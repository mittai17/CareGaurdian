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
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Allergies')
@ApiBearerAuth()
@Controller()
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post('patients/:patientId/allergies')
  @ApiOperation({ summary: 'Create an allergy for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateAllergyDto,
    @CurrentUser() user: RequestUser,
  ) {
    const allergy = await this.allergiesService.create(patientId, dto, user);
    return { data: allergy };
  }

  @Get('patients/:patientId/allergies')
  @ApiOperation({ summary: 'List allergies for a patient' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const allergies = await this.allergiesService.findByPatient(patientId, user);
    return { data: allergies };
  }

  @Patch('allergies/:id')
  @ApiOperation({ summary: 'Partially update an allergy' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAllergyDto,
    @CurrentUser() user: RequestUser,
  ) {
    const allergy = await this.allergiesService.update(id, dto, user);
    return { data: allergy };
  }
}
