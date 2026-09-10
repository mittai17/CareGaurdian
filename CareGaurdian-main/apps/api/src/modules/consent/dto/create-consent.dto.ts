import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const CONSENT_RECIPIENT_TYPES = [
  'PATIENT',
  'GUARDIAN',
  'FAMILY_CAREGIVER',
  'PROFESSIONAL_CAREGIVER',
  'CLINICIAN',
  'PHARMACIST',
  'EMERGENCY_CLINICIAN',
  'ADMIN',
] as const;

export class CreateConsentDto {
  @ApiProperty({ description: 'ID of the patient the consent applies to' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'ID of the user receiving access' })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({
    enum: CONSENT_RECIPIENT_TYPES,
    description: 'Role of the recipient',
  })
  @IsEnum(CONSENT_RECIPIENT_TYPES)
  recipientType!: string;

  @ApiProperty({
    description:
      'Data scopes granted, e.g. ["medication", "observation", "lab-result"]. Each scope maps to resource/action permission pairs.',
    example: ['medication', 'observation'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  dataScope!: string[];

  @ApiProperty({ description: 'Purpose of the consent (also recorded in audit)' })
  @IsString()
  @IsNotEmpty()
  purpose!: string;

  @ApiPropertyOptional({
    description: 'ISO start date; defaults to now',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'ISO expiration date; omitted = no expiry',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}