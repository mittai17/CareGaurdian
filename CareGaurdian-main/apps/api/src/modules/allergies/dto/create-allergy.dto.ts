import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAllergyDto {
  @ApiProperty({ example: 'Penicillin' })
  @IsNotEmpty()
  @IsString()
  allergen!: string;

  @ApiPropertyOptional({ example: 'Hives, swelling' })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiPropertyOptional({ example: 'SEVERE' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}
