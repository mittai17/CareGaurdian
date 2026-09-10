import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { CreateConsentDto } from './dto/create-consent.dto';

/**
 * Maps a data-scope token to the default set of actions a consent grants.
 * Unknown scopes degrade to READ-only, which is the safest default.
 */
const DATA_SCOPE_ACTIONS: Record<string, string[]> = {
  profile: ['READ'],
  condition: ['READ'],
  medication: ['READ'],
  allergy: ['READ'],
  observation: ['READ', 'CREATE', 'UPDATE'],
  'lab-result': ['READ'],
  encounter: ['READ'],
  'health-event': ['READ'],
  document: ['READ'],
  assessment: ['READ'],
  'emergency-summary': ['READ'],
};

const GRANTING_ROLES = ['PATIENT', 'GUARDIAN'];

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a Consent (status PENDING) plus derived Permission rows.
   * Only a PATIENT or GUARDIAN may grant; the grantor must be the patient
   * themself or hold an ACTIVE GuardianRelationship to the patient.
   */
  async create(dto: CreateConsentDto, actorId: string) {
    await this.assertCanGrant(dto, actorId);

    const now = new Date();
    const startDate = dto.startDate ? new Date(dto.startDate) : now;
    const expirationDate = dto.expirationDate
      ? new Date(dto.expirationDate)
      : null;

    if (expirationDate && expirationDate <= startDate) {
      throw new ConflictException('expirationDate must be after startDate');
    }

    // Guard against double-granting an identical, still-active consent.
    const duplicate = await this.prisma.consent.findFirst({
      where: {
        patientId: dto.patientId,
        recipientId: dto.recipientId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'An active or pending consent already exists for this patient and recipient',
      );
    }

    const permissions = this.derivePermissions(dto.dataScope);

    const consent = await this.prisma.consent.create({
      data: {
        patientId: dto.patientId,
        grantorId: actorId,
        recipientId: dto.recipientId,
        recipientType: dto.recipientType as PrismaUserRole,
        dataScope: dto.dataScope,
        purpose: dto.purpose,
        startDate,
        expirationDate,
        status: 'PENDING',
        permissions: {
          create: permissions,
        },
      },
      include: { permissions: true },
    });

    return { data: this.serialize(consent) };
  }

  /** List consents for a patient (any status, newest first). */
  async listForPatient(patientId: string, actorId: string) {
    // Patients may view their own; guardians/grantors with active relation; admins.
    await this.assertCanView(patientId, actorId);

    const rows = await this.prisma.consent.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { permissions: true },
    });

    return { data: rows.map((r) => this.serialize(r)) };
  }

  /** Approve a PENDING consent (typically by the patient or the grantor). */
  async approve(consentId: string, actorId: string) {
    const consent = await this.prisma.consent.findUnique({
      where: { id: consentId },
    });
    if (!consent) throw new NotFoundException('Consent not found');

    await this.assertCanManage(consent, actorId);

    if (consent.status === 'REVOKED') {
      throw new ConflictException('Cannot approve a revoked consent');
    }

    const updated = await this.prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'ACTIVE',
        startDate: consent.startDate > new Date() ? consent.startDate : new Date(),
        revokedAt: null,
      },
      include: { permissions: true },
    });

    return { data: this.serialize(updated) };
  }

  /** Revoke an ACTIVE or PENDING consent (grantor, patient, or admin). */
  async revoke(consentId: string, actorId: string) {
    const consent = await this.prisma.consent.findUnique({
      where: { id: consentId },
    });
    if (!consent) throw new NotFoundException('Consent not found');

    await this.assertCanManage(consent, actorId);

    if (consent.status === 'REVOKED') {
      throw new ConflictException('Consent is already revoked');
    }

    const updated = await this.prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
      include: { permissions: true },
    });

    // Flip derived permissions off so enforcement layers see the revocation.
    await this.prisma.permission.updateMany({
      where: { consentId },
      data: { allowed: false },
    });

    return { data: this.serialize(updated) };
  }

  // ---------------------------------------------------------------------------
  // Authorization helpers
  // ---------------------------------------------------------------------------

  private async assertCanGrant(dto: CreateConsentDto, actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');

    const role = actor.roles.find((r) => GRANTING_ROLES.includes(r));
    if (!role) {
      throw new ForbiddenException(
        'Only a PATIENT or GUARDIAN may grant consent',
      );
    }

    if (role === 'PATIENT' && !actor.roles.includes('ADMIN')) {
      const link = await this.prisma.patientUserRelationship.findUnique({
        where: {
          patientId_userId: { patientId: dto.patientId, userId: actorId },
        },
      });
      if (!link) {
        throw new ForbiddenException(
          'You must be linked to this patient to grant consent',
        );
      }
    } else if (role === 'GUARDIAN') {
      const rel = await this.prisma.guardianRelationship.findFirst({
        where: {
          patientId: dto.patientId,
          guardianUserId: actorId,
          status: 'ACTIVE',
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      });
      if (!rel) {
        throw new ForbiddenException(
          'You must hold an ACTIVE guardianship for this patient to grant consent',
        );
      }
    } else if (actor.roles.includes('ADMIN')) {
      // Admin override for bootstrapping (allowed because role check passes).
    } else {
      throw new ForbiddenException('You are not authorized to grant this consent');
    }

    // Recipient must exist
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });
    if (!recipient) throw new NotFoundException('Recipient user not found');
  }

  private async assertCanView(patientId: string, actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');

    if (actor.roles.includes('ADMIN')) return;

    // Patient linked to this record
    const patientLink = await this.prisma.patientUserRelationship.findUnique({
      where: { patientId_userId: { patientId, userId: actorId } },
    });
    if (patientLink) return;

    // Active guardian
    const guardianRel = await this.prisma.guardianRelationship.findFirst({
      where: {
        patientId,
        guardianUserId: actorId,
        status: 'ACTIVE',
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
    });
    if (guardianRel) return;

    throw new ForbiddenException('Not authorized to view consents for this patient');
  }

  private async assertCanManage(
    consent: { id: string; patientId: string; grantorId: string },
    actorId: string,
  ) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');
    if (actor.roles.includes('ADMIN')) return;

    // The grantor can manage
    if (consent.grantorId === actorId) return;

    // The linked patient can manage
    const link = await this.prisma.patientUserRelationship.findUnique({
      where: {
        patientId_userId: { patientId: consent.patientId, userId: actorId },
      },
    });
    if (link) return;

    throw new ForbiddenException('Not authorized to manage this consent');
  }

  // ---------------------------------------------------------------------------
  // Mapping helpers
  // ---------------------------------------------------------------------------

  private derivePermissions(dataScope: string[]): { resource: string; action: string; allowed: boolean }[] {
    const permissions: { resource: string; action: string; allowed: boolean }[] = [];
    for (const scope of dataScope) {
      const actions = DATA_SCOPE_ACTIONS[scope] ?? ['READ'];
      for (const action of actions) {
        permissions.push({ resource: scope, action, allowed: true });
      }
    }
    return permissions;
  }

  private serialize(consent: {
    id: string;
    patientId: string;
    grantorId: string;
    recipientId: string;
    recipientType: string;
    dataScope: string[];
    purpose: string;
    startDate: Date;
    expirationDate: Date | null;
    revokedAt: Date | null;
    status: string;
    createdAt: Date;
    permissions?: {
      id: string;
      resource: string;
      action: string;
      allowed: boolean;
    }[];
  }) {
    return {
      id: consent.id,
      patientId: consent.patientId,
      grantorId: consent.grantorId,
      recipientId: consent.recipientId,
      recipientType: consent.recipientType,
      dataScope: consent.dataScope,
      purpose: consent.purpose,
      startDate: consent.startDate.toISOString(),
      expirationDate: consent.expirationDate
        ? consent.expirationDate.toISOString()
        : null,
      revokedAt: consent.revokedAt ? consent.revokedAt.toISOString() : null,
      status: consent.status,
      createdAt: consent.createdAt.toISOString(),
      permissions: consent.permissions?.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        allowed: p.allowed,
      })),
    };
  }
}