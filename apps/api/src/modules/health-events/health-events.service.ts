import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateHealthEventDto } from './dto/create-health-event.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class HealthEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateHealthEventDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'health-event',
      'create health event',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Determine source type: explicit or inferred from user role
    const sourceType = dto.sourceType ?? this.inferSourceType(currentUser.roles);

    const event = await this.prisma.healthEvent.create({
      data: {
        patientId,
        type: dto.type as 'FALL',
        timestamp: new Date(dto.timestamp),
        sourceType: sourceType as 'CAREGIVER',
        sourceId: dto.sourceId ?? null,
        status: 'REPORTED',
        confidence: 0.8,
        description: dto.description ?? null,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        episodeId: dto.episodeId ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_HEALTH_EVENT',
      resourceType: 'HealthEvent',
      resourceId: event.id,
      purpose: 'RECORDING',
      result: 'SUCCESS',
      metadata: { eventType: dto.type },
    });

    return this.serialize(event);
  }

  async findByPatient(
    patientId: string,
    currentUser: RequestUser,
    filters: {
      type?: string;
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
    },
  ) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'health-event',
      'list health events',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

    const where: Prisma.HealthEventWhereInput = { patientId };
    if (filters.type) {
      where.type = { equals: filters.type as 'FALL' };
    }
    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = new Date(filters.from);
      if (filters.to) where.timestamp.lte = new Date(filters.to);
    }

    const cursor = filters.cursor
      ? { id: filters.cursor }
      : undefined;

    const rows = await this.prisma.healthEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit + 1, // fetch one extra to determine hasMore
      ...(cursor ? { cursor, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: data.map((r) => this.serialize(r)),
      meta: {
        hasMore,
        nextCursor: hasMore ? data[data.length - 1]!.id : null,
      },
    };
  }

  async findById(id: string, currentUser: RequestUser) {
    const event = await this.prisma.healthEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Health event not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      event.patientId,
      'READ',
      'health-event',
      'view health event',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this health event');
    }

    return this.serialize(event);
  }

  async findByEpisodeId(episodeId: string) {
    const events = await this.prisma.healthEvent.findMany({
      where: { episodeId },
      orderBy: { timestamp: 'desc' },
    });
    return events.map((e) => this.serialize(e));
  }

  private inferSourceType(roles: string[]): string {
    if (roles.includes('CLINICIAN')) return 'CLINICIAN';
    if (roles.includes('PHARMACIST')) return 'PHARMACIST';
    if (roles.includes('FAMILY_CAREGIVER') || roles.includes('PROFESSIONAL_CAREGIVER')) return 'CAREGIVER';
    return 'PATIENT';
  }

  private serialize(event: {
    id: string;
    patientId: string;
    type: string;
    timestamp: Date;
    sourceType: string;
    sourceId: string | null;
    status: string;
    confidence: number;
    description: string | null;
    metadata: Prisma.JsonValue;
    episodeId: string | null;
    createdAt: Date;
  }) {
    return {
      id: event.id,
      patientId: event.patientId,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      status: event.status,
      confidence: event.confidence,
      description: event.description,
      metadata: event.metadata as Record<string, unknown>,
      episodeId: event.episodeId,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
