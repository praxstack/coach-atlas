import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIRequest, Message, ProviderConfig } from "../../types";
import { OpenAIAdapter } from "./OpenAIAdapter";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OpenAIAdapter", () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    adapter = new OpenAIAdapter();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should be defined", () => {
      expect(adapter).toBeDefined();
    });
  });

  describe("validateApiKey", () => {
    it("should return true for valid key format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const isValid = await adapter.validateApiKey("sk-test-key");
      expect(isValid).toBe(true);
    });

    it("should return false for invalid key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const isValid = await adapter.validateApiKey("invalid-key");
      expect(isValid).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const isValid = await adapter.validateApiKey("sk-test-key");
      expect(isValid).toBe(false);
    });
  });

  describe("sendMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test-key",
    };

    const mockMessages: Message[] = [
      {
        id: "1",
        conversationId: "conv-1",
        role: "user",
        content: "Hello",
        timestamp: Date.now(),
      },
    ];

    const mockRequest: AIRequest = {
      messages: mockMessages,
      config: mockConfig,
      systemPrompt: "You are a helpful assistant",
    };

    it("should send message and return response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "Hello! How can I help?" } }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
          }),
      });

      const response = await adapter.sendMessage(mockRequest);

      expect(response.content).toBe("Hello! How can I help?");
      expect(response.usage?.totalTokens).toBe(30);
    });

    it("should throw on 401 error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
        json: () => Promise.reject(new Error("JSON parse error")),
      });

      await expect(adapter.sendMessage(mockRequest)).rejects.toThrow();
    });

    it("should throw on 429 rate limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limited"),
        json: () => Promise.reject(new Error("JSON parse error")),
      });

      await expect(adapter.sendMessage(mockRequest)).rejects.toThrow();
    });
  });

  describe("streamMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test-key",
    };

    const mockMessages: Message[] = [
      {
        id: "1",
        conversationId: "conv-1",
        role: "user",
        content: "Hello",
        timestamp: Date.now(),
      },
    ];

    const mockRequest: AIRequest = {
      messages: mockMessages,
      config: mockConfig,
    };

    it("should throw on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      });

      const generator = adapter.streamMessage(mockRequest);

      await expect(generator.next()).rejects.toThrow();
    });
  });
});
