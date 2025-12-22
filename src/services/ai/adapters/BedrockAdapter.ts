/**
 * Bedrock Adapter - Uses Bearer Token Authentication
 * Endpoint: bedrock-runtime.{region}.amazonaws.com/model/{model}/invoke
 * Auth: Authorization: Bearer {apiKey}
 */
import type { AIRequest, AIResponse, IAIService, Message, StreamChunk } from "../../types";

export class BedrockAdapter implements IAIService {
  private getRegion(config: { region?: string }): string {
    return config.region?.trim() || 'us-east-1';
  }

  private formatMessages(messages: Message[]): { role: "user" | "assistant"; content: string }[] {
    const filtered = messages
      .filter(msg => msg.role !== 'system')
      .filter(msg => msg.content && msg.content.trim().length > 0); // Filter empty messages

    // Claude requires alternating user/assistant messages
    // Merge consecutive same-role messages
    const merged: { role: "user" | "assistant"; content: string }[] = [];

    for (const msg of filtered) {
      const role: "user" | "assistant" = msg.role === "assistant" ? "assistant" : "user";

      if (merged.length === 0) {
        merged.push({ role, content: msg.content });
      } else if (merged[merged.length - 1].role === role) {
        // Same role - merge content
        merged[merged.length - 1].content += '\n\n' + msg.content;
      } else {
        merged.push({ role, content: msg.content });
      }
    }

    // Claude requires first message to be from user
    if (merged.length > 0 && merged[0].role === 'assistant') {
      merged.shift(); // Remove leading assistant message
    }

    console.log('[Bedrock] Formatted messages:', merged.length, 'from', filtered.length);
    return merged;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { config, messages, systemPrompt } = request;
    const region = this.getRegion(config);
    const modelId = config.model;

    // Debug logging (dev only, never log API keys)
    if (import.meta.env.DEV) {
      console.log('[Bedrock] Region:', region, '| Model:', modelId, '| Messages:', messages.length);
    }

    // Build request body for Anthropic Claude models
    const requestBody = {
      messages: this.formatMessages(messages),
      max_tokens: 4096,
      temperature: 0.7,
      anthropic_version: 'bedrock-2023-05-31',
      ...(systemPrompt && { system: systemPrompt }),
    };

    const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Bedrock] ERROR Response:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid API key - Authentication failed');
        } else if (response.status === 403) {
          throw new Error(`Access denied - Request model access in AWS Console for: ${modelId}`);
        } else if (response.status === 404) {
          throw new Error(`Model not found or not available in region: ${region}`);
        } else {
          throw new Error(`Bedrock Error (${response.status}): ${errorText}`);
        }
      }

      const json = await response.json();

      // Parse Claude response
      const responseText = json.content?.[0]?.text || '';

      return {
        content: responseText,
        model: modelId,
        usage: {
          promptTokens: json.usage?.input_tokens || 0,
          completionTokens: json.usage?.output_tokens || 0,
          totalTokens: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
        },
      };
    } catch (error) {
      // Don't log the API key!
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Bedrock API request failed');
    }
  }

  async *streamMessage(request: AIRequest): AsyncGenerator<StreamChunk> {
    const { config, messages, systemPrompt } = request;
    const region = this.getRegion(config);
    const modelId = config.model;

    // Debug logging (dev only, never log API keys)
    if (import.meta.env.DEV) {
      console.log('[Bedrock] Stream | Region:', region, '| Model:', modelId);
    }

    // Build request body for Anthropic Claude models
    const requestBody = {
      messages: this.formatMessages(messages),
      max_tokens: 4096,
      temperature: 0.7,
      anthropic_version: 'bedrock-2023-05-31',
      ...(systemPrompt && { system: systemPrompt }),
    };

    // Streaming endpoint
    const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke-with-response-stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Bedrock] STREAM ERROR Response:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid API key - Authentication failed');
        } else if (response.status === 403) {
          throw new Error(`Access denied - Request model access in AWS Console for: ${modelId}`);
        } else if (response.status === 404) {
          throw new Error(`Model not found or not available in region: ${region}`);
        } else {
          throw new Error(`Bedrock Error (${response.status}): ${errorText}`);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = new Uint8Array(0);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append to buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;

        // Try to parse Amazon EventStream messages
        // Each message has: prelude (8 bytes) + headers + payload + message CRC (4 bytes)
        while (buffer.length >= 16) {
          // Read total length from first 4 bytes (big-endian)
          const totalLen = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];

          if (buffer.length < totalLen) {
            // Not enough data yet
            break;
          }

          // Extract message
          const message = buffer.slice(0, totalLen);
          buffer = buffer.slice(totalLen);

          // Skip prelude (8 bytes) and find headers length
          const headersLen = (message[4] << 24) | (message[5] << 16) | (message[6] << 8) | message[7];

          // Payload starts after prelude (8) + prelude CRC (4) + headers (headersLen)
          const payloadStart = 12 + headersLen;
          const payloadEnd = totalLen - 4; // Exclude message CRC

          if (payloadEnd > payloadStart) {
            const payload = message.slice(payloadStart, payloadEnd);
            const payloadStr = decoder.decode(payload);

            try {
              const data = JSON.parse(payloadStr);

              // Handle different event types
              if (data.type === 'content_block_delta' && data.delta?.text) {
                yield { content: data.delta.text, done: false };
              } else if (data.type === 'message_delta') {
                // Final message with stop reason
                yield { content: '', done: true };
              } else if (data.bytes) {
                // Base64 encoded chunk (alternative format)
                const decodedBytes = atob(data.bytes);
                const chunkData = JSON.parse(decodedBytes);
                if (chunkData.type === 'content_block_delta' && chunkData.delta?.text) {
                  yield { content: chunkData.delta.text, done: false };
                }
              }
            } catch {
              // Might be partial JSON, skip
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Bedrock streaming failed');
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    return apiKey.trim().length > 0;
  }

  /**
   * Fetch available models from Bedrock
   * Endpoint: bedrock.{region}.amazonaws.com/foundation-models
   */
  async fetchAvailableModels(apiKey: string, region: string = 'us-east-1'): Promise<{ id: string; name: string; provider: string }[]> {
    const url = `https://bedrock.${region}.amazonaws.com/foundation-models`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();

      // Parse the response
      return (data.modelSummaries || []).map((model: { modelId: string; modelName: string; providerName: string }) => ({
        id: model.modelId,
        name: model.modelName,
        provider: model.providerName,
      }));
    } catch {
      return [];
    }
  }
}

export const bedrockAdapter = new BedrockAdapter();
