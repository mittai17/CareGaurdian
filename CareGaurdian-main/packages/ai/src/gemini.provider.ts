/**
 * Gemini LLM Provider — wraps the Google GenAI SDK.
 * Falls back gracefully if the SDK or API key is unavailable.
 */

import type { LlmProvider, LlmProviderOptions, StructuredOutput } from './types';

let GoogleGenAI: unknown;
try {
  // Dynamic import for ESM-only package; resolves in Node 22+ with CJS interop
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch {
  // SDK not installed or not resolvable — provider will report unavailable
}

const GEMINI_MODEL = 'gemini-3.6-flash';

export class GeminiProvider implements LlmProvider {
  private client: unknown = null;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env['GEMINI_API_KEY'] ?? '';
    if (this.apiKey && typeof GoogleGenAI === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.client = new (GoogleGenAI as new (opts: { apiKey: string }) => unknown)({ apiKey: this.apiKey });
      } catch {
        this.client = null;
      }
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  async generateStructured<T>(
    prompt: string,
    schemaHint: string,
    opts?: LlmProviderOptions,
  ): Promise<StructuredOutput<T>> {
    if (!this.isAvailable()) {
      return { data: null, error: 'Gemini provider not available (missing API key or SDK)' };
    }

    const systemInstruction = opts?.systemInstruction ?? 'You are a healthcare data analysis assistant. Return only valid JSON. Never include diagnosis or treatment recommendations.';
    const fullPrompt = `${systemInstruction}\n\n${prompt}\n\nRespond with a JSON object matching this schema:\n${schemaHint}`;

    try {
      const rawText = await this.generateText(fullPrompt, { ...opts, temperature: opts?.temperature ?? 0.1 });
      const parsed = this.extractJson(rawText) as T;
      return { data: parsed, rawText };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: `Gemini structured generation failed: ${message}` };
    }
  }

  async generateText(prompt: string, opts?: LlmProviderOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Gemini provider not available');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const response = await (this.client as any).models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: opts?.maxTokens ?? 4096,
        temperature: opts?.temperature ?? 0.3,
      },
    });

    // response.text is a getter property
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const text = (response as any).text as string | undefined;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }
    return text;
  }

  /** Robustly extract the first JSON object/array from LLM text. */
  private extractJson(text: string): unknown {
    // Try direct parse
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // continue
    }
    // Try extracting from markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as unknown;
      } catch {
        // continue
      }
    }
    // Try finding first { ... } or [ ... ]
    const objectMatch = text.match(/(\{[\s\S]*\})/);
    if (objectMatch?.[1]) {
      try {
        return JSON.parse(objectMatch[1]) as unknown;
      } catch {
        // continue
      }
    }
    throw new Error('Unable to extract JSON from Gemini response');
  }
}
