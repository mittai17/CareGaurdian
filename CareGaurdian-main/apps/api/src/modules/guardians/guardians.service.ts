import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGuardianRelationshipDto } from './dto/create-guardian-relationship.dto';

@Injectable()
export class GuardianService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a guardianship relationship between a patient and a guardian user.
   * Only the patient themself (PATIENT role linked to the patient) or an ADMIN
   * may establish a guardianship.
   */
  async createRelationship(dto: CreateGuardianRelationshipDto, actorId: string) {
    // Actor authorization
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');

    const isAdmin = actor.roles.includes('ADMIN');
    const isPatient = actor.roles.includes('PATIENT');

    if (!isAdmin && !isPatient) {
      throw new ForbiddenException(
        'Only the patient or an ADMIN can establish a guardianship',
      );
    }

    if (isPatient) {
      const link = await this.prisma.patientUserRelationship.findUnique({
        where: {
          patientId_userId: {
            patientId: dto.patientId,
            userId: actorId,
          },
        },
      });
      if (!link) {
        throw new ForbiddenException(
          'You are not linked to this patient record',
        );
      }
    }

    // Guardian user must exist
    const guardian = await this.prisma.user.findUnique({
      where: { id: dto.guardianUserId },
    });
    if (!guardian) {
      throw new NotFoundException('Guardian user not found');
    }

    // Upsert semantics: a second relationship for the same patient+guardian is a conflict
    const existing = await this.prisma.guardianRelationship.findFirst({
      where: {
        patientId: dto.patientId,
        guardianUserId: dto.guardianUserId,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      throw new ConflictException(
        'An active guardianship already exists for this patient and guardian',
      );
    }

    const relationship = await this.prisma.guardianRelationship.create({
      data: {
        patientId: dto.patientId,
        guardianUserId: dto.guardianUserId,
        linkedUserId: dto.linkedUserId ?? null,
        relationship: dto.relationship,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        documentRef: dto.documentRef ?? null,
        status: 'ACTIVE',
      },
    });

    return { data: this.serialize(relationship) };
  }

  /** List guardianships for a patient (any status, newest first). */
  async listForPatient(patientId: string, actorId: string) {
    // Only the patient or an ADMIN can list guardianships.
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('PATIENT')) {
      throw new ForbiddenException('Not authorized to list guardianships');
    }
    if (actor.roles.includes('PATIENT') && !actor.roles.includes('ADMIN')) {
      const link = await this.prisma.patientUserRelationship.findUnique({
        where: {
          patientId_userId: { patientId, userId: actorId },
        },
      });
      if (!link) {
        throw new ForbiddenException('You are not linked to this patient');
      }
    }

    const rows = await this.prisma.guardianRelationship.findMany({
      where: { patientId },
      orderBy: { startsAt: 'desc' },
    });

    return { data: rows.map((r) => this.serialize(r)) };
  }

  /**
   * Revoke a guardianship. Allowed for the patient themself, the guardian on
   * the record, or an ADMIN.
   */
  async revoke(relationshipId: string, actorId: string) {
    const rel = await this.prisma.guardianRelationship.findUnique({
      where: { id: relationshipId },
    });
    if (!rel) {
      throw new NotFoundException('Guardianship not found');
    }

    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');

    const isAdmin = actor.roles.includes('ADMIN');
    const isPatient = actor.roles.includes('PATIENT');
    const isGuardian = rel.guardianUserId === actorId;

    if (!isAdmin && !isGuardian) {
      if (!isPatient) {
        throw new ForbiddenException('Not authorized to revoke this guardianship');
      }
      const link = await this.prisma.patientUserRelationship.findUnique({
        where: {
          patientId_userId: { patientId: rel.patientId, userId: actorId },
        },
      });
      if (!link) {
        throw new ForbiddenException('Only the linked patient may revoke this guardianship');
      }
    }

    const updated = await this.prisma.guardianRelationship.update({
      where: { id: relationshipId },
      data: {
        status: 'REVOKED',
        endsAt: new Date(),
      },
    });

    return { data: this.serialize(updated) };
  }

  /** Returns true when an ACTIVE guardianship exists between patient and user (guardian or linked). */
  async isActiveGuardian(patientId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.guardianRelationship.count({
      where: {
        patientId,
        status: 'ACTIVE',
        guardianUserId: userId,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  private serialize(r: {
    id: string;
    patientId: string;
    guardianUserId: string;
    linkedUserId: string | null;
    relationship: string;
    startsAt: Date;
    endsAt: Date | null;
    documentRef: string | null;
    status: string;
  }) {
    return {
      id: r.id,
      patientId: r.patientId,
      guardianUserId: r.guardianUserId,
      linkedUserId: r.linkedUserId,
      relationship: r.relationship,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt ? r.endsAt.toISOString() : null,
      documentRef: r.documentRef,
      status: r.status,
    };
  }
}