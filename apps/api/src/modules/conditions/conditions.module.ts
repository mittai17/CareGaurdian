import { Module } from '@nestjs/common';
import { ConditionsController } from './conditions.controller';
import { ConditionsService } from './conditions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [ConditionsController],
  providers: [ConditionsService, AccessControlService],
  exports: [ConditionsService],
})
export class ConditionsModule {}
