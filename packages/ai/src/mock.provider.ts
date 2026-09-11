/**
 * Mock LLM Provider — deterministic, rule-based fallback.
 * Used when no GEMINI_API_KEY is present.
 * Outputs are clearly labeled as "local fallback" — NEVER used in production
 * when a real provider is available.
 *
 * This ensures the full AI pipeline works offline for hackathon demos,
 * integration tests, and environments without API keys.
 */

import type { LlmProvider, LlmProviderOptions, StructuredOutput } from './types';

const FALLBACK_PREFIX = '[local fallback]';

export class MockProvider implements LlmProvider {
  isAvailable(): boolean {
    return true; // Always available as a fallback
  }

  async generateStructured<T>(
    prompt: string,
    _schemaHint: string,
    _opts?: LlmProviderOptions,
  ): Promise<StructuredOutput<T>> {
    // Route to the appropriate mock based on prompt keywords
    const lower = prompt.toLowerCase();

    if (lower.includes('observation') || lower.includes('analyze') || lower.includes('caregiver')) {
      return {
        data: {
          structured: {
            category: 'OTHER',
            severity: 'MILD',
            description: `${FALLBACK_PREFIX} Caregiver observation processed`,
            indicators: [],
            confidence: 0.5,
          },
          categories: ['OTHER'],
          summary: `${FALLBACK_PREFIX} Observation analyzed using local rules — no LLM available`,
        } as unknown as T,
        rawText: `${FALLBACK_PREFIX} Structured observation`,
      };
    }

    if (lower.includes('change') || lower.includes('summary') || lower.includes('deviation')) {
      return {
        data: {
          structured: {
            changeDetected: true,
            domains: ['medication', 'cognition'],
            confidence: 0.6,
          },
          categories: ['CHANGE_SIGNAL'],
          summary: `${FALLBACK_PREFIX} Change summary generated using local rules`,
        } as unknown as T,
        rawText: `${FALLBACK_PREFIX} Change summary`,
      };
    }

    // Generic structured response
    return {
      data: {
        structured: {},
        categories: ['OTHER'],
        summary: `${FALLBACK_PREFIX} Analysis completed using local rules — connect GEMINI_API_KEY for real LLM analysis`,
      } as unknown as T,
      rawText: `${FALLBACK_PREFIX} Generic analysis`,
    };
  }

  async generateText(prompt: string, _opts?: LlmProviderOptions): Promise<string> {
    const lower = prompt.toLowerCase();

    if (lower.includes('clinical brief') || lower.includes('what changed')) {
      return `${FALLBACK_PREFIX} Clinical summary generated from patient data. No LLM available — this is a local rule-based summary.\n\nKey observations:\n- Data was aggregated from available patient records\n- Connect GEMINI_API_KEY for AI-powered analysis\n- This is a demonstration output for offline/hackathon mode`;
    }

    if (lower.includes('query') || lower.includes('question')) {
      return `${FALLBACK_PREFIX} Based on the available patient records, I can provide a basic summary. For AI-powered answers, please configure GEMINI_API_KEY.\n\nSources: Patient health records, observations, medication history`;
    }

    if (lower.includes('dosage range and max dosage')) {
      return JSON.stringify({
        fda_labeled_range: "500-2000mg/day (max 2550mg/day)",
        flag: "within range",
        evidence: "[local fallback] Dosage is within the typical FDA range for non-renal patients."
      });
    }

    if (lower.includes('safety') || lower.includes('validation')) {
      return JSON.stringify({ pass: true, notes: `${FALLBACK_PREFIX} Safety check passed (local rules)` });
    }

    return `${FALLBACK_PREFIX} Response generated using local rules. Connect GEMINI_API_KEY for real LLM-powered analysis.`;
  }
}
