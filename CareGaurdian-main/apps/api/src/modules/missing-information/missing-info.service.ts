import { Injectable, Logger } from '@nestjs/common';
import { Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface MissingRule {
  category: string;
  description: string;
  severity: Severity;
}

@Injectable()
export class MissingInfoService {
  private readonly logger = new Logger(MissingInfoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Detect missing information by applying clinical rules:
   * 1. >=2 FALL/NEAR_FALL in 90 days AND no fall-risk assessment → alert
   * 2. >=10 active meds AND no reconciliation encounter in 90 days → alert
   * 3. >=2 COGNITIVE_CHANGE in 60 days AND no cognitive assessment → alert
   * 4. >=1 HOSPITALIZATION in 180 days AND no follow-up encounter in 14 days → alert
   */
  async detect(patientId: string) {
    const now = new Date();
    const findings: MissingRule[] = [];

    // ------------------------------------------------------------------
    // Rule 1: Fall risk assessment gap
    // ------------------------------------------------------------------
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const fallEvents = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        type: { in: ['FALL', 'NEAR_FALL'] },
        timestamp: { gte: ninetyDaysAgo, lte: now },
      },
    });

    if (fallEvents.length >= 2) {
      const fallRiskAssessments = await this.prisma.assessment.findMany({
        where: {
          patientId,
          subtype: 'fall-risk',
          assessedAt: { gte: ninetyDaysAgo, lte: now },
        },
      });

      if (fallRiskAssessments.length === 0) {
        findings.push({
          category: 'FALL_RISK_ASSESSMENT',
          description:
            'No recent fall-risk assessment despite multiple fall/near-fall events',
          severity: 'REVIEW',
        });
      }
    }

    // ------------------------------------------------------------------
    // Rule 2: Medication reconciliation gap
    // ------------------------------------------------------------------
    const activeMedCount = await this.prisma.medication.count({
      where: { patientId, status: 'ACTIVE' },
    });

    if (activeMedCount >= 10) {
      const reconciliationEncounters = await this.prisma.encounter.findMany({
        where: {
          patientId,
          type: 'reconciliation',
          startedAt: { gte: ninetyDaysAgo, lte: now },
        },
      });

      if (reconciliationEncounters.length === 0) {
        findings.push({
          category: 'MEDICATION_RECONCILIATION',
          description:
            `No recent medication reconciliation despite ${activeMedCount} active medications`,
          severity: 'REVIEW',
        });
      }
    }

    // ------------------------------------------------------------------
    // Rule 3: Cognitive assessment gap
    // ------------------------------------------------------------------
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const cognitiveEvents = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        type: 'COGNITIVE_CHANGE',
        timestamp: { gte: sixtyDaysAgo, lte: now },
      },
    });

    // Also check observations with CONFUSION category
    const confusionObs = await this.prisma.observation.findMany({
      where: {
        patientId,
        category: 'CONFUSION',
        occurredAt: { gte: sixtyDaysAgo, lte: now },
      },
    });

    if (cognitiveEvents.length + confusionObs.length >= 2) {
      const cognitiveAssessments = await this.prisma.assessment.findMany({
        where: {
          patientId,
          type: 'cognitive',
          assessedAt: { gte: sixtyDaysAgo, lte: now },
        },
      });

      if (cognitiveAssessments.length === 0) {
        findings.push({
          category: 'COGNITIVE_ASSESSMENT',
          description:
            'No recent cognitive assessment despite observed cognitive changes',
          severity: 'REVIEW',
        });
      }
    }

    // ------------------------------------------------------------------
    // Rule 4: Post-discharge follow-up gap
    // ------------------------------------------------------------------
    const oneHundredEightyDaysAgo = new Date(
      now.getTime() - 180 * 24 * 60 * 60 * 1000,
    );

    const hospitalizations = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        type: 'HOSPITALIZATION',
        timestamp: { gte: oneHundredEightyDaysAgo, lte: now },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (hospitalizations.length >= 1) {
      // Check the most recent hospitalization
      const latestHosp = hospitalizations[0]!;
      const hospDate = latestHosp.timestamp;
      const followUpDeadline = new Date(
        hospDate.getTime() + 14 * 24 * 60 * 60 * 1000,
      );

      // Only flag if the deadline has passed (i.e., we're past the 14-day window)
      if (now > followUpDeadline) {
        const followUpEncounters = await this.prisma.encounter.findMany({
          where: {
            patientId,
            startedAt: {
              gte: hospDate,
              lte: followUpDeadline,
            },
          },
        });

        if (followUpEncounters.length === 0) {
          findings.push({
            category: 'POST_DISCHARGE_FOLLOWUP',
            description:
              `No post-discharge follow-up encounter within 14 days of hospitalization on ${hospDate.toISOString().slice(0, 10)}`,
            severity: 'CRITICAL',
          });
        }
      }
    }

    // ------------------------------------------------------------------
    // Persist findings (dedupe by category + description)
    // ------------------------------------------------------------------
    const existing = await this.prisma.missingInformation.findMany({
      where: { patientId, status: 'OPEN' },
    });
    const existingSet = new Set(
      existing.map((e) => `${e.category}|${e.description}`),
    );

    const persisted: Array<{
      id: string;
      category: string;
      description: string;
      severity: string;
      status: string;
      detectedAt: Date;
    }> = [];

    for (const finding of findings) {
      const dedupeKey = `${finding.category}|${finding.description}`;
      if (existingSet.has(dedupeKey)) continue;

      const row = await this.prisma.missingInformation.create({
        data: {
          patientId,
          category: finding.category,
          description: finding.description,
          severity: finding.severity,
          status: 'OPEN',
        },
      });
      persisted.push(row);
    }

    // ------------------------------------------------------------------
    // Audit
    // ------------------------------------------------------------------
    await this.auditService.log({
      patientId,
      action: 'AI_ANALYSIS',
      resourceType: 'MissingInformation',
      purpose: 'ANALYSIS',
      result: 'SUCCESS',
      metadata: {
        totalDetected: findings.length,
        newPersisted: persisted.length,
      },
    });

    this.logger.log(
      `Missing info scan for patient ${patientId}: ${findings.length} findings, ${persisted.length} new persisted`,
    );

    return {
      data: persisted.map((r) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        severity: r.severity,
        status: r.status,
        detectedAt: r.detectedAt.toISOString(),
      })),
    };
  }

  /** List all missing information entries for a patient. */
  async list(patientId: string) {
    const rows = await this.prisma.missingInformation.findMany({
      where: { patientId },
      orderBy: { detectedAt: 'desc' },
    });

    return {
      data: rows.map((r) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        severity: r.severity,
        status: r.status,
        detectedAt: r.detectedAt.toISOString(),
      })),
    };
  }
}
