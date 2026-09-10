import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateMedicationDto {
  @ApiPropertyOptional({ example: 'Lisinopril' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'lisinopril' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ example: '20mg' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: 'twice daily' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: 'oral' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  stoppedAt?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith' })
  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @ApiPropertyOptional({ example: 'Dosage increased due to elevated BP' })
  @IsOptional()
  @IsString()
  notes?: string;
}
