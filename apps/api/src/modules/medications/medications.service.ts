import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreateMedicationEventDto } from './dto/create-medication-event.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

/** Maps MedicationEvent type to HealthEvent EventType */
const MED_EVENT_TO_HEALTH_EVENT: Record<string, string> = {
  STARTED: 'MEDICATION_STARTED',
  STOPPED: 'MEDICATION_STOPPED',
  CHANGED: 'MEDICATION_CHANGED',
  MISSED: 'MISSED_MEDICATION',
  TAKEN: 'MEDICATION_CHANGED',
};

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateMedicationDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'medication',
      'create medication',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const medication = await this.prisma.medication.create({
      data: {
        patientId,
        name: dto.name,
        genericName: dto.genericName ?? null,
        dosage: dto.dosage ?? null,
        frequency: dto.frequency ?? null,
        route: dto.route ?? null,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        prescribedBy: dto.prescribedBy ?? null,
        notes: dto.notes ?? null,
        status: 'ACTIVE',
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_MEDICATION',
      resourceType: 'Medication',
      resourceId: medication.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serializeMedication(medication);
  }

  async findByPatient(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'medication',
      'list medications',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const medications = await this.prisma.medication.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return medications.map((m) => this.serializeMedication(m));
  }

  async update(id: string, dto: UpdateMedicationDto, currentUser: RequestUser) {
    const existing = await this.prisma.medication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Medication not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      existing.patientId,
      'WRITE',
      'medication',
      'update medication',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this medication');
    }

    const data: Prisma.MedicationUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.genericName !== undefined) data.genericName = dto.genericName;
    if (dto.dosage !== undefined) data.dosage = dto.dosage;
    if (dto.frequency !== undefined) data.frequency = dto.frequency;
    if (dto.route !== undefined) data.route = dto.route;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.stoppedAt !== undefined) data.stoppedAt = new Date(dto.stoppedAt);
    if (dto.prescribedBy !== undefined) data.prescribedBy = dto.prescribedBy;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.medication.update({ where: { id }, data });

    await this.audit.log({
      actorId: currentUser.id,
      patientId: existing.patientId,
      action: 'UPDATE_MEDICATION',
      resourceType: 'Medication',
      resourceId: id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serializeMedication(updated);
  }

  async createEvent(patientId: string, dto: CreateMedicationEventDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'medication-event',
      'create medication event',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const sourceType = (dto.sourceType ?? this.inferSourceType(currentUser.roles)) as string;

    const result = await this.prisma.$transaction(async (tx) => {
      const medEvent = await tx.medicationEvent.create({
        data: {
          patientId,
          medicationId: dto.medicationId ?? null,
          medicationName: dto.medicationName,
          type: dto.type,
          occurredAt: new Date(dto.occurredAt),
          reason: dto.reason ?? null,
          sourceType: sourceType as 'CAREGIVER',
        },
      });

      // Also create a matching HealthEvent
      const healthEventType = MED_EVENT_TO_HEALTH_EVENT[dto.type] ?? 'MEDICATION_CHANGED';
      const healthEvent = await tx.healthEvent.create({
        data: {
          patientId,
          type: healthEventType as 'MEDICATION_CHANGED',
          timestamp: new Date(dto.occurredAt),
          sourceType: sourceType as 'CAREGIVER',
          status: 'REPORTED',
          confidence: 0.8,
          description: `${dto.type} - ${dto.medicationName}${dto.reason ? `: ${dto.reason}` : ''}`,
          metadata: {
            medicationEventId: medEvent.id,
            medicationId: dto.medicationId,
            medicationName: dto.medicationName,
            reason: dto.reason,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return { medEvent, healthEvent };
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_MEDICATION_EVENT',
      resourceType: 'MedicationEvent',
      resourceId: result.medEvent.id,
      purpose: 'RECORDING',
      result: 'SUCCESS',
      metadata: { type: dto.type, medicationName: dto.medicationName },
    });

    return this.serializeMedEvent(result.medEvent);
  }

  /**
   * Returns missed/taken counts for a patient in a time window.
   * Used by the baseline engine to compute adherence metrics.
   */
  async adherenceEventsBetween(patientId: string, from: Date, to: Date) {
    const events = await this.prisma.medicationEvent.findMany({
      where: {
        patientId,
        occurredAt: { gte: from, lte: to },
      },
    });

    let missed = 0;
    let taken = 0;
    for (const e of events) {
      if (e.type === 'MISSED') missed++;
      if (e.type === 'TAKEN') taken++;
    }

    return { missed, taken, total: events.length };
  }

  private inferSourceType(roles: string[]): string {
    if (roles.includes('CLINICIAN')) return 'CLINICIAN';
    if (roles.includes('PHARMACIST')) return 'PHARMACIST';
    if (roles.includes('FAMILY_CAREGIVER') || roles.includes('PROFESSIONAL_CAREGIVER')) return 'CAREGIVER';
    return 'PATIENT';
  }

  private serializeMedication(med: {
    id: string;
    patientId: string;
    name: string;
    genericName: string | null;
    dosage: string | null;
    frequency: string | null;
    route: string | null;
    startedAt: Date | null;
    stoppedAt: Date | null;
    status: string;
    prescribedBy: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: med.id,
      patientId: med.patientId,
      name: med.name,
      genericName: med.genericName,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      startedAt: med.startedAt?.toISOString() ?? null,
      stoppedAt: med.stoppedAt?.toISOString() ?? null,
      status: med.status,
      prescribedBy: med.prescribedBy,
      notes: med.notes,
      createdAt: med.createdAt.toISOString(),
      updatedAt: med.updatedAt.toISOString(),
    };
  }

  private serializeMedEvent(evt: {
    id: string;
    patientId: string;
    medicationId: string | null;
    medicationName: string;
    type: string;
    occurredAt: Date;
    reason: string | null;
    sourceType: string;
  }) {
    return {
      id: evt.id,
      patientId: evt.patientId,
      medicationId: evt.medicationId,
      medicationName: evt.medicationName,
      type: evt.type,
      occurredAt: evt.occurredAt.toISOString(),
      reason: evt.reason,
      sourceType: evt.sourceType,
    };
  }
}
