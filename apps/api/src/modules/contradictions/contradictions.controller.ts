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
import { ContradictionsService } from './contradictions.service';

@ApiTags('Contradictions')
@ApiBearerAuth()
@Controller()
export class ContradictionsController {
  constructor(
    private readonly contradictionsService: ContradictionsService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get('patients/:id/contradictions')
  @ApiOperation({ summary: 'List contradictions for a patient' })
  async list(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'contradiction',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to view contradictions');
    }
    return this.contradictionsService.list(id);
  }

  @Post('patients/:id/contradictions/detect')
  @ApiOperation({ summary: 'Run contradiction detection scan for a patient' })
  async detect(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'ANALYZE',
      'contradiction',
      'ANALYSIS',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to run contradiction detection');
    }
    return this.contradictionsService.detect(id);
  }
}
