import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';

export interface TimelineItem {
  id: string;
  patientId: string;
  type: string;
  date: string;
  sourceType: string;
  description: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class TimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async getTimeline(
    patientId: string,
    currentUser: RequestUser,
    filters: {
      type?: string;
      source?: string;
      from?: string;
      to?: string;
      limit?: number;
    },
  ) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'timeline',
      'view timeline',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);

    // Build date filter shared across queries
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.from) dateFilter.gte = new Date(filters.from);
    if (filters.to) dateFilter.lte = new Date(filters.to);

    // Query all three sources in parallel
    const [healthEvents, observations, medicationEvents] = await Promise.all([
      this.prisma.healthEvent.findMany({
        where: {
          patientId,
          ...(filters.type ? { type: { equals: filters.type as 'FALL' } } : {}),
          ...(Object.keys(dateFilter).length ? { timestamp: dateFilter } : {}),
          ...(filters.source ? { sourceType: { equals: filters.source as 'CAREGIVER' } } : {}),
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      }),
      this.prisma.observation.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length ? { occurredAt: dateFilter } : {}),
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      }),
      this.prisma.medicationEvent.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length ? { occurredAt: dateFilter } : {}),
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      }),
    ]);

    // Map to TimelineItem shape
    const items: TimelineItem[] = [
      ...healthEvents.map((e) => ({
        id: e.id,
        patientId: e.patientId,
        type: `HEALTH_EVENT:${e.type}`,
        date: e.timestamp.toISOString(),
        sourceType: e.sourceType,
        description: e.description ?? `${e.type}`,
        metadata: {
          eventType: e.type,
          status: e.status,
          confidence: e.confidence,
          ...(e.metadata as Record<string, unknown>),
        },
      })),
      ...observations.map((o) => ({
        id: o.id,
        patientId: o.patientId,
        type: `OBSERVATION:${o.category}`,
        date: o.occurredAt.toISOString(),
        sourceType: o.sourceType,
        description: o.rawText ?? `${o.category} observation`,
        metadata: {
          category: o.category,
          severity: o.severity,
          structured: o.structured as Record<string, unknown>,
        },
      })),
      ...medicationEvents.map((m) => ({
        id: m.id,
        patientId: m.patientId,
        type: `MEDICATION_EVENT:${m.type}`,
        date: m.occurredAt.toISOString(),
        sourceType: m.sourceType,
        description: `${m.type} - ${m.medicationName}`,
        metadata: {
          medicationName: m.medicationName,
          medicationId: m.medicationId,
          reason: m.reason,
          eventType: m.type,
        },
      })),
    ];

    // Sort all items descending by date
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply optional type filter at the mapped level
    const filtered = filters.type
      ? items.filter((i) => i.type.toUpperCase().includes(filters.type!.toUpperCase()))
      : items;

    return { data: filtered.slice(0, limit) };
  }
}
