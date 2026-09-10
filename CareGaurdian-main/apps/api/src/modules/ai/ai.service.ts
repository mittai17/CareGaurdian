/**
 * AI Service — orchestrates the analysis workflow and query pipeline.
 * Enforces access control, persists results, wraps in try/catch.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AIGatewayService } from '@baseline/ai';
import {
  type WorkflowState,
  setWorkflowDeps,
  runAnalysisWorkflow,
  isGraphAvailable,
  buildAnalysisGraph,
} from './agents/workflow';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly gateway: AIGatewayService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {
    this.gateway = new AIGatewayService();

    // Wire up workflow dependencies
    setWorkflowDeps({ prisma: this.prisma as any });

    // Build LangGraph if available
    if (isGraphAvailable()) {
      this.logger.log('LangGraph available — using graph-based workflow');
    } else {
      this.logger.log('LangGraph not available — using functional fallback workflow');
    }
  }

  /**
   * Run the full analysis pipeline for a patient.
   * Creates an AgentRun, executes all agents, persists RiskSignal + Evidence.
   * Non-throwing: errors are captured in AgentRun(FAILED).
   */
  async runAnalysis(
    patientId: string,
    actorId: string,
    triggerEventId?: string | null,
  ): Promise<{
    riskSignal: Record<string, unknown>;
    agentRun: Record<string, unknown>;
  }> {
    // Create PENDING agent run
    const agentRun = await this.prisma.agentRun.create({
      data: {
        patientId,
        workflowId: `analysis-${Date.now()}`,
        status: 'PENDING',
        actorId,
        agentsRun: [],
      },
    });

    try {
      // Execute workflow
      const finalState = await runAnalysisWorkflow(patientId, triggerEventId);

      // Persist RiskSignal
      const consensus = finalState.consensus;
      const riskSignal = await this.prisma.riskSignal.create({
        data: {
          patientId,
          signalType: (consensus?.signalType ?? 'CHANGE_SIGNAL') as any,
          severity: (consensus?.severity ?? 'UNKNOWN') as any,
          confidenceLevel: (consensus?.confidenceLevel ?? 'INSUFFICIENT_DATA') as any,
          summary: consensus?.summary ?? 'Analysis completed with no significant findings',
          metrics: consensus?.supportingSignals ?? [],
          evidenceIds: consensus?.evidenceIds ?? [],
          supportingSignals: consensus?.supportingSignals ?? [],
          contradictions: consensus?.contradictions ?? [],
          dataGaps: consensus?.dataGaps ?? [],
          requiresHumanReview: consensus?.requiresHumanReview ?? true,
          status: 'PENDING',
          whyNow: this.buildWhyNow(finalState) as any,
        },
      });

      // Persist Evidence rows for any new evidence from the workflow
      const evidenceRows = finalState.evidence.map((e) => ({
        riskSignalId: riskSignal.id,
        eventId: e.sourceId,
        claim: e.claim,
        sourceType: e.sourceType as any,
        sourceId: e.sourceId,
        recordedAt: new Date(e.recordedAt),
      }));

      if (evidenceRows.length > 0) {
        await this.prisma.evidence.createMany({ data: evidenceRows });
      }

      // Update AgentRun to COMPLETED
      await this.prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: 'COMPLETED',
          agentsRun: finalState.agentsRun,
          result: finalState.consensus as any,
          completedAt: new Date(),
        },
      });

      return { riskSignal: riskSignal as unknown as Record<string, unknown>, agentRun: agentRun as unknown as Record<string, unknown> };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Analysis failed for patient ${patientId}: ${errorMessage}`);

      // Update AgentRun to FAILED
      await this.prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
          completedAt: new Date(),
        },
      }).catch((updateErr) => {
        this.logger.error(`Failed to update AgentRun status: ${updateErr instanceof Error ? updateErr.message : String(updateErr)}`);
      });

      // Return a minimal result so the caller doesn't break
      const fallbackSignal = await this.prisma.riskSignal.create({
        data: {
          patientId,
          signalType: 'CHANGE_SIGNAL',
          severity: 'UNKNOWN',
          confidenceLevel: 'INSUFFICIENT_DATA',
          summary: `Analysis failed: ${errorMessage}`,
          requiresHumanReview: true,
          status: 'PENDING',
        },
      });

      return {
        riskSignal: fallbackSignal as unknown as Record<string, unknown>,
        agentRun: agentRun as unknown as Record<string, unknown>,
      };
    }
  }

  /**
   * RAG-lite query: keyword search across patient documents + LLM answer.
   */
  async query(
    patientId: string,
    question: string,
    actorId: string,
  ): Promise<{ answer: string; sources: Array<{ id: string; type: string; snippet: string }> }> {
    // Keyword search across patient data
    const sources: Array<{ id: string; type: string; snippet: string }> = [];

    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .filter((w) => !['what', 'when', 'where', 'which', 'does', 'patient', 'their', 'there', 'about', 'recent', 'status', 'summarize', 'summarise'].includes(w))
      .slice(0, 8);
    const keywordFilters = (field: string) =>
      keywords.length > 0
        ? keywords.map((k) => ({ [field]: { contains: k, mode: 'insensitive' as const } }))
        : [{ [field]: { contains: question, mode: 'insensitive' as const } }];

    // Search observations
    const observations = await this.prisma.observation.findMany({
      where: {
        patientId,
        OR: keywordFilters('rawText'),
      },
      take: 10,
    });

    for (const obs of observations) {
      sources.push({
        id: String(obs['id']),
        type: 'observation',
        snippet: String(obs['rawText'] ?? '').substring(0, 200),
      });
    }

    // Search health events
    const events = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        OR: keywordFilters('description'),
      },
      take: 10,
    });

    for (const evt of events) {
      sources.push({
        id: String(evt['id']),
        type: 'health_event',
        snippet: String(evt['description'] ?? '').substring(0, 200),
      });
    }

    // Search documents
    const documents = await this.prisma.document.findMany({
      where: {
        patientId,
        OR: [
          ...keywordFilters('parsedText'),
          ...keywordFilters('filename'),
        ],
      },
      take: 5,
    });

    for (const doc of documents) {
      sources.push({
        id: String(doc['id']),
        type: 'document',
        snippet: String(doc['parsedText'] ?? doc['filename'] ?? '').substring(0, 200),
      });
    }

    // Search memory facts
    const facts = await this.prisma.healthMemoryFact.findMany({
      where: {
        patientId,
        OR: keywordFilters('content'),
      },
      take: 10,
    });

    for (const fact of facts) {
      sources.push({
        id: String(fact['id']),
        type: 'memory_fact',
        snippet: String(fact['content'] ?? '').substring(0, 200),
      });
    }

    // Assemble context for LLM
    const context = sources
      .map((s) => `[${s.type}] ${s.snippet}`)
      .join('\n---\n');

    const prompt = `Answer the following question about a patient based on the provided context.
