import {
  Controller,
  Get,
  Post,
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
import { BaselinesService } from './baselines.service';

@ApiTags('Baselines')
@ApiBearerAuth()
@Controller()
export class BaselinesController {
  constructor(
    private readonly baselinesService: BaselinesService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get('patients/:id/baseline')
  @ApiOperation({ summary: 'Get or compute personal baseline for a patient' })
  async getBaseline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'baseline',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to patient baseline');
    }
    return this.baselinesService.getOrCompute(id);
  }

  @Post('patients/:id/baseline/recompute')
  @ApiOperation({ summary: 'Force recompute of patient baseline' })
  async recomputeBaseline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'WRITE',
      'baseline',
      'ANALYSIS',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to recompute baseline');
    }
    return this.baselinesService.recompute(id);
  }
}
