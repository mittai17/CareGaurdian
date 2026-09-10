import { Module } from '@nestjs/common';
import { ContradictionsController } from './contradictions.controller';
import { ContradictionsService } from './contradictions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [ContradictionsController],
  providers: [ContradictionsService],
  exports: [ContradictionsService],
})
export class ContradictionsModule {}
