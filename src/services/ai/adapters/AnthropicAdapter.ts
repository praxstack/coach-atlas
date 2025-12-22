/**
 * Anthropic (Claude) API Adapter
 * Direct fetch implementation (no SDK)
 * Supports streaming via SSE
 */
import type { AIRequest, AIResponse, Message, StreamChunk } from "../../types";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  id: string;
  content: Array<{
    type: "text";
    text: string;
  }>;
  stop_reason: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicAdapter {
  private baseUrl = "https://api.anthropic.com/v1";

  /**
   * Convert internal messages to Anthropic format
   * Note: Anthropic uses 'system' as a separate parameter, not in messages
   */
  private formatMessages(messages: Message[]): AnthropicMessage[] {
    return messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
  }

  /**
   * Send message to Anthropic API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { messages, config, systemPrompt, maxTokens = 4096 } = request;

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        // Required for browser-based requests
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: this.formatMessages(messages),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Anthropic API error: ${response.status}`
      );
    }

    const data: AnthropicResponse = await response.json();

    return {
      content: data.content[0]?.text || "",
      model: config.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * Stream message from Anthropic API using SSE
   */
  async *streamMessage(request: AIRequest): AsyncGenerator<StreamChunk> {
    const { messages, config, systemPrompt, maxTokens = 4096 } = request;

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: this.formatMessages(messages),
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Anthropic API error: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: "", done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Anthropic SSE format: event: and data: lines
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              // Anthropic sends content_block_delta events with text
              if (json.type === "content_block_delta" && json.delta?.text) {
                yield { content: json.delta.text, done: false };
              }
              // message_stop indicates end of stream
              if (json.type === "message_stop") {
                yield { content: "", done: true };
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
      // Anthropic doesn't have a simple models endpoint, so we try a minimal message
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const anthropicAdapter = new AnthropicAdapter();
