/**
 * Every adapter's sendMessage must hand the caller's AbortSignal to fetch, so
 * cancelling an interview evaluation stops the provider request.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AIRequest, ProviderConfig, ProviderId } from "../../types";
import { AnthropicAdapter } from "./AnthropicAdapter";
import { BedrockAdapter } from "./BedrockAdapter";
import { GoogleAdapter } from "./GoogleAdapter";
import { OpenAIAdapter } from "./OpenAIAdapter";

function request(provider: ProviderId, model: string, signal: AbortSignal): AIRequest {
  const config: ProviderConfig = { provider, model, apiKey: "test-key", region: "us-east-1" };
  return {
    messages: [{ id: "1", conversationId: "c", role: "user", content: "hi", timestamp: 0 }],
    config,
    signal,
  };
}

function captureFetchSignal(): () => AbortSignal | undefined {
  let seen: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      seen = init?.signal ?? undefined;
      throw new Error("stop");
    })
  );
  return () => seen;
}

afterEach(() => vi.unstubAllGlobals());

describe("sendMessage forwards the abort signal", () => {
  it.each([
    ["openai", new OpenAIAdapter(), "gpt-4o"],
    ["anthropic", new AnthropicAdapter(), "claude-3-5-sonnet-20241022"],
    ["google", new GoogleAdapter(), "gemini-1.5-pro"],
  ] as const)("%s", async (provider, adapter, model) => {
    const seen = captureFetchSignal();
    const controller = new AbortController();
    await adapter.sendMessage(request(provider, model, controller.signal)).catch(() => {});
    expect(seen()).toBe(controller.signal);
  });

  it("bedrock links the caller's signal to its timeout controller", async () => {
    const seen = captureFetchSignal();
    const controller = new AbortController();
    await new BedrockAdapter()
      .sendMessage(request("bedrock", "anthropic.claude-3-haiku-20240307-v1:0", controller.signal))
      .catch(() => {});
    expect(seen()?.aborted).toBe(false);
    controller.abort();
    expect(seen()?.aborted).toBe(true);
  });
});
