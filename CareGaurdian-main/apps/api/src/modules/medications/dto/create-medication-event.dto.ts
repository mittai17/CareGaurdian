import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum MedicationEventTypeDto {
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  CHANGED = 'CHANGED',
  MISSED = 'MISSED',
  TAKEN = 'TAKEN',
}

export enum MedSourceTypeDto {
  CAREGIVER = 'CAREGIVER',
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN',
  PHARMACIST = 'PHARMACIST',
}

export class CreateMedicationEventDto {
  @ApiProperty({ example: 'Lisinopril' })
  @IsNotEmpty()
  @IsString()
  medicationName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicationId?: string;

  @ApiProperty({ enum: MedicationEventTypeDto, example: MedicationEventTypeDto.MISSED })
  @IsNotEmpty()
  @IsEnum(MedicationEventTypeDto)
  type!: MedicationEventTypeDto;

  @ApiProperty({ example: '2024-01-15T08:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({ example: 'Patient refused to take medication' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ enum: MedSourceTypeDto, example: MedSourceTypeDto.CAREGIVER })
  @IsOptional()
  @IsEnum(MedSourceTypeDto)
  sourceType?: MedSourceTypeDto;
}
