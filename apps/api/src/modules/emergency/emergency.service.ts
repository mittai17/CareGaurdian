import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { EmergencySummary } from '@baseline/types';

// Emergency access token validity: 1 hour
const EMERGENCY_ACCESS_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // -----------------------------------------------------------------------
  // Emergency summary (read-only)
  // -----------------------------------------------------------------------

  /**
   * Build an EmergencySummary for a patient.
   * Accessible by EMERGENCY_CLINICIAN (with active break-glass) or ADMIN.
   */
  async getEmergencySummary(
    patientId: string,
    callerId: string,
    callerRoles: string[],
  ): Promise<EmergencySummary> {
    await this.assertEmergencyAccess(patientId, callerId, callerRoles);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const [criticalAllergies, currentMedications, majorConditions, recentEvents] =
      await Promise.all([
        // Severe allergies
        this.prisma.allergy.findMany({
          where: { patientId, severity: 'SEVERE' },
          orderBy: { recordedAt: 'desc' },
        }),
        // Active medications
        this.prisma.medication.findMany({
          where: { patientId, status: 'ACTIVE' },
          orderBy: { startedAt: 'desc' },
        }),
        // Active conditions
        this.prisma.condition.findMany({
          where: { patientId, status: 'ACTIVE' },
          orderBy: { diagnosedAt: 'desc' },
        }),
        // Recent hospitalizations (last 1y) + procedures (last 2y)
        this.prisma.healthEvent.findMany({
          where: {
            patientId,
            OR: [
              { type: 'HOSPITALIZATION', timestamp: { gte: oneYearAgo } },
              { type: 'PROCEDURE', timestamp: { gte: twoYearsAgo } },
            ],
          },
          orderBy: { timestamp: 'desc' },
        }),
      ]);

    const recentHospitalizations = recentEvents.filter(
      (e) => e.type === 'HOSPITALIZATION',
    );
    const importantProcedures = recentEvents.filter(
      (e) => e.type === 'PROCEDURE',
    );

    return {
      criticalAllergies: criticalAllergies.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        allergen: a.allergen,
        reaction: a.reaction ?? null,
        severity: (a.severity as any) ?? null,
        recordedAt: a.recordedAt.toISOString(),
        verificationStatus: a.verificationStatus as any,
      })),
      currentMedications: currentMedications.map((m) => ({
        id: m.id,
        patientId: m.patientId,
        name: m.name,
        genericName: m.genericName ?? null,
        dosage: m.dosage ?? null,
        frequency: m.frequency ?? null,
        route: m.route ?? null,
        startedAt: m.startedAt?.toISOString() ?? null,
        stoppedAt: m.stoppedAt?.toISOString() ?? null,
        status: m.status as any,
        prescribedBy: m.prescribedBy ?? null,
        notes: m.notes ?? null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      majorConditions: majorConditions.map((c) => ({
        id: c.id,
        patientId: c.patientId,
        name: c.name,
        code: c.code ?? null,
        codeSystem: c.codeSystem ?? null,
        diagnosedAt: c.diagnosedAt?.toISOString() ?? null,
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        status: c.status as any,
        verificationStatus: c.verificationStatus as any,
        notes: c.notes ?? null,
      })),
      recentHospitalizations: recentHospitalizations.map((e) => ({
        id: e.id,
        patientId: e.patientId,
        type: e.type as any,
        timestamp: e.timestamp.toISOString(),
        sourceType: e.sourceType as any,
        sourceId: e.sourceId ?? null,
        status: e.status as any,
        confidence: e.confidence,
        description: e.description ?? null,
        metadata: (e.metadata as Record<string, unknown>) ?? {},
        episodeId: e.episodeId ?? null,
        createdAt: e.createdAt.toISOString(),
      })),
      importantProcedures: importantProcedures.map((e) => ({
        id: e.id,
        patientId: e.patientId,
        type: e.type as any,
        timestamp: e.timestamp.toISOString(),
        sourceType: e.sourceType as any,
        sourceId: e.sourceId ?? null,
        status: e.status as any,
        confidence: e.confidence,
        description: e.description ?? null,
        metadata: (e.metadata as Record<string, unknown>) ?? {},
        episodeId: e.episodeId ?? null,
        createdAt: e.createdAt.toISOString(),
      })),
      criticalCareInfo: [],
      emergencyContact: {
        name: patient.emergencyContactName ?? '',
        phone: patient.emergencyContactPhone ?? '',
      },
    };
  }

  // -----------------------------------------------------------------------
  // Break-glass access (mutating)
  // -----------------------------------------------------------------------

  /**
   * Create a break-glass EmergencyAccess record, log it, notify linked
   * clinicians, and return the emergency summary.
   */
  async createEmergencyAccess(
    patientId: string,
    callerId: string,
    callerRoles: string[],
    reason: string,
  ): Promise<{
    access: { id: string; patientId: string; userId: string; reason: string; expiresAt: string; createdAt: string };
    summary: EmergencySummary;
  }> {
    if (!callerRoles.includes('EMERGENCY_CLINICIAN') && !callerRoles.includes('ADMIN')) {
      throw new ForbiddenException(
        'Only EMERGENCY_CLINICIAN or ADMIN may perform break-glass access',
      );
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const expiresAt = new Date(Date.now() + EMERGENCY_ACCESS_TTL_MS);

    // Create EmergencyAccess row
    const access = await this.prisma.emergencyAccess.create({
      data: {
        patientId,
        userId: callerId,
        reason,
        action: 'BREAK_GLASS',
        expiresAt,
      },
    });

    // Audit log
    await this.audit.log({
      actorId: callerId,
      patientId,
      action: 'BREAK_GLASS_ACCESS',
      resourceType: 'EmergencyAccess',
      resourceId: access.id,
      purpose: reason,
      result: 'SUCCESS',
      metadata: { expiresAt: expiresAt.toISOString() },
    });

    // Notify linked clinicians/guardians
    await this.notifications.notifyClinicians(
      patientId,
      'BREAK_GLASS_ACCESS',
      'Emergency Break-Glass Access',
      `A clinician (${callerId}) has accessed emergency records for patient ${patient.firstName} ${patient.lastName}. Reason: ${reason}`,
      'CLINICIAN',
    );

    // Build the summary
    const summary = await this.getEmergencySummary(
      patientId,
      callerId,
      callerRoles,
    );

    return {
      access: {
        id: access.id,
        patientId: access.patientId,
        userId: access.userId,
        reason: access.reason,
        expiresAt: access.expiresAt.toISOString(),
        createdAt: access.createdAt.toISOString(),
      },
      summary,
    };
  }

  // -----------------------------------------------------------------------
  // Access log (admin)
  // -----------------------------------------------------------------------

  async getAccessLog(patientId: string) {
    const rows = await this.prisma.emergencyAccess.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: rows.map((r) => ({
        id: r.id,
        patientId: r.patientId,
        userId: r.userId,
        reason: r.reason,
        action: r.action,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  // -----------------------------------------------------------------------
  // Auth helpers
  // -----------------------------------------------------------------------

  private async assertEmergencyAccess(
    patientId: string,
    callerId: string,
    callerRoles: string[],
  ) {
    // ADMIN always allowed
    if (callerRoles.includes('ADMIN')) return;

    // EMERGENCY_CLINICIAN with active break-glass
    if (callerRoles.includes('EMERGENCY_CLINICIAN')) {
      const access = await this.prisma.emergencyAccess.findFirst({
        where: {
          patientId,
          userId: callerId,
          expiresAt: { gt: new Date() },
        },
      });
      if (access) return;
    }

    throw new ForbiddenException(
      'Emergency access requires an active break-glass record or ADMIN role',
    );
  }
}
