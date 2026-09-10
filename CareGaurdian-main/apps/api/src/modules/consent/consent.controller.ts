import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Consent')
@ApiBearerAuth()
@Controller()
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('consents')
  @ApiOperation({ summary: 'Create a consent (PENDING) with derived permissions' })
  async create(
    @Body() dto: CreateConsentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.consentService.create(dto, user.id);
  }

  @Get('patients/:patientId/consents')
  @ApiOperation({ summary: 'List consents for a patient' })
  async listForPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.consentService.listForPatient(patientId, user.id);
  }

  @Post('consents/:id/approve')
  @ApiOperation({ summary: 'Approve a pending consent' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.consentService.approve(id, user.id);
  }

  @Post('consents/:id/revoke')
  @ApiOperation({ summary: 'Revoke an active or pending consent' })
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.consentService.revoke(id, user.id);
  }
}