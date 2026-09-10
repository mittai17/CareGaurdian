import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogInput {
  actorId?: string | null;
  patientId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  purpose: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  metadata?: Record<string, unknown> | null;
}

export interface AuditQuery {
  patientId?: string;
  actorId?: string;
  action?: string;
  result?: string;
  take?: number;
  skip?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an AuditLog row. Fire-and-forget friendly: never throws — failures
   * are logged so they don't break the primary operation (fail-loud doctrine).
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          patientId: input.patientId ?? null,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId ?? null,
          purpose: input.purpose,
          result: input.result,
          metadata: (input.metadata ?? null) as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      // Never break the calling operation; surface loudly in logs.
      this.logger.error(
        `Failed to write audit log (action=${input.action}, actor=${input.actorId}): ${String(err)}`,
      );
    }
  }

  /** Query audit entries — filtered by patient, actor, action, and/or result. */
  async query(query: AuditQuery) {
    const take = Math.min(Math.max(query.take ?? 50, 1), 200);
    const skip = query.skip ?? 0;

    const where: Record<string, unknown> = {};
    if (query.patientId) where.patientId = query.patientId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.result) where.result = query.result;

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        patientId: r.patientId,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        timestamp: r.timestamp.toISOString(),
        purpose: r.purpose,
        result: r.result,
        metadata: r.metadata,
      })),
      meta: {
        total,
        take,
        skip,
        hasMore: skip + rows.length < total,
      },
    };
  }
}