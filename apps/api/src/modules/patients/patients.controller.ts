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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient and link to creator' })
  async create(@Body() dto: CreatePatientDto, @CurrentUser() user: RequestUser) {
    const patient = await this.patientsService.create(dto, user);
    return { data: patient };
  }

  @Get()
  @ApiOperation({ summary: 'List patients the current user has access to' })
  async findAll(@CurrentUser() user: RequestUser) {
    const patients = await this.patientsService.findAll(user);
    return { data: patients };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const patient = await this.patientsService.findById(id, user);
    return { data: patient };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a patient' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: RequestUser,
  ) {
    const patient = await this.patientsService.update(id, dto, user);
    return { data: patient };
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get patient summary with counts of conditions, medications, events, and last observation' })
  async getSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const summary = await this.patientsService.getSummary(id, user);
    return { data: summary };
  }

  @Get(':id/care-circle')
  @ApiOperation({ summary: 'Get care circle members for a patient' })
  async getCareCircle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const members = await this.patientsService.getCareCircle(id, user);
    return { data: members };
  }
}
