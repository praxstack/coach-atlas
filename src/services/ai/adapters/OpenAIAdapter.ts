/**
 * OpenAI API Adapter
 * Direct fetch implementation (no SDK) for smaller bundle size
 * Supports streaming via SSE (Server-Sent Events)
 */
import type { AIRequest, AIResponse, Message, StreamChunk } from "../../types";

interface OpenAIMessage {
  role: "system" | "developer" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** o-series and gpt-5 models are reasoning models with a different chat API contract. */
export function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-5)/i.test(model);
}

/**
 * For reasoning models, max_completion_tokens covers hidden reasoning tokens
 * as well as the visible reply, so 4096 can be spent entirely on reasoning
 * and return an empty answer. OpenAI recommends reserving about 25k.
 */
export const DEFAULT_MAX_TOKENS = 4096;
export const REASONING_DEFAULT_MAX_TOKENS = 25000;

export function defaultMaxTokens(model: string): number {
  return isReasoningModel(model) ? REASONING_DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS;
}

/** Thrown when the token budget ran out before the model produced any text. */
export function emptyLengthError(model: string): Error {
  return new Error(
    `OpenAI returned no text for ${model}: the token limit was used up before an answer ` +
      `(finish_reason "length"). Shorten the conversation or choose a non-reasoning model.`
  );
}

/** o1-preview / o1-mini accept neither system nor developer messages. */
function rejectsInstructionRole(model: string): boolean {
  return /^o1-(preview|mini)/i.test(model);
}

export class OpenAIAdapter {
  private baseUrl = "https://api.openai.com/v1";

  /**
   * Convert internal messages to OpenAI format
   */
  formatMessages(
    messages: Message[],
    systemPrompt?: string,
    model = ""
  ): OpenAIMessage[] {
    const formatted: OpenAIMessage[] = [];
    let foldIntoFirstUser: string | undefined;

    // Add system prompt first
    if (systemPrompt) {
      if (rejectsInstructionRole(model)) {
        foldIntoFirstUser = systemPrompt;
      } else {
        formatted.push({
          role: isReasoningModel(model) ? "developer" : "system",
          content: systemPrompt,
        });
      }
    }

    // Add conversation messages
    for (const msg of messages) {
      formatted.push({
        role: msg.role,
        content:
          foldIntoFirstUser !== undefined && msg.role === "user"
            ? `${foldIntoFirstUser}\n\n${msg.content}`
            : msg.content,
      });
      if (msg.role === "user") foldIntoFirstUser = undefined;
    }

    return formatted;
  }

  /** Token-limit parameter name differs for reasoning models. */
  tokenLimitParam(model: string, maxTokens: number): Record<string, number> {
    return isReasoningModel(model)
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens };
  }

  /**
   * Send message to OpenAI API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { messages, config, systemPrompt } = request;
    const maxTokens = request.maxTokens ?? defaultMaxTokens(config.model);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: this.formatMessages(messages, systemPrompt, config.model),
        ...this.tokenLimitParam(config.model, maxTokens),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `OpenAI API error: ${response.status}`
      );
    }

    const data: OpenAIResponse = await response.json();
    const choice = data.choices[0];
    const content = choice?.message?.content || "";
    if (!content && choice?.finish_reason === "length") {
      throw emptyLengthError(config.model);
    }

    return {
      content,
      model: config.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Stream message from OpenAI API using SSE
   * Yields chunks as they arrive for real-time display
   */
  async *streamMessage(request: AIRequest): AsyncGenerator<StreamChunk> {
    const { messages, config, systemPrompt } = request;
    const maxTokens = request.maxTokens ?? defaultMaxTokens(config.model);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: this.formatMessages(messages, systemPrompt, config.model),
        ...this.tokenLimitParam(config.model, maxTokens),
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `OpenAI API error: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let yieldedText = false;
    let finishReason: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (!yieldedText && finishReason === "length") {
            throw emptyLengthError(config.model);
          }
          yield { content: "", done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const choice = json.choices?.[0];
              if (choice?.finish_reason) finishReason = choice.finish_reason;
              const content = choice?.delta?.content || "";
              if (content) {
                yieldedText = true;
                yield { content, done: false };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Validate API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const openAIAdapter = new OpenAIAdapter();
