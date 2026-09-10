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
import { ConditionsService } from './conditions.service';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Conditions')
@ApiBearerAuth()
@Controller()
export class ConditionsController {
  constructor(private readonly conditionsService: ConditionsService) {}

  @Post('patients/:patientId/conditions')
  @ApiOperation({ summary: 'Create a condition for a patient' })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateConditionDto,
    @CurrentUser() user: RequestUser,
  ) {
    const condition = await this.conditionsService.create(patientId, dto, user);
    return { data: condition };
  }

  @Get('patients/:patientId/conditions')
  @ApiOperation({ summary: 'List conditions for a patient' })
  async findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const conditions = await this.conditionsService.findByPatient(patientId, user);
    return { data: conditions };
  }

  @Patch('conditions/:id')
  @ApiOperation({ summary: 'Partially update a condition' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConditionDto,
    @CurrentUser() user: RequestUser,
  ) {
    const condition = await this.conditionsService.update(id, dto, user);
    return { data: condition };
  }
}
