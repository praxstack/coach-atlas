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

  private formatMessages(messages: Message[]) {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }));
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { config, messages, systemPrompt } = request;
    const region = this.getRegion(config);
    const modelId = config.model;

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
