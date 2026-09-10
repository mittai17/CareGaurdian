import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { AccessControlService } from '../../common/services/access-control.service';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';

@ApiTags('Episodes')
@ApiBearerAuth()
@Controller()
export class EpisodesController {
  constructor(
    private readonly episodesService: EpisodesService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Post('patients/:id/episodes')
  @ApiOperation({ summary: 'Create an episode for a patient' })
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEpisodeDto,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'CREATE',
      'episode',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to create episode');
    }
    return this.episodesService.create(id, dto);
  }

  @Get('patients/:id/episodes')
  @ApiOperation({ summary: 'List episodes for a patient' })
  async list(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'episode',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to list episodes');
    }
    return this.episodesService.list(id);
  }

  @Get('episodes/:id')
  @ApiOperation({ summary: 'Get a specific episode by ID' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    // Fetch first to get patientId for access check
    const result = await this.episodesService.getById(id);
    const allowed = await this.accessControl.check(
      user,
      result.data.patientId,
      'READ',
      'episode',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to view this episode');
    }
    return result;
  }

  @Get('patients/:id/episodes/match')
  @ApiOperation({
    summary:
      'Match current 14-day window against past episodes by signature similarity',
  })
  async matchCurrent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'episode',
      'ANALYSIS',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to match episodes');
    }
    return this.episodesService.matchCurrent(id);
  }
}
