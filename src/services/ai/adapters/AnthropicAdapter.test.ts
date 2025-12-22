import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIRequest, Message, ProviderConfig } from "../../types";
import { AnthropicAdapter } from "./AnthropicAdapter";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AnthropicAdapter", () => {
  let adapter: AnthropicAdapter;

  beforeEach(() => {
    adapter = new AnthropicAdapter();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should be defined", () => {
      expect(adapter).toBeDefined();
    });
  });

  describe("validateApiKey", () => {
    it("should return true for valid key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const isValid = await adapter.validateApiKey("sk-ant-test-key");
      expect(isValid).toBe(true);
    });

    it("should return false for invalid key (401)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const isValid = await adapter.validateApiKey("invalid-key");
      expect(isValid).toBe(false);
    });

    it("should return false on 400 (bad request)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const isValid = await adapter.validateApiKey("sk-ant-test-key");
      expect(isValid).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const isValid = await adapter.validateApiKey("sk-ant-test-key");
      expect(isValid).toBe(false);
    });
  });

  describe("sendMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      apiKey: "sk-ant-test-key",
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
            content: [{ text: "Hello! How can I help?" }],
            usage: {
              input_tokens: 10,
              output_tokens: 20,
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
        json: () => Promise.reject(new Error("JSON error")),
      });

      await expect(adapter.sendMessage(mockRequest)).rejects.toThrow();
    });

    it("should throw on 529 overloaded", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 529,
        text: () => Promise.resolve("Overloaded"),
        json: () => Promise.reject(new Error("JSON error")),
      });

      await expect(adapter.sendMessage(mockRequest)).rejects.toThrow();
    });

    it("should include x-api-key header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: "Response" }],
            usage: { input_tokens: 5, output_tokens: 5 },
          }),
      });

      await adapter.sendMessage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": "sk-ant-test-key",
          }),
        })
      );
    });
  });

  describe("streamMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      apiKey: "sk-ant-test-key",
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
