import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Lisinopril' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'lisinopril' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ example: '10mg' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: 'once daily' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: 'oral' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith' })
  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @ApiPropertyOptional({ example: 'For blood pressure management' })
  @IsOptional()
  @IsString()
  notes?: string;
}
