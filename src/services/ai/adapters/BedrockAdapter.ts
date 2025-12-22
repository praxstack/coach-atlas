import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { AIRequest, AIResponse, IAIService, Message, StreamChunk } from "../../types";

export class BedrockAdapter implements IAIService {
  private getClient(apiKey: string): BedrockRuntimeClient {
    // Try to decode Bedrock API Key format (base64 encoded credentials)
    // Format: base64(BedrockAPIKey-{region}-{timestamp}:{accessKeyId}:{secretAccessKey})
    try {
      const decoded = atob(apiKey);

      // Check if it's a Bedrock API Key format
      if (decoded.startsWith('BedrockAPIKey-')) {
        // Format: BedrockAPIKey-{region}-{timestamp}:{accessKeyId}:{secretAccessKey}
        const parts = decoded.split(':');
        if (parts.length >= 3) {
          const headerParts = parts[0].split('-');
          const region = headerParts[1] || 'us-east-1';
          const accessKeyId = parts[1];
          const secretAccessKey = parts.slice(2).join(':'); // Handle colons in secret

          return new BedrockRuntimeClient({
            region,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          });
        }
      }

      // Fallback: Try simple AccessKey:SecretKey:Region format
      const simpleParts = apiKey.split(':');
      if (simpleParts.length >= 2) {
        const [accessKeyId, secretAccessKey, region] = simpleParts;
        return new BedrockRuntimeClient({
          region: region || 'us-east-1',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      }
    } catch {
      // Not base64 encoded, treat as region for environment credentials
    }

    // Fallback: Use as region with environment credentials
    return new BedrockRuntimeClient({
      region: apiKey || "us-east-1",
    });
  }

  private formatMessages(messages: Message[], systemPrompt?: string) {
    // Bedrock Claude Messages API format
    // System prompt is top-level (if model supports it) or prepended
    // For Claude 3, it's a top-level parameter, but here we construct the body manually.

    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: [{ type: "text", text: msg.content }]
    }));

    return formattedMessages;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    const { config, messages, systemPrompt } = request;
    const client = this.getClient(config.apiKey);

    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: systemPrompt ? [{ type: "text", text: systemPrompt }] : undefined,
      messages: this.formatMessages(messages),
    };

    const command = new InvokeModelCommand({
      modelId: config.model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    });

    try {
      const response = await client.send(command);
      const responseBody = new TextDecoder().decode(response.body);
      const json = JSON.parse(responseBody);

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
    const client = this.getClient(config.apiKey);

    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: systemPrompt ? [{ type: "text", text: systemPrompt }] : undefined,
      messages: this.formatMessages(messages),
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: config.model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    });

    try {
      const response = await client.send(command);

      if (!response.body) return;

      for await (const chunk of response.body) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const decode = new TextDecoder().decode(chunk.chunk.bytes);
          const json = JSON.parse(decode);

          if (json.type === "content_block_delta" && json.delta?.text) {
            yield { content: json.delta.text, done: false };
          }

          if (json.type === "message_stop") {
             yield { content: "", done: true };
          }
        }
      }
    } catch (error) {
      console.error("Bedrock Stream Error:", error);
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    // apiKey is just the region - any non-empty string is valid
    return apiKey.trim().length > 0;
  }
}

export const bedrockAdapter = new BedrockAdapter();
