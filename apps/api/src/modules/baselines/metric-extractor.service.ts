import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BaselineMetricType,
  ConfidenceLevel,
  ObservationCategory,
} from '@prisma/client';

export interface MetricResult {
  metric: BaselineMetricType;
  values: number[];
  sampleSize: number;
  mean: number | null;
  stdDev: number | null;
  confidence: ConfidenceLevel;
}

/** Maps ObservationCategory → BaselineMetricType for score-based metrics. */
const OBSERVATION_TO_METRIC: Partial<Record<ObservationCategory, BaselineMetricType>> = {
  CONFUSION: 'COGNITION',
  APPETITE: 'APPETITE',
  SLEEP: 'SLEEP',
  MOBILITY: 'MOBILITY',
  MOOD: 'MOOD',
  PAIN: 'PAIN',
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing)
// ---------------------------------------------------------------------------

export function computeStats(values: number[]): {
  mean: number;
  stdDev: number;
} {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { mean, stdDev: 0 };
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

export function deriveConfidence(
  sampleSize: number,
  stdDev: number,
): ConfidenceLevel {
  if (sampleSize >= 10 && stdDev > 0) return 'HIGH';
  if (sampleSize >= 5) return 'MODERATE';
  if (sampleSize >= 3) return 'LOW';
  return 'INSUFFICIENT_DATA';
}

/** Severity string → numeric score (0-10 scale). */
function severityToScore(severity: string): number | null {
  switch (severity.toUpperCase()) {
    case 'MILD':
      return 3;
    case 'MODERATE':
      return 6;
    case 'SEVERE':
      return 9;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------

@Injectable()
export class MetricExtractorService {
  private readonly logger = new Logger(MetricExtractorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extract all computable metrics from real DB data within the given time
   * window. Used by both BaselinesService (90-day window) and
   * ChangeDetectionService (7-day window).
   */
  async extractMetrics(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MetricResult[]> {
    const results: MetricResult[] = [];

    // ------------------------------------------------------------------
    // 1. MEDICATION_ADHERENCE from MedicationEvent (TAKEN vs MISSED)
    // ------------------------------------------------------------------
    const medEvents = await this.prisma.medicationEvent.findMany({
      where: {
        patientId,
        occurredAt: { gte: startDate, lte: endDate },
      },
    });

    const taken = medEvents.filter((e) => e.type === 'TAKEN').length;
    const missed = medEvents.filter((e) => e.type === 'MISSED').length;
    const total = taken + missed;

    if (total >= 3) {
      // Binary values: taken → 1, missed → 0
      const binaryValues: number[] = [];
      for (let i = 0; i < taken; i++) binaryValues.push(1);
      for (let i = 0; i < missed; i++) binaryValues.push(0);

      const { mean, stdDev } = computeStats(binaryValues);
      // Store as percentage 0-100
      const adherencePercent = mean !== null ? mean * 100 : null;

      results.push({
        metric: 'MEDICATION_ADHERENCE',
        values: binaryValues,
        sampleSize: total,
        mean: adherencePercent,
        stdDev,
        confidence: deriveConfidence(total, stdDev),
      });
    }

    // ------------------------------------------------------------------
    // 2. Observation-based metrics (per category)
    // ------------------------------------------------------------------
    const observations = await this.prisma.observation.findMany({
      where: {
        patientId,
        occurredAt: { gte: startDate, lte: endDate },
      },
    });

    const categoryBuckets = new Map<ObservationCategory, number[]>();
    const walkingValues: number[] = [];

    for (const obs of observations) {
      const structured = obs.structured as Record<string, unknown>;

      // Check for steps data → WALKING metric
      const steps = this.extractSteps(structured);
      if (steps !== null) {
        walkingValues.push(steps);
      }

      // Map category → metric
      const metricType = OBSERVATION_TO_METRIC[obs.category];
      if (!metricType) continue;

      const score = this.extractObservationScore(structured, obs.severity);
      if (score === null) continue;

      if (!categoryBuckets.has(obs.category)) {
        categoryBuckets.set(obs.category, []);
      }
      categoryBuckets.get(obs.category)!.push(score);
    }

    for (const [category, values] of categoryBuckets) {
      const metricType = OBSERVATION_TO_METRIC[category]!;
      const { mean, stdDev } = computeStats(values);
      results.push({
        metric: metricType,
        values,
        sampleSize: values.length,
        mean,
        stdDev,
        confidence: deriveConfidence(values.length, stdDev),
      });
    }

    // ------------------------------------------------------------------
    // 3. WALKING from steps in structured data
    // ------------------------------------------------------------------
    if (walkingValues.length >= 3) {
      const { mean, stdDev } = computeStats(walkingValues);
      results.push({
        metric: 'WALKING',
        values: walkingValues,
        sampleSize: walkingValues.length,
        mean,
        stdDev,
        confidence: deriveConfidence(walkingValues.length, stdDev),
      });
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Extract a numeric score from an Observation's structured data.
   * Priority: normalizedScore → score → severity mapping.
   */
  private extractObservationScore(
    structured: Record<string, unknown>,
    severity: string | null,
  ): number | null {
    // Try normalizedScore (0-10)
    if (
      structured.normalizedScore !== undefined &&
      structured.normalizedScore !== null
    ) {
      const score = Number(structured.normalizedScore);
      if (!isNaN(score) && score >= 0 && score <= 10) return score;
    }

    // Try score field (0-10)
    if (structured.score !== undefined && structured.score !== null) {
      const score = Number(structured.score);
      if (!isNaN(score) && score >= 0 && score <= 10) return score;
    }

    // Fall back to severity string
    if (severity) {
      return severityToScore(severity);
    }

    return null;
  }

  /**
   * Extract step count from structured metadata.
   * Checks: structured.metadata.steps → structured.steps.
   */
  private extractSteps(structured: Record<string, unknown>): number | null {
    // structured.metadata.steps
    if (
      structured.metadata !== undefined &&
      structured.metadata !== null &&
      typeof structured.metadata === 'object'
    ) {
      const meta = structured.metadata as Record<string, unknown>;
      if (meta.steps !== undefined && meta.steps !== null) {
        const steps = Number(meta.steps);
        if (!isNaN(steps) && steps >= 0) return steps;
      }
    }

    // structured.steps
    if (structured.steps !== undefined && structured.steps !== null) {
      const steps = Number(structured.steps);
      if (!isNaN(steps) && steps >= 0) return steps;
    }

    return null;
  }
}
