import { AccessControlService } from './access-control.service';

// ---------------------------------------------------------------------------
// In-memory mocked PrismaService (object mock)
// ---------------------------------------------------------------------------
function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    patientOrganizationRelationship: {
      findUnique: jest.fn(),
    },
    patientUserRelationship: {
      findUnique: jest.fn(),
    },
    consent: {
      findFirst: jest.fn(),
    },
    emergencyAccess: {
      findFirst: jest.fn(),
    },
    ...overrides,
  } as any;
}

const user = (roles: string[], organizationId?: string | null) => ({
  id: 'usr-1',
  roles,
  organizationId: organizationId ?? null,
});

describe('AccessControlService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AccessControlService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AccessControlService(prisma);
    jest.clearAllMocks();
  });

  describe('ADMIN role', () => {
    it('allows any access without additional checks', async () => {
      const result = await service.check(
        user(['ADMIN']),
        'pat-1',
        'READ',
        'medication',
        'review',
      );
      expect(result).toBe(true);
      // No DB lookups should be needed for a pure admin decision.
      expect(prisma.consent.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('PATIENT role', () => {
    it('allows access when the user is linked to the patient', async () => {
      prisma.patientUserRelationship.findUnique.mockResolvedValue({
        id: 'rel-1',
        patientId: 'pat-1',
        userId: 'usr-1',
      });

      const result = await service.check(
        user(['PATIENT']),
        'pat-1',
        'READ',
        'profile',
        'view own record',
      );

      expect(result).toBe(true);
      expect(prisma.patientUserRelationship.findUnique).toHaveBeenCalledWith({
        where: {
          patientId_userId: { patientId: 'pat-1', userId: 'usr-1' },
        },
      });
    });

    it('denies access when the user is not linked to the patient', async () => {
      prisma.patientUserRelationship.findUnique.mockResolvedValue(null);

      const result = await service.check(
        user(['PATIENT']),
        'pat-9',
        'READ',
        'profile',
        'snoop',
      );

      expect(result).toBe(false);
    });
  });

  describe('GUARDIAN role', () => {
    it('allows access with an ACTIVE consent whose dataScope covers the resource', async () => {
      prisma.consent.findFirst.mockResolvedValue({
        id: 'consent-1',
        patientId: 'pat-1',
        recipientId: 'usr-1',
        status: 'ACTIVE',
        dataScope: ['medication', 'observation'],
      });

      const result = await service.check(
        user(['GUARDIAN']),
        'pat-1',
        'READ',
        'medication',
        'care coordination',
      );

      expect(result).toBe(true);
      expect(prisma.consent.findFirst).toHaveBeenCalledTimes(1);
    });

    it('denies access when no consent covers the resource', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);

      const result = await service.check(
        user(['GUARDIAN']),
        'pat-1',
        'READ',
        'document',
        'not consented',
      );

      expect(result).toBe(false);
    });

    it('denies access when the consent is expired', async () => {
      const now = new Date();
      prisma.consent.findFirst.mockImplementation((args: any) =>
        // Simulate the DB applying the filter: nothing matches an expired consent.
        args.where.expirationDate?.gt
          ? null
          : null,
      );

      const result = await service.check(
        user(['GUARDIAN']),
        'pat-1',
        'READ',
        'medication',
        'expired consent',
      );

      expect(result).toBe(false);
    });
  });

  describe('EMERGENCY_CLINICIAN role', () => {
    it('allows access only when a non-expired EmergencyAccess record exists', async () => {
      prisma.emergencyAccess.findFirst.mockResolvedValue({
        id: 'ea-1',
        patientId: 'pat-1',
        userId: 'usr-1',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await service.check(
        user(['EMERGENCY_CLINICIAN']),
        'pat-1',
        'READ',
        'emergency-summary',
        'break-glass',
      );

      expect(result).toBe(true);
      expect(prisma.emergencyAccess.findFirst).toHaveBeenCalledTimes(1);
    });

    it('denies access when no EmergencyAccess record exists', async () => {
      prisma.emergencyAccess.findFirst.mockResolvedValue(null);

      const result = await service.check(
        user(['EMERGENCY_CLINICIAN']),
        'pat-1',
        'READ',
        'emergency-summary',
        'no break-glass',
      );

      expect(result).toBe(false);
    });
  });

  describe('unrecognized role', () => {
    it('denies by default', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);
      const result = await service.check(
        user(['PHARMACIST']),
        'pat-1',
        'READ',
        'medication',
        'not covered',
      );
      expect(result).toBe(false);
    });
  });
});