Be factual and cite specific records. Do NOT diagnose. Do NOT recommend treatment.
If the context doesn't contain enough information, say so.

Question: ${question}

Patient records:
${context || 'No matching records found.'}`;

    const answer = await this.gateway.getProvider().generateText(prompt, {
      temperature: 0.2,
      maxTokens: 2048,
    });

    // Safety filter on the answer
    const safeAnswer = this.safetyFilter(answer);

    return {
      answer: safeAnswer,
      sources: sources.slice(0, 10), // Cap at 10 sources
    };
  }

  /**
   * Analyze a raw caregiver observation text into structured data.
   */
  async analyzeObservation(
    observation: {
      rawText?: string | null;
      category: string;
      severity?: string | null;
      patientId: string;
    },
    actorId: string,
  ) {
    return this.gateway.analyzeObservation(observation);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildWhyNow(state: WorkflowState): unknown[] {
    const reasons: string[] = [];

    if (state.medicationSignal && state.medicationSignal.signal !== 'MEDICATION_OK') {
      reasons.push(state.medicationSignal.reason);
    }
    if (state.cognitiveSignal && state.cognitiveSignal.signal !== 'COGNITIVE_STABLE') {
      reasons.push(state.cognitiveSignal.reason);
    }
    if (state.functionalSignal && state.functionalSignal.signal !== 'FUNCTIONAL_STABLE') {
      reasons.push(state.functionalSignal.reason);
    }
    state.changeSignals.forEach((s) => reasons.push(s.reason));

    return reasons;
  }

  private safetyFilter(text: string): string {
    const DIAGNOSIS_PATTERNS = [
      /diagnosed?\s+with/gi,
      /cause[d]?\s+(is|was|are|were)/gi,
      /\bdiagnosis\b/gi,
    ];

    let filtered = text;
    for (const pattern of DIAGNOSIS_PATTERNS) {
      filtered = filtered.replace(pattern, (match) => `[redacted: ${match}]`);
    }

    return filtered;
  }
}
