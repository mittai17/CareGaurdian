import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListNotificationsDto {
  @ApiPropertyOptional({ description: 'Only return unread notifications' })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
