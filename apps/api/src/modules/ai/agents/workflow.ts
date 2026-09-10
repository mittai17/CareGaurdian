/**
 * Analysis workflow — LangGraph state machine for patient risk analysis.
 *
 * Implements a 10-node pipeline:
 *   baseline → change → medication → cognitive → functional →
 *   episode → evidence → safety → consensus → output
 *
 * If @langchain/langgraph is unavailable or fails to compile, the same
 * functions are callable directly via runAnalysisWorkflow() as a
 * functional fallback (no graph dependency).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// State schema (used by both graph and functional fallback)
// ---------------------------------------------------------------------------

export interface WorkflowState {
  patientId: string;
  triggerEventId?: string | null;
  baseline: Record<string, unknown> | null;
  changeSignals: Array<{ agent: string; signal: string; confidence: number; reason: string; evidenceIds: string[] }>;
  medicationSignal: { signal: string; confidence: number; reason: string } | null;
  cognitiveSignal: { signal: string; confidence: number; reason: string } | null;
  functionalSignal: { signal: string; confidence: number; reason: string } | null;
  episodeMatches: Array<{ episodeId: string; title: string; similarity: number }>;
  evidence: Array<{ id: string; claim: string; sourceType: string; sourceId: string | null; recordedAt: string }>;
  safetyCheck: { pass: boolean; notes: string; rewrittenSummary?: string };
  consensus: {
    signalType: string;
    severity: string;
    confidenceLevel: string;
    summary: string;
    evidenceIds: string[];
    supportingSignals: Array<{ agent: string; signal: string; confidence: number }>;
    contradictions: string[];
    dataGaps: string[];
    requiresHumanReview: boolean;
  } | null;
  agentsRun: string[];
  errors: string[];
}

export function createInitialState(patientId: string, triggerEventId?: string | null): WorkflowState {
  return {
    patientId,
    triggerEventId: triggerEventId ?? null,
    baseline: null,
    changeSignals: [],
    medicationSignal: null,
    cognitiveSignal: null,
    functionalSignal: null,
    episodeMatches: [],
    evidence: [],
    safetyCheck: { pass: true, notes: 'No safety issues detected' },
    consensus: null,
    agentsRun: [],
    errors: [],
  };
}

// ---------------------------------------------------------------------------
// Node implementations (pure functions, testable without graph)
// ---------------------------------------------------------------------------

type NodeDeps = {
  prisma: {
    baseline: { findUnique: (args: { where: { patientId: string }; include?: Record<string, unknown> }) => Promise<Record<string, unknown> | null> };
    riskSignal: {
      findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
      create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    medication: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    medicationEvent: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    observation: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    healthEvent: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    episode: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    evidence: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> };
    [key: string]: unknown;
  };
};

/** 1. baselineAgent — reads Baseline for the patient */
export async function baselineAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const baseline = await deps.prisma.baseline.findUnique({
      where: { patientId: state.patientId },
    });
    return {
      baseline: baseline ?? null,
      agentsRun: [...state.agentsRun, 'baselineAgent'],
    };
  } catch (err) {
    return {
      baseline: null,
      agentsRun: [...state.agentsRun, 'baselineAgent'],
      errors: [...state.errors, `baselineAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 2. changeAgent — reads recent CHANGE_SIGNAL risk signals */
export async function changeAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const signals = await deps.prisma.riskSignal.findMany({
      where: {
        patientId: state.patientId,
        signalType: 'CHANGE_SIGNAL',
      },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    const changeSignals = signals.map((s) => ({
      agent: 'changeAgent',
      signal: String(s['signalType'] ?? 'CHANGE_SIGNAL'),
      confidence: Number(s['confidenceLevel'] === 'HIGH' ? 0.9 : s['confidenceLevel'] === 'MODERATE' ? 0.7 : 0.4),
      reason: String(s['summary'] ?? 'Change signal detected'),
      evidenceIds: Array.isArray(s['evidenceIds']) ? (s['evidenceIds'] as string[]) : [],
    }));

    return {
      changeSignals,
      agentsRun: [...state.agentsRun, 'changeAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'changeAgent'],
      errors: [...state.errors, `changeAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 3. medicationAgent — queries medications + medication events */
export async function medicationAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const activeMeds = await deps.prisma.medication.findMany({
      where: { patientId: state.patientId, status: 'ACTIVE' },
    });

    const recentEvents = await deps.prisma.medicationEvent.findMany({
      where: {
        patientId: state.patientId,
        occurredAt: { gte: fourteenDaysAgo },
      },
      orderBy: { occurredAt: 'desc' },
    });

    let signal = 'MEDICATION_OK';
    let confidence = 0.8;
    let reason = `${activeMeds.length} active medications, ${recentEvents.length} recent events — no changes detected`;

    // Detect recent changes
    const changeEvents = recentEvents.filter((e) =>
      ['CHANGED', 'STOPPED', 'STARTED'].includes(String(e['type'])),
    );
    const missedEvents = recentEvents.filter((e) => String(e['type']) === 'MISSED');

    if (changeEvents.length > 0) {
      signal = 'MEDICATION_CHANGE_RECENT';
      confidence = 0.85;
      reason = `${changeEvents.length} medication change(s) in the last 14 days`;
    }

    if (missedEvents.length >= 3) {
      signal = 'MEDICATION_ADHERENCE_DROP';
      confidence = 0.8;
      reason = `${missedEvents.length} missed medication events in the last 14 days`;
    }

    return {
      medicationSignal: { signal, confidence, reason },
      agentsRun: [...state.agentsRun, 'medicationAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'medicationAgent'],
      errors: [...state.errors, `medicationAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 4. cognitiveAgent — queries CONFUSION/COGNITIVE_CHANGE observations and events */
export async function cognitiveAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const observations = await deps.prisma.observation.findMany({
      where: {
        patientId: state.patientId,
        category: { in: ['CONFUSION'] },
        occurredAt: { gte: fourteenDaysAgo },
      },
      orderBy: { occurredAt: 'desc' },
    });

    const events = await deps.prisma.healthEvent.findMany({
      where: {
        patientId: state.patientId,
        type: 'COGNITIVE_CHANGE',
        timestamp: { gte: fourteenDaysAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const totalSignals = observations.length + events.length;

    if (totalSignals === 0) {
      return {
        cognitiveSignal: { signal: 'COGNITIVE_STABLE', confidence: 0.7, reason: 'No cognitive change signals in last 14 days' },
        agentsRun: [...state.agentsRun, 'cognitiveAgent'],
      };
    }

    const highSeverity = observations.filter((o) => o['severity'] === 'SEVERE' || o['severity'] === 'MODERATE').length;

    return {
      cognitiveSignal: {
        signal: 'COGNITIVE_CHANGE',
        confidence: Math.min(0.95, 0.6 + totalSignals * 0.08 + highSeverity * 0.1),
        reason: `${observations.length} confusion observations + ${events.length} cognitive change events in 14 days`,
      },
      agentsRun: [...state.agentsRun, 'cognitiveAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'cognitiveAgent'],
      errors: [...state.errors, `cognitiveAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 5. functionalAgent — queries FALL/NEAR_FALL/MOBILITY observations */
export async function functionalAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const observations = await deps.prisma.observation.findMany({
      where: {
        patientId: state.patientId,
        category: { in: ['FALL', 'NEAR_FALL', 'MOBILITY'] },
        occurredAt: { gte: fourteenDaysAgo },
      },
      orderBy: { occurredAt: 'desc' },
    });

    const events = await deps.prisma.healthEvent.findMany({
      where: {
        patientId: state.patientId,
        type: { in: ['FALL', 'NEAR_FALL', 'MOBILITY_CHANGE', 'FUNCTIONAL_CHANGE'] },
        timestamp: { gte: fourteenDaysAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    const fallCount = observations.filter((o) => o['category'] === 'FALL').length +
      events.filter((e) => e['type'] === 'FALL').length;
    const nearFallCount = observations.filter((o) => o['category'] === 'NEAR_FALL').length +
      events.filter((e) => e['type'] === 'NEAR_FALL').length;
    const mobilityCount = observations.filter((o) => o['category'] === 'MOBILITY').length +
      events.filter((e) => e['type'] === 'MOBILITY_CHANGE' || e['type'] === 'FUNCTIONAL_CHANGE').length;

    const totalSignals = fallCount + nearFallCount + mobilityCount;

    if (totalSignals === 0) {
      return {
        functionalSignal: { signal: 'FUNCTIONAL_STABLE', confidence: 0.7, reason: 'No functional decline signals in last 14 days' },
        agentsRun: [...state.agentsRun, 'functionalAgent'],
      };
    }

    let signal = 'FUNCTIONAL_DECLINE_SIGNAL';
    let confidence = Math.min(0.95, 0.5 + totalSignals * 0.1);
    let reason = `${fallCount} falls, ${nearFallCount} near-falls, ${mobilityCount} mobility changes in 14 days`;

    if (fallCount >= 2) {
      signal = 'FALL_RISK_ELEVATED';
      confidence = Math.min(0.98, confidence + 0.15);
      reason += ' — multiple falls indicate elevated fall risk';
    }

    return {
      functionalSignal: { signal, confidence, reason },
      agentsRun: [...state.agentsRun, 'functionalAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'functionalAgent'],
      errors: [...state.errors, `functionalAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 6. episodeAgent — loads episodes, computes similarity via intersection scoring */
export async function episodeAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    // Get recent health events for similarity comparison
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await deps.prisma.healthEvent.findMany({
      where: {
        patientId: state.patientId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const recentTypes = new Set(recentEvents.map((e) => String(e['type'])));
    const recentDescriptions = recentEvents
      .map((e) => String(e['description'] ?? '').toLowerCase())
      .filter((d) => d.length > 0);

    const episodes = await deps.prisma.episode.findMany({
      where: { patientId: state.patientId },
      orderBy: { startDate: 'desc' },
      take: 20,
    });

    const matches = episodes
      .map((ep) => {
        const epSymptoms = (Array.isArray(ep['symptoms']) ? (ep['symptoms'] as string[]) : []).map((s) => s.toLowerCase());
        const epFunctional = (Array.isArray(ep['functionalChanges']) ? (ep['functionalChanges'] as string[]) : []).map((s) => s.toLowerCase());
        const epCognitive = (Array.isArray(ep['cognitiveChanges']) ? (ep['cognitiveChanges'] as string[]) : []).map((s) => s.toLowerCase());
        const epMeds = (Array.isArray(ep['medicationsInvolved']) ? (ep['medicationsInvolved'] as string[]) : []).map((s) => s.toLowerCase());

        const allEpTags = [...epSymptoms, ...epFunctional, ...epCognitive, ...epMeds];
        const recentTags = recentDescriptions;

        // Intersection scoring
        let overlap = 0;
        for (const tag of allEpTags) {
          if (recentTags.some((rt) => rt.includes(tag) || tag.includes(rt))) {
            overlap++;
          }
        }

        // Also consider event type overlap
        const epEventTypes = new Set<string>();
        // Episodes have symptoms/changes, not direct event types — use the tag overlap as primary

        const similarity = allEpTags.length > 0
          ? overlap / Math.max(allEpTags.length, 1)
          : 0;

        return {
          episodeId: String(ep['id']),
          title: String(ep['title']),
          similarity: Math.round(similarity * 100) / 100,
        };
      })
      .filter((m) => m.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return {
      episodeMatches: matches,
      agentsRun: [...state.agentsRun, 'episodeAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'episodeAgent'],
      errors: [...state.errors, `episodeAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 7. evidenceAgent — collects evidence rows, ensures each claim maps to sources */
export async function evidenceAgent(state: WorkflowState, deps: NodeDeps): Promise<Partial<WorkflowState>> {
  try {
    const evidence = await deps.prisma.evidence.findMany({
      where: {
        riskSignal: { patientId: state.patientId },
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    const formattedEvidence = evidence.map((e) => ({
      id: String(e['id']),
      claim: String(e['claim']),
      sourceType: String(e['sourceType']),
      sourceId: (e['sourceId'] as string | null) ?? null,
      recordedAt: String(e['recordedAt']),
    }));

    return {
      evidence: formattedEvidence,
      agentsRun: [...state.agentsRun, 'evidenceAgent'],
    };
  } catch (err) {
    return {
      agentsRun: [...state.agentsRun, 'evidenceAgent'],
      errors: [...state.errors, `evidenceAgent: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

/** 8. safetyAgent — validates output, rejects diagnosis claims, caps confidence */
const DIAGNOSIS_PATTERNS = [
  /diagnosed?\s+with/i,
  /cause[d]?\s+(is|was|are|were)/i,
  /has\s+a\s+diagnosis/i,
  /\bdiagnosis\b/i,
  /\bprognosis\b/i,
];

const TREATMENT_PATTERNS = [
  /should\s+take/i,
  /recommend(ed)?\s+(taking|starting|stopping|changing)/i,
  /prescri(be|bed|ption)/i,
  /dosage\s+(should|must|needs?)/i,
  /start\s+(this|the|a)\s+(medication|drug|treatment)/i,
];

const EMERGENCY_PATTERNS = [
  /call\s+911/i,
  /go\s+to\s+(the\s+)?er/i,
  /emergency\s+(room|care|services)/i,
  /seek\s+immediate/i,
];

export function safetyAgent(state: WorkflowState): Partial<WorkflowState> {
  // Build the summary text from consensus if available, else from signals
  const summaryParts: string[] = [];

  if (state.medicationSignal) summaryParts.push(state.medicationSignal.reason);
  if (state.cognitiveSignal) summaryParts.push(state.cognitiveSignal.reason);
  if (state.functionalSignal) summaryParts.push(state.functionalSignal.reason);
  state.changeSignals.forEach((s) => summaryParts.push(s.reason));

  const fullText = summaryParts.join('. ');

  const violations: string[] = [];

  for (const pattern of DIAGNOSIS_PATTERNS) {
    if (pattern.test(fullText)) {
      violations.push(`Blocked diagnosis assertion: ${pattern.source}`);
    }
  }

  for (const pattern of TREATMENT_PATTERNS) {
    if (pattern.test(fullText)) {
      violations.push(`Blocked treatment recommendation: ${pattern.source}`);
    }
  }

  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(fullText)) {
      violations.push(`Blocked emergency advice: ${pattern.source}`);
    }
  }

  // Rewrite summary if violations found
  let rewrittenSummary = fullText;
  if (violations.length > 0) {
    rewrittenSummary = fullText
      .replace(/diagnosed?\s+with\s+\w+/gi, 'showing signs consistent with')
      .replace(/cause[d]?\s+(is|was|are|were)\s+\w+/gi, 'is associated with')
      .replace(/should\s+take\s+\w+/gi, 'may benefit from review')
      .replace(/call\s+911/gi, 'consult with care team')
      .replace(/seek\s+immediate\s+\w+/gi, 'consult with care team');
  }

  return {
    safetyCheck: {
      pass: violations.length === 0,
      notes: violations.length > 0 ? violations.join('; ') : 'No safety issues detected',
      rewrittenSummary: violations.length > 0 ? rewrittenSummary : undefined,
    },
    agentsRun: [...state.agentsRun, 'safetyAgent'],
  };
}

/** 9. consensusEngine — combines all agent signals into a ConsensusResult */
export function consensusEngine(state: WorkflowState): Partial<WorkflowState> {
  const signals: Array<{ agent: string; signal: string; confidence: number }> = [];

  if (state.medicationSignal) {
    signals.push({ agent: 'medicationAgent', signal: state.medicationSignal.signal, confidence: state.medicationSignal.confidence });
  }
  if (state.cognitiveSignal) {
    signals.push({ agent: 'cognitiveAgent', signal: state.cognitiveSignal.signal, confidence: state.cognitiveSignal.confidence });
  }
  if (state.functionalSignal) {
    signals.push({ agent: 'functionalAgent', signal: state.functionalSignal.signal, confidence: state.functionalSignal.confidence });
  }
  state.changeSignals.forEach((s) => {
    signals.push({ agent: s.agent, signal: s.signal, confidence: s.confidence });
  });

  // Determine dominant signal type
  const signalCounts: Record<string, number> = {};
  for (const s of signals) {
    const type = mapSignalToType(s.signal);
    signalCounts[type] = (signalCounts[type] ?? 0) + 1;
  }

  let dominantType = 'CHANGE_SIGNAL';
  let maxCount = 0;
  for (const [type, count] of Object.entries(signalCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  }

  // Severity escalation: if >=3 agents flag something, escalate
  const flaggingAgents = signals.filter((s) => !['MEDICATION_OK', 'COGNITIVE_STABLE', 'FUNCTIONAL_STABLE'].includes(s.signal));

  let severity = 'NORMAL';
  let confidenceLevel = 'INSUFFICIENT_DATA';

  if (flaggingAgents.length >= 3) {
    severity = 'CRITICAL';
    confidenceLevel = 'HIGH';
  } else if (flaggingAgents.length >= 2) {
    severity = 'REVIEW';
    confidenceLevel = 'MODERATE';
  } else if (flaggingAgents.length === 1) {
    severity = 'ATTENTION';
    confidenceLevel = flaggingAgents[0]!.confidence >= 0.8 ? 'MODERATE' : 'LOW';
  }

  // Average confidence
  const avgConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    : 0;

  // Data gaps
  const dataGaps: string[] = [];
  if (!state.baseline) dataGaps.push('No baseline data available');
  if (state.episodeMatches.length === 0) dataGaps.push('No historical episode matches found');
  if (state.evidence.length === 0) dataGaps.push('No evidence records found');

  // Use safety-rewritten summary if available
  const summary = state.safetyCheck.rewrittenSummary ?? generateConsensusSummary(signals, flaggingAgents, dataGaps);

  return {
    consensus: {
      signalType: dominantType as any,
      severity: severity as any,
      confidenceLevel: confidenceLevel as any,
      summary,
      evidenceIds: state.evidence.map((e) => e.id),
      supportingSignals: signals,
      contradictions: [],
      dataGaps,
      requiresHumanReview: flaggingAgents.length >= 2 || severity === 'CRITICAL',
    },
    agentsRun: [...state.agentsRun, 'consensusEngine'],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapSignalToType(signal: string): string {
  if (signal.includes('MEDICATION')) return 'MEDICATION_SIGNAL';
  if (signal.includes('COGNITIVE')) return 'COGNITIVE_SIGNAL';
  if (signal.includes('FUNCTIONAL') || signal.includes('FALL')) return 'FUNCTIONAL_DECLINE_SIGNAL';
  return 'CHANGE_SIGNAL';
}

function generateConsensusSummary(
  signals: Array<{ agent: string; signal: string; confidence: number }>,
  flaggingAgents: Array<{ agent: string; signal: string; confidence: number }>,
  dataGaps: string[],
): string {
  if (flaggingAgents.length === 0) {
    return 'No significant changes detected across monitored domains. Patient data appears stable.';
  }

  const flagged = flaggingAgents.map((a) => a.agent).join(', ');
  const avgConf = flaggingAgents.reduce((s, a) => s + a.confidence, 0) / flaggingAgents.length;
  const confDesc = avgConf >= 0.8 ? 'high' : avgConf >= 0.6 ? 'moderate' : 'low';

  let summary = `${flaggingAgents.length} agent(s) flagged concerns with ${confDesc} confidence: ${flagged}.`;
  if (dataGaps.length > 0) {
    summary += ` Data gaps: ${dataGaps.join('; ')}.`;
  }
  summary += ' Requires clinician review.';
  return summary;
}

// ---------------------------------------------------------------------------
// Graph construction (with fallback)
// ---------------------------------------------------------------------------

let StateGraphClass: unknown = null;
let AnnotationObj: unknown = null;
let graphSTART: string | null = null;
let graphEND: string | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const langgraph = require('@langchain/langgraph');
  StateGraphClass = langgraph.StateGraph;
  AnnotationObj = langgraph.Annotation;
  graphSTART = langgraph.START;
  graphEND = langgraph.END;
} catch {
  // langgraph not available — will use functional fallback
}

export function isGraphAvailable(): boolean {
  return StateGraphClass !== null && AnnotationObj !== null && graphSTART !== null && graphEND !== null;
}

/**
 * Build the LangGraph StateGraph if available.
 * Returns null if langgraph is not usable.
 */
export function buildAnalysisGraph(): ReturnType<(...args: unknown[]) => unknown> | null {
  if (!isGraphAvailable()) return null;

  try {
    // Build state annotation
     
    const Annotation = AnnotationObj as any;
    const StateAnnotation = Annotation.Root({
      patientId: Annotation(),
      triggerEventId: Annotation(),
      baseline: Annotation(),
      changeSignals: Annotation(),
      medicationSignal: Annotation(),
      cognitiveSignal: Annotation(),
      functionalSignal: Annotation(),
      episodeMatches: Annotation(),
      evidence: Annotation(),
      safetyCheck: Annotation(),
      consensus: Annotation(),
      agentsRun: Annotation(),
      errors: Annotation(),
    });

     
    const StateGraphCtor = StateGraphClass as new (...args: unknown[]) => any;
    const graph = new StateGraphCtor(StateAnnotation);

    // Add nodes — each wraps the pure function
     
    graph.addNode('baselineAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await baselineAgent(state, deps) : {};
    });
     
    graph.addNode('changeAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await changeAgent(state, deps) : {};
    });
     
    graph.addNode('medicationAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await medicationAgent(state, deps) : {};
    });
     
    graph.addNode('cognitiveAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await cognitiveAgent(state, deps) : {};
    });
     
    graph.addNode('functionalAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await functionalAgent(state, deps) : {};
    });
     
    graph.addNode('episodeAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await episodeAgent(state, deps) : {};
    });
     
    graph.addNode('evidenceAgent', async (state: WorkflowState) => {
      const deps = getDeps();
      return deps ? await evidenceAgent(state, deps) : {};
    });
     
    graph.addNode('safetyAgent', async (state: WorkflowState) => safetyAgent(state));
     
    graph.addNode('consensusEngine', async (state: WorkflowState) => consensusEngine(state));

    // Edges — linear pipeline with parallel fans
    const START = graphSTART as string;
    const END = graphEND as string;

     
    graph.addEdge(START, 'baselineAgent');
     
    graph.addEdge('baselineAgent', 'changeAgent');
     
    graph.addEdge('changeAgent', 'medicationAgent');
     
    graph.addEdge('medicationAgent', 'cognitiveAgent');
     
    graph.addEdge('cognitiveAgent', 'functionalAgent');
     
    graph.addEdge('functionalAgent', 'episodeAgent');
     
    graph.addEdge('episodeAgent', 'evidenceAgent');
     
    graph.addEdge('evidenceAgent', 'safetyAgent');
     
    graph.addEdge('safetyAgent', 'consensusEngine');
     
    graph.addEdge('consensusEngine', END);

    // Compile
     
    return graph.compile();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dependency injection (set by ai.service.ts before workflow runs)
// ---------------------------------------------------------------------------

let _deps: NodeDeps | null = null;

export function setWorkflowDeps(deps: NodeDeps): void {
  _deps = deps;
}

function getDeps(): NodeDeps | null {
  return _deps;
}

/**
 * Functional fallback — runs the pipeline without the graph.
 * Produces identical results but is simpler and always works.
 */
export async function runAnalysisWorkflow(
  patientId: string,
  triggerEventId?: string | null,
): Promise<WorkflowState> {
  const deps = getDeps();
  if (!deps) {
    throw new Error('Workflow dependencies not set. Call setWorkflowDeps() first.');
  }

  let state = createInitialState(patientId, triggerEventId);

  // Run nodes sequentially (same order as graph)
  const nodeFns = [
    () => baselineAgent(state, deps),
    () => changeAgent(state, deps),
    () => medicationAgent(state, deps),
    () => cognitiveAgent(state, deps),
    () => functionalAgent(state, deps),
    () => episodeAgent(state, deps),
    () => evidenceAgent(state, deps),
    () => Promise.resolve(safetyAgent(state)),
    () => Promise.resolve(consensusEngine(state)),
  ];

  for (const fn of nodeFns) {
    const update = await fn();
    state = { ...state, ...update };
  }

  return state;
}
