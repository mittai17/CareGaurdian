import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ObservationCategoryDto {
  CONFUSION = 'CONFUSION',
  FALL = 'FALL',
  NEAR_FALL = 'NEAR_FALL',
  APPETITE = 'APPETITE',
  SLEEP = 'SLEEP',
  MOBILITY = 'MOBILITY',
  MOOD = 'MOOD',
  PAIN = 'PAIN',
  MEDICATION = 'MEDICATION',
  OTHER = 'OTHER',
}

export class CreateObservationDto {
  @ApiProperty({ enum: ObservationCategoryDto, example: ObservationCategoryDto.FALL })
  @IsNotEmpty()
  @IsEnum(ObservationCategoryDto)
  category!: ObservationCategoryDto;

  @ApiPropertyOptional({ example: 'Patient fell while getting out of bed' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ example: 'MODERATE' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ example: '5 minutes' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ example: { type: 'missed' } })
  @IsOptional()
  @IsObject()
  structured?: Record<string, unknown>;
}
