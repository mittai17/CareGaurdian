import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LabResultsService } from './lab-results.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Lab Results')
@ApiBearerAuth()
@Controller()
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post('patients/:patientId/lab-results')
  @ApiOperation({ summary: 'Create a lab result for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateLabResultDto,
    @CurrentUser() user: RequestUser,
  ) {
    const labResult = await this.labResultsService.create(patientId, dto, user);
    return { data: labResult };
  }

  @Get('patients/:patientId/lab-results')
  @ApiOperation({ summary: 'List lab results for a patient' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const results = await this.labResultsService.findByPatient(patientId, user);
    return { data: results };
  }

  @Get('lab-results/:id')
  @ApiOperation({ summary: 'Get a lab result by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const labResult = await this.labResultsService.findById(id, user);
    return { data: labResult };
  }
}
