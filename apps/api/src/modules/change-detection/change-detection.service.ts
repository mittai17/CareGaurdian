import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  MetricExtractorService,
  MetricResult,
} from '../baselines/metric-extractor.service';
import {
  ConfidenceLevel,
  BaselineMetricType,
} from '@prisma/client';

const CURRENT_WINDOW_DAYS = 7;
const DEVIATION_THRESHOLD_PERCENT = 15;

interface MetricDeviation {
  metric: BaselineMetricType;
  baseline: number;
  current: number;
  deviationPercent: number;
  timeWindowDays: number;
  confidence: ConfidenceLevel;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
}

@Injectable()
export class ChangeDetectionService {
  private readonly logger = new Logger(ChangeDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly metricExtractor: MetricExtractorService,
  ) {}

  /**
   * Run change detection for a patient:
   * 1. Load existing baseline (required)
   * 2. Compute current metric values (last 7 days)
   * 3. Compare and identify deviations
   * 4. Create RiskSignal + Evidence rows if deviations found
   */
  async detect(patientId: string) {
    // ---------------------------------------------------------------
    // 1. Load baseline
    // ---------------------------------------------------------------
    const baseline = await this.prisma.baseline.findUnique({
      where: { patientId },
      include: { metrics: true },
    });

    if (!baseline) {
      throw new NotFoundException(
        'No baseline found for this patient. Compute a baseline first.',
      );
    }

    // ---------------------------------------------------------------
    // 2. Compute current values (last 7 days)
    // ---------------------------------------------------------------
    const now = new Date();
    const startDate = new Date(
      now.getTime() - CURRENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const currentMetrics = await this.metricExtractor.extractMetrics(
      patientId,
      startDate,
      now,
    );

    // ---------------------------------------------------------------
    // 3. Compare baseline vs current
    // ---------------------------------------------------------------
    const deviations: MetricDeviation[] = [];
    const baselineMetricMap = new Map(
      baseline.metrics.map((m) => [m.metric, m]),
    );

    for (const current of currentMetrics) {
      const bl = baselineMetricMap.get(current.metric);
      // Skip if no baseline value or current has no value
      if (!bl || bl.value === null || current.mean === null) continue;
      // Skip if current sample too small
      if (current.sampleSize < 2) continue;

      const baselineValue = bl.value;
      const currentValue = current.mean;

      // Avoid division by zero
      if (baselineValue === 0) continue;

      const deviationPercent =
        ((currentValue - baselineValue) / baselineValue) * 100;

      if (Math.abs(deviationPercent) >= DEVIATION_THRESHOLD_PERCENT) {
        const trend =
          deviationPercent > 0
            ? 'INCREASING'
            : deviationPercent < 0
              ? 'DECREASING'
              : 'STABLE';

        deviations.push({
          metric: current.metric,
          baseline: baselineValue,
          current: currentValue,
          deviationPercent: Math.round(deviationPercent * 100) / 100,
          timeWindowDays: CURRENT_WINDOW_DAYS,
          confidence: current.confidence,
          trend,
        });
      }
    }

    // ---------------------------------------------------------------
    // 4. Determine severity + signal type
    // ---------------------------------------------------------------
    if (deviations.length === 0) {
      return {
        data: null,
        message: 'No meaningful deviations detected from personal baseline.',
      };
    }

    let severity: Severity;
    if (deviations.length >= 4) {
      severity = 'CRITICAL';
    } else if (deviations.length >= 2) {
      severity = 'REVIEW';
    } else {
      severity = 'ATTENTION';
    }

    const signalType =
      deviations.length >= 3 ? 'MULTI_DOMAIN_CHANGE' : 'CHANGE_SIGNAL';

    // Confidence from deviations
    const confidences = deviations.map((d) => d.confidence);
    const overallConfidence = this.computeOverallConfidence(confidences);

    // Build whyNow reasons
    const whyNow = deviations.map(
      (d) =>
        `${d.metric} ${d.trend === 'INCREASING' ? 'increased' : 'decreased'} ${Math.abs(d.deviationPercent).toFixed(1)}%`,
    );

    // ---------------------------------------------------------------
    // 5. Persist RiskSignal + Evidence in a transaction
    // ---------------------------------------------------------------
    const signal = await this.prisma.$transaction(async (tx) => {
      const riskSignal = await tx.riskSignal.create({
        data: {
          patientId,
          signalType,
          severity,
          confidenceLevel: overallConfidence,
          summary:
            'Meaningful deviation from personal baseline detected.',
          metrics: deviations as unknown as Prisma.InputJsonValue,
          requiresHumanReview: true,
          status: 'PENDING',
          whyNow: whyNow as unknown as Prisma.InputJsonValue,
        },
      });

      // Emit Evidence rows for each deviation
      const evidenceIds: string[] = [];

      for (const dev of deviations) {
        // Find source events used for this current metric
        const sourceEvents = await tx.healthEvent.findMany({
          where: {
            patientId,
            timestamp: { gte: startDate, lte: now },
          },
          take: 20,
        });

        // Pick up to 5 evidence events
        const evidenceEvents = sourceEvents.slice(0, 5);

        for (const evt of evidenceEvents) {
          const evidence = await tx.evidence.create({
            data: {
              riskSignalId: riskSignal.id,
              eventId: evt.id,
              claim: `${dev.metric} deviation: baseline=${dev.baseline.toFixed(2)}, current=${dev.current.toFixed(2)} (${dev.deviationPercent > 0 ? '+' : ''}${dev.deviationPercent.toFixed(1)}%)`,
              detail: `Confidence: ${dev.confidence}. Trend: ${dev.trend}.`,
              sourceType: evt.sourceType,
              sourceId: evt.id,
              sourceDescription: evt.description ?? undefined,
              recordedAt: now,
            },
          });
          evidenceIds.push(evidence.id);
        }
      }

      return { ...riskSignal, evidenceIds };
    });

    // ---------------------------------------------------------------
    // 6. Audit
    // ---------------------------------------------------------------
    await this.auditService.log({
      patientId,
      action: 'AI_ANALYSIS',
      resourceType: 'RiskSignal',
      resourceId: signal.id,
      purpose: 'ANALYSIS',
      result: 'SUCCESS',
      metadata: {
        signalType,
        severity,
        deviationCount: deviations.length,
      },
    });

    this.logger.log(
      `Change detection for patient ${patientId}: ${deviations.length} deviations, severity=${severity}`,
    );

    return {
      data: {
        id: signal.id,
        patientId: signal.patientId,
        signalType: signal.signalType,
        severity: signal.severity,
        confidenceLevel: signal.confidenceLevel,
        summary: signal.summary,
        metrics: signal.metrics,
        evidenceIds: signal.evidenceIds,
        requiresHumanReview: signal.requiresHumanReview,
        status: signal.status,
        generatedAt: signal.generatedAt.toISOString(),
        whyNow: signal.whyNow,
      },
    };
  }

  /** List RiskSignals of CHANGE_SIGNAL type for a patient. */
  async listChanges(patientId: string) {
    const signals = await this.prisma.riskSignal.findMany({
      where: {
        patientId,
        signalType: { in: ['CHANGE_SIGNAL', 'MULTI_DOMAIN_CHANGE'] },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return {
      data: signals.map((s) => ({
        id: s.id,
        patientId: s.patientId,
        signalType: s.signalType,
        severity: s.severity,
        confidenceLevel: s.confidenceLevel,
        summary: s.summary,
        metrics: s.metrics,
        evidenceIds: s.evidenceIds,
        requiresHumanReview: s.requiresHumanReview,
        status: s.status,
        generatedAt: s.generatedAt.toISOString(),
        whyNow: s.whyNow,
      })),
    };
  }

  /** Get a single RiskSignal by ID. */
  async getById(id: string) {
    const signal = await this.prisma.riskSignal.findUnique({
      where: { id },
    });
    if (!signal) {
      throw new NotFoundException('Risk signal not found');
    }
    return {
      data: {
        id: signal.id,
        patientId: signal.patientId,
        signalType: signal.signalType,
        severity: signal.severity,
        confidenceLevel: signal.confidenceLevel,
        summary: signal.summary,
        metrics: signal.metrics,
        evidenceIds: signal.evidenceIds,
        requiresHumanReview: signal.requiresHumanReview,
        status: signal.status,
        generatedAt: signal.generatedAt.toISOString(),
        whyNow: signal.whyNow,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private computeOverallConfidence(
    confidences: ConfidenceLevel[],
  ): ConfidenceLevel {
    // If any is INSUFFICIENT_DATA, downgrade
    const hasInsufficient = confidences.includes('INSUFFICIENT_DATA');
    const highCount = confidences.filter((c) => c === 'HIGH').length;
    const moderateCount = confidences.filter((c) => c === 'MODERATE').length;

    if (hasInsufficient) return 'LOW';
    if (highCount > moderateCount) return 'HIGH';
    if (moderateCount > 0) return 'MODERATE';
    return 'LOW';
  }
}
