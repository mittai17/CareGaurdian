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
import { MissingInfoService } from './missing-info.service';

@ApiTags('Missing Information')
@ApiBearerAuth()
@Controller()
export class MissingInfoController {
  constructor(
    private readonly missingInfoService: MissingInfoService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get('patients/:id/missing-information')
  @ApiOperation({ summary: 'List missing information for a patient' })
  async list(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'missing-information',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to view missing information');
    }
    return this.missingInfoService.list(id);
  }

  @Post('patients/:id/missing-information/detect')
  @ApiOperation({ summary: 'Run missing information detection for a patient' })
  async detect(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'ANALYZE',
      'missing-information',
      'ANALYSIS',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to run missing information detection');
    }
    return this.missingInfoService.detect(id);
  }
}
