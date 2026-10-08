/**
 * Interview state machine (pure): actions, state, reducer, and clock helpers.
 * Kept out of InterviewContext.tsx so that file only exports components/hooks
 * (react-refresh/only-export-components).
 *
 * States: idle → setup → active ⇄ paused → submitted → review
 */
import type {
  EvaluationReport,
  InterviewConfig,
  InterviewProblem,
  InterviewSession,
  InterviewStatus,
} from "@/services/types/interview";
import { INTERVIEW_CONSTANTS } from "@/services/types/interview";

// ============================================
// Action Types
// ============================================

export type InterviewAction =
  | { type: "START_SETUP"; config: InterviewConfig }
  | { type: "CONFIRM_SETUP"; session: InterviewSession }
  | { type: "CANCEL" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; remainingMs: number }
  | { type: "USE_HINT" }
  | { type: "TIMEOUT" }
  | { type: "SUBMIT" }
  | { type: "SET_EVALUATION"; evaluation: EvaluationReport }
  | { type: "NEXT_PROBLEM"; problem: InterviewProblem }
  | { type: "RESTORE_SESSION"; session: InterviewSession }
  | { type: "ADD_MESSAGE_ID"; messageId: string };

// ============================================
// State Type
// ============================================

export interface InterviewState {
  status: InterviewStatus;
  session: InterviewSession | null;
  config: InterviewConfig | null;
  remainingMs: number; // milliseconds remaining
  error: string | null;
}

export const initialState: InterviewState = {
  status: "idle",
  session: null,
  config: null,
  remainingMs: 0,
  error: null,
};

/** Remaining time derived from wall-clock, excluding accumulated pauses. */
export function computeRemainingMs(
  session: Pick<InterviewSession, "startTime" | "totalPausedTime" | "durationMinutes">,
  now: number
): number {
  const elapsed = now - session.startTime - session.totalPausedTime;
  return Math.max(0, session.durationMinutes * 60 * 1000 - elapsed);
}

// ============================================
// Reducer
// ============================================

export function interviewReducer(
  state: InterviewState,
  action: InterviewAction
): InterviewState {
  switch (action.type) {
    case "START_SETUP":
      return {
        ...state,
        status: "setup",
        config: action.config,
        error: null,
      };

    case "CONFIRM_SETUP":
      return {
        ...state,
        status: "active",
        session: action.session,
        remainingMs: action.session.durationMinutes * 60 * 1000,
      };

    case "CANCEL":
      return initialState;

    case "PAUSE":
      if (
        state.status !== "active" ||
        !state.session ||
        state.session.pauseCount >= INTERVIEW_CONSTANTS.MAX_PAUSES
      ) {
        return state;
      }
      return {
        ...state,
        status: "paused",
        session: {
          ...state.session,
          status: "paused",
          pausedAt: Date.now(),
          pauseCount: state.session.pauseCount + 1,
          updatedAt: Date.now(),
        },
      };

    case "RESUME":
      if (state.status !== "paused" || !state.session) {
        return state;
      }
      const pausedDuration = state.session.pausedAt
        ? Date.now() - state.session.pausedAt
        : 0;
      return {
        ...state,
        status: "active",
        session: {
          ...state.session,
          status: "active",
          pausedAt: undefined,
          totalPausedTime: state.session.totalPausedTime + pausedDuration,
          updatedAt: Date.now(),
        },
      };

    case "TICK":
      if (state.status !== "active") {
        return state;
      }
      return {
        ...state,
        remainingMs: action.remainingMs,
      };

    case "USE_HINT":
      if (!state.session) return state;
      const problemIndex = state.session.currentProblemIndex;
      const newHintsUsed = [...state.session.hintsUsedPerProblem];
      newHintsUsed[problemIndex] = (newHintsUsed[problemIndex] || 0) + 1;
      return {
        ...state,
        session: {
          ...state.session,
          hintsUsedPerProblem: newHintsUsed,
          updatedAt: Date.now(),
        },
      };

    case "TIMEOUT":
    case "SUBMIT":
      if (state.status !== "active" && state.status !== "paused") {
        return state;
      }
      return {
        ...state,
        status: "submitted",
        session: state.session
          ? {
              ...state.session,
              status: "submitted",
              updatedAt: Date.now(),
            }
          : null,
      };

    case "SET_EVALUATION":
      // Ignore late results (e.g. evaluation finished after Cancel)
      if (state.status !== "submitted") {
        return state;
      }
      return {
        ...state,
        status: "review",
        session: state.session
          ? {
              ...state.session,
              status: "review",
              evaluation: action.evaluation,
              updatedAt: Date.now(),
            }
          : null,
      };

    case "NEXT_PROBLEM":
      if (!state.session) return state;
      return {
        ...state,
        status: "active",
        remainingMs: state.session.durationMinutes * 60 * 1000,
        session: {
          ...state.session,
          status: "active",
          currentProblemIndex: state.session.currentProblemIndex + 1,
          problems: [...state.session.problems, action.problem],
          evaluation: undefined,
          updatedAt: Date.now(),
        },
      };

    case "RESTORE_SESSION": {
      const elapsed = Date.now() - action.session.startTime - action.session.totalPausedTime;
      const remaining = Math.max(0, action.session.durationMinutes * 60 * 1000 - elapsed);
      return {
        ...state,
        status: action.session.status,
        session: action.session,
        remainingMs: remaining,
      };
    }

    case "ADD_MESSAGE_ID":
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          chatMessageIds: [...state.session.chatMessageIds, action.messageId],
          updatedAt: Date.now(),
        },
      };

    default:
      return state;
  }
}
