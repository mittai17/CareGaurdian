import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreateMedicationEventDto } from './dto/create-medication-event.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Medications')
@ApiBearerAuth()
@Controller()
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post('patients/:patientId/medications')
  @ApiOperation({ summary: 'Create a medication for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateMedicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const medication = await this.medicationsService.create(patientId, dto, user);
    return { data: medication };
  }

  @Get('patients/:patientId/medications')
  @ApiOperation({ summary: 'List medications for a patient (active + history)' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const medications = await this.medicationsService.findByPatient(patientId, user);
    return { data: medications };
  }

  @Patch('medications/:id')
  @ApiOperation({ summary: 'Partially update a medication' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const medication = await this.medicationsService.update(id, dto, user);
    return { data: medication };
  }

  @Post('patients/:patientId/medication-events')
  @ApiOperation({ summary: 'Record a medication event (also creates a matching HealthEvent)' })
  async createEvent(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateMedicationEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    const event = await this.medicationsService.createEvent(patientId, dto, user);
    return { data: event };
  }
}
