import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateEmergencyAccessDto } from './dto/create-emergency-access.dto';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Emergency')
@ApiBearerAuth()
@Controller()
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  // -----------------------------------------------------------------------
  // GET /patients/:id/emergency-summary
  // -----------------------------------------------------------------------

  @Get('patients/:id/emergency-summary')
  @ApiOperation({
    summary:
      'Get emergency summary (requires EMERGENCY_CLINICIAN role + active break-glass, or ADMIN)',
  })
  async getSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const summary = await this.emergencyService.getEmergencySummary(
      id,
      user.id,
      user.roles,
    );
    return { data: summary };
  }

  // -----------------------------------------------------------------------
  // POST /patients/:id/emergency-access
  // -----------------------------------------------------------------------

  @Post('patients/:id/emergency-access')
  @Roles('EMERGENCY_CLINICIAN', 'ADMIN')
  @ApiOperation({
    summary:
      'Create break-glass emergency access and return the emergency summary',
  })
  async createAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEmergencyAccessDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.emergencyService.createEmergencyAccess(
      id,
      user.id,
      user.roles,
      dto.reason,
    );
  }

  // -----------------------------------------------------------------------
  // GET /emergency/access-log/:patientId (ADMIN only)
  // -----------------------------------------------------------------------

  @Get('emergency/access-log/:patientId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List emergency access logs for a patient (ADMIN only)' })
  async getAccessLog(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.emergencyService.getAccessLog(patientId);
  }
}
