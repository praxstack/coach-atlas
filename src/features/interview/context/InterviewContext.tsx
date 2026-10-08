/**
 * Interview Mode Context
 *
 * Provides global state management for interview sessions using a reducer pattern.
 * Implements the formal state machine from the design doc.
 *
 * States: idle → setup → active ⇄ paused → submitted → review
 */
import type {
  EvaluationReport,
  InterviewConfig,
  InterviewProblem,
  InterviewSession,
  InterviewStatus,
  TimerState,
} from "@/services/types/interview";
import { INTERVIEW_CONSTANTS } from "@/services/types/interview";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

// ============================================
// Action Types
// ============================================

type InterviewAction =
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

interface InterviewState {
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

// ============================================
// Timer Helpers
// ============================================

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getUrgency(ms: number): TimerState["urgency"] {
  if (ms <= INTERVIEW_CONSTANTS.CRITICAL_THRESHOLD_MS) return "critical";
  if (ms <= INTERVIEW_CONSTANTS.WARNING_THRESHOLD_MS) return "warning";
  return "normal";
}

// ============================================
// Context Type
// ============================================

interface InterviewContextValue {
  // State
  status: InterviewStatus;
  session: InterviewSession | null;
  timer: TimerState;
  currentProblem: InterviewProblem | null;

  // Computed
  isInterviewActive: boolean;
  canPause: boolean;
  canRequestHint: boolean;
  hintsRemaining: number;
  pausesRemaining: number;

  // Actions
  startSetup: (config: InterviewConfig) => void;
  confirmSetup: (session: InterviewSession) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  submit: () => void;
  timeout: () => void;
  useHint: () => void;
  setEvaluation: (evaluation: EvaluationReport) => void;
  nextProblem: (problem: InterviewProblem) => void;
  restoreSession: (session: InterviewSession) => void;
  addMessageId: (messageId: string) => void;
  updateRemainingMs: (ms: number) => void;
}

const InterviewContext = createContext<InterviewContextValue | null>(null);

// ============================================
// Provider Component
// ============================================

interface InterviewProviderProps {
  children: ReactNode;
}

export function InterviewProvider({ children }: InterviewProviderProps) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  // ========== Computed Values ==========
  const currentProblem = useMemo(() => {
    if (!state.session || state.session.problems.length === 0) {
      return null;
    }
    return state.session.problems[state.session.currentProblemIndex] || null;
  }, [state.session]);

  const timer: TimerState = useMemo(() => ({
    remainingMs: state.remainingMs,
    isRunning: state.status === "active",
    isExpired: state.remainingMs <= 0 && state.status === "active",
    display: formatTime(state.remainingMs),
    urgency: getUrgency(state.remainingMs),
  }), [state.remainingMs, state.status]);

  const isInterviewActive = state.status === "active";

  const canPause =
    state.status === "active" &&
    (state.session?.pauseCount || 0) < INTERVIEW_CONSTANTS.MAX_PAUSES;

  const hintsUsedCount =
    state.session?.hintsUsedPerProblem[state.session.currentProblemIndex] || 0;
  const hintsRemaining = INTERVIEW_CONSTANTS.MAX_HINTS_PER_PROBLEM - hintsUsedCount;
  const canRequestHint = isInterviewActive && hintsRemaining > 0;

  const pausesRemaining =
    INTERVIEW_CONSTANTS.MAX_PAUSES - (state.session?.pauseCount || 0);

  // ========== Actions ==========
  const startSetup = useCallback((config: InterviewConfig) => {
    dispatch({ type: "START_SETUP", config });
  }, []);

  const confirmSetup = useCallback((session: InterviewSession) => {
    dispatch({ type: "CONFIRM_SETUP", session });
  }, []);

  const cancel = useCallback(() => {
    dispatch({ type: "CANCEL" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: "RESUME" });
  }, []);

  const submit = useCallback(() => {
    dispatch({ type: "SUBMIT" });
  }, []);

  const timeout = useCallback(() => {
    dispatch({ type: "TIMEOUT" });
  }, []);

  const useHint = useCallback(() => {
    dispatch({ type: "USE_HINT" });
  }, []);

  const setEvaluation = useCallback((evaluation: EvaluationReport) => {
    dispatch({ type: "SET_EVALUATION", evaluation });
  }, []);

  const nextProblem = useCallback((problem: InterviewProblem) => {
    dispatch({ type: "NEXT_PROBLEM", problem });
  }, []);

  const restoreSession = useCallback((session: InterviewSession) => {
    dispatch({ type: "RESTORE_SESSION", session });
  }, []);

  const addMessageId = useCallback((messageId: string) => {
    dispatch({ type: "ADD_MESSAGE_ID", messageId });
  }, []);

  const updateRemainingMs = useCallback((ms: number) => {
    dispatch({ type: "TICK", remainingMs: ms });
  }, []);

  // ========== Countdown: drive TICK while active, TIMEOUT at zero ==========
  const activeSession = state.session;
  useEffect(() => {
    if (state.status !== "active" || !activeSession) return;
    const tick = () => {
      const remaining = computeRemainingMs(activeSession, Date.now());
      dispatch({ type: "TICK", remainingMs: remaining });
      if (remaining <= 0) {
        dispatch({ type: "TIMEOUT" });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.status, activeSession]);

  // ========== Auto-resume from pause timeout ==========
  useEffect(() => {
    if (state.status !== "paused" || !state.session?.pausedAt) {
      return;
    }

    const pauseStart = state.session.pausedAt;
    const checkPauseTimeout = setInterval(() => {
      const elapsed = Date.now() - pauseStart;
      if (elapsed >= INTERVIEW_CONSTANTS.MAX_PAUSE_DURATION_MS) {
        resume();
      }
    }, 1000);

    return () => clearInterval(checkPauseTimeout);
  }, [state.status, state.session?.pausedAt, resume]);

  // ========== Context Value ==========
  const value: InterviewContextValue = useMemo(
    () => ({
      // State
      status: state.status,
      session: state.session,
      timer,
      currentProblem,

      // Computed
      isInterviewActive,
      canPause,
      canRequestHint,
      hintsRemaining,
      pausesRemaining,

      // Actions
      startSetup,
      confirmSetup,
      cancel,
      pause,
      resume,
      submit,
      timeout,
      useHint,
      setEvaluation,
      nextProblem,
      restoreSession,
      addMessageId,
      updateRemainingMs,
    }),
    [
      state.status,
      state.session,
      timer,
      currentProblem,
      isInterviewActive,
      canPause,
      canRequestHint,
      hintsRemaining,
      pausesRemaining,
      startSetup,
      confirmSetup,
      cancel,
      pause,
      resume,
      submit,
      timeout,
      useHint,
      setEvaluation,
      nextProblem,
      restoreSession,
      addMessageId,
      updateRemainingMs,
    ]
  );

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useInterview(): InterviewContextValue {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}

// ============================================
// Exports
// ============================================

export { InterviewContext };
export type { InterviewContextValue, InterviewState };
