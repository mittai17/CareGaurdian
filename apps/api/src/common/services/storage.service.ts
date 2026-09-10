import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Interface — swap implementations (S3, GCS, Azure Blob) without touching callers
// ---------------------------------------------------------------------------
export interface StorageService {
  /** Persist a buffer and return the storage key. */
  put(key: string, buffer: Buffer, contentType?: string): Promise<string>;

  /** Return a short-lived signed URL for read access. */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /** Return the raw bytes for the given key. */
  get(key: string): Promise<Buffer>;
}

// ---------------------------------------------------------------------------
// Local filesystem implementation — MVP / dev only
// ---------------------------------------------------------------------------
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(
      process.env.DOC_STORAGE_PATH ?? './storage/documents',
    );
    this.ensureBaseDir();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async put(key: string, buffer: Buffer, _contentType?: string): Promise<string> {
    const fullPath = this.fullPath(key);
    await this.ensureDir(path.dirname(fullPath));
    await fs.promises.writeFile(fullPath, buffer);
    this.logger.debug(`Stored ${buffer.length} bytes → ${key}`);
    return key;
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    // For local storage we build a simple HMAC token the content endpoint can
    // validate.  The URL itself points at the content endpoint, NOT the raw
    // filesystem path — so callers never see storage internals.
    const secret = process.env.ENCRYPTION_KEY ?? 'baseline-dev-encryption-key-change-me';
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expires}`;
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Return a relative URL the caller can prefix with the API base URL.
    return `/documents/${encodeURIComponent(key)}/content?expires=${expires}&token=${token}`;
  }

  async get(key: string): Promise<Buffer> {
    const fullPath = this.fullPath(key);
    return fs.promises.readFile(fullPath);
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private fullPath(key: string): string {
    // Prevent path traversal
    const sanitised = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.basePath, sanitised);
  }

  private ensureBaseDir(): void {
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  private async ensureDir(dir: string): Promise<void> {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}
