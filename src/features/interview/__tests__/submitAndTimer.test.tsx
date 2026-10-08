import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { createElement } from "react";
import { InterviewProvider, useInterview } from "../context/InterviewContext";
import { computeRemainingMs } from "../context/interviewReducer";
import { useEvaluateOnSubmit } from "../hooks/useEvaluateOnSubmit";
import type { InterviewSession } from "@/services/types/interview";

function makeSession(startTime: number, durationMinutes = 1): InterviewSession {
  return {
    id: "s1",
    type: "coding",
    status: "active",
    startTime,
    totalPausedTime: 0,
    durationMinutes,
    problems: [],
    currentProblemIndex: 0,
    hintsUsedPerProblem: [0],
    pauseCount: 0,
    chatMessageIds: [],
    createdAt: startTime,
    updatedAt: startTime,
  } as unknown as InterviewSession;
}

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(InterviewProvider, null, children);

describe("COA-024 evaluate on submitted", () => {
  it("runs evaluate once when status becomes submitted, not before", () => {
    const evaluate = vi.fn();
    const { rerender } = renderHook(({ s }) => useEvaluateOnSubmit(s, evaluate), {
      initialProps: { s: "active" },
    });
    expect(evaluate).not.toHaveBeenCalled();
    rerender({ s: "submitted" });
    rerender({ s: "submitted" });
    expect(evaluate).toHaveBeenCalledTimes(1);
    rerender({ s: "review" });
    rerender({ s: "submitted" });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it("ignores a late evaluation after cancel", () => {
    const { result } = renderHook(() => useInterview(), { wrapper });
    act(() => result.current.confirmSetup(makeSession(Date.now(), 45)));
    act(() => result.current.submit());
    expect(result.current.status).toBe("submitted");
    act(() => result.current.cancel());
    act(() => result.current.setEvaluation({} as never));
    expect(result.current.status).toBe("idle");
  });
});

describe("COA-025 countdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("computeRemainingMs excludes paused time and clamps at 0", () => {
    const s = { ...makeSession(1000, 1), totalPausedTime: 10_000 };
    expect(computeRemainingMs(s, 1000 + 30_000)).toBe(40_000);
    expect(computeRemainingMs(s, 1000 + 999_000)).toBe(0);
  });

  it("ticks down and times out into submitted", () => {
    const { result } = renderHook(() => useInterview(), { wrapper });
    act(() => result.current.confirmSetup(makeSession(Date.now(), 1)));
    expect(result.current.status).toBe("active");
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.timer.remainingMs).toBeLessThanOrEqual(50_000);
    expect(result.current.timer.remainingMs).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.status).toBe("submitted");
  });
});

describe("NEXT_PROBLEM restarts the clock (review minor-1)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not time out immediately on the next problem", () => {
    const { result } = renderHook(() => useInterview(), { wrapper });
    act(() => result.current.confirmSetup(makeSession(Date.now(), 1)));
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(result.current.status).toBe("submitted");
    act(() => result.current.setEvaluation({} as never));
    expect(result.current.status).toBe("review");
    act(() => result.current.nextProblem({ id: "p2" } as never));
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current.status).toBe("active");
    expect(result.current.timer.remainingMs).toBeGreaterThan(55_000);
  });
});
