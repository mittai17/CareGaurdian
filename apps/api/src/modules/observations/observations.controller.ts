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
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Observations')
@ApiBearerAuth()
@Controller()
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post('patients/:id/observations')
  @ApiOperation({ summary: 'Create a caregiver observation (also creates a linked HealthEvent)' })
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateObservationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const observation = await this.observationsService.create(id, dto, user);
    return { data: observation };
  }

  @Get('patients/:id/observations')
  @ApiOperation({ summary: 'List observations for a patient' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async findByPatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const observations = await this.observationsService.findByPatient(id, user!, {
      category,
      from,
      to,
    });
    return { data: observations };
  }

  @Get('observations/:id')
  @ApiOperation({ summary: 'Get an observation by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const observation = await this.observationsService.findById(id, user);
    return { data: observation };
  }
}
