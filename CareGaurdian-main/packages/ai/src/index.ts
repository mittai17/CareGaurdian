/**
 * @baseline/ai — AI Gateway abstraction for the BASELINE healthcare platform.
 *
 * Provides LLM provider abstraction with graceful degradation:
 * - GeminiProvider: real LLM via Google GenAI SDK (requires GEMINI_API_KEY)
 * - MockProvider: deterministic local fallback for offline/demo mode
 * - AIGatewayService: unified entry point for all AI operations
 */

export type { LlmProvider, LlmProviderOptions, StructuredOutput } from './types';
export { GeminiProvider } from './gemini.provider';
export { MockProvider } from './mock.provider';
export { AIGatewayService } from './ai-gateway.service';
export type { ObservationAnalysis } from './ai-gateway.service';
