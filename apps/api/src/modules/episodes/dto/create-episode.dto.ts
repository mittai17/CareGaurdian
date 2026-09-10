import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const EPISODE_OUTCOMES = [
  'HOSPITALIZATION',
  'ER_VISIT',
  'MEDICATION_CHANGE',
  'RESOLVED',
  'ACUTE_EVENT',
  'ONGOING',
] as const;

export const EPISODE_SEVERITIES = [
  'NORMAL',
  'ATTENTION',
  'REVIEW',
  'CRITICAL',
  'UNKNOWN',
] as const;

export class CreateEpisodeDto {
  @ApiProperty({ description: 'Short descriptive title for the episode' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed description of the episode' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'ISO date when the episode started' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'ISO date when the episode ended' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: EPISODE_OUTCOMES, description: 'Outcome of the episode' })
  @IsOptional()
  @IsEnum(EPISODE_OUTCOMES)
  outcome?: string;

  @ApiPropertyOptional({ enum: EPISODE_SEVERITIES, description: 'Severity level' })
  @IsOptional()
  @IsEnum(EPISODE_SEVERITIES)
  severity?: string;

  @ApiPropertyOptional({ description: 'Symptoms observed during the episode', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional({ description: 'Medications involved in this episode', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicationsInvolved?: string[];

  @ApiPropertyOptional({ description: 'Functional changes observed', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functionalChanges?: string[];

  @ApiPropertyOptional({ description: 'Cognitive changes observed', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cognitiveChanges?: string[];

  @ApiPropertyOptional({
    description:
      'Start of date range to auto-attach existing HealthEvents (ISO date).',
  })
  @IsOptional()
  @IsDateString()
  attachEventsFrom?: string;

  @ApiPropertyOptional({
    description:
      'End of date range to auto-attach existing HealthEvents (ISO date).',
  })
  @IsOptional()
  @IsDateString()
  attachEventsTo?: string;
}
