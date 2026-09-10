import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Timeline')
@ApiBearerAuth()
@Controller('patients/:id/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get merged timeline of health events, observations, and medication events' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.timelineService.getTimeline(id, user!, {
      type,
      source,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
