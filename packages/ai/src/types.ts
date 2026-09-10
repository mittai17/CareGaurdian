/**
 * LLM Provider abstraction — the single interface all AI calls go through.
 * Enables graceful degradation: Gemini when available, Mock otherwise.
 */

export interface StructuredOutput<T> {
  data: T | null;
  error?: string;
  rawText?: string;
}

export interface LlmProviderOptions {
  /** Max tokens for the response */
  maxTokens?: number;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** System instruction prepended to the prompt */
  systemInstruction?: string;
}

export interface LlmProvider {
  /**
   * Ask the model to return structured JSON matching a schema hint.
   * @param prompt       - The user/system prompt describing what to generate.
   * @param schemaHint   - A JSON-Schema-like description of the expected shape.
   * @param opts         - Optional generation parameters.
   */
  generateStructured<T>(
    prompt: string,
    schemaHint: string,
    opts?: LlmProviderOptions,
  ): Promise<StructuredOutput<T>>;

  /**
   * Free-form text generation (for summaries, analyses, etc.).
   */
  generateText(prompt: string, opts?: LlmProviderOptions): Promise<string>;

  /**
   * Whether the provider is actually usable (API key present, etc.).
   */
  isAvailable(): boolean;
}
