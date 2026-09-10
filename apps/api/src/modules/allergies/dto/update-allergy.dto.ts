import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAllergyDto {
  @ApiPropertyOptional({ example: 'Penicillin' })
  @IsOptional()
  @IsString()
  allergen?: string;

  @ApiPropertyOptional({ example: 'Hives, swelling, difficulty breathing' })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiPropertyOptional({ example: 'SEVERE' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ example: 'CLINICALLY_VERIFIED' })
  @IsOptional()
  @IsString()
  verificationStatus?: string;
}
