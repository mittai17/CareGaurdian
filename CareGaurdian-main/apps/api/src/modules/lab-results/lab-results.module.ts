import { Module } from '@nestjs/common';
import { LabResultsController } from './lab-results.controller';
import { LabResultsService } from './lab-results.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [LabResultsController],
  providers: [LabResultsService, AccessControlService],
  exports: [LabResultsService],
})
export class LabResultsModule {}
