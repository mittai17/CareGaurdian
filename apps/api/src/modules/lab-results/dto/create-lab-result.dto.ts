import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabResultDto {
  @ApiProperty({ example: 'Complete Blood Count' })
  @IsNotEmpty()
  @IsString()
  testName!: string;

  @ApiProperty({ example: '12.5' })
  @IsNotEmpty()
  @IsString()
  value!: string;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '12.0-16.0' })
  @IsOptional()
  @IsString()
  referenceRange?: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  collectedAt!: string;

  @ApiPropertyOptional({ example: 'NORMAL' })
  @IsOptional()
  @IsString()
  interpretation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}
