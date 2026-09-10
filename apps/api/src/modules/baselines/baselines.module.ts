import { Module } from '@nestjs/common';
import { BaselinesController } from './baselines.controller';
import { BaselinesService } from './baselines.service';
import { MetricExtractorService } from './metric-extractor.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';

/**
 * THE PERSONAL BASELINE ENGINE.
 *
 * Exports MetricExtractorService so ChangeDetectionModule can reuse the
 * metric extraction logic without duplication.
 */
@Module({
  imports: [GlobalGuardsModule, PrismaModule, AuditModule],
  controllers: [BaselinesController],
  providers: [BaselinesService, MetricExtractorService],
  exports: [BaselinesService, MetricExtractorService],
})
export class BaselinesModule {}
