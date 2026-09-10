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
import { ChangeDetectionService } from './change-detection.service';

@ApiTags('Change Detection')
@ApiBearerAuth()
@Controller()
export class ChangeDetectionController {
  constructor(
    private readonly changeDetectionService: ChangeDetectionService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Post('patients/:id/change-detection/run')
  @ApiOperation({ summary: 'Run change detection analysis for a patient' })
  async runDetection(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'ANALYZE',
      'change-detection',
      'ANALYSIS',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to run change detection');
    }
    return this.changeDetectionService.detect(id);
  }

  @Get('patients/:id/changes')
  @ApiOperation({ summary: 'List change signals for a patient' })
  async listChanges(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'change-detection',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to view changes');
    }
    return this.changeDetectionService.listChanges(id);
  }

  @Get('changes/:id')
  @ApiOperation({ summary: 'Get a specific change signal by ID' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    // We fetch the signal first to know the patientId for access check
    const result = await this.changeDetectionService.getById(id);
    const allowed = await this.accessControl.check(
      user,
      result.data.patientId,
      'READ',
      'change-detection',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to view this change signal');
    }
    return result;
  }
}
