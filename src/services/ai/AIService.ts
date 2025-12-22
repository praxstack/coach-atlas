/**
 * AIService - Facade for AI Provider Adapters
 * Implements History Injection pattern for context memory
 */
import type {
  AIRequest,
  AIResponse,
  IAIService,
  Message,
  ProviderConfig,
  ProviderId,
  StreamChunk,
} from "../types";
import { anthropicAdapter } from "./adapters/AnthropicAdapter";
import { bedrockAdapter } from "./adapters/BedrockAdapter";
import { googleAdapter } from "./adapters/GoogleAdapter";
import { openAIAdapter } from "./adapters/OpenAIAdapter";
import { selectContext } from "./ContextManager";

/**
 * Coach Atlas System Prompt
 * Defines the AI persona and behavior
 */
export const SYSTEM_PROMPT = `You are Coach Atlas, a world-class technical mentor who combines deep interview preparation coaching with comprehensive tutorial creation. You teach through guided discovery, provide brutally honest feedback, and create production-ready learning resources.

Your core principles:
1. Build Problem Solvers, Not Solution Memorizers
2. Guided Discovery First - Ask questions before giving answers
3. Brutal Honesty Always - Tell it like it is, no sugarcoating
4. Visual Learning - Use diagrams, tables, and structured examples
5. Production-Ready - Everything you teach should work in real jobs

For interview coaching: Use the Socratic method with escalating hints.
For tutorials: Create comprehensive, beginner-to-advanced guides with code examples.
For system design: Guide through requirements, capacity, API design, database, architecture, and trade-offs.

Always be direct, professional, and focused on building real skills.`;

export class AIService implements IAIService {
  /**
   * Send message to the appropriate provider
   * Implements History Injection: sends full conversation context
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { config } = request;

    // Use system prompt if not provided
    const requestWithPrompt: AIRequest = {
      ...request,
      systemPrompt: request.systemPrompt || SYSTEM_PROMPT,
    };

    switch (config.provider) {
      case "openai":
        return openAIAdapter.sendMessage(requestWithPrompt);

      case "anthropic":
        return anthropicAdapter.sendMessage(requestWithPrompt);

      case "google":
        return googleAdapter.sendMessage(requestWithPrompt);

      case "bedrock":
        return bedrockAdapter.sendMessage(requestWithPrompt);

      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(provider: ProviderId, apiKey: string): Promise<boolean> {
    switch (provider) {
      case "openai":
        return openAIAdapter.validateApiKey(apiKey);

      case "anthropic":
        return anthropicAdapter.validateApiKey(apiKey);

      case "google":
        return googleAdapter.validateApiKey(apiKey);

      case "bedrock":
        return bedrockAdapter.validateApiKey(apiKey);

      default:
        return false;
    }
  }

  /**
   * Convenience method: Send a simple chat message with history injection
   * Uses ContextManager to fit within token limits
   */
  async chat(
    userMessage: string,
    conversationHistory: Message[],
    config: ProviderConfig
  ): Promise<AIResponse> {
    // Build the full message list for history injection
    const allMessages: Message[] = [
      ...conversationHistory,
      {
        id: "pending",
        conversationId: "pending",
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      },
    ];

    // Apply sliding window to fit within context limit
    const contextMessages = selectContext(allMessages, config.model, SYSTEM_PROMPT);

    return this.sendMessage({
      messages: contextMessages,
      config,
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  /**
   * Stream chat message with history injection
   * Uses ContextManager to fit within token limits
   * Yields chunks as they arrive from the API
   * @param customSystemPrompt - Optional custom system prompt for persona support
   */
  async *streamChat(
    userMessage: string,
    conversationHistory: Message[],
    config: ProviderConfig,
    customSystemPrompt?: string
  ): AsyncGenerator<StreamChunk> {
    // Use custom system prompt if provided, otherwise default
    const systemPrompt = customSystemPrompt || SYSTEM_PROMPT;

    // Build the full message list for history injection
    const allMessages: Message[] = [
      ...conversationHistory,
      {
        id: "pending",
        conversationId: "pending",
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      },
    ];

    // Apply sliding window to fit within context limit
    const contextMessages = selectContext(allMessages, config.model, systemPrompt);

    const request: AIRequest = {
      messages: contextMessages,
      config,
      systemPrompt,
    };

    // Route to the appropriate adapter's stream method
    switch (config.provider) {
      case "openai":
        yield* openAIAdapter.streamMessage(request);
        break;

      case "anthropic":
        yield* anthropicAdapter.streamMessage(request);
        break;

      case "google":
        yield* googleAdapter.streamMessage(request);
        break;

      case "bedrock":
        yield* bedrockAdapter.streamMessage(request);
        break;

      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}

// Singleton export
export const aiService = new AIService();
