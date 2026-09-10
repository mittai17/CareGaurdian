import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MemoryTypeDto {
  FACT = 'FACT',
  OBSERVATION = 'OBSERVATION',
  INFERENCE = 'INFERENCE',
}

export class ProvenanceDto {
  @ApiProperty({ example: 'CAREGIVER' })
  @IsNotEmpty()
  @IsString()
  sourceType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ example: 'Recorded by daughter during visit' })
  @IsOptional()
  @IsString()
  sourceDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageRef?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verifiedBy?: string;
}

export class CreateMemoryFactDto {
  @ApiProperty({ enum: MemoryTypeDto, example: MemoryTypeDto.FACT })
  @IsNotEmpty()
  @IsEnum(MemoryTypeDto)
  memoryType!: MemoryTypeDto;

  @ApiProperty({ example: 'allergy' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiProperty({ example: 'Patient is allergic to penicillin' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({ type: ProvenanceDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProvenanceDto)
  provenance!: ProvenanceDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}
