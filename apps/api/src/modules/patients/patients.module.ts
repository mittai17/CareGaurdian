import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [PatientsController],
  providers: [PatientsService, AccessControlService],
  exports: [PatientsService],
})
export class PatientsModule {}
