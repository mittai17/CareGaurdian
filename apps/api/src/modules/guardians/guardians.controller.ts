import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuardianService } from './guardians.service';
import { CreateGuardianRelationshipDto } from './dto/create-guardian-relationship.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Guardians')
@ApiBearerAuth()
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post()
  @ApiOperation({ summary: 'Establish a guardianship relationship' })
  async create(
    @Body() dto: CreateGuardianRelationshipDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.guardianService.createRelationship(dto, user.id);
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: 'List guardianships for a patient' })
  async listForPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.guardianService.listForPatient(patientId, user.id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a guardianship relationship' })
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.guardianService.revoke(id, user.id);
  }
}