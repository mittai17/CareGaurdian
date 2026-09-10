import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HealthEventsService } from './health-events.service';
import { CreateHealthEventDto } from './dto/create-health-event.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Health Events')
@ApiBearerAuth()
@Controller()
export class HealthEventsController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  @Post('patients/:patientId/events')
  @ApiOperation({ summary: 'Create a health event for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateHealthEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    const event = await this.healthEventsService.create(patientId, dto, user);
    return { data: event };
  }

  @Get('patients/:patientId/events')
  @ApiOperation({ summary: 'List health events for a patient (cursor pagination)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.healthEventsService.findByPatient(patientId, user!, {
      type,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get a health event by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const event = await this.healthEventsService.findById(id, user);
    return { data: event };
  }
}
