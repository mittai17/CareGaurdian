import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MemoryService } from './memory.service';
import { CreateMemoryFactDto } from './dto/create-memory-fact.dto';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Health Memory')
@ApiBearerAuth()
@Controller()
export class HealthMemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post('patients/:id/memory')
  @ApiOperation({ summary: 'Create a health memory fact for a patient' })
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMemoryFactDto,
    @CurrentUser() user: RequestUser,
  ) {
    const fact = await this.memoryService.create(id, dto, user);
    return { data: fact };
  }

  @Get('patients/:id/memory')
  @ApiOperation({ summary: 'List health memory facts for a patient' })
  @ApiQuery({ name: 'memoryType', required: false })
  @ApiQuery({ name: 'category', required: false })
  async findByPatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('memoryType') memoryType?: string,
    @Query('category') category?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const facts = await this.memoryService.findByPatient(id, user!, {
      memoryType,
      category,
    });
    return { data: facts };
  }

  @Get('memory/:id')
  @ApiOperation({ summary: 'Get a health memory fact by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const fact = await this.memoryService.findById(id, user);
    return { data: fact };
  }
}
