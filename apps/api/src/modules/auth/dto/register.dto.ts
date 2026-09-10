import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Str0ngP@ss!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: ['PATIENT'],
    enum: [
      'PATIENT',
      'GUARDIAN',
      'FAMILY_CAREGIVER',
      'PROFESSIONAL_CAREGIVER',
      'CLINICIAN',
      'PHARMACIST',
      'EMERGENCY_CLINICIAN',
      'ADMIN',
    ],
    isArray: true,
    default: ['PATIENT'],
  })
  @IsOptional()
  @IsEnum(
    [
      'PATIENT',
      'GUARDIAN',
      'FAMILY_CAREGIVER',
      'PROFESSIONAL_CAREGIVER',
      'CLINICIAN',
      'PHARMACIST',
      'EMERGENCY_CLINICIAN',
      'ADMIN',
    ],
    { each: true },
  )
  roles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
