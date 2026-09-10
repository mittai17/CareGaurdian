import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';

/**
 * Audit trail — export AuditService so any other module can write immutable
 * audit entries with `Log(...)` / `auditService.log(...)`.
 */
@Module({
  imports: [GlobalGuardsModule, PrismaModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}