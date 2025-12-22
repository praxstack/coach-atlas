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
} from "../types";
import { anthropicAdapter } from "./adapters/AnthropicAdapter";
import { googleAdapter } from "./adapters/GoogleAdapter";
import { openAIAdapter } from "./adapters/OpenAIAdapter";

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
        throw new Error(
          "AWS Bedrock requires server-side integration. Please use OpenAI, Anthropic, or Google."
        );

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
        // Bedrock uses IAM, not API keys
        return false;

      default:
        return false;
    }
  }

  /**
   * Convenience method: Send a simple chat message with history injection
   * This is the main method ChatPage will use
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

    return this.sendMessage({
      messages: allMessages,
      config,
      systemPrompt: SYSTEM_PROMPT,
    });
  }
}

// Singleton export
export const aiService = new AIService();
