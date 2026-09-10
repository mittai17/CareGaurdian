import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyAccessDto {
  @ApiProperty({
    description:
      'Free-text reason for breaking glass (required for audit trail)',
    example: 'Patient arrived unconscious in ER — need medication list',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
