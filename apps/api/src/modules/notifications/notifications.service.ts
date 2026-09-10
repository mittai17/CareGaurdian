import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a single notification for a user.
   */
  async create(
    userId: string,
    type: string,
    title: string,
    body: string,
    patientId?: string,
    metadata?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        patientId: patientId ?? null,
        metadata:
          metadata !== undefined
            ? (metadata as Prisma.InputJsonValue)
            : undefined,
      },
    });

    return this.serialize(notification);
  }

  /**
   * Notify all clinicians/guardians/admins linked to a patient.
   * Filters by `minRole` hierarchy: EMERGENCY_CLINICIAN < CLINICIAN < ADMIN.
   * By default `minRole='CLINICIAN'` so pharmacists / caregivers are excluded.
   */
  async notifyClinicians(
    patientId: string,
    type: string,
    title: string,
    body: string,
    minRole: string = 'CLINICIAN',
  ) {
    const minRoleRank = roleRank(minRole);

    const relationships = await this.prisma.patientUserRelationship.findMany({
      where: { patientId },
      include: { user: true },
    });

    const targets = relationships.filter((r) => {
      // At least one of the user's roles must be >= minRole
      return r.user.roles.some((role) => roleRank(role) >= minRoleRank);
    });

    const results = await Promise.allSettled(
      targets.map((t) =>
        this.create(t.userId, type, title, body, patientId),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');

    if (failed.length > 0) {
      this.logger.warn(
        `notifyClinicians: ${failed.length}/${results.length} notifications failed for patient ${patientId}`,
      );
    }

    this.logger.log(
      `Notified ${succeeded} users for patient ${patientId} (type=${type})`,
    );

    return { notified: succeeded, total: targets.length };
  }

  /**
   * List notifications for a user (newest first).
   */
  async listForUser(userId: string, unreadOnly = false) {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.read = false;

    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((r) => this.serialize(r));
  }

  /**
   * Mark a notification as read.
   */
  async markRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return this.serialize(updated);
  }

  // ---------------------------------------------------------------------------
  // Serialiser
  // ---------------------------------------------------------------------------

  private serialize(n: {
    id: string;
    userId: string;
    patientId: string | null;
    type: string;
    title: string;
    body: string;
    read: boolean;
    metadata: unknown;
    createdAt: Date;
  }) {
    return {
      id: n.id,
      userId: n.userId,
      patientId: n.patientId,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Numeric rank so we can compare role seniority. Higher = more privileged. */
function roleRank(role: string): number {
  const ranks: Record<string, number> = {
    PATIENT: 0,
    FAMILY_CAREGIVER: 1,
    PROFESSIONAL_CAREGIVER: 2,
    GUARDIAN: 3,
    PHARMACIST: 4,
    CLINICIAN: 5,
    EMERGENCY_CLINICIAN: 6,
    ADMIN: 10,
  };
  return ranks[role] ?? 0;
}
