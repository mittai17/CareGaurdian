import { Module } from '@nestjs/common';
import { MissingInfoController } from './missing-info.controller';
import { MissingInfoService } from './missing-info.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [MissingInfoController],
  providers: [MissingInfoService],
  exports: [MissingInfoService],
})
export class MissingInformationModule {}
