import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const GUARDIANSHIP_TYPES = [
  'LEGAL_GUARDIAN',
  'POWER_OF_ATTORNEY',
  'PARENT',
  'SPOUSE',
  'CHILD',
  'OTHER',
] as const;

export class CreateGuardianRelationshipDto {
  @ApiProperty({ description: 'ID of the patient under guardianship' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'ID of the user acting as guardian' })
  @IsUUID()
  guardianUserId!: string;

  @ApiPropertyOptional({ description: 'ID of a linked caregiver user (optional)' })
  @IsOptional()
  @IsUUID()
  linkedUserId?: string;

  @ApiProperty({
    enum: GUARDIANSHIP_TYPES,
    example: 'LEGAL_GUARDIAN',
  })
  @IsEnum(GUARDIANSHIP_TYPES)
  relationship!: string;

  @ApiPropertyOptional({
    description: 'ISO start date; defaults to now',
  })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO end date for a time-boxed guardianship' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: 'Reference to supporting legal document' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  documentRef?: string;
}