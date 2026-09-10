import { Injectable, Logger } from '@nestjs/common';
import { ConfidenceLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContradictionsService {
  private readonly logger = new Logger(ContradictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Scan patient data for contradictions:
   * (a) ALLERGY_CONFLICT: allergy listed but active medication with matching ingredient
   * (b) MEDICATION_CONFLICT: active medication with both startedAt AND stoppedAt
   * (c) DOSAGE_CONFLICT: duplicated medication with same genericName but different dosage
   * (d) Historical duplicate conditions (same name, different sourceId prefixes)
   */
  async detect(patientId: string) {
    const [allergies, medications, conditions] = await Promise.all([
      this.prisma.allergy.findMany({ where: { patientId } }),
      this.prisma.medication.findMany({ where: { patientId } }),
      this.prisma.condition.findMany({ where: { patientId } }),
    ]);

    const contradictions: Array<{
      type: string;
      description: string;
      evidenceA: string;
      evidenceB: string;
      confidence: ConfidenceLevel;
    }> = [];

    // ------------------------------------------------------------------
    // (a) ALLERGY_CONFLICT: allergy → active med with same ingredient name
    // ------------------------------------------------------------------
    const activeMeds = medications.filter((m) => m.status === 'ACTIVE');

    for (const allergy of allergies) {
      const allergenLower = allergy.allergen.toLowerCase();

      for (const med of activeMeds) {
        const nameMatch =
          med.name.toLowerCase().includes(allergenLower) ||
          allergenLower.includes(med.name.toLowerCase());
        const genericMatch =
          med.genericName !== null &&
          med.genericName !== undefined &&
          (
            med.genericName.toLowerCase().includes(allergenLower) ||
            allergenLower.includes(med.genericName.toLowerCase())
          );

        if (nameMatch || genericMatch) {
          contradictions.push({
            type: 'ALLERGY_CONFLICT',
            description:
              `Patient has allergy to "${allergy.allergen}" but is prescribed active medication "${med.name}"` +
              (med.genericName ? ` (generic: ${med.genericName})` : ''),
            evidenceA: `Allergy: ${allergy.allergen} (severity: ${allergy.severity ?? 'UNKNOWN'}, recorded: ${allergy.recordedAt.toISOString()})`,
            evidenceB: `Medication: ${med.name} (dosage: ${med.dosage ?? 'N/A'}, status: ACTIVE, started: ${med.startedAt?.toISOString() ?? 'N/A'})`,
            confidence: allergy.verificationStatus === 'CLINICALLY_VERIFIED'
              ? 'HIGH'
              : 'MODERATE',
          });
        }
      }
    }

    // ------------------------------------------------------------------
    // (b) MEDICATION_CONFLICT: active med with both startedAt AND stoppedAt
    // ------------------------------------------------------------------
    for (const med of activeMeds) {
      if (med.startedAt !== null && med.stoppedAt !== null) {
        contradictions.push({
          type: 'MEDICATION_CONFLICT',
          description:
            `Medication "${med.name}" is marked ACTIVE but has both a start date (${med.startedAt.toISOString()}) and stop date (${med.stoppedAt.toISOString()})`,
          evidenceA: `Medication ${med.name}: status=ACTIVE`,
          evidenceB: `startedAt=${med.startedAt.toISOString()}, stoppedAt=${med.stoppedAt.toISOString()}`,
          confidence: 'HIGH',
        });
      }
    }

    // ------------------------------------------------------------------
    // (c) DOSAGE_CONFLICT: same genericName, different dosage
    // ------------------------------------------------------------------
    const genericMap = new Map<string, typeof medications>();
    for (const med of activeMeds) {
      if (!med.genericName) continue;
      const key = med.genericName.toLowerCase();
      if (!genericMap.has(key)) genericMap.set(key, []);
      genericMap.get(key)!.push(med);
    }

    for (const [generic, meds] of genericMap) {
      if (meds.length < 2) continue;
      const dosages = new Set(meds.map((m) => m.dosage ?? 'UNKNOWN'));
      if (dosages.size > 1) {
        const medNames = meds.map((m) => `${m.name} (${m.dosage ?? 'N/A'})`).join(', ');
        contradictions.push({
          type: 'DOSAGE_CONFLICT',
          description:
            `Multiple active medications share generic name "${generic}" with different dosages: ${medNames}`,
          evidenceA: `Generic: ${generic}, dosages: ${[...dosages].join(', ')}`,
          evidenceB: `Medications: ${medNames}`,
          confidence: 'MODERATE',
        });
      }
    }

    // ------------------------------------------------------------------
    // (d) Historical duplicate conditions (same name, different sourceId)
    // ------------------------------------------------------------------
    const conditionByName = new Map<string, typeof conditions>();
    for (const cond of conditions) {
      const key = cond.name.toLowerCase().trim();
      if (!conditionByName.has(key)) conditionByName.set(key, []);
      conditionByName.get(key)!.push(cond);
    }

    for (const [name, conds] of conditionByName) {
      if (conds.length < 2) continue;
      // Check if sourceId prefixes differ (suggesting different sources = potential duplicate)
      const sourceIds = conds
        .map((c) => c.sourceId)
        .filter((s): s is string => s !== null && s !== undefined);

      if (sourceIds.length >= 2) {
        const prefixes = new Set(
          sourceIds.map((s) => s.split('-')[0] ?? s),
        );
        if (prefixes.size > 1) {
          contradictions.push({
            type: 'HISTORY_CONFLICT',
            description:
              `Condition "${name}" appears ${conds.length} times with different source origins, suggesting possible duplication`,
            evidenceA: `Condition entries: ${conds.map((c) => `${c.name} (status: ${c.status}, source: ${c.sourceId ?? 'N/A'})`).join('; ')}`,
            evidenceB: `Source prefixes: ${[...prefixes].join(', ')}`,
            confidence: 'LOW',
          });
        }
      }
    }

    // ------------------------------------------------------------------
    // Persist contradictions
    // ------------------------------------------------------------------
    const persisted: Array<{
      id: string;
      type: string;
      description: string;
      evidenceA: string;
      evidenceB: string;
      confidence: string;
      status: string;
      detectedAt: Date;
    }> = [];

    if (contradictions.length > 0) {
      // Deduplicate by type + description against existing OPEN contradictions
      const existing = await this.prisma.contradiction.findMany({
        where: { patientId, status: 'OPEN' },
      });
      const existingSet = new Set(
        existing.map((c) => `${c.type}|${c.description}`),
      );

      for (const c of contradictions) {
        const dedupeKey = `${c.type}|${c.description}`;
        if (existingSet.has(dedupeKey)) continue;

        const row = await this.prisma.contradiction.create({
          data: {
            patientId,
            type: c.type,
            description: c.description,
            evidenceA: c.evidenceA,
            evidenceB: c.evidenceB,
            confidence: c.confidence,
            status: 'OPEN',
          },
        });
        persisted.push(row);
      }
    }

    // ------------------------------------------------------------------
    // Audit
    // ------------------------------------------------------------------
    await this.auditService.log({
      patientId,
      action: 'AI_ANALYSIS',
      resourceType: 'Contradiction',
      purpose: 'ANALYSIS',
      result: 'SUCCESS',
      metadata: {
        totalDetected: contradictions.length,
        newPersisted: persisted.length,
      },
    });

    this.logger.log(
      `Contradiction scan for patient ${patientId}: ${contradictions.length} detected, ${persisted.length} new persisted`,
    );

    return {
      data: persisted.map((c) => ({
        id: c.id,
        type: c.type,
        description: c.description,
        evidenceA: c.evidenceA,
        evidenceB: c.evidenceB,
        confidence: c.confidence,
        status: c.status,
        detectedAt: c.detectedAt.toISOString(),
      })),
    };
  }

  /** List all contradictions for a patient. */
  async list(patientId: string) {
    const rows = await this.prisma.contradiction.findMany({
      where: { patientId },
      orderBy: { detectedAt: 'desc' },
    });

    return {
      data: rows.map((c) => ({
        id: c.id,
        type: c.type,
        description: c.description,
        evidenceA: c.evidenceA,
        evidenceB: c.evidenceB,
        confidence: c.confidence,
        status: c.status,
        detectedAt: c.detectedAt.toISOString(),
      })),
    };
  }
}
