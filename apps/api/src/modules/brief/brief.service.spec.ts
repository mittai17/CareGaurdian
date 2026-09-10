/**
 * Tests for BriefService — assembles ClinicalBrief from mocked Prisma data.
 */

import { BriefService } from './brief.service';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------
function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    riskSignal: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'signal-1',
        patientId: 'pat-1',
        signalType: 'CHANGE_SIGNAL',
        severity: 'ATTENTION',
        confidenceLevel: 'MODERATE',
        summary: 'Cognitive change detected in last 14 days',
        evidenceIds: ['ev-1', 'ev-2'],
        supportingSignals: [
          { agent: 'cognitiveAgent', signal: 'COGNITIVE_CHANGE', confidence: 0.75 },
        ],
        contradictions: [],
        dataGaps: ['No baseline data available'],
        requiresHumanReview: true,
        status: 'PENDING',
        generatedAt: new Date('2025-09-01'),
        whyNow: ['Increased confusion observations', 'Medication change detected'],
      }),
    },
    episode: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'ep-1',
          patientId: 'pat-1',
          title: 'Cognitive decline episode',
          description: 'Period of increased confusion',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-15'),
          symptoms: ['confusion', 'disorientation'],
          medicationsInvolved: ['donepezil'],
          functionalChanges: ['wandering'],
          cognitiveChanges: ['memory loss', 'confusion'],
        },
      ]),
    },
    evidence: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'ev-1',
          riskSignalId: 'signal-1',
          claim: 'Confusion observations increased by 200%',
          detail: '3 observations in last 14d vs 1 in previous period',
          sourceType: 'ML',
          sourceId: null,
          recordedAt: new Date('2025-09-01'),
        },
        {
          id: 'ev-2',
          riskSignalId: 'signal-1',
          claim: 'Medication changed: donepezil dosage adjusted',
          detail: null,
          sourceType: 'CAREGIVER',
          sourceId: 'evt-1',
          recordedAt: new Date('2025-08-28'),
        },
      ]),
    },
    contradiction: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'con-1',
          patientId: 'pat-1',
          type: 'MEDICATION_CONFLICT',
          description: 'Medication list shows donepezil but caregiver reports stopped',
          evidenceA: 'ev-1',
          evidenceB: 'ev-2',
          detectedAt: new Date('2025-09-01'),
          status: 'OPEN',
          confidence: 'MODERATE',
        },
      ]),
    },
    missingInformation: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'mi-1',
          patientId: 'pat-1',
          category: 'BASELINE',
          description: 'No baseline cognitive assessment available',
          severity: 'ATTENTION',
          detectedAt: new Date('2025-09-01'),
          status: 'OPEN',
        },
      ]),
    },
    healthEvent: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'he-1',
          type: 'COGNITIVE_CHANGE',
          description: 'Patient confused about time and place',
          timestamp: new Date('2025-08-25'),
        },
      ]),
    },
    observation: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    medicationEvent: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    medication: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  } as any;
}

describe('BriefService', () => {
  describe('build()', () => {
    it('assembles a clinical brief from mocked prisma data', async () => {
      const prisma = createPrismaMock();
      const service = new BriefService(prisma);

      const brief = await service.build('pat-1');

      // Verify structure
      expect(brief.patientId).toBe('pat-1');
      expect(brief.overallState).toBe('ATTENTION');
      expect(brief.confidence).toBe('MODERATE');
      expect(brief.status).toBe('GENERATED');
      expect(brief.generatedAt).toBeDefined();

      // Verify whyNow comes from the signal
      expect(brief.whyNow.length).toBeGreaterThan(0);
      expect(brief.whyNow).toContain('Increased confusion observations');
      expect(brief.whyNow).toContain('Medication change detected');

      // Verify historical matches
      expect(brief.historicalMatches.length).toBeGreaterThanOrEqual(0);

      // Verify evidence strings
      expect(brief.evidence.length).toBe(2);
      expect(brief.evidence[0]).toContain('Confusion observations increased');

      // Verify contradictions
      expect(brief.contradictions.length).toBe(1);
      expect(brief.contradictions[0]!.type).toBe('MEDICATION_CONFLICT');
      expect(brief.contradictions[0]!.status).toBe('OPEN');

      // Verify data gaps
      expect(brief.dataGaps.length).toBe(1);
      expect(brief.dataGaps[0]!.category).toBe('BASELINE');
      expect(brief.dataGaps[0]!.status).toBe('OPEN');

      // Verify prisma was called correctly
      expect(prisma.riskSignal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'pat-1' },
        }),
      );
      expect(prisma.contradiction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'pat-1', status: 'OPEN' },
        }),
      );
    });

    it('returns default values when no data exists', async () => {
      const prisma = createPrismaMock({
        riskSignal: { findFirst: jest.fn().mockResolvedValue(null) },
        episode: { findMany: jest.fn().mockResolvedValue([]) },
        evidence: { findMany: jest.fn().mockResolvedValue([]) },
        contradiction: { findMany: jest.fn().mockResolvedValue([]) },
        missingInformation: { findMany: jest.fn().mockResolvedValue([]) },
        healthEvent: { findMany: jest.fn().mockResolvedValue([]) },
      });
      const service = new BriefService(prisma);

      const brief = await service.build('pat-1');

      expect(brief.overallState).toBe('NORMAL');
      expect(brief.confidence).toBe('INSUFFICIENT_DATA');
      expect(brief.whyNow).toEqual(['No recent changes detected']);
      expect(brief.evidence).toEqual([]);
      expect(brief.contradictions).toEqual([]);
      expect(brief.dataGaps).toEqual([]);
    });
  });
});
