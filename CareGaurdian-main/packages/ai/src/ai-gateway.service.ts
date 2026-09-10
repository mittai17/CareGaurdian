/**
 * AI Gateway — the single entry point for all LLM interactions.
 * Selects the appropriate provider (Gemini or Mock) and provides
 * convenience methods for healthcare-specific AI tasks.
 */

import type { LlmProvider } from './types';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';

export interface ObservationAnalysis {
  structured: {
    category: string;
    severity: string;
    description: string;
    indicators: string[];
    confidence: number;
  };
  categories: string[];
  summary: string;
}

export class AIGatewayService {
  private gemini: GeminiProvider;
  private mock: MockProvider;
  private activeProvider: LlmProvider;

  constructor() {
    this.gemini = new GeminiProvider();
    this.mock = new MockProvider();
    this.activeProvider = this.gemini.isAvailable() ? this.gemini : this.mock;

    if (!this.gemini.isAvailable()) {
      console.warn(
        '[AIGateway] GEMINI_API_KEY not set — using MockProvider (local fallback). ' +
        'Set GEMINI_API_KEY for real LLM analysis.',
      );
    }
  }

  /** Returns the active provider (Gemini if key present, else Mock). */
  getProvider(): LlmProvider {
    return this.activeProvider;
  }

  /**
   * Extract structured data from a caregiver's raw observation text.
   * Returns categories, structured output, and a summary.
   */
  async analyzeObservation(observation: {
    rawText?: string | null;
    category: string;
    severity?: string | null;
  }): Promise<ObservationAnalysis> {
    const prompt = `Analyze this healthcare observation and extract structured data.

Category: ${observation.category}
Severity: ${observation.severity ?? 'unspecified'}
Raw text: "${observation.rawText ?? 'No text provided'}"

Extract:
1. The most relevant category from: CONFUSION, FALL, NEAR_FALL, APPETITE, SLEEP, MOBILITY, MOOD, PAIN, MEDICATION, OTHER
2. Severity assessment: MILD, MODERATE, SEVERE
3. Key indicators (patterns, concerns, notable details)
4. A brief clinical summary suitable for a care team dashboard

DO NOT provide diagnoses. DO NOT recommend treatments. Only describe what was observed.`;

    const schemaHint = `{
      "structured": {
        "category": "string (observation category)",
        "severity": "string (MILD|MODERATE|SEVERE)",
        "description": "string (brief description)",
        "indicators": ["string array of notable patterns"],
        "confidence": "number 0-1"
      },
      "categories": ["string array of relevant categories"],
      "summary": "string (clinical summary for dashboard)"
    }`;

    const result = await this.activeProvider.generateStructured<ObservationAnalysis>(
      prompt,
      schemaHint,
      { temperature: 0.1 },
    );

    if (result.data) {
      return result.data;
    }

    // Fallback if structured parsing fails
    return {
      structured: {
        category: observation.category,
        severity: observation.severity ?? 'MILD',
        description: result.rawText ?? 'Analysis unavailable',
        indicators: [],
        confidence: 0.3,
      },
      categories: [observation.category],
      summary: result.error ?? 'Analysis completed with limited data',
    };
  }

  /**
   * Generate a human-readable summary of detected changes.
   */
  async generateChangeSummary(
    signals: Array<{ agent: string; signal: string; confidence: number; reason: string }>,
    deviations: Array<{ metric: string; baseline: number; current: number; deviationPercent: number }>,
  ): Promise<string> {
    const signalText = signals
      .map((s) => `  - ${s.agent}: ${s.signal} (confidence: ${s.confidence}) — ${s.reason}`)
      .join('\n');

    const deviationText = deviations.length > 0
      ? deviations
          .map((d) => `  - ${d.metric}: ${d.baseline} → ${d.current} (${d.deviationPercent > 0 ? '+' : ''}${d.deviationPercent.toFixed(1)}%)`)
          .join('\n')
      : '  No metric deviations detected.';

    const prompt = `Summarize the following health changes for a clinical care team dashboard.
Be concise, factual, and specific. Do NOT diagnose. Do NOT recommend treatment.
Only describe what changed and why it matters for monitoring.

Signals detected:
${signalText}

Metric deviations from baseline:
${deviationText}

Provide a 2-4 sentence summary suitable for a "What Changed" section.`;

    return this.activeProvider.generateText(prompt, { temperature: 0.2 });
  }

  /**
   * Safely extract JSON from LLM text that may contain markdown fences,
   * preamble text, or other non-JSON content.
   */
  ensureJson(text: string): unknown {
    // Direct parse
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // continue
    }

    // Extract from code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as unknown;
      } catch {
        // continue
      }
    }

    // Find first JSON object
    const objMatch = text.match(/(\{[\s\S]*\})/);
    if (objMatch?.[1]) {
      try {
        return JSON.parse(objMatch[1]) as unknown;
      } catch {
        // continue
      }
    }

    // Find first JSON array
    const arrMatch = text.match(/(\[[\s\S]*\])/);
    if (arrMatch?.[1]) {
      try {
        return JSON.parse(arrMatch[1]) as unknown;
      } catch {
        // continue
      }
    }

    throw new Error(`Unable to extract JSON from text: ${text.substring(0, 200)}...`);
  }
}
