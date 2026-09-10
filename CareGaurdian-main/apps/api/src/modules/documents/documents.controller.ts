import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Body,
  Req,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DocumentsService, MulterFile } from './documents.service';
import { CreateTextDocumentDto } from './dto/create-text-document.dto';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // -----------------------------------------------------------------------
  // Upload a file
  // -----------------------------------------------------------------------

  @Post('patients/:patientId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for a patient' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'File to upload' },
        documentType: { type: 'string', example: 'DISCHARGE_SUMMARY' },
      },
    },
  })
  async uploadFile(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @UploadedFile() file: MulterFile | undefined,
    @Body('documentType') documentType: string,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!documentType) {
      throw new BadRequestException('documentType is required');
    }

    return this.documentsService.upload(
      patientId,
      file,
      user.id,
      documentType,
    );
  }

  // -----------------------------------------------------------------------
  // Create from pasted text
  // -----------------------------------------------------------------------

  @Post('patients/:patientId/documents/text')
  @ApiOperation({ summary: 'Create a document from pasted text' })
  async createFromText(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateTextDocumentDto,
    @CurrentUser() user: RequestUser,
  ) {
    let metadata: Record<string, unknown> | undefined;
    if (dto.metadata) {
      try {
        metadata = JSON.parse(dto.metadata);
      } catch {
        throw new BadRequestException('metadata must be valid JSON');
      }
    }

    return this.documentsService.createFromText(
      patientId,
      dto.text,
      dto.documentType,
      user.id,
      dto.filename,
      metadata,
    );
  }

  // -----------------------------------------------------------------------
  // List documents for a patient
  // -----------------------------------------------------------------------

  @Get('patients/:patientId/documents')
  @ApiOperation({ summary: 'List documents for a patient' })
  async listForPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    const docs = await this.documentsService.listForPatient(patientId);
    return { data: docs };
  }

  // -----------------------------------------------------------------------
  // Get a single document
  // -----------------------------------------------------------------------

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document metadata by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.getById(id);
  }

  // -----------------------------------------------------------------------
  // Signed URL
  // -----------------------------------------------------------------------

  @Get('documents/:id/signed-url')
  @ApiOperation({ summary: 'Get a short-lived signed URL for a document' })
  async getSignedUrl(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.getSignedUrl(id);
  }

  // -----------------------------------------------------------------------
  // Content download (token-validated)
  // -----------------------------------------------------------------------

  @Get('documents/:id/content')
  @ApiOperation({ summary: 'Download document content via signed token' })
  async getContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const expires = Number(req.query.expires);
    const token = req.query.token as string;

    if (!expires || !token) {
      throw new BadRequestException('expires and token query params are required');
    }

    const { buffer, mimeType, filename } =
      await this.documentsService.validateAndReadContent(id, expires, token);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
