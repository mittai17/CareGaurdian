import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTextDocumentDto {
  @ApiProperty({ description: 'Patient ID the document belongs to' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'Plain text content of the document' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ description: 'Document type (e.g. NOTE, DISCHARGE_SUMMARY)' })
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @ApiPropertyOptional({ description: 'Descriptive filename' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  filename?: string;

  @ApiPropertyOptional({ description: 'Optional JSON metadata' })
  @IsOptional()
  @IsString()
  metadata?: string;
}
