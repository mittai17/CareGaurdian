import { Module } from '@nestjs/common';
import { ChangeDetectionController } from './change-detection.controller';
import { ChangeDetectionService } from './change-detection.service';
import { BaselinesModule } from '../baselines/baselines.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AuditModule } from '../audit/audit.module';

/**
 * THE CHANGE DETECTION ENGINE.
 *
 * Imports BaselinesModule to reuse MetricExtractorService — avoids
 * duplicating metric extraction logic.
 */
@Module({
  imports: [
    GlobalGuardsModule,
    PrismaModule,
    AuditModule,
    BaselinesModule, // for MetricExtractorService
  ],
  controllers: [ChangeDetectionController],
  providers: [ChangeDetectionService],
  exports: [ChangeDetectionService],
})
export class ChangeDetectionModule {}
