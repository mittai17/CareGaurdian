import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit log entries (ADMIN only)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'result', required: false })
  @ApiQuery({ name: 'take', required: false, schema: { type: 'integer', default: 50 } })
  @ApiQuery({ name: 'skip', required: false, schema: { type: 'integer', default: 0 } })
  async query(
    @Query('patientId') patientId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('result') result?: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    return this.auditService.query({
      patientId,
      actorId,
      action,
      result,
      take,
      skip,
    });
  }
}