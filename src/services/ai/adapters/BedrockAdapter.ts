/**
 * Bedrock Adapter - Uses Bearer Token Authentication
 * Compatible with Bedrock API Keys (not AWS SDK credentials)
 */
import type { AIRequest, AIResponse, IAIService, Message, StreamChunk } from "../../types";

export class BedrockAdapter implements IAIService {
  private getRegion(config: { apiKey: string; region?: string }): string {
    // Use explicit region from config
    if (config.region && config.region.trim()) {
      return config.region.trim();
    }
    return 'us-east-1';
  }

  private formatMessages(messages: Message[], systemPrompt?: string) {
    const formatted = messages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: [{ type: "text", text: msg.content }]
    }));

    return formatted;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { config, messages, systemPrompt } = request;
    const region = this.getRegion(config);

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: systemPrompt ? [{ type: "text", text: systemPrompt }] : undefined,
      messages: this.formatMessages(messages),
    });

    const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${config.model}/invoke`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bedrock API Error (${response.status}): ${errorText}`);
      }

      const json = await response.json();

      return {
        content: json.content?.[0]?.text || "",
        model: config.model,
        usage: {
          promptTokens: json.usage?.input_tokens || 0,
          completionTokens: json.usage?.output_tokens || 0,
          totalTokens: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
        },
      };
    } catch (error) {
      console.error("Bedrock API Error:", error);
      throw error;
    }
  }

  async *streamMessage(request: AIRequest): AsyncGenerator<StreamChunk> {
    const { config, messages, systemPrompt } = request;
    const region = this.getRegion(config);

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: systemPrompt ? [{ type: "text", text: systemPrompt }] : undefined,
      messages: this.formatMessages(messages),
    });

    const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${config.model}/invoke-with-response-stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bedrock Stream Error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());

              if (data.type === "content_block_delta" && data.delta?.text) {
                yield { content: data.delta.text, done: false };
              }

              if (data.type === "message_stop") {
                yield { content: "", done: true };
              }
            } catch {
              // Ignore parse errors for partial data
            }
          }
        }
      }
    } catch (error) {
      console.error("Bedrock Stream Error:", error);
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    return apiKey.trim().length > 0;
  }
}

export const bedrockAdapter = new BedrockAdapter();
