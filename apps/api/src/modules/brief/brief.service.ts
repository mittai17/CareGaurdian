/**
 * Brief Service — assembles ClinicalBrief and WhatChanged data for patients.
 * Pulls from RiskSignal, Episode, Evidence, Contradiction, MissingInformation
 * tables to build a unified clinical picture.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIGatewayService } from '@baseline/ai';

export interface ClinicalBriefResult {
  patientId: string;
  overallState: string;
  whyNow: string[];
  historicalMatches: Array<{ episodeId: string; title: string; similarity: number }>;
  evidence: string[];
  contradictions: Array<{
    id: string;
    type: string;
    description: string;
    evidenceA: string;
    evidenceB: string;
    detectedAt: string;
    status: string;
    confidence: string;
  }>;
  dataGaps: Array<{
    id: string;
    patientId: string;
    category: string;
    description: string;
    severity: string;
    detectedAt: string;
    status: string;
  }>;
  confidence: string;
  status: string;
  generatedAt: string;
}

export interface WhatChangedResult {
  patientId: string;
  since: string;
  sections: {
    new: string[];
    changed: string[];
    improved: string[];
    resolved: string[];
    unchanged: string[];
    unknown: string[];
  };
  medications: { added: string[]; changed: string[]; stopped: string[] };
  cognition: string[];
}

@Injectable()
export class BriefService {
  private readonly logger = new Logger(BriefService.name);
  private readonly gateway: AIGatewayService;

  constructor(private readonly prisma: PrismaService) {
    this.gateway = new AIGatewayService();
  }

  /**
   * Generate an AI-powered Clinical Brief with natural language sections.
   */
  async generateAiBrief(patientId: string) {
    const data = await this.build(patientId);
    
    let generatedSections;
    try {
      generatedSections = await this.gateway.generateClinicalBrief(data);
    } catch (err) {
      this.logger.error(`Failed to generate AI brief for ${patientId}: ${err instanceof Error ? err.message : String(err)}`);
      // Fallback if LLM fails
      generatedSections = {
        sections: {
          currentChanges: data.whyNow.join('; '),
          relevantHistory: "AI summarization failed. See raw data.",
          careCircleObservations: data.evidence.join('; '),
          medicationContext: "AI summarization failed.",
          cognitiveChanges: "AI summarization failed.",
          functionalChanges: "AI summarization failed.",
          historicalEpisodeMatch: "AI summarization failed.",
          suggestedAreasForClinicalReview: ["Review raw evidence logs manually"]
        }
      };
    }

    return {
      _disclaimer: "This clinical brief is AI-generated from raw health signals, observations, and system data. It is intended to assist clinical review but does not constitute a diagnosis or medical advice. All findings must be independently verified.",
      generatedAt: new Date().toISOString(),
      ...generatedSections
    };
  }

  /**
   * Build a ClinicalBrief for a patient.
   * Aggregates data from risk signals, episodes, evidence, contradictions, and missing info.
   */
  async build(patientId: string): Promise<ClinicalBriefResult> {
    // Fetch all data in parallel
    const [latestSignal, episodes, evidence, contradictions, dataGaps] = await Promise.all([
      // Latest risk signal
      this.prisma.riskSignal.findFirst({
        where: { patientId },
        orderBy: { generatedAt: 'desc' },
      }),

      // Episodes for historical matches
      this.prisma.episode.findMany({
        where: { patientId },
        orderBy: { startDate: 'desc' },
        take: 20,
      }),

      // Evidence rows
      this.prisma.evidence.findMany({
        where: { riskSignal: { patientId } },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),

      // Open contradictions
      this.prisma.contradiction.findMany({
        where: { patientId, status: 'OPEN' },
        orderBy: { detectedAt: 'desc' },
      }),

      // Open data gaps (Prisma model: MissingInformation → accessor: missingInformation)
      (this.prisma as any).missingInformation.findMany({
        where: { patientId, status: 'OPEN' },
        orderBy: { detectedAt: 'desc' },
      }),
    ]);

    // Compute historical matches (simple: most recent episodes with similarity heuristic)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const recentDescriptions = recentEvents
      .map((e) => String(e['description'] ?? '').toLowerCase())
      .filter((d) => d.length > 0);

    const historicalMatches = episodes
      .map((ep: Record<string, unknown>) => {
        const epSymptoms = (Array.isArray(ep['symptoms']) ? (ep['symptoms'] as string[]) : []).map((s: string) => s.toLowerCase());
        const epChanges = [
          ...(Array.isArray(ep['functionalChanges']) ? (ep['functionalChanges'] as string[]) : []),
          ...(Array.isArray(ep['cognitiveChanges']) ? (ep['cognitiveChanges'] as string[]) : []),
        ].map((s: string) => s.toLowerCase());

        const allTags = [...epSymptoms, ...epChanges];
        let overlap = 0;
        for (const tag of allTags) {
          if (recentDescriptions.some((rd: string) => rd.includes(tag) || tag.includes(rd))) {
            overlap++;
          }
        }

        const similarity = allTags.length > 0
          ? Math.round((overlap / allTags.length) * 100) / 100
          : 0;

        return {
          episodeId: String(ep['id']),
          title: String(ep['title']),
          similarity,
        };
      })
      .filter((m: { episodeId: string; title: string; similarity: number }) => m.similarity > 0.1)
      .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
      .slice(0, 5);

    // Determine overall state
    const overallState = latestSignal ? String(latestSignal['severity']) : 'NORMAL';

    // Extract whyNow
    const whyNow: string[] = [];
    if (latestSignal && Array.isArray(latestSignal['whyNow'])) {
      whyNow.push(...(latestSignal['whyNow'] as string[]));
    }
    if (latestSignal) {
      whyNow.push(`Latest signal: ${latestSignal['summary']}`);
    }
    if (whyNow.length === 0) {
      whyNow.push('No recent changes detected');
    }

    // Format evidence
    const evidenceStrings = evidence.map(
      (e: Record<string, unknown>) => `[${e['sourceType']}] ${e['claim']}${e['detail'] ? ` — ${e['detail']}` : ''}`,
    );

    // Format contradictions
    const formattedContradictions = contradictions.map((c: Record<string, unknown>) => ({
      id: String(c['id']),
      type: String(c['type']),
      description: String(c['description']),
      evidenceA: String(c['evidenceA']),
      evidenceB: String(c['evidenceB']),
      detectedAt: c['detectedAt'] instanceof Date ? c['detectedAt'].toISOString() : String(c['detectedAt']),
      status: String(c['status']),
      confidence: String(c['confidence']),
    }));

    // Format data gaps
    const formattedGaps = dataGaps.map((d: Record<string, unknown>) => ({
      id: String(d['id']),
      patientId: String(d['patientId']),
      category: String(d['category']),
      description: String(d['description']),
      severity: String(d['severity']),
      detectedAt: d['detectedAt'] instanceof Date ? d['detectedAt'].toISOString() : String(d['detectedAt']),
      status: String(d['status']),
    }));

    // Determine confidence
    const confidence = latestSignal
      ? String(latestSignal['confidenceLevel'])
      : 'INSUFFICIENT_DATA';

    return {
      patientId,
      overallState,
      whyNow,
      historicalMatches,
      evidence: evidenceStrings,
      contradictions: formattedContradictions,
      dataGaps: formattedGaps,
      confidence,
      status: 'GENERATED',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build a "What Changed" comparison: last 30d vs previous 60d.
   * Returns categorized sections and medication changes.
   */
  async whatChanged(patientId: string): Promise<WhatChangedResult> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch recent (30d) and previous (60d-30d) data in parallel
    const [
      recentObservations,
      previousObservations,
      recentMedEvents,
      previousMedEvents,
      recentHealthEvents,
      previousHealthEvents,
      recentMeds,
    ] = await Promise.all([
      // Recent observations (last 30 days)
      this.prisma.observation.findMany({
        where: {
          patientId,
          occurredAt: { gte: thirtyDaysAgo },
        },
        orderBy: { occurredAt: 'desc' },
      }),

      // Previous observations (30-90 days ago)
      this.prisma.observation.findMany({
        where: {
          patientId,
          occurredAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
        orderBy: { occurredAt: 'desc' },
      }),

      // Recent medication events (last 30 days)
      this.prisma.medicationEvent.findMany({
        where: {
          patientId,
          occurredAt: { gte: thirtyDaysAgo },
        },
        orderBy: { occurredAt: 'desc' },
      }),

      // Previous medication events (30-90 days ago)
      this.prisma.medicationEvent.findMany({
        where: {
          patientId,
          occurredAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
        orderBy: { occurredAt: 'desc' },
      }),

      // Recent health events (last 30 days)
      this.prisma.healthEvent.findMany({
        where: {
          patientId,
          timestamp: { gte: thirtyDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
      }),

      // Previous health events (30-90 days ago)
      this.prisma.healthEvent.findMany({
        where: {
          patientId,
          timestamp: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
      }),

      // Current active medications
      this.prisma.medication.findMany({
        where: { patientId, status: 'ACTIVE' },
      }),
    ]);

    // --- Medication changes ---
    const recentMedNames = new Set(recentMedEvents.map((e) => String(e['medicationName']).toLowerCase()));
    const previousMedNames = new Set(previousMedEvents.map((e) => String(e['medicationName']).toLowerCase()));

    const added = recentMedEvents
      .filter((e) => String(e['type']) === 'STARTED' || (recentMedNames.has(String(e['medicationName']).toLowerCase()) && !previousMedNames.has(String(e['medicationName']).toLowerCase())))
      .map((e) => String(e['medicationName']))
      .filter((name, i, arr) => arr.indexOf(name) === i);

    const changed = recentMedEvents
      .filter((e) => String(e['type']) === 'CHANGED')
      .map((e) => String(e['medicationName']))
      .filter((name, i, arr) => arr.indexOf(name) === i);

    const stopped = recentMedEvents
      .filter((e) => String(e['type']) === 'STOPPED')
      .map((e) => String(e['medicationName']))
      .filter((name, i, arr) => arr.indexOf(name) === i);

    // --- Observation sections ---
    const recentObsByCategory = this.groupObservations(recentObservations);
    const previousObsByCategory = this.groupObservations(previousObservations);

    const newItems: string[] = [];
    const changedItems: string[] = [];
    const improvedItems: string[] = [];
    const resolvedItems: string[] = [];
    const unchangedItems: string[] = [];
    const unknownItems: string[] = [];

    // Compare categories
    const allCategories = new Set([
      ...Object.keys(recentObsByCategory),
      ...Object.keys(previousObsByCategory),
    ]);

    for (const category of allCategories) {
      const recent = recentObsByCategory[category] ?? [];
      const previous = previousObsByCategory[category] ?? [];

      if (recent.length > 0 && previous.length === 0) {
        // New category appeared
        newItems.push(`${category}: ${recent[0]?.description ?? 'new observation'}`);
      } else if (recent.length === 0 && previous.length > 0) {
        // Category disappeared — resolved
        resolvedItems.push(`${category}: previously observed, no recent entries`);
      } else if (recent.length > 0 && previous.length > 0) {
        // Both periods have data — compare severity
        const recentSeverity = this.avgSeverity(recent);
        const previousSeverity = this.avgSeverity(previous);

        if (recentSeverity > previousSeverity) {
          changedItems.push(`${category}: severity increased (was ${this.severityLabel(previousSeverity)}, now ${this.severityLabel(recentSeverity)})`);
        } else if (recentSeverity < previousSeverity) {
          improvedItems.push(`${category}: severity decreased (was ${this.severityLabel(previousSeverity)}, now ${this.severityLabel(recentSeverity)})`);
        } else {
          unchangedItems.push(`${category}: no significant change`);
        }
      } else {
        unknownItems.push(`${category}: insufficient data for comparison`);
      }
    }

    // Also check health event types
    const recentEventTypes = new Set(recentHealthEvents.map((e) => String(e['type'])));
    const previousEventTypes = new Set(previousHealthEvents.map((e) => String(e['type'])));

    for (const type of recentEventTypes) {
      if (!previousEventTypes.has(type)) {
        newItems.push(`Health event: ${type}`);
      }
    }

    // --- Cognition ---
    const recentCognitiveObs = recentObservations.filter(
      (o) => String(o['category']) === 'CONFUSION',
    );
    const previousCognitiveObs = previousObservations.filter(
      (o) => String(o['category']) === 'CONFUSION',
    );

    const cognition: string[] = [];
    if (recentCognitiveObs.length > previousCognitiveObs.length) {
      cognition.push(`Increased confusion observations: ${recentCognitiveObs.length} in last 30d vs ${previousCognitiveObs.length} in previous 60d`);
    } else if (recentCognitiveObs.length < previousCognitiveObs.length) {
      cognition.push(`Decreased confusion observations: ${recentCognitiveObs.length} in last 30d vs ${previousCognitiveObs.length} in previous 60d`);
    } else if (recentCognitiveObs.length > 0) {
      cognition.push(`Stable confusion observations: ${recentCognitiveObs.length} in both periods`);
    }

    return {
      patientId,
      since: thirtyDaysAgo.toISOString(),
      sections: {
        new: newItems,
        changed: changedItems,
        improved: improvedItems,
        resolved: resolvedItems,
        unchanged: unchangedItems,
        unknown: unknownItems,
      },
      medications: { added, changed, stopped },
      cognition,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private groupObservations(
    observations: Array<Record<string, unknown>>,
  ): Record<string, Array<{ severity: string; description: string; category: string }>> {
    const grouped: Record<string, Array<{ severity: string; description: string; category: string }>> = {};

    for (const obs of observations) {
      const category = String(obs['category'] ?? 'OTHER');
      if (!grouped[category]) {
        grouped[category] = [];
      }

      const structured = obs['structured'] as Record<string, unknown> | undefined;
      grouped[category]!.push({
        severity: String(obs['severity'] ?? (structured?.['severity'] as string) ?? 'MILD'),
        description: String(obs['rawText'] ?? (structured?.['description'] as string) ?? ''),
        category,
      });
    }

    return grouped;
  }

  private avgSeverity(observations: Array<{ severity: string }>): number {
    if (observations.length === 0) return 0;
    const severityMap: Record<string, number> = { MILD: 1, MODERATE: 2, SEVERE: 3 };
    const total = observations.reduce(
      (sum, o) => sum + (severityMap[o.severity] ?? 1),
      0,
    );
    return total / observations.length;
  }

  private severityLabel(value: number): string {
    if (value >= 2.5) return 'SEVERE';
    if (value >= 1.5) return 'MODERATE';
    return 'MILD';
  }
}
