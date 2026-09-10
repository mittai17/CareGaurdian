import { Module } from '@nestjs/common';
import { HealthEventsController } from './health-events.controller';
import { HealthEventsService } from './health-events.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [HealthEventsController],
  providers: [HealthEventsService, AccessControlService],
  exports: [HealthEventsService],
})
export class HealthEventsModule {}
