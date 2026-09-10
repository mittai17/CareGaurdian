import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEncounterDto {
  @ApiProperty({ example: 'Office Visit' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'Dr. Jane Smith' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiPropertyOptional({ example: 'Routine check-up' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startedAt!: string;

  @ApiPropertyOptional({ example: '2024-01-15T09:45:00Z' })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional({ example: 'Springfield Medical Center' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Blood pressure elevated' })
  @IsOptional()
  @IsString()
  notes?: string;
}
