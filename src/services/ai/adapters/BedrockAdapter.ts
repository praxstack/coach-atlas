import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { AIRequest, AIResponse, IAIService, Message, StreamChunk } from "../../types";

export class BedrockAdapter implements IAIService {
  private getClient(apiKey: string): BedrockRuntimeClient {
    const parts = apiKey.split(":");
    // Supports 2 parts (AccessKey:SecretKey) or 3 parts (AccessKey:SecretKey:Region)
    if (parts.length < 2) {
      throw new Error("Invalid Bedrock API Key format. Expected 'AccessKey:SecretKey' or 'AccessKey:SecretKey:Region'");
    }
    const [accessKeyId, secretAccessKey, region] = parts;

    return new BedrockRuntimeClient({
      region: region || "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
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
    try {
       const parts = apiKey.split(":");
       return parts.length >= 2;
    } catch {
      return false;
    }
  }
}

export const bedrockAdapter = new BedrockAdapter();
