/**
 * Page-level wiring (review minor-5): render the real InterviewPage and prove
 * that both the Finish button and the countdown reaching zero run the final
 * evaluation and leave the "submitted" screen for the results screen.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewConfig, InterviewProblem, InterviewSession } from "@/services/types/interview";

const synthesizeFinalReport = vi.fn();
let sessionStartOffsetMs = 0;

// Stable service objects: the page reloads config whenever the service identity changes.
const services = vi.hoisted(() => ({
  ai: { streamChat: () => {} },
  storage: {
    loadProviderConfig: async () => ({ provider: "openai", apiKey: "test-key", model: "gpt-4o" }),
  },
}));

vi.mock("@/app/ServiceContext", () => ({
  useAIService: () => services.ai,
  useStorageService: () => services.storage,
}));

vi.mock("@/lib/markdown-viewer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock("../components/InterviewSetupModal", () => ({
  InterviewSetupModal: ({ onStart }: { onStart: (c: InterviewConfig) => void }) => (
    <button
      onClick={() =>
        onStart({ type: "coding", difficulty: "medium", durationMinutes: 1 } as unknown as InterviewConfig)
      }
    >
      Start test interview
    </button>
  ),
}));

vi.mock("../components/ProblemPanel", () => ({
  ProblemPanel: () => <div>problem</div>,
  ProblemPanelSkeleton: () => <div>loading problem</div>,
}));

vi.mock("../components/EvaluationCard", () => ({
  EvaluationCard: ({ evaluation }: { evaluation: { modelUsed: string } }) => (
    <div>evaluation from {evaluation.modelUsed}</div>
  ),
}));

vi.mock("../services/InterviewService", () => ({
  getInterviewService: () => ({
    generateProblem: async () =>
      ({ id: "p1", title: "Two Sum", difficulty: "easy", topics: ["arrays"] }) as unknown as InterviewProblem,
    createSession: (config: InterviewConfig, problems: InterviewProblem[]): InterviewSession => {
      const start = Date.now() - sessionStartOffsetMs;
      return {
        id: `interview-${start}`,
        type: config.type,
        status: "active",
        startTime: start,
        totalPausedTime: 0,
        durationMinutes: config.durationMinutes,
        problems,
        currentProblemIndex: 0,
        hintsUsedPerProblem: [0],
        pauseCount: 0,
        chatMessageIds: [],
        createdAt: start,
        updatedAt: start,
      } as unknown as InterviewSession;
    },
    generateEvaluation: vi.fn(),
  }),
}));

vi.mock("../services/ProgressiveEvaluator", () => ({
  createProgressiveEvaluator: () => ({
    getState: () => ({
      evaluationCount: 0,
      observations: [],
      scores: { problemSolving: 3, coding: 3, communication: 3, verification: 3, timeManagement: 3 },
    }),
    synthesizeFinalReport,
    onMessageExchange: vi.fn(async () => {}),
  }),
}));

import InterviewPage from "../InterviewPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <InterviewPage />
    </MemoryRouter>
  );
}

async function startInterview() {
  fireEvent.click(await screen.findByText("Start test interview"));
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
  sessionStartOffsetMs = 0;
  synthesizeFinalReport.mockReset();
  synthesizeFinalReport.mockResolvedValue({
    overallScore: 4,
    dimensions: { problemSolving: 4, coding: 4, communication: 4, verification: 4, timeManagement: 4 },
    feedback: { strengths: [], weaknesses: [], actionItems: [], followUpQuestions: [] },
    generatedAt: Date.now(),
    modelUsed: "test-model",
  });
});

afterEach(() => cleanup());

describe("InterviewPage runs the evaluation (COA-024/025 wiring)", () => {
  it("Finish evaluates once and shows the results", async () => {
    renderPage();
    await startInterview();

    fireEvent.click(await screen.findByText("Finish"));

    expect(await screen.findByText("evaluation from test-model")).toBeTruthy();
    expect(synthesizeFinalReport).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Evaluating Your Performance...")).toBeNull();
  });

  it("timer expiry evaluates once and shows the results", async () => {
    // The session started more than its 1-minute duration ago, so the first
    // countdown tick reaches zero and dispatches TIMEOUT.
    sessionStartOffsetMs = 61_000;
    renderPage();
    await startInterview();

    expect(await screen.findByText("evaluation from test-model")).toBeTruthy();
    await waitFor(() => expect(synthesizeFinalReport).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Finish")).toBeNull();
  });
});
