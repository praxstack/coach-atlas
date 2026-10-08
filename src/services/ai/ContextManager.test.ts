import { describe, expect, it } from "vitest";
import { getAvailableTokens, getContextLimit } from "./ContextManager";

describe("getContextLimit (COA-033)", () => {
  it("keeps exact table entries", () => {
    expect(getContextLimit("gpt-4")).toBe(8192);
    expect(getContextLimit("claude-3-5-haiku-20241022")).toBe(200000);
  });

  it.each([
    ["o1-preview", 128000],
    ["o1-mini", 128000],
    ["gpt-4o-2024-08-06", 128000],
    ["gpt-5.1", 128000],
    ["claude-sonnet-4-5-20250929", 200000],
    ["us.anthropic.claude-3-opus-20240229-v1:0", 200000],
    ["us.anthropic.claude-3-5-sonnet-20241022-v2:0", 200000],
    ["gemini-2.0-flash", 1000000],
    ["meta.llama3-1-405b-instruct-v1:0", 128000],
    ["amazon.titan-text-express-v1", 8192],
  ])("resolves %s", (model, limit) => {
    expect(getContextLimit(model)).toBe(limit);
  });

  it("falls back to a non-crippling default for unknown ids", () => {
    expect(getContextLimit("some-new-model")).toBeGreaterThanOrEqual(32000);
  });
});

describe("getAvailableTokens (review minor-3)", () => {
  it("reserves the reasoning completion budget for reasoning models", () => {
    expect(getAvailableTokens("o1-mini")).toBe(128000 - 25000 - 500);
    expect(getAvailableTokens("gpt-4o")).toBe(128000 - 4096 - 500);
  });
});
