import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Encounters')
@ApiBearerAuth()
@Controller()
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post('patients/:patientId/encounters')
  @ApiOperation({ summary: 'Create an encounter for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateEncounterDto,
    @CurrentUser() user: RequestUser,
  ) {
    const encounter = await this.encountersService.create(patientId, dto, user);
    return { data: encounter };
  }

  @Get('patients/:patientId/encounters')
  @ApiOperation({ summary: 'List encounters for a patient' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const encounters = await this.encountersService.findByPatient(patientId, user);
    return { data: encounters };
  }
}
