/**
 * Year Timeline Service — produces a per-year health-status classification.
 *
 * This is a TRANSPARENT, heuristic classification of documented health change
 * per year. It is not a medical diagnosis. Each year is assigned a status with
 * evidence-backed reasons derived from health events, episodes, risk signals,
 * contradictions and documented information gaps.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type YearStatus = 'GOOD' | 'STABLE' | 'WATCH' | 'CONCERN' | 'CRITICAL';

export interface YearEvent {
  id: string;
  type: string;
  timestamp: string;
  description?: string;
  sourceType: string;
  status: string;
  episodeId?: string;
}

export interface YearMetrics {
  events: number;
  hospitalizations: number;
  erVisits: number;
  falls: number;
  nearFalls: number;
  medicationChanges: number;
  missedMedications: number;
  cognitiveChanges: number;
  functionalChanges: number;
  observations: number;
  signals: number;
  episodes: number;
  contradictions: number;
}

export interface YearSource {
  sourceType: string;
  count: number;
}

export interface YearSummary {
  year: number;
  status: YearStatus;
  label: string;
  summary: string;
  reasons: string[];
  metrics: YearMetrics;
  events: YearEvent[];
  episodeTitles: string[];
  sources: YearSource[];
  score?: number;
}

export interface YearTimelineResult {
  patientId: string;
  currentYear: number;
  years: YearSummary[];
}

const EVENT_WEIGHTS: Record<string, number> = {
  HOSPITALIZATION: 4,
  ER_VISIT: 2.5,
  FALL: 3,
  NEAR_FALL: 1.5,
  DIAGNOSIS: 2,
  COGNITIVE_CHANGE: 2.5,
  FUNCTIONAL_CHANGE: 2.5,
  MEDICATION_CHANGED: 1.5,
  MEDICATION_STARTED: 1,
  MEDICATION_STOPPED: 1,
  MISSED_MEDICATION: 1,
  APPETITE_CHANGE: 1,
  SLEEP_CHANGE: 1,
  MOBILITY_CHANGE: 1,
  SYMPTOM: 1,
  PROCEDURE: 1,
  CAREGIVER_OBSERVATION: 0.5,
  LAB_RESULT: 0.5,
  CLINICAL_REVIEW: 0.5,
  ASSESSMENT: 0.5,
  MEDICATION_REMINDER: 0,
  CHECK_IN: 0,
  CONTACT: 0,
};

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 4,
  REVIEW: 2,
  ATTENTION: 1,
  NORMAL: 0,
  UNKNOWN: 0,
};

const EVENT_LABEL: Record<string, string> = {
  HOSPITALIZATION: 'Hospitalization',
  ER_VISIT: 'ER visit',
  FALL: 'Fall',
  NEAR_FALL: 'Near fall',
  DIAGNOSIS: 'New diagnosis',
  COGNITIVE_CHANGE: 'Cognitive change',
  FUNCTIONAL_CHANGE: 'Functional decline',
  MEDICATION_CHANGED: 'Medication change',
  MEDICATION_STARTED: 'Medication started',
  MEDICATION_STOPPED: 'Medication stopped',
  MISSED_MEDICATION: 'Missed medication',
  APPETITE_CHANGE: 'Appetite change',
  SLEEP_CHANGE: 'Sleep change',
  MOBILITY_CHANGE: 'Mobility change',
  SYMPTOM: 'New symptom',
  PROCEDURE: 'Procedure',
  CAREGIVER_OBSERVATION: 'Caregiver observation',
  LAB_RESULT: 'Lab result',
  CLINICAL_REVIEW: 'Clinical review',
  ASSESSMENT: 'Assessment',
};

const STATUS_META: Record<YearStatus, { label: string }> = {
  CRITICAL: { label: 'Critical' },
  CONCERN: { label: 'Concern' },
  WATCH: { label: 'Watch' },
  STABLE: { label: 'Stable' },
  GOOD: { label: 'Good' },
};

@Injectable()
export class YearTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async build(patientId: string): Promise<YearTimelineResult> {
    const now = new Date();
    const currentYear = now.getFullYear();

    const [events, episodes, signals, contradictions, gaps, observations] = await Promise.all([
      this.prisma.healthEvent.findMany({
        where: { patientId },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.episode.findMany({
        where: { patientId },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.riskSignal.findMany({
        where: { patientId },
        orderBy: { generatedAt: 'asc' },
      }),
      this.prisma.contradiction.findMany({
        where: { patientId, status: 'OPEN' },
        orderBy: { detectedAt: 'asc' },
      }),
      (this.prisma as any).missingInformation.findMany({
        where: { patientId, status: 'OPEN' },
        orderBy: { detectedAt: 'asc' },
      }),
      this.prisma.observation.findMany({
        where: { patientId },
        orderBy: { occurredAt: 'asc' },
      }),
    ]);

    const years = this.collectYears({ events, episodes, signals, contradictions, gaps, observations });

    return {
      patientId,
      currentYear,
      years,
    };
  }

  // ---------------------------------------------------------------------------
  // Aggregation
  // ---------------------------------------------------------------------------

  private collectYears(input: {
    events: Array<Record<string, unknown>>;
    episodes: Array<Record<string, unknown>>;
    signals: Array<Record<string, unknown>>;
    contradictions: Array<Record<string, unknown>>;
    gaps: Array<Record<string, unknown>>;
    observations: Array<Record<string, unknown>>;
  }): YearSummary[] {
    const buckets = new Map<number, YearSummary>();

    const getBucket = (year: number): YearSummary => {
      if (!buckets.has(year)) {
        buckets.set(year, {
          year,
          status: 'GOOD',
          label: STATUS_META.GOOD.label,
          summary: '',
          reasons: [],
          metrics: this.emptyMetrics(),
          events: [],
          episodeTitles: [],
          sources: [],
        });
      }
      return buckets.get(year)!;
    };

    // Health events
    for (const e of input.events) {
      const year = new Date(String(e['timestamp'])).getFullYear();
      if (Number.isNaN(year)) continue;
      const bucket = getBucket(year);
      bucket.events.push({
        id: String(e['id']),
        type: String(e['type']),
        timestamp: new Date(String(e['timestamp'])).toISOString(),
        description: e['description'] ? String(e['description']) : undefined,
        sourceType: String(e['sourceType']),
        status: String(e['status']),
        episodeId: e['episodeId'] ? String(e['episodeId']) : undefined,
      });
      this.applyEventMetric(bucket.metrics, String(e['type']));
    }

    // Episodes
    for (const ep of input.episodes) {
      const startYear = new Date(String(ep['startDate'])).getFullYear();
      const endYear = ep['endDate']
        ? new Date(String(ep['endDate'])).getFullYear()
        : startYear;
      for (let y = startYear; y <= endYear; y++) {
        const bucket = getBucket(y);
        bucket.metrics.episodes += 1;
        bucket.episodeTitles.push(String(ep['title']));
        const severityWeight = SEVERITY_WEIGHT[String(ep['severity'] ?? 'UNKNOWN')] ?? 0;
        this.addScore(bucket, severityWeight);
        if (severityWeight > 0) {
          this.addReason(
            bucket,
            severityWeight >= 4
              ? `Episode "${String(ep['title'])}" recorded as CRITICAL`
              : severityWeight >= 2
                ? `Episode "${String(ep['title'])}" recorded as REVIEW`
                : `Episode "${String(ep['title'])}" recorded`,
          );
        }
      }
    }

    // Risk signals
    for (const s of input.signals) {
      const year = new Date(String(s['generatedAt'])).getFullYear();
      if (Number.isNaN(year)) continue;
      const bucket = getBucket(year);
      bucket.metrics.signals += 1;
      const severity = String(s['severity'] ?? 'UNKNOWN');
      const weight = SEVERITY_WEIGHT[severity] ?? 0;
      this.addScore(bucket, weight);
      if (weight >= 2) {
        this.addReason(bucket, `${String(s['signalType'])} signal flagged for clinical review`);
      }
    }

    // Contradictions + info gaps + observations add to score softly
    for (const c of input.contradictions) {
      const year = new Date(String(c['detectedAt'])).getFullYear();
      if (Number.isNaN(year)) continue;
      const bucket = getBucket(year);
      bucket.metrics.contradictions += 1;
      this.addScore(bucket, 1);
      this.addReason(bucket, 'Conflicting record detected');
    }

    for (const g of input.gaps) {
      const year = new Date(String(g['detectedAt'])).getFullYear();
      if (Number.isNaN(year)) continue;
      this.addScore(getBucket(year), 0.5);
    }

    for (const o of input.observations) {
      const year = new Date(String(o['occurredAt'])).getFullYear();
      if (Number.isNaN(year)) continue;
      const bucket = getBucket(year);
      bucket.metrics.observations += 1;
      this.addScore(bucket, 0.1);
      const sourceType = String(o['sourceType'] ?? 'UNKNOWN');
      const tally = bucket.sources.find((s) => s.sourceType === sourceType);
      if (tally) {
        tally.count += 1;
      } else {
        bucket.sources.push({ sourceType, count: 1 });
      }
    }

    const years = [...buckets.values()].sort((a, b) => a.year - b.year);
    for (const bucket of years) {
      this.finalize(bucket);
    }

    return years;
  }

  private emptyMetrics(): YearMetrics {
    return {
      events: 0,
      hospitalizations: 0,
      erVisits: 0,
      falls: 0,
      nearFalls: 0,
      medicationChanges: 0,
      missedMedications: 0,
      cognitiveChanges: 0,
      functionalChanges: 0,
      observations: 0,
      signals: 0,
      episodes: 0,
      contradictions: 0,
    };
  }

  private applyEventMetric(metrics: YearMetrics, type: string): void {
    metrics.events += 1;
    switch (type) {
      case 'HOSPITALIZATION':
        metrics.hospitalizations += 1;
        break;
      case 'ER_VISIT':
        metrics.erVisits += 1;
        break;
      case 'FALL':
        metrics.falls += 1;
        break;
      case 'NEAR_FALL':
        metrics.nearFalls += 1;
        break;
      case 'MEDICATION_CHANGED':
      case 'MEDICATION_STARTED':
      case 'MEDICATION_STOPPED':
        metrics.medicationChanges += 1;
        break;
      case 'MISSED_MEDICATION':
        metrics.missedMedications += 1;
        break;
      case 'COGNITIVE_CHANGE':
        metrics.cognitiveChanges += 1;
        break;
      case 'FUNCTIONAL_CHANGE':
        metrics.functionalChanges += 1;
        break;
    }
  }

  private addScore(bucket: YearSummary, points: number): void {
    bucket.score = (bucket.score ?? 0) + points;
  }

  private addReason(bucket: YearSummary, reason: string): void {
    if (!bucket.reasons.includes(reason)) {
      bucket.reasons.push(reason);
    }
  }

  private finalize(bucket: YearSummary): void {
    const score = bucket.score ?? 0;
    const m = bucket.metrics;
    const reasonList = [...bucket.reasons];

    if (m.hospitalizations > 0) {
      this.pushReason(reasonList, `${m.hospitalizations} hospitalization${m.hospitalizations > 1 ? 's' : ''}`);
    }
    if (m.falls > 0) {
      this.pushReason(reasonList, `${m.falls} documented fall${m.falls > 1 ? 's' : ''}`);
    }
    if (m.medicationChanges > 0) {
      this.pushReason(reasonList, `${m.medicationChanges} medication change${m.medicationChanges > 1 ? 's' : ''}`);
    }
    if (m.cognitiveChanges > 0) {
      this.pushReason(reasonList, `${m.cognitiveChanges} documented cognitive change${m.cognitiveChanges > 1 ? 's' : ''}`);
    }
    if (m.functionalChanges > 0) {
      this.pushReason(reasonList, `${m.functionalChanges} documented functional change${m.functionalChanges > 1 ? 's' : ''}`);
    }
    if (m.missedMedications > 0) {
      this.pushReason(reasonList, `${m.missedMedications} missed medication${m.missedMedications > 1 ? 's' : ''}`);
    }
    if (m.observations >= 20) {
      this.pushReason(reasonList, `${m.observations} recorded observations`);
    }
    if (m.signals > 0) {
      this.pushReason(reasonList, `${m.signals} change signal${m.signals > 1 ? 's' : ''} flagged for review`);
    }
    if (bucket.episodeTitles.length > 0) {
      this.pushReason(reasonList, `Episode documented: ${bucket.episodeTitles[0]}`);
    }
    if (m.contradictions > 0) {
      this.pushReason(reasonList, `${m.contradictions} conflicting record${m.contradictions > 1 ? 's' : ''}`);
    }

    // Classify — transparent thresholds on the weighted change burden.
    let status: YearStatus;
    if (score >= 28) status = 'CRITICAL';
    else if (score >= 16) status = 'CONCERN';
    else if (score >= 8) status = 'WATCH';
    else if (score >= 3) status = 'STABLE';
    else status = 'GOOD';

    const reasons = reasonList.slice(0, 6);

    if (bucket.events.length === 0 && m.observations === 0) {
      // Data-presence fallback keeps classification honest.
      status = 'GOOD';
    }

    bucket.status = status;
    bucket.label = STATUS_META[status].label;
    bucket.reasons = reasons;
    bucket.summary = this.summarize(status, reasons, bucket.events.length);
    bucket.events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    delete bucket.score;
  }

  private pushReason(list: string[], reason: string): void {
    if (!list.includes(reason)) {
      list.push(reason);
    }
  }

  private summarize(status: YearStatus, reasons: string[], eventCount: number): string {
    if (eventCount === 0 && reasons.length === 0) {
      return 'No documented health activity this year.';
    }
    if (status === 'CRITICAL') {
      return 'Multiple significant documented changes this year requiring urgent clinical review.';
    }
    if (status === 'CONCERN') {
      return 'Meaningful changes documented this year. Clinical review recommended.';
    }
    if (status === 'WATCH') {
      return 'Some changes detected this year. Worth monitoring.';
    }
    if (status === 'STABLE') {
      return 'Minor documented changes; overall stable.';
    }
    return 'Generally stable with no significant changes documented.';
  }
}