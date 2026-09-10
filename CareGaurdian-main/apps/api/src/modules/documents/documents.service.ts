import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  LocalStorageService,
  StorageService,
} from '../../common/services/storage.service';
import * as crypto from 'crypto';

// Minimal Multer file shape so we don't depend on @types/multer at compile time.
export interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/** Fixed chunk size in characters for document splitting. */
const CHUNK_SIZE = 800;
/** Overlap between consecutive chunks (in characters). */
const CHUNK_OVERLAP = 100;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface UploadedDocument {
  id: string;
  patientId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  documentType: string;
  uploadedBy: string;
  parsedText: string | null;
  status: string;
  metadata: unknown;
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  patientId: string;
  chunkIndex: number;
  text: string;
  metadata: unknown;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly storage: StorageService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    localStorage: LocalStorageService,
  ) {
    // Swap this assignment for an S3StorageService in production.
    this.storage = localStorage;
  }

  // -----------------------------------------------------------------------
  // Upload
  // -----------------------------------------------------------------------

  /**
   * Upload a file for a patient.  Persists the Document row (status UPLOADED),
   * writes the file to storage, then kicks off ingestion (sync for text/plain,
   * async microtask for everything else).
   */
  async upload(
    patientId: string,
    file: MulterFile,
    uploadedBy: string,
    documentType: string,
    metadata?: Record<string, unknown>,
  ): Promise<UploadedDocument> {
    // 1. Build storage key
    const id = crypto.randomUUID();
    const storageKey = `${patientId}/${id}/${file.originalname}`;

    // 2. Write to storage
    await this.storage.put(storageKey, file.buffer, file.mimetype);

    // 3. Create Document row
    const doc = await this.prisma.document.create({
      data: {
        id,
        patientId,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.buffer.length,
        storageKey,
        documentType,
        uploadedBy,
        status: 'UPLOADED',
        metadata: (metadata ?? null) as Prisma.InputJsonValue,
      },
    });

    // 4. Audit log
    await this.audit.log({
      actorId: uploadedBy,
      patientId,
      action: 'VIEW_DOCUMENT',
      resourceType: 'Document',
      resourceId: id,
      purpose: 'Document upload',
      result: 'SUCCESS',
      metadata: { filename: file.originalname, mimeType: file.mimetype },
    });

    // 5. Start ingestion (fire-and-forget — never blocks the response)
    this.ingestDocument(doc.id, file.mimetype, file.buffer).catch((err) => {
      this.logger.error(`Ingestion failed for document ${doc.id}: ${String(err)}`);
    });

    return this.serialize(doc);
  }

  // -----------------------------------------------------------------------
  // Create from text (pasted text)
  // -----------------------------------------------------------------------

  /**
   * Create a document directly from pasted text — no file upload needed.
   */
  async createFromText(
    patientId: string,
    text: string,
    documentType: string,
    uploadedBy: string,
    filename?: string,
    metadata?: Record<string, unknown>,
  ): Promise<UploadedDocument> {
    const id = crypto.randomUUID();
    const safeFilename = filename ?? `${documentType.toLowerCase()}-${id}.txt`;
    const storageKey = `${patientId}/${id}/${safeFilename}`;

    // Persist text as a plain text file
    await this.storage.put(storageKey, Buffer.from(text, 'utf-8'), 'text/plain');

    const doc = await this.prisma.document.create({
      data: {
        id,
        patientId,
        filename: safeFilename,
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(text, 'utf-8'),
        storageKey,
        documentType,
        uploadedBy,
        parsedText: text,
        status: 'READY',
        metadata: (metadata ?? null) as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      actorId: uploadedBy,
      patientId,
      action: 'VIEW_DOCUMENT',
      resourceType: 'Document',
      resourceId: id,
      purpose: 'Text document creation',
      result: 'SUCCESS',
    });

    // Chunk the text
    const chunks = splitTextIntoChunks(text);
    if (chunks.length > 0) {
      await this.prisma.documentChunk.createMany({
        data: chunks.map((chunkText, idx) => ({
          documentId: id,
          patientId,
          chunkIndex: idx,
          text: chunkText,
          metadata: { source: 'text-paste' } as Prisma.InputJsonValue,
        })),
      });
    }

    return this.serialize(doc);
  }

  // -----------------------------------------------------------------------
  // Read
  // -----------------------------------------------------------------------

  async getById(documentId: string): Promise<UploadedDocument> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return this.serialize(doc);
  }

  async listForPatient(patientId: string): Promise<UploadedDocument[]> {
    const docs = await this.prisma.document.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.serialize(d));
  }

  // -----------------------------------------------------------------------
  // Signed URL / content access
  // -----------------------------------------------------------------------

  /**
   * Generate a short-lived signed URL for downloading the document.
   */
  async getSignedUrl(documentId: string): Promise<{ url: string }> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const url = await this.storage.getSignedUrl(doc.storageKey, 900); // 15 min
    return { url };
  }

  /**
   * Validate a signed URL token and return the raw file buffer.
   * This is the handler for GET /documents/:id/content?expires=...&token=...
   */
  async validateAndReadContent(
    documentId: string,
    expires: number,
    token: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    // 1. Check expiry
    if (Math.floor(Date.now() / 1000) > expires) {
      throw new ForbiddenException('Signed URL has expired');
    }

    // 2. Validate HMAC
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const secret = process.env.ENCRYPTION_KEY ?? 'baseline-dev-encryption-key-change-me';
    const payload = `${doc.storageKey}:${expires}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))) {
      throw new ForbiddenException('Invalid signed URL token');
    }

    // 3. Fetch from storage
    const buffer = await this.storage.get(doc.storageKey);

    await this.audit.log({
      action: 'VIEW_DOCUMENT',
      resourceType: 'Document',
      resourceId: documentId,
      patientId: doc.patientId,
      purpose: 'Signed URL content access',
      result: 'SUCCESS',
    });

    return { buffer, mimeType: doc.mimeType, filename: doc.filename };
  }

  // -----------------------------------------------------------------------
  // Ingestion
  // -----------------------------------------------------------------------

  /**
   * Attempt to extract text from a document.  For text/plain files this
   * happens synchronously.  For other MIME types we attempt a best-effort
   * extraction of the first 50 KB — if that fails we mark the document
   * as FAILED.
   */
  private async ingestDocument(
    documentId: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<void> {
    let parsedText: string | null = null;
    let status = 'READY';

    try {
      if (mimeType === 'text/plain') {
        parsedText = buffer.toString('utf-8');
      } else {
        // Best-effort: try reading as UTF-8 text (handles many embedded text
        // formats).  Take only the first 50 KB.
        const slice = buffer.subarray(0, 50 * 1024);
        parsedText = slice.toString('utf-8');
        // If the decoded text is mostly garbage (high replacement char ratio),
        // treat as binary / unreadable.
        const replacementRatio =
          (parsedText.match(/\uFFFD/g)?.length ?? 0) / Math.max(parsedText.length, 1);
        if (replacementRatio > 0.1) {
          parsedText = null;
          status = 'FAILED';
        }
      }
    } catch {
      parsedText = null;
      status = 'FAILED';
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { parsedText, status },
    });

    // Chunk if we got text
    if (parsedText && parsedText.length > 0) {
      const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) return;

      const chunks = splitTextIntoChunks(parsedText);
      if (chunks.length > 0) {
        await this.prisma.documentChunk.createMany({
          data: chunks.map((chunkText, idx) => ({
            documentId,
            patientId: doc.patientId,
            chunkIndex: idx,
            text: chunkText,
            metadata: { source: 'ingestion' } as Prisma.InputJsonValue,
          })),
        });
      }
    }

    this.logger.log(
      `Ingestion complete for document ${documentId}: status=${status}, chunks=${parsedText ? 'yes' : 'no'}`,
    );
  }

  // -----------------------------------------------------------------------
  // Serialiser
  // -----------------------------------------------------------------------

  private serialize(doc: {
    id: string;
    patientId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    documentType: string;
    uploadedBy: string;
    parsedText: string | null;
    status: string;
    metadata: unknown;
    createdAt: Date;
  }): UploadedDocument {
    return {
      id: doc.id,
      patientId: doc.patientId,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      storageKey: doc.storageKey,
      documentType: doc.documentType,
      uploadedBy: doc.uploadedBy,
      parsedText: doc.parsedText,
      status: doc.status,
      metadata: doc.metadata,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Pure chunking helper — exported for testing
// ---------------------------------------------------------------------------

export function splitTextIntoChunks(text: string): string[] {
  if (!text || text.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}
