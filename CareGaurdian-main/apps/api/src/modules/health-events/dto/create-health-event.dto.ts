import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum EventTypeDto {
  MEDICATION_STARTED = 'MEDICATION_STARTED',
  MEDICATION_STOPPED = 'MEDICATION_STOPPED',
  MEDICATION_CHANGED = 'MEDICATION_CHANGED',
  MISSED_MEDICATION = 'MISSED_MEDICATION',
  FALL = 'FALL',
  NEAR_FALL = 'NEAR_FALL',
  HOSPITALIZATION = 'HOSPITALIZATION',
  ER_VISIT = 'ER_VISIT',
  SYMPTOM = 'SYMPTOM',
  COGNITIVE_CHANGE = 'COGNITIVE_CHANGE',
  FUNCTIONAL_CHANGE = 'FUNCTIONAL_CHANGE',
  APPETITE_CHANGE = 'APPETITE_CHANGE',
  SLEEP_CHANGE = 'SLEEP_CHANGE',
  MOBILITY_CHANGE = 'MOBILITY_CHANGE',
  CAREGIVER_OBSERVATION = 'CAREGIVER_OBSERVATION',
  LAB_RESULT = 'LAB_RESULT',
  PROCEDURE = 'PROCEDURE',
  DIAGNOSIS = 'DIAGNOSIS',
  ASSESSMENT = 'ASSESSMENT',
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  CHECK_IN = 'CHECK_IN',
  CONTACT = 'CONTACT',
}

export enum SourceTypeDto {
  CAREGIVER = 'CAREGIVER',
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN',
  PHARMACIST = 'PHARMACIST',
  DOCUMENT = 'DOCUMENT',
  FHIR = 'FHIR',
  ML = 'ML',
  SYSTEM = 'SYSTEM',
}

export class CreateHealthEventDto {
  @ApiProperty({ enum: EventTypeDto, example: EventTypeDto.FALL })
  @IsNotEmpty()
  @IsEnum(EventTypeDto)
  type!: EventTypeDto;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsNotEmpty()
  @IsDateString()
  timestamp!: string;

  @ApiPropertyOptional({ enum: SourceTypeDto, example: SourceTypeDto.CAREGIVER })
  @IsOptional()
  @IsEnum(SourceTypeDto)
  sourceType?: SourceTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ example: 'Patient fell in bathroom' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  episodeId?: string;
}
