import { Module } from '@nestjs/common';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [ObservationsController],
  providers: [ObservationsService, AccessControlService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
