import { Module } from '@nestjs/common';
import { HealthMemoryController } from './health-memory.controller';
import { MemoryService } from './memory.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [HealthMemoryController],
  providers: [MemoryService, AccessControlService],
  exports: [MemoryService],
})
export class HealthMemoryModule {}
