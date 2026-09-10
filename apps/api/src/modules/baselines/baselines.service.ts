import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  MetricExtractorService,
  MetricResult,
} from './metric-extractor.service';
import { deriveConfidence } from './metric-extractor.service';

const BASELINE_WINDOW_DAYS = 90;

@Injectable()
export class BaselinesService {
  private readonly logger = new Logger(BaselinesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly metricExtractor: MetricExtractorService,
  ) {}

  /**
   * Return the existing baseline for a patient, or compute + persist a new one.
   * All values come from real DB queries — no fabricated numbers.
   */
  async getOrCompute(
    patientId: string,
    options?: { forceRecompute?: boolean },
  ) {
    // ---------------------------------------------------------------
    // 1. Check for existing baseline
    // ---------------------------------------------------------------
    if (!options?.forceRecompute) {
      const existing = await this.prisma.baseline.findUnique({
        where: { patientId },
        include: { metrics: true },
      });
      if (existing) {
        return { data: this.serializeBaseline(existing) };
      }
    }

    // ---------------------------------------------------------------
    // 2. Compute metrics from last 90 days of real data
    // ---------------------------------------------------------------
    const now = new Date();
    const startDate = new Date(
      now.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const metricResults = await this.metricExtractor.extractMetrics(
      patientId,
      startDate,
      now,
    );

    // Apply minimum sample-size filter: <3 samples → INSUFFICIENT_DATA
    const processedMetrics = metricResults.map((r) =>
      r.sampleSize < 3
        ? { ...r, value: null, confidence: 'INSUFFICIENT_DATA' as const }
        : r,
    );

    // Count how many metrics have a real computed value
    const computedCount = processedMetrics.filter(
      (m) => m.mean !== null && m.confidence !== 'INSUFFICIENT_DATA',
    ).length;

    const baselineStatus = computedCount >= 4 ? 'COMPUTED' : 'INSUFFICIENT_DATA';

    // ---------------------------------------------------------------
    // 3. Persist in a transaction
    // ---------------------------------------------------------------
    const baseline = await this.prisma.$transaction(async (tx) => {
      // Upsert baseline row
      const bl = await tx.baseline.upsert({
        where: { patientId },
        create: {
          patientId,
          status: baselineStatus,
          computedAt: now,
        },
        update: {
          status: baselineStatus,
          computedAt: now,
        },
      });

      // Delete old metrics for this baseline, then recreate
      await tx.baselineMetric.deleteMany({
        where: { baselineId: bl.id },
      });

      const metricRows = await Promise.all(
        processedMetrics.map((m) =>
          tx.baselineMetric.create({
            data: {
              baselineId: bl.id,
              metric: m.metric,
              value: m.mean,
              unit: m.metric === 'MEDICATION_ADHERENCE' ? '%' : null,
              timeWindowDays: BASELINE_WINDOW_DAYS,
              sampleSize: m.sampleSize,
              confidence: m.confidence,
              sourceCount: m.sampleSize,
              stdDev: m.stdDev,
              lastUpdated: now,
            },
          }),
        ),
      );

      return { ...bl, metrics: metricRows };
    });

    // ---------------------------------------------------------------
    // 4. Audit
    // ---------------------------------------------------------------
    await this.auditService.log({
      patientId,
      action: 'CREATE_BASELINE',
      resourceType: 'Baseline',
      resourceId: baseline.id,
      purpose: 'CARE',
      result: 'SUCCESS',
      metadata: {
        status: baselineStatus,
        computedMetrics: computedCount,
        totalMetrics: processedMetrics.length,
      },
    });

    this.logger.log(
      `Baseline computed for patient ${patientId}: status=${baselineStatus}, metrics=${computedCount}/${processedMetrics.length}`,
    );

    return { data: this.serializeBaseline(baseline) };
  }

  /** Explicit recompute — always recalculates from scratch. */
  async recompute(patientId: string) {
    return this.getOrCompute(patientId, { forceRecompute: true });
  }

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  private serializeBaseline(baseline: {
    id: string;
    patientId: string;
    status: string;
    computedAt: Date;
    metrics: Array<{
      id: string;
      baselineId: string;
      metric: string;
      value: number | null;
      unit: string | null;
      timeWindowDays: number;
      sampleSize: number;
      confidence: string;
      sourceCount: number;
      lastUpdated: Date;
      stdDev: number | null;
    }>;
  }) {
    return {
      id: baseline.id,
      patientId: baseline.patientId,
      status: baseline.status,
      computedAt: baseline.computedAt.toISOString(),
      metrics: baseline.metrics.map((m) => ({
        id: m.id,
        baselineId: m.baselineId,
        metric: m.metric,
        value: m.value,
        unit: m.unit,
        timeWindowDays: m.timeWindowDays,
        sampleSize: m.sampleSize,
        confidence: m.confidence,
        sourceCount: m.sourceCount,
        lastUpdated: m.lastUpdated.toISOString(),
        stdDev: m.stdDev,
      })),
    };
  }
}
