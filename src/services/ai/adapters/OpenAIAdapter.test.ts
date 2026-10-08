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

  describe("reasoning model request shape (COA-034)", () => {
    const msgs = [{ id: "1", role: "user", content: "hi" }] as unknown as Message[];

    it("uses max_completion_tokens and developer role for o3/gpt-5", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "x" } }] }),
      });
      await adapter.sendMessage({
        messages: msgs,
        config: { provider: "openai", apiKey: "k", model: "gpt-5" },
        systemPrompt: "sys",
        maxTokens: 100,
      } as AIRequest);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_completion_tokens).toBe(100);
      expect(body.max_tokens).toBeUndefined();
      expect(body.messages[0].role).toBe("developer");
    });

    it("keeps max_tokens and system role for gpt-4o", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "x" } }] }),
      });
      await adapter.sendMessage({
        messages: msgs,
        config: { provider: "openai", apiKey: "k", model: "gpt-4o" },
        systemPrompt: "sys",
        maxTokens: 100,
      } as AIRequest);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(100);
      expect(body.messages[0].role).toBe("system");
    });

    it("folds the system prompt into the first user turn for o1-mini", () => {
      const out = adapter.formatMessages(msgs, "sys", "o1-mini");
      expect(out).toHaveLength(1);
      expect(out[0]).toEqual({ role: "user", content: "sys\n\nhi" });
    });
  });
  describe("reasoning model token budget (review minor-3)", () => {
    const msgs = [{ id: "1", role: "user", content: "hi" }] as unknown as Message[];

    function sseBody(events: unknown[]) {
      const enc = new TextEncoder();
      const chunks = events.map((e) => enc.encode(`data: ${JSON.stringify(e)}\n`));
      chunks.push(enc.encode("data: [DONE]\n"));
      let i = 0;
      return {
        getReader: () => ({
          read: async () =>
            i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined },
          releaseLock: () => {},
        }),
      };
    }

    async function drain(gen: AsyncGenerator<{ content: string; done: boolean }>) {
      let text = "";
      for await (const c of gen) text += c.content;
      return text;
    }

    it("defaults to a 25k completion budget for reasoning models, 4096 otherwise", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "x" }, finish_reason: "stop" }] }),
      });
      await adapter.sendMessage({
        messages: msgs,
        config: { provider: "openai", apiKey: "k", model: "gpt-5" },
      } as AIRequest);
      await adapter.sendMessage({
        messages: msgs,
        config: { provider: "openai", apiKey: "k", model: "gpt-4o" },
      } as AIRequest);
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).max_completion_tokens).toBe(25000);
      expect(JSON.parse(mockFetch.mock.calls[1][1].body).max_tokens).toBe(4096);
    });

    it("streaming request for o3 uses max_completion_tokens and the developer role", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: sseBody([{ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] }]),
      });
      const text = await drain(
        adapter.streamMessage({
          messages: msgs,
          config: { provider: "openai", apiKey: "k", model: "o3-mini" },
          systemPrompt: "sys",
        } as AIRequest)
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(text).toBe("ok");
      expect(body.max_completion_tokens).toBe(25000);
      expect(body.max_tokens).toBeUndefined();
      expect(body.messages[0].role).toBe("developer");
    });

    it("throws instead of returning empty text when sendMessage stops on length", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "" }, finish_reason: "length" }] }),
      });
      await expect(
        adapter.sendMessage({
          messages: msgs,
          config: { provider: "openai", apiKey: "k", model: "gpt-5" },
        } as AIRequest)
      ).rejects.toThrow(/finish_reason "length"/);
    });

    it("throws instead of yielding nothing when a stream stops on length", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: sseBody([
          { choices: [{ delta: { role: "assistant", content: "" } }] },
          { choices: [{ delta: {}, finish_reason: "length" }] },
        ]),
      });
      await expect(
        drain(
          adapter.streamMessage({
            messages: msgs,
            config: { provider: "openai", apiKey: "k", model: "o3-mini" },
          } as AIRequest)
        )
      ).rejects.toThrow(/finish_reason "length"/);
    });
  });
});
