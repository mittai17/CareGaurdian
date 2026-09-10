import { ForbiddenException, ConflictException } from '@nestjs/common';
import { ConsentService } from './consent.service';

// ---------------------------------------------------------------------------
// In-memory mocked PrismaService (object mock)
// ---------------------------------------------------------------------------
function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    user: { findUnique: jest.fn() },
    patientUserRelationship: { findUnique: jest.fn() },
    guardianRelationship: { findFirst: jest.fn() },
    consent: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    permission: { updateMany: jest.fn() },
    ...overrides,
  } as any;
}

const actor = (id: string, roles: string[]) => ({
  id,
  email: `${id}@example.com`,
  passwordHash: 'hash',
  name: 'Actor',
  roles,
  organizationId: null,
  mfaEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const pendingConsent = {
  id: 'consent-1',
  patientId: 'pat-1',
  grantorId: 'usr-guardian',
  recipientId: 'usr-recipient',
  recipientType: 'FAMILY_CAREGIVER',
  dataScope: ['medication'],
  purpose: 'Care coordination',
  startDate: new Date(),
  expirationDate: null,
  revokedAt: null,
  status: 'PENDING',
  createdAt: new Date(),
};

const consentRow = {
  id: 'consent-1',
  patientId: 'pat-1',
  grantorId: 'usr-guardian',
  recipientId: 'usr-recipient',
  recipientType: 'FAMILY_CAREGIVER',
  dataScope: ['medication', 'observation'],
  purpose: 'Care coordination',
  startDate: new Date(),
  expirationDate: null,
  revokedAt: null,
  status: 'PENDING',
  createdAt: new Date(),
  permissions: [
    { id: 'perm-1', resource: 'medication', action: 'READ', allowed: true },
    { id: 'perm-2', resource: 'observation', action: 'READ', allowed: true },
    { id: 'perm-3', resource: 'observation', action: 'CREATE', allowed: true },
  ],
};

describe('ConsentService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ConsentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ConsentService(prisma);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('creates a consent + derived permissions when a GUARDIAN holds an active relationship', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(actor('usr-guardian', ['GUARDIAN']))
        .mockResolvedValueOnce(actor('usr-recipient', ['FAMILY_CAREGIVER']));
      prisma.guardianRelationship.findFirst.mockResolvedValue({
        id: 'rel-1',
        status: 'ACTIVE',
        startsAt: new Date(Date.now() - 1000),
        endsAt: null,
      });
      prisma.consent.findFirst.mockResolvedValue(null); // no duplicate
      prisma.consent.create.mockResolvedValue(consentRow);

      const result = await service.create(
        {
          patientId: 'pat-1',
          recipientId: 'usr-recipient',
          recipientType: 'FAMILY_CAREGIVER',
          dataScope: ['medication', 'observation'],
          purpose: 'Care coordination',
        },
        'usr-guardian',
      );

      expect(prisma.consent.create).toHaveBeenCalledTimes(1);
      const createCall = prisma.consent.create.mock.calls[0][0];
      expect(createCall.data.status).toBe('PENDING');
      expect(createCall.data.permissions.create).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ resource: 'medication', action: 'READ' }),
          expect.objectContaining({ resource: 'observation', action: 'READ' }),
          expect.objectContaining({ resource: 'observation', action: 'CREATE' }),
        ]),
      );
      expect(result.data.status).toBe('PENDING');
    });

    it('rejects non-PATIENT/GUARDIAN grantors', async () => {
      prisma.user.findUnique.mockResolvedValue(actor('usr-clinician', ['CLINICIAN']));

      await expect(
        service.create(
          {
            patientId: 'pat-1',
            recipientId: 'usr-recipient',
            recipientType: 'CLINICIAN',
            dataScope: ['medication'],
            purpose: 'care',
          },
          'usr-clinician',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.consent.create).not.toHaveBeenCalled();
    });

    it('rejects a PATIENT who is not linked to the target patient', async () => {
      prisma.user.findUnique.mockResolvedValue(actor('usr-patient', ['PATIENT']));
      prisma.patientUserRelationship.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            patientId: 'pat-9',
            recipientId: 'usr-recipient',
            recipientType: 'FAMILY_CAREGIVER',
            dataScope: ['medication'],
            purpose: 'care',
          },
          'usr-patient',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a GUARDIAN without an active relationship', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(actor('usr-guardian', ['GUARDIAN']))
        .mockResolvedValueOnce(actor('usr-recipient', ['FAMILY_CAREGIVER']));
      prisma.guardianRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            patientId: 'pat-1',
            recipientId: 'usr-recipient',
            recipientType: 'FAMILY_CAREGIVER',
            dataScope: ['medication'],
            purpose: 'care',
          },
          'usr-guardian',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects duplicate active/pending consents', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(actor('usr-patient', ['PATIENT']))
        .mockResolvedValueOnce(actor('usr-recipient', ['FAMILY_CAREGIVER']));
      prisma.patientUserRelationship.findUnique.mockResolvedValue({
        id: 'rel-1',
        patientId: 'pat-1',
        userId: 'usr-patient',
      });
      prisma.consent.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          {
            patientId: 'pat-1',
            recipientId: 'usr-recipient',
            recipientType: 'FAMILY_CAREGIVER',
            dataScope: ['medication'],
            purpose: 'care',
          },
          'usr-patient',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.consent.create).not.toHaveBeenCalled();
    });
  });

  describe('revoke()', () => {
    it('revokes the consent and disables derived permissions', async () => {
      prisma.consent.findUnique.mockResolvedValue({ ...pendingConsent, status: 'ACTIVE' });
      prisma.user.findUnique.mockResolvedValue(actor('usr-guardian', ['GUARDIAN']));
      prisma.consent.update.mockResolvedValue({ ...pendingConsent, status: 'REVOKED', revokedAt: new Date() });
      prisma.permission.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.revoke('consent-1', 'usr-guardian');

      expect(result.data.status).toBe('REVOKED');
      expect(prisma.permission.updateMany).toHaveBeenCalledWith({
        where: { consentId: 'consent-1' },
        data: { allowed: false },
      });
    });

    it('rejects revocation by an unrelated actor', async () => {
      prisma.consent.findUnique.mockResolvedValue({ ...pendingConsent, status: 'ACTIVE' });
      prisma.user.findUnique.mockResolvedValue(actor('usr-stranger', ['CLINICIAN']));
      prisma.patientUserRelationship.findUnique.mockResolvedValue(null);

      await expect(service.revoke('consent-1', 'usr-stranger')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});