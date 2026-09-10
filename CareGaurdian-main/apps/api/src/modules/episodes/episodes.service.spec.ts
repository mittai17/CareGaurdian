import { Prisma } from '@prisma/client';
import { EpisodesService } from './episodes.service';

// ---------------------------------------------------------------------------
// In-memory mocked PrismaService
// ---------------------------------------------------------------------------
function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    healthEvent: {
      findMany: jest.fn(),
    },
    episode: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditService: { log: jest.fn() },
    ...overrides,
  } as any;
}

const mockAuditService = { log: jest.fn() } as any;

// ---------------------------------------------------------------------------
// Helper to build mock HealthEvent-like objects
// ---------------------------------------------------------------------------
function mockEvent(
  type: string,
  description: string | null,
  metadata: Record<string, unknown> = {},
): {
  id: string;
  patientId: string;
  type: string;
  timestamp: Date;
  sourceType: string;
  status: string;
  confidence: number;
  description: string | null;
  metadata: Prisma.JsonValue;
  episodeId: null;
  createdAt: Date;
} {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    patientId: 'pat-1',
    type,
    timestamp: new Date(),
    sourceType: 'CAREGIVER',
    status: 'REPORTED',
    confidence: 0.8,
    description,
    metadata: metadata as unknown as Prisma.JsonValue,
    episodeId: null,
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------

const EVENTS_A = [
  mockEvent('FALL', 'Patient fell in bathroom', { medicationName: 'donepezil' }),
  mockEvent('SLEEP_CHANGE', 'Sleeping more than usual'),
  mockEvent('SYMPTOM', 'Confusion and disorientation'),
];

const EVENTS_B_IDENTICAL = [
  mockEvent('FALL', 'Patient fell in bathroom', { medicationName: 'donepezil' }),
  mockEvent('SLEEP_CHANGE', 'Sleeping more than usual'),
  mockEvent('SYMPTOM', 'Confusion and disorientation'),
];

const EVENTS_C_PARTIAL = [
  mockEvent('FALL', 'Patient fell while walking', { medicationName: 'donepezil' }),
  mockEvent('SLEEP_CHANGE', 'Sleeping more than usual'),
  mockEvent('APPETITE_CHANGE', 'Not eating well'),
];

const EVENTS_D_NONE = [
  mockEvent('MEDICATION_STARTED', 'Started new blood pressure medication'),
  mockEvent('LAB_RESULT', 'Routine blood work'),
];

// ---------------------------------------------------------------------------

describe('EpisodesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: EpisodesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new EpisodesService(prisma, mockAuditService);
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------------
  // computeSimilarity tests (the core matching algorithm)
  // ------------------------------------------------------------------------

  describe('computeSimilarity()', () => {
    it('returns 1.0 for identical sets', () => {
      const setA = new Set(['type:FALL', 'med:donepezil', 'kw:bathroom']);
      const setB = new Set(['type:FALL', 'med:donepezil', 'kw:bathroom']);

      const score = service.computeSimilarity(setA, setB);

      expect(score).toBe(1.0);
    });

    it('returns >0 and <1 for partially overlapping sets', () => {
      const setA = new Set(['type:FALL', 'med:donepezil', 'kw:bathroom']);
      const setB = new Set(
        ['type:FALL', 'med:donepezil', 'kw:hallway', 'type:SYMPTOM'],
      );

      const score = service.computeSimilarity(setA, setB);

      // intersection = 2, |A| = 3, |B| = 4
      // score = 2 / sqrt(12) = 2 / 3.464 ≈ 0.577
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
      expect(score).toBeCloseTo(0.577, 2);
    });

    it('returns 0 for completely disjoint sets', () => {
      const setA = new Set(['type:FALL', 'kw:bathroom']);
      const setB = new Set(['type:LAB_RESULT', 'kw:blood']);

      const score = service.computeSimilarity(setA, setB);

      expect(score).toBe(0);
    });

    it('returns 0 when either set is empty', () => {
      const setA = new Set<string>();
      const setB = new Set(['type:FALL']);

      expect(service.computeSimilarity(setA, setB)).toBe(0);
      expect(service.computeSimilarity(setB, setA)).toBe(0);
      expect(service.computeSimilarity(setA, setA)).toBe(0);
    });
  });

  // ------------------------------------------------------------------------
  // buildEpisodeSignature tests
  // ------------------------------------------------------------------------

  describe('buildEpisodeSignature()', () => {
    it('includes event types and medication from metadata', () => {
      const events = [
        mockEvent('FALL', null, { medicationName: 'aspirin' }),
        mockEvent('SYMPTOM', 'dizziness'),
      ];

      const sig = service.buildEpisodeSignature(events, []);

      expect(sig.has('type:FALL')).toBe(true);
      expect(sig.has('type:SYMPTOM')).toBe(true);
      expect(sig.has('med:aspirin')).toBe(true);
      expect(sig.has('kw:dizziness')).toBe(true);
    });

    it('includes episode-level medications', () => {
      const sig = service.buildEpisodeSignature([], ['Metformin', 'Lisinopril']);

      expect(sig.has('med:metformin')).toBe(true);
      expect(sig.has('med:lisinopril')).toBe(true);
    });
  });

  // ------------------------------------------------------------------------
  // matchCurrent integration (mocked DB)
  // ------------------------------------------------------------------------

  describe('matchCurrent()', () => {
    it('returns top matching episodes with score >= 0.4', async () => {
      prisma.healthEvent.findMany.mockResolvedValue(EVENTS_A);
      prisma.episode.findMany.mockResolvedValue([
        {
          id: 'ep-past-1',
          patientId: 'pat-1',
          title: 'Previous Fall Episode',
          description: null,
          startDate: new Date('2025-01-01'),
          endDate: null,
          outcome: null,
          severity: 'REVIEW',
          symptoms: [],
          medicationsInvolved: ['donepezil'],
          functionalChanges: [],
          cognitiveChanges: [],
          createdAt: new Date('2025-01-01'),
          events: EVENTS_B_IDENTICAL,
        },
      ]);

      const result = await service.matchCurrent('pat-1');

      expect(result.data.length).toBe(1);
      const match = result.data[0]!;
      expect(match.matchedEpisodeId).toBe('ep-past-1');
      expect(match.similarityScore).toBeGreaterThanOrEqual(0.4);
      expect(match.matchedEpisodeTitle).toBe('Previous Fall Episode');
    });

    it('returns empty when no events in current window', async () => {
      prisma.healthEvent.findMany.mockResolvedValue([]);

      const result = await service.matchCurrent('pat-1');

      expect(result.data).toEqual([]);
    });

    it('returns empty when no past episodes match above threshold', async () => {
      prisma.healthEvent.findMany.mockResolvedValue(EVENTS_A);
      prisma.episode.findMany.mockResolvedValue([
        {
          id: 'ep-unrelated',
          patientId: 'pat-1',
          title: 'Unrelated Lab Work',
          description: null,
          startDate: new Date('2025-01-01'),
          endDate: null,
          outcome: null,
          severity: 'NORMAL',
          symptoms: [],
          medicationsInvolved: [],
          functionalChanges: [],
          cognitiveChanges: [],
          createdAt: new Date('2025-01-01'),
          events: EVENTS_D_NONE,
        },
      ]);

      const result = await service.matchCurrent('pat-1');

      expect(result.data).toEqual([]);
    });
  });
});
