/**
 * Google AI (Gemini) API Adapter
 * Direct fetch implementation (no SDK)
 */
import type { AIRequest, AIResponse, Message } from "../../types";

interface GoogleContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GoogleResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleAdapter {
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  /**
   * Convert internal messages to Google format
   */
  private formatMessages(
    messages: Message[],
    systemPrompt?: string
  ): GoogleContent[] {
    const formatted: GoogleContent[] = [];

    // Add system prompt as first user message (Google's approach)
    if (systemPrompt) {
      formatted.push({
        role: "user",
        parts: [{ text: systemPrompt }],
      });
      // Add placeholder model response for system prompt
      formatted.push({
        role: "model",
        parts: [{ text: "Understood. I'll follow these instructions." }],
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === "system") continue; // Skip system messages, handled above
      formatted.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    return formatted;
  }

  /**
   * Send message to Google AI API
   */
  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { messages, config, systemPrompt } = request;

    const response = await fetch(
      `${this.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: this.formatMessages(messages, systemPrompt),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Google AI API error: ${response.status}`
      );
    }

    const data: GoogleResponse = await response.json();

    return {
      content: data.candidates[0]?.content?.parts[0]?.text || "",
      model: config.model,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  /**
   * Validate API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const googleAdapter = new GoogleAdapter();
