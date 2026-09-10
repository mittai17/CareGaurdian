/**
 * Brief Controller — REST endpoints for clinical briefs and change tracking.
 * All endpoints require bearer authentication (global guard).
 */

import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BriefService } from './brief.service';
import { YearTimelineService } from './year-timeline.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clinical Brief')
@ApiBearerAuth()
@Controller()
export class BriefController {
  constructor(
    private readonly briefService: BriefService,
    private readonly yearTimelineService: YearTimelineService,
  ) {}

  /**
   * GET /patients/:id/clinical-brief
   * Returns the assembled clinical brief for a patient.
   */
  @Get('patients/:id/clinical-brief')
  @ApiOperation({
    summary: 'Get clinical brief for a patient',
    description: 'Assembles overall state, why now, historical matches, evidence, contradictions, and data gaps',
  })
  async getClinicalBrief(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: RequestUser,
  ) {
    const brief = await this.briefService.build(id);
    return { data: brief };
  }

  /**
   * GET /brief/:id
   * Returns the AI-generated clinical brief sections.
   */
  @Get('brief/:id')
  @ApiOperation({
    summary: 'Get AI-generated clinical brief sections',
    description: 'Generates natural language paragraphs for the clinical brief using AI',
  })
  async getAiBrief(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: RequestUser,
  ) {
    const brief = await this.briefService.generateAiBrief(id);
    return { data: brief };
  }

  /**
   * GET /patients/:id/what-changed
   * Returns a comparison of last 30d vs previous 60d.
   */
  @Get('patients/:id/what-changed')
  @ApiOperation({
    summary: 'Get what changed for a patient (last 30d vs previous 60d)',
    description: 'Computes new/changed/improved/resolved/unchanged sections plus medication changes and cognition observations',
  })
  async getWhatChanged(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: RequestUser,
  ) {
    const result = await this.briefService.whatChanged(id);
    return { data: result };
  }

  /**
   * GET /patients/:id/year-timeline
   * Returns a per-year health-status classification with evidence-backed reasons.
   */
  @Get('patients/:id/year-timeline')
  @ApiOperation({
    summary: 'Get year-by-year health timeline for a patient',
    description: 'Classifies each documented year with a status (GOOD/STABLE/WATCH/CONCERN/CRITICAL) and evidence-backed reasons',
  })
  async getYearTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: RequestUser,
  ) {
    const result = await this.yearTimelineService.build(id);
    return { data: result };
  }
}
