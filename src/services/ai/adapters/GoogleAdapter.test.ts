import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIRequest, Message, ProviderConfig } from "../../types";
import { GoogleAdapter } from "./GoogleAdapter";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GoogleAdapter", () => {
  let adapter: GoogleAdapter;

  beforeEach(() => {
    adapter = new GoogleAdapter();
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
        json: () => Promise.resolve({ models: [] }),
      });

      const isValid = await adapter.validateApiKey("valid-api-key");
      expect(isValid).toBe(true);
    });

    it("should return false for invalid key (400/403)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const isValid = await adapter.validateApiKey("invalid-key");
      expect(isValid).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const isValid = await adapter.validateApiKey("api-key");
      expect(isValid).toBe(false);
    });
  });

  describe("sendMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "google",
      model: "gemini-1.5-pro",
      apiKey: "test-api-key",
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
            candidates: [
              {
                content: {
                  parts: [{ text: "Hello! How can I help?" }],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 20,
              totalTokenCount: 30,
            },
          }),
      });

      const response = await adapter.sendMessage(mockRequest);

      expect(response.content).toBe("Hello! How can I help?");
      expect(response.usage?.totalTokens).toBe(30);
    });

    it("should throw on 400/403 error (invalid key)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Invalid API key"),
        json: () => Promise.reject(new Error("JSON error")),
      });

      await expect(adapter.sendMessage(mockRequest)).rejects.toThrow();
    });

    it("should construct correct URL with API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: "Response" }],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 5,
              totalTokenCount: 10,
            },
          }),
      });

      await adapter.sendMessage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("key=test-api-key"),
        expect.any(Object)
      );
    });
  });

  describe("streamMessage", () => {
    const mockConfig: ProviderConfig = {
      provider: "google",
      model: "gemini-1.5-pro",
      apiKey: "test-api-key",
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
