/**
 * Tests for AiService — mock provider fallback + safety agent blocks diagnosis.
 */

import { AiService } from './ai.service';
import { AIGatewayService } from '@baseline/ai';
import { safetyAgent, createInitialState } from './agents/workflow';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------
function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    agentRun: {
      create: jest.fn().mockResolvedValue({
        id: 'run-1',
        patientId: 'pat-1',
        status: 'PENDING',
        agentsRun: [],
        startedAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    baseline: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    riskSignal: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'signal-1',
        patientId: 'pat-1',
        signalType: 'CHANGE_SIGNAL',
        severity: 'NORMAL',
        confidenceLevel: 'INSUFFICIENT_DATA',
        summary: 'No issues',
        evidenceIds: [],
        supportingSignals: [],
        contradictions: [],
        dataGaps: [],
        requiresHumanReview: true,
        status: 'PENDING',
        generatedAt: new Date(),
      }),
    },
    medication: { findMany: jest.fn().mockResolvedValue([]) },
    medicationEvent: { findMany: jest.fn().mockResolvedValue([]) },
    observation: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    healthEvent: { findMany: jest.fn().mockResolvedValue([]) },
    episode: { findMany: jest.fn().mockResolvedValue([]) },
    evidence: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({}),
    },
    document: { findMany: jest.fn().mockResolvedValue([]) },
    healthMemoryFact: { findMany: jest.fn().mockResolvedValue([]) },
    contradiction: { findMany: jest.fn().mockResolvedValue([]) },
    missingInfo: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  } as any;
}

function createAccessControlMock() {
  return {
    check: jest.fn().mockResolvedValue(true),
  } as any;
}

describe('AiService', () => {
  describe('mock provider fallback', () => {
    it('returns safe structured output when no GEMINI_API_KEY is set', async () => {
      const originalKey = process.env['GEMINI_API_KEY'];
      delete process.env['GEMINI_API_KEY'];

      try {
        const gateway = new AIGatewayService();

        // The gateway should use MockProvider
        expect(gateway.getProvider().isAvailable()).toBe(true);

        // analyzeObservation should return structured data
        const result = await gateway.analyzeObservation({
          rawText: 'Patient seemed confused today',
          category: 'CONFUSION',
          severity: 'MODERATE',
        });

        expect(result).toBeDefined();
        expect(result.categories).toBeDefined();
        expect(result.categories.length).toBeGreaterThan(0);
        expect(result.summary).toBeDefined();
        expect(typeof result.summary).toBe('string');
        // Mock provider labels its output as local fallback
        expect(result.summary).toContain('[local fallback]');
      } finally {
        if (originalKey !== undefined) {
          process.env['GEMINI_API_KEY'] = originalKey;
        }
      }
    });

    it('full pipeline runs with mock provider and persists results', async () => {
      const originalKey = process.env['GEMINI_API_KEY'];
      delete process.env['GEMINI_API_KEY'];

      try {
        const prisma = createPrismaMock();
        const accessControl = createAccessControlMock();
        const service = new AiService(prisma, accessControl);

        const result = await service.runAnalysis('pat-1', 'user-1');

        expect(result).toBeDefined();
        expect(result.riskSignal).toBeDefined();
        expect(result.agentRun).toBeDefined();

        // AgentRun should be created then updated to COMPLETED
        expect(prisma.agentRun.create).toHaveBeenCalledTimes(1);
        expect(prisma.agentRun.update).toHaveBeenCalledTimes(1);

        const updateCall = prisma.agentRun.update.mock.calls[0][0];
        expect(updateCall.data.status).toBe('COMPLETED');

        // RiskSignal should be created
        expect(prisma.riskSignal.create).toHaveBeenCalledTimes(1);
      } finally {
        if (originalKey !== undefined) {
          process.env['GEMINI_API_KEY'] = originalKey;
        }
      }
    });
  });

  describe('safety agent', () => {
    it('blocks a diagnosis-style claim and rewrites summary', () => {
      const state = createInitialState('pat-1');
      state.medicationSignal = {
        signal: 'MEDICATION_CHANGE_RECENT',
        confidence: 0.8,
        reason: 'Patient was diagnosed with diabetes and should take metformin',
      };

      const result = safetyAgent(state);

      expect(result.safetyCheck).toBeDefined();
      expect(result.safetyCheck!.pass).toBe(false);
      expect(result.safetyCheck!.notes).toContain('Blocked');
      // The rewritten summary should have the diagnosis replaced
      expect(result.safetyCheck!.rewrittenSummary).toBeDefined();
      expect(result.safetyCheck!.rewrittenSummary).not.toContain('diagnosed with diabetes');
      expect(result.safetyCheck!.rewrittenSummary).not.toContain('should take metformin');
    });

    it('passes when no unsafe content is present', () => {
      const state = createInitialState('pat-1');
      state.medicationSignal = {
        signal: 'MEDICATION_CHANGE_RECENT',
        confidence: 0.8,
        reason: 'Medication was changed 3 days ago',
      };

      const result = safetyAgent(state);

      expect(result.safetyCheck!.pass).toBe(true);
      expect(result.safetyCheck!.notes).toBe('No safety issues detected');
      expect(result.safetyCheck!.rewrittenSummary).toBeUndefined();
    });

    it('blocks treatment recommendations', () => {
      const state = createInitialState('pat-1');
      state.cognitiveSignal = {
        signal: 'COGNITIVE_CHANGE',
        confidence: 0.7,
        reason: 'Patient should take donepezil for cognitive decline',
      };

      const result = safetyAgent(state);

      expect(result.safetyCheck!.pass).toBe(false);
      expect(result.safetyCheck!.notes).toContain('Blocked treatment recommendation');
    });

    it('blocks emergency advice', () => {
      const state = createInitialState('pat-1');
      state.functionalSignal = {
        signal: 'FALL_RISK_ELEVATED',
        confidence: 0.9,
        reason: 'Multiple falls detected, call 911 for immediate evaluation',
      };

      const result = safetyAgent(state);

      expect(result.safetyCheck!.pass).toBe(false);
      expect(result.safetyCheck!.notes).toContain('Blocked emergency advice');
    });
  });
});
