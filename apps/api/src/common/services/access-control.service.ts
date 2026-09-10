import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ABAC (Attribute-Based Access Control) service.
 *
 * Decision logic:
 *   1. ADMIN → always allow.
 *   2. CLINICIAN/PHARMACIST with PatientUserRelationship OR org membership → allow.
 *   3. PATIENT accessing own data → allow.
 *   4. GUARDIAN / caregiver with PatientUserRelationship or active Consent → allow.
 *   5. EMERGENCY_CLINICIAN with a non-expired EmergencyAccess record → allow.
 *   6. Otherwise → deny.
 */
@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns `true` when the caller is permitted, `false` otherwise.
   */
  async check(
    user: { id: string; roles: string[]; organizationId?: string | null },
    patientId: string,
    action: string,
    resource: string,
    purpose: string,
  ): Promise<boolean> {
    // 1. ADMIN → always true
    if (user.roles.includes('ADMIN')) {
      return true;
    }

    // 2. CLINICIAN or PHARMACIST
    if (
      user.roles.includes('CLINICIAN') ||
      user.roles.includes('PHARMACIST')
    ) {
      // a) Direct patient-user link
      const directLink = await this.prisma.patientUserRelationship.findUnique({
        where: { patientId_userId: { patientId, userId: user.id } },
      });
      if (directLink) return true;

      // b) Via organizationId on User record
      if (user.organizationId) {
        const rel = await this.prisma.patientOrganizationRelationship.findUnique({
          where: {
            patientId_organizationId: {
              patientId,
              organizationId: user.organizationId,
            },
          },
        });
        if (rel && rel.status === 'ACTIVE') return true;
      }

      // c) Via OrganizationMembership (when User.organizationId is null)
      const memberships = await this.prisma.organizationMembership.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      for (const m of memberships) {
        const rel = await this.prisma.patientOrganizationRelationship.findUnique({
          where: {
            patientId_organizationId: {
              patientId,
              organizationId: m.organizationId,
            },
          },
        });
        if (rel && rel.status === 'ACTIVE') return true;
      }

      return false;
    }

    // 3. PATIENT self
    if (user.roles.includes('PATIENT')) {
      const link = await this.prisma.patientUserRelationship.findUnique({
        where: { patientId_userId: { patientId, userId: user.id } },
      });
      return !!link;
    }

    // 4. GUARDIAN / caregiver
    if (
      user.roles.includes('GUARDIAN') ||
      user.roles.includes('FAMILY_CAREGIVER') ||
      user.roles.includes('PROFESSIONAL_CAREGIVER')
    ) {
      const directLink = await this.prisma.patientUserRelationship.findUnique({
        where: { patientId_userId: { patientId, userId: user.id } },
      });
      if (directLink) return true;

      const now = new Date();
      const consent = await this.prisma.consent.findFirst({
        where: {
          patientId,
          recipientId: user.id,
          status: 'ACTIVE',
          startDate: { lte: now },
          OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
        },
      });
      if (consent) {
        this.logger.debug(
          `Access granted via consent ${consent.id} for user ${user.id} on patient ${patientId}`,
        );
        return true;
      }
      return false;
    }

    // 5. EMERGENCY_CLINICIAN
    if (user.roles.includes('EMERGENCY_CLINICIAN')) {
      const now = new Date();
      const emergency = await this.prisma.emergencyAccess.findFirst({
        where: { patientId, userId: user.id, expiresAt: { gt: now } },
      });
      return !!emergency;
    }

    // 6. Default → deny
    return false;
  }
}
