/**
 * Interview Mode Types
 * Defines the core data structures for the Interview Simulator
 *
 * @module InterviewTypes
 */

// ============================================================================
// STATUS & CONFIGURATION
// ============================================================================

/**
 * Finite State Machine states for Interview Mode
 * Valid transitions:
 * - IDLE -> SETUP (startInterview)
 * - SETUP -> ACTIVE (confirmSetup)
 * - ACTIVE -> PAUSED (pause)
 * - PAUSED -> ACTIVE (resume)
 * - ACTIVE -> SUBMITTED (timeout/finish)
 * - SUBMITTED -> REVIEW (evaluationComplete)
 * - REVIEW -> ACTIVE (nextProblem)
 * - REVIEW -> IDLE (endSession)
 */
export type InterviewStatus =
  | "idle"
  | "setup"
  | "active"
  | "paused"
  | "submitted"
  | "review";

export type InterviewType = "coding" | "system-design" | "behavioral";

export type Difficulty = "easy" | "medium" | "hard";

export interface InterviewConfig {
  type: InterviewType;
  topic: string;
  difficulty: Difficulty;
  durationMinutes: number;
  problemCount: number;
}

// ============================================================================
// PROBLEM DEFINITION
// ============================================================================

export interface CodeExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expected: string;
  hidden: boolean;
}

export interface InterviewProblem {
  id: string;
  title: string;
  description: string;
  examples: CodeExample[];
  constraints: string[];
  hints: string[]; // Progressive hints (index 0 = easiest)
  difficulty: Difficulty;
  topics: string[];
  testCases?: TestCase[];
  timeLimit?: number; // Minutes for this specific problem
}

// ============================================================================
// SESSION STATE
// ============================================================================

/**
 * Represents an active or completed interview session
 * This is persisted to IndexedDB for crash recovery
 */
export interface InterviewSession {
  id: string;
  type: InterviewType;
  status: InterviewStatus;

  // Timing
  startTime: number; // Unix timestamp when session started
  pausedAt?: number; // Timestamp when pause was triggered
  totalPausedTime: number; // Accumulated pause duration in ms
  durationMinutes: number;

  // Problems
  problems: InterviewProblem[];
  currentProblemIndex: number;

  // Progress tracking
  hintsUsedPerProblem: number[]; // hintsUsedPerProblem[0] = hints used on problem 0
  pauseCount: number; // Max 2 pauses per session

  // Chat history (message IDs for reconstruction)
  chatMessageIds: string[];

  // Results
  evaluation?: EvaluationReport;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// EVALUATION
// ============================================================================

export interface EvaluationDimensions {
  /** Problem-solving approach and algorithm choice (1-5) */
  problemSolving: number;
  /** Code quality, syntax, correctness (1-5) */
  coding: number;
  /** Clarity of explanation and questions (1-5) */
  communication: number;
  /** Testing and debugging approach (1-5) */
  verification: number;
  /** Pacing and prioritization (1-5) */
  timeManagement: number;
}

export interface EvaluationFeedback {
  strengths: string[];
  weaknesses: string[];
  actionItems: string[]; // Specific practice recommendations
  followUpQuestions: string[]; // Questions the interviewer would ask
}

export interface EvaluationComparison {
  /** e.g., "Top 30% of candidates" */
  percentile?: number;
  /** Similar problems to practice */
  similarProblems: string[];
}

/**
 * Structured interview evaluation following FAANG rubrics
 */
export interface EvaluationReport {
  /**
   * Overall hiring recommendation (1-5)
   * 1 = Strong No Hire
   * 2 = No Hire
   * 3 = Lean No Hire / Lean Hire
   * 4 = Hire
   * 5 = Strong Hire
   */
  overallScore: number;
  dimensions: EvaluationDimensions;
  feedback: EvaluationFeedback;
  comparison?: EvaluationComparison;

  // Problem-specific scores (if multi-problem session)
  problemScores?: {
    problemId: string;
    score: number;
    notes: string;
  }[];

  // Metadata
  generatedAt: number;
  modelUsed?: string;
}

// ============================================================================
// TIMER
// ============================================================================

export interface TimerState {
  /** Remaining time in milliseconds */
  remainingMs: number;
  /** Is timer currently running? */
  isRunning: boolean;
  /** Has timer expired? */
  isExpired: boolean;
  /** Formatted display string (e.g., "43:12") */
  display: string;
  /** Urgency level for UI styling */
  urgency: "normal" | "warning" | "critical";
}

// ============================================================================
// CONTEXT VALUE
// ============================================================================

export interface InterviewContextValue {
  // State
  session: InterviewSession | null;
  status: InterviewStatus;
  timer: TimerState;
  currentProblem: InterviewProblem | null;

  // Actions
  startInterview: (config: InterviewConfig) => Promise<void>;
  confirmSetup: (problems: InterviewProblem[]) => void;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => Promise<void>;
  submitForReview: () => Promise<EvaluationReport>;
  requestHint: () => string | null;
  nextProblem: () => Promise<void>;
  resetSession: () => void;

  // Utilities
  isInterviewActive: boolean;
  canPause: boolean;
  canRequestHint: boolean;
  hintsRemaining: number;
  pausesRemaining: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const INTERVIEW_CONSTANTS = {
  MAX_PAUSES: 2,
  MAX_PAUSE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  MAX_HINTS_PER_PROBLEM: 3,
  HINT_PENALTY: 0.2, // Score reduction per hint
  AUTO_SAVE_INTERVAL_MS: 30 * 1000, // 30 seconds
  WARNING_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes
  CRITICAL_THRESHOLD_MS: 1 * 60 * 1000, // 1 minute
  DEFAULT_DURATION_MINUTES: 45,
} as const;

// ============================================================================
// STATE MACHINE TRANSITIONS
// ============================================================================

export type InterviewAction =
  | { type: "START_INTERVIEW"; config: InterviewConfig }
  | { type: "CONFIRM_SETUP"; problems: InterviewProblem[] }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TIMEOUT" }
  | { type: "FINISH" }
  | { type: "EVALUATION_COMPLETE"; report: EvaluationReport }
  | { type: "NEXT_PROBLEM" }
  | { type: "END_SESSION" }
  | { type: "USE_HINT" }
  | { type: "TICK"; now: number }
  | { type: "RESTORE_SESSION"; session: InterviewSession };

/**
 * Valid state transitions for the Interview FSM
 */
export const VALID_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  idle: ["setup"],
  setup: ["active", "idle"],
  active: ["paused", "submitted"],
  paused: ["active", "submitted"],
  submitted: ["review"],
  review: ["active", "idle"],
};
