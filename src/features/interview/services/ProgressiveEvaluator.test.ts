import { describe, expect, it, vi } from "vitest";
import type { AIService } from "@/services/ai/AIService";
import type { AIRequest, AIResponse, ProviderConfig } from "@/services/types";
import type { InterviewProblem } from "@/services/types/interview";
import { ProgressiveEvaluator } from "./ProgressiveEvaluator";

const config: ProviderConfig = { provider: "openai", apiKey: "k", model: "gpt-4o" };
const problem = {
  id: "p1",
  title: "Two Sum",
  description: "Find two numbers.",
  difficulty: "easy",
  topics: ["arrays"],
} as unknown as InterviewProblem;

const MICRO = JSON.stringify({
  observations: [{ type: "strength", dimension: "coding", content: "good", confidence: 0.9 }],
  scoreDeltas: { coding: 0.5 },
  updatedSummary: "summary",
});
const FINAL = JSON.stringify({ overallScore: 4, dimensions: {}, feedback: {} });

const isMicro = (r: AIRequest) => r.messages[0].content.startsWith("You are an expert technical interviewer");

function deferredAI() {
  const pending: Array<() => void> = [];
  const sendMessage = vi.fn((req: AIRequest): Promise<AIResponse> => {
    const content = isMicro(req) ? MICRO : FINAL;
    return new Promise((resolve) => pending.push(() => resolve({ content, model: "m" })));
  });
  const flush = async () => {
    for (let i = 0; i < 20; i++) {
      while (pending.length) pending.shift()!();
      await new Promise((r) => setTimeout(r, 0));
    }
  };
  return { ai: { sendMessage } as unknown as AIService, sendMessage, flush };
}

describe("ProgressiveEvaluator final synthesis", () => {
  it("waits for an in-flight background micro-evaluation instead of evaluating the same exchanges twice", async () => {
    const { ai, sendMessage, flush } = deferredAI();
    const evaluator = new ProgressiveEvaluator(ai, config, problem);

    await evaluator.onMessageExchange("u0", "a0");
    await evaluator.onMessageExchange("u1", "a1"); // starts the background micro-eval (pending)
    expect(sendMessage.mock.calls.filter(([r]) => isMicro(r))).toHaveLength(1);

    const report = evaluator.synthesizeFinalReport();
    await flush();
    await report;

    expect(sendMessage.mock.calls.filter(([r]) => isMicro(r))).toHaveLength(1);
    expect(evaluator.getState().scores.coding).toBe(3.5);
    expect(evaluator.getObservations()).toHaveLength(1);
  });

  it("stops without sending more requests once the caller aborts", async () => {
    const { ai, sendMessage, flush } = deferredAI();
    const evaluator = new ProgressiveEvaluator(ai, config, problem);
    await evaluator.onMessageExchange("u0", "a0");

    const controller = new AbortController();
    const report = evaluator.synthesizeFinalReport(controller.signal);
    await new Promise((r) => setTimeout(r, 0));
    // The remaining micro-eval was sent with the caller's signal.
    expect(sendMessage.mock.calls[0][0].signal).toBe(controller.signal);

    controller.abort();
    const settled = report.then(
      () => "resolved",
      (e: Error) => e.name
    );
    await flush();

    expect(await settled).toBe("AbortError");
    expect(sendMessage.mock.calls.filter(([r]) => !isMicro(r))).toHaveLength(0);
  });

  it("aborting the final synthesis also aborts background micro-evaluation", async () => {
    const { ai, sendMessage, flush } = deferredAI();
    const evaluator = new ProgressiveEvaluator(ai, config, problem);
    await evaluator.onMessageExchange("u0", "a0");
    await evaluator.onMessageExchange("u1", "a1"); // background micro-eval in flight
    const background = sendMessage.mock.calls[0][0].signal;
    expect(background?.aborted).toBe(false);

    const controller = new AbortController();
    const report = evaluator.synthesizeFinalReport(controller.signal).catch((e: Error) => e.name);
    controller.abort();
    expect(background?.aborted).toBe(true);
    await flush();

    expect(await report).toBe("AbortError");
    expect(sendMessage.mock.calls.filter(([r]) => !isMicro(r))).toHaveLength(0);
  });
});
