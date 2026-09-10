import {
  Controller,
  Get,
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
import { HealthGraphService } from './health-graph.service';

@ApiTags('Health Graph')
@ApiBearerAuth()
@Controller()
export class HealthGraphController {
  constructor(
    private readonly healthGraphService: HealthGraphService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get('patients/:id/health-graph')
  @ApiOperation({ summary: 'Build and return the patient health graph' })
  async getHealthGraph(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allowed = await this.accessControl.check(
      user,
      id,
      'READ',
      'health-graph',
      'CARE',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to patient health graph');
    }
    return this.healthGraphService.build(id);
  }
}
