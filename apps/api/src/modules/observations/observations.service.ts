import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

/** Maps observation category to HealthEvent EventType */
const CATEGORY_TO_EVENT_TYPE: Record<string, string> = {
  CONFUSION: 'COGNITIVE_CHANGE',
  FALL: 'FALL',
  NEAR_FALL: 'NEAR_FALL',
  APPETITE: 'APPETITE_CHANGE',
  SLEEP: 'SLEEP_CHANGE',
  MOBILITY: 'MOBILITY_CHANGE',
  MOOD: 'SYMPTOM',
  PAIN: 'SYMPTOM',
  MEDICATION: 'MEDICATION_CHANGED', // Default; overridden if structured.type === 'missed'
  OTHER: 'CAREGIVER_OBSERVATION',
};

/**
 * Resolve the EventType for a MEDICATION observation.
 * If structured.type === 'missed' → MISSED_MEDICATION, otherwise MEDICATION_CHANGED.
 */
function resolveMedicationEventType(structured: Record<string, unknown>): string {
  if (structured && structured.type === 'missed') {
    return 'MISSED_MEDICATION';
  }
  return 'MEDICATION_CHANGED';
}

@Injectable()
export class ObservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateObservationDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'observation',
      'create observation',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const structured = (dto.structured ?? {}) as Record<string, unknown>;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    // Resolve the event type
    let eventType: string;
    if (dto.category === 'MEDICATION') {
      eventType = resolveMedicationEventType(structured);
    } else {
      eventType = CATEGORY_TO_EVENT_TYPE[dto.category] ?? 'CAREGIVER_OBSERVATION';
    }

    // Create observation and health event in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const observation = await tx.observation.create({
        data: {
          patientId,
          sourceUserId: currentUser.id,
          sourceType: 'CAREGIVER',
          category: dto.category as 'FALL',
          rawText: dto.rawText ?? null,
          structured: structured as unknown as Prisma.InputJsonValue,
          severity: dto.severity ?? null,
          duration: dto.duration ?? null,
          occurredAt,
          verificationStatus: 'REPORTED',
        },
      });

      const healthEvent = await tx.healthEvent.create({
        data: {
          patientId,
          type: eventType as 'FALL',
          timestamp: occurredAt,
          sourceType: 'CAREGIVER',
          status: 'REPORTED',
          confidence: 0.8,
          description: dto.rawText ?? `${dto.category} observation by caregiver`,
          metadata: {
            observationId: observation.id,
            category: dto.category,
            severity: dto.severity,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return { observation, healthEvent };
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_OBSERVATION',
      resourceType: 'Observation',
      resourceId: result.observation.id,
      purpose: 'CARE',
      result: 'SUCCESS',
      metadata: {
        category: dto.category,
        eventType,
        healthEventId: result.healthEvent.id,
      },
    });

    return this.serialize(result.observation);
  }

  async findByPatient(
    patientId: string,
    currentUser: RequestUser,
    filters: { category?: string; from?: string; to?: string },
  ) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'observation',
      'list observations',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const where: Prisma.ObservationWhereInput = { patientId };
    if (filters.category) {
      where.category = { equals: filters.category as 'FALL' };
    }
    if (filters.from || filters.to) {
      where.occurredAt = {};
      if (filters.from) where.occurredAt.gte = new Date(filters.from);
      if (filters.to) where.occurredAt.lte = new Date(filters.to);
    }

    const observations = await this.prisma.observation.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
    });

    return observations.map((o) => this.serialize(o));
  }

  async findById(id: string, currentUser: RequestUser) {
    const observation = await this.prisma.observation.findUnique({ where: { id } });
    if (!observation) {
      throw new NotFoundException('Observation not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      observation.patientId,
      'READ',
      'observation',
      'view observation',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this observation');
    }

    return this.serialize(observation);
  }

  /**
   * Pure function — exposed for testing. Maps an ObservationCategory to the
   * corresponding HealthEvent EventType.
   */
  static resolveEventType(
    category: string,
    structured?: Record<string, unknown>,
  ): string {
    if (category === 'MEDICATION') {
      return resolveMedicationEventType(structured ?? {});
    }
    return CATEGORY_TO_EVENT_TYPE[category] ?? 'CAREGIVER_OBSERVATION';
  }

  private serialize(obs: {
    id: string;
    patientId: string;
    sourceUserId: string | null;
    sourceType: string;
    category: string;
    rawText: string | null;
    structured: Prisma.JsonValue;
    severity: string | null;
    duration: string | null;
    occurredAt: Date;
    verificationStatus: string;
    createdAt: Date;
  }) {
    return {
      id: obs.id,
      patientId: obs.patientId,
      sourceUserId: obs.sourceUserId,
      sourceType: obs.sourceType,
      category: obs.category,
      rawText: obs.rawText,
      structured: obs.structured as Record<string, unknown>,
      severity: obs.severity,
      duration: obs.duration,
      occurredAt: obs.occurredAt.toISOString(),
      verificationStatus: obs.verificationStatus,
      createdAt: obs.createdAt.toISOString(),
    };
  }
}
