/**
 * Progressive Evaluator
 *
 * Enterprise-grade incremental evaluation system that:
 * 1. Evaluates in background after every 2-3 exchanges
 * 2. Maintains running scores and observations
 * 3. Compacts context to preserve key insights
 * 4. Enables fast final synthesis (~2-3 seconds)
 *
 * Based on ARD-003: Progressive Real-Time Evaluation System
 */
import type { AIService } from "@/services/ai/AIService";
import type { ProviderConfig } from "@/services/types";
import type { EvaluationReport, InterviewProblem } from "@/services/types/interview";

// ============================================
// Types
// ============================================

export interface Observation {
  id: string;
  type: "strength" | "weakness" | "insight" | "missed" | "improvement";
  dimension: "problemSolving" | "coding" | "communication" | "verification" | "timeManagement";
  content: string;
  messageIndex: number;
  confidence: number;
  timestamp: number;
}

export interface DimensionScores {
  problemSolving: number;
  coding: number;
  communication: number;
  verification: number;
  timeManagement: number;
}

export interface ProgressiveEvaluationState {
  scores: DimensionScores;
  observations: Observation[];
  contextSummary: string;
  lastEvaluatedIndex: number;
  totalExchanges: number;
  evaluationCount: number;
  hintsUsed: number;
  startTime: number;
}

/**
 * Serializable state for persistence to IndexedDB
 * This is what gets saved to survive page refreshes
 */
export interface SerializableEvaluationState {
  state: ProgressiveEvaluationState;
  exchanges: Array<{ userMessage: string; assistantResponse: string; index: number }>;
  problemId: string;
}

/**
 * Callback for state persistence
 * Called after every state mutation so parent can sync to IndexedDB
 */
export type OnStateUpdateCallback = (state: SerializableEvaluationState) => void;

interface MessageExchange {
  userMessage: string;
  assistantResponse: string;
  index: number;
}

interface MicroEvaluationResult {
  observations: Array<{
    type: Observation["type"];
    dimension: Observation["dimension"];
    content: string;
    confidence?: number;
  }>;
  scoreDeltas: Partial<DimensionScores>;
  updatedSummary: string;
}

// ============================================
// Async Mutex Lock (prevents race conditions)
// ============================================

class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ============================================
// Retry with Exponential Backoff
// ============================================

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[ProgressiveEvaluator] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ============================================
// Prompts
// ============================================

const MICRO_EVALUATION_PROMPT = `You are an expert technical interviewer analyzing a coding interview exchange.

**Problem Being Solved**: {problemTitle}
{problemDescription}

**Previous Summary**:
{contextSummary}

**Recent Exchange (messages {startIndex} to {endIndex})**:
{recentExchange}

Analyze ONLY this recent exchange. Extract observations about the candidate's performance.

Output ONLY valid JSON (no markdown):
{
  "observations": [
    {
      "type": "strength|weakness|insight|missed|improvement",
      "dimension": "problemSolving|coding|communication|verification|timeManagement",
      "content": "Brief specific observation",
      "confidence": 0.8
    }
  ],
  "scoreDeltas": {
    "problemSolving": 0,
    "coding": 0,
    "communication": 0,
    "verification": 0,
    "timeManagement": 0
  },
  "updatedSummary": "Updated concise summary including new context (max 300 words)"
}

Score deltas: Use -0.5 to +0.5 based on this exchange only.
- Strong positive signal: +0.3 to +0.5
- Mild positive: +0.1 to +0.2
- Neutral: 0
- Mild negative: -0.1 to -0.2
- Significant issue: -0.3 to -0.5`;

const FINAL_SYNTHESIS_PROMPT = `You are synthesizing a final interview evaluation from collected observations.

**Problem**: {problemTitle}

**Collected Observations**:
{observations}

**Running Scores** (1-5 scale):
{scores}

**Context Summary**:
{contextSummary}

**Interview Stats**:
- Duration: {durationMinutes} minutes
- Hints used: {hintsUsed} (each hint = -0.2 on coding)
- Total exchanges: {totalExchanges}

Synthesize a final evaluation. Adjust scores based on observations and hints.

Output ONLY valid JSON:
{
  "overallScore": 3,
  "dimensions": {
    "problemSolving": 3,
    "coding": 3,
    "communication": 3,
    "verification": 3,
    "timeManagement": 3
  },
  "feedback": {
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1"],
    "actionItems": ["Action item 1", "Action item 2"],
    "followUpQuestions": ["Question 1"]
  }
}`;

// ============================================
// Progressive Evaluator Class
// ============================================

export class ProgressiveEvaluator {
  private state: ProgressiveEvaluationState;
  private aiService: AIService;
  private config: ProviderConfig;
  private problem: InterviewProblem;
  private exchanges: MessageExchange[] = [];

  // Mutex lock for thread safety
  private evaluationMutex = new AsyncMutex();
  private pendingEvaluation = false;

  // Aborted when the final synthesis is cancelled, so queued or in-flight
  // background micro-evaluations stop too.
  private backgroundController = new AbortController();

  // Persistence callback
  private onStateUpdate?: OnStateUpdateCallback;

  // Configuration
  private readonly EXCHANGES_PER_EVALUATION = 2;
  private readonly BASE_SCORE = 3;
  private readonly MAX_RETRIES = 2;

  constructor(
    aiService: AIService,
    config: ProviderConfig,
    problem: InterviewProblem,
    onStateUpdate?: OnStateUpdateCallback,
    restoredState?: SerializableEvaluationState
  ) {
    this.aiService = aiService;
    this.config = config;
    this.problem = problem;
    this.onStateUpdate = onStateUpdate;

    // Restore from persisted state if available
    if (restoredState && restoredState.problemId === problem.id) {
      console.log("[ProgressiveEvaluator] Restoring from persisted state", {
        observations: restoredState.state.observations.length,
        exchanges: restoredState.exchanges.length,
      });
      this.state = restoredState.state;
      this.exchanges = restoredState.exchanges;
    } else {
      this.state = this.createInitialState();
    }
  }

  private createInitialState(): ProgressiveEvaluationState {
    return {
      scores: {
        problemSolving: this.BASE_SCORE,
        coding: this.BASE_SCORE,
        communication: this.BASE_SCORE,
        verification: this.BASE_SCORE,
        timeManagement: this.BASE_SCORE,
      },
      observations: [],
      contextSummary: `Candidate is solving "${this.problem.title}" (${this.problem.difficulty}). Topics: ${this.problem.topics.join(", ")}.`,
      lastEvaluatedIndex: -1,
      totalExchanges: 0,
      evaluationCount: 0,
      hintsUsed: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Record a message exchange
   * Triggers background evaluation if threshold reached
   */
  async onMessageExchange(userMessage: string, assistantResponse: string): Promise<void> {
    const index = this.exchanges.length;
    this.exchanges.push({ userMessage, assistantResponse, index });
    this.state.totalExchanges = this.exchanges.length;

    // Persist state after recording exchange
    this.persistState();

    console.log(`[ProgressiveEvaluator] Exchange ${index} recorded. Total: ${this.exchanges.length}`);

    // Check if we should trigger evaluation
    const unevaluatedCount = index - this.state.lastEvaluatedIndex;
    if (unevaluatedCount >= this.EXCHANGES_PER_EVALUATION) {
      // Fire and forget - don't await
      this.triggerBackgroundEvaluation().catch((err) => {
        console.error("[ProgressiveEvaluator] Background evaluation failed:", err);
      });
    }
  }

  /**
   * Record hint usage
   */
  recordHintUsage(): void {
    this.state.hintsUsed++;
    this.persistState();
    console.log(`[ProgressiveEvaluator] Hint used. Total: ${this.state.hintsUsed}`);
  }

  /**
   * Persist current state via callback
   * Called after every mutation for crash recovery
   */
  private persistState(): void {
    if (this.onStateUpdate) {
      const serializable: SerializableEvaluationState = {
        state: { ...this.state },
        exchanges: [...this.exchanges],
        problemId: this.problem.id,
      };
      this.onStateUpdate(serializable);
    }
  }

  /**
   * Get current running scores
   */
  getRunningScores(): DimensionScores {
    return { ...this.state.scores };
  }

  /**
   * Get collected observations
   */
  getObservations(): Observation[] {
    return [...this.state.observations];
  }

  /**
   * Get current state for debugging/display
   */
  getState(): ProgressiveEvaluationState {
    return { ...this.state };
  }

  /**
   * Trigger background evaluation with mutex lock
   * Ensures only one evaluation runs at a time
   */
  private async triggerBackgroundEvaluation(): Promise<void> {
    const signal = this.backgroundController.signal;
    if (signal.aborted) return;
    // Use mutex to prevent concurrent evaluations
    await this.evaluationMutex.withLock(async () => {
      if (signal.aborted) return;
      console.log("[ProgressiveEvaluator] Starting background micro-evaluation...");

      try {
        // Retry with exponential backoff
        await retryWithBackoff(
          () => this.runMicroEvaluation(signal),
          this.MAX_RETRIES,
          1000,
          signal
        );
      } catch (error) {
        console.error("[ProgressiveEvaluator] Micro-evaluation failed after retries:", error);
        // Non-fatal - we continue with current state
        // Could add analytics/telemetry here
      }
    });

    // Check if another evaluation was requested while we were running
    const unevaluated = this.exchanges.length - 1 - this.state.lastEvaluatedIndex;
    if (!signal.aborted && unevaluated >= this.EXCHANGES_PER_EVALUATION) {
      // Schedule next evaluation with delay
      setTimeout(() => this.triggerBackgroundEvaluation(), 500);
    }
  }

  /**
   * Run a micro-evaluation on recent exchanges
   */
  private async runMicroEvaluation(signal?: AbortSignal): Promise<void> {
    const startIndex = this.state.lastEvaluatedIndex + 1;
    const endIndex = this.exchanges.length - 1;

    if (startIndex > endIndex) {
      console.log("[ProgressiveEvaluator] No new exchanges to evaluate");
      return;
    }

    // Build recent exchange text
    const recentExchanges = this.exchanges.slice(startIndex, endIndex + 1);
    const exchangeText = recentExchanges
      .map(
        (ex, i) =>
          `[Exchange ${startIndex + i}]\nCandidate: ${ex.userMessage.slice(0, 1000)}\nInterviewer: ${ex.assistantResponse.slice(0, 500)}`
      )
      .join("\n\n");

    const prompt = MICRO_EVALUATION_PROMPT
      .replace("{problemTitle}", this.problem.title)
      .replace("{problemDescription}", this.problem.description.slice(0, 500))
      .replace("{contextSummary}", this.state.contextSummary)
      .replace("{startIndex}", String(startIndex))
      .replace("{endIndex}", String(endIndex))
      .replace("{recentExchange}", exchangeText);

    console.log("[ProgressiveEvaluator] Sending micro-evaluation request...", {
      startIndex,
      endIndex,
      promptLength: prompt.length,
    });

    const response = await this.aiService.sendMessage({
      messages: [
        {
          id: `micro-eval-${Date.now()}`,
          conversationId: "progressive-eval",
          role: "user",
          content: prompt,
          timestamp: Date.now(),
        },
      ],
      config: this.config,
      signal,
    });
    signal?.throwIfAborted();

    // Parse response
    const result = this.parseMicroEvaluation(response.content);
    if (result) {
      this.applyMicroEvaluation(result, startIndex, endIndex);
    }

    this.state.lastEvaluatedIndex = endIndex;
    this.state.evaluationCount++;

    // CRITICAL: Persist state after evaluation
    this.persistState();

    console.log("[ProgressiveEvaluator] Micro-evaluation complete", {
      evaluationCount: this.state.evaluationCount,
      observationCount: this.state.observations.length,
      scores: this.state.scores,
    });
  }

  /**
   * Parse micro-evaluation response
   */
  private parseMicroEvaluation(content: string): MicroEvaluationResult | null {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[ProgressiveEvaluator] No JSON found in response");
        return null;
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        observations: data.observations || [],
        scoreDeltas: data.scoreDeltas || {},
        updatedSummary: data.updatedSummary || this.state.contextSummary,
      };
    } catch (error) {
      console.error("[ProgressiveEvaluator] Failed to parse micro-evaluation:", error);
      return null;
    }
  }

  /**
   * Apply micro-evaluation results to state
   */
  private applyMicroEvaluation(
    result: MicroEvaluationResult,
    startIndex: number,
    endIndex: number
  ): void {
    // Add observations
    for (const obs of result.observations) {
      this.state.observations.push({
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: obs.type,
        dimension: obs.dimension,
        content: obs.content,
        messageIndex: endIndex,
        confidence: obs.confidence || 0.7,
        timestamp: Date.now(),
      });
    }

    // Apply score deltas with clamping
    const dimensions = Object.keys(result.scoreDeltas) as Array<keyof DimensionScores>;
    for (const dim of dimensions) {
      const delta = result.scoreDeltas[dim] || 0;
      this.state.scores[dim] = Math.max(1, Math.min(5, this.state.scores[dim] + delta));
    }

    // Update context summary
    if (result.updatedSummary) {
      this.state.contextSummary = result.updatedSummary.slice(0, 2000);
    }
  }

  /**
   * Synthesize final evaluation report
   * This is FAST because we've already done the heavy lifting
   */
  async synthesizeFinalReport(signal?: AbortSignal): Promise<EvaluationReport> {
    console.log("[ProgressiveEvaluator] Synthesizing final report...");

    // Cancelling the evaluation also stops background micro-evaluation work.
    const stopBackground = () => this.backgroundController.abort(signal?.reason);
    if (signal?.aborted) stopBackground();
    signal?.addEventListener("abort", stopBackground, { once: true });
    signal?.throwIfAborted();

    // Ensure all exchanges are evaluated. Take the same lock as the background
    // micro-evaluation so an in-flight one finishes first and its range is not
    // evaluated (and its score deltas applied) a second time.
    await this.evaluationMutex.withLock(async () => {
      signal?.throwIfAborted();
      if (this.state.lastEvaluatedIndex >= this.exchanges.length - 1) return;
      try {
        await this.runMicroEvaluation(signal);
      } catch (error) {
        if (signal?.aborted) throw error;
        console.warn("[ProgressiveEvaluator] Final micro-eval failed, using current state");
      }
    });
    signal?.throwIfAborted();

    const durationMinutes = Math.floor((Date.now() - this.state.startTime) / 60000);

    // Format observations for synthesis
    const observationsText = this.state.observations
      .map((o) => `[${o.type.toUpperCase()}] (${o.dimension}) ${o.content}`)
      .join("\n");

    // Format scores
    const scoresText = Object.entries(this.state.scores)
      .map(([dim, score]) => `${dim}: ${score.toFixed(1)}`)
      .join("\n");

    const prompt = FINAL_SYNTHESIS_PROMPT
      .replace("{problemTitle}", this.problem.title)
      .replace("{observations}", observationsText || "No specific observations recorded")
      .replace("{scores}", scoresText)
      .replace("{contextSummary}", this.state.contextSummary)
      .replace("{durationMinutes}", String(durationMinutes))
      .replace("{hintsUsed}", String(this.state.hintsUsed))
      .replace("{totalExchanges}", String(this.state.totalExchanges));

    console.log("[ProgressiveEvaluator] Sending synthesis request...", {
      observationCount: this.state.observations.length,
      exchangeCount: this.state.totalExchanges,
      promptLength: prompt.length,
    });

    try {
      const response = await this.aiService.sendMessage({
        messages: [
          {
            id: `final-synthesis-${Date.now()}`,
            conversationId: "progressive-eval",
            role: "user",
            content: prompt,
            timestamp: Date.now(),
          },
        ],
        config: this.config,
        signal,
      });
      signal?.throwIfAborted();

      return this.parseFinalEvaluation(response.content);
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error("[ProgressiveEvaluator] Synthesis failed:", error);
      return this.buildFallbackEvaluation();
    }
  }

  /**
   * Parse final evaluation response
   */
  private parseFinalEvaluation(content: string): EvaluationReport {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      const data = JSON.parse(jsonMatch[0]);

      // Apply hint penalty
      const hintPenalty = this.state.hintsUsed * 0.2;
      const codingScore = Math.max(1, (data.dimensions?.coding || this.state.scores.coding) - hintPenalty);

      return {
        overallScore: data.overallScore || Math.round(this.calculateOverallScore()),
        dimensions: {
          problemSolving: data.dimensions?.problemSolving || this.state.scores.problemSolving,
          coding: codingScore,
          communication: data.dimensions?.communication || this.state.scores.communication,
          verification: data.dimensions?.verification || this.state.scores.verification,
          timeManagement: data.dimensions?.timeManagement || this.state.scores.timeManagement,
        },
        feedback: {
          strengths: data.feedback?.strengths || this.extractFeedback("strength"),
          weaknesses: data.feedback?.weaknesses || this.extractFeedback("weakness"),
          actionItems: data.feedback?.actionItems || ["Continue practicing"],
          followUpQuestions: data.feedback?.followUpQuestions || [],
        },
        generatedAt: Date.now(),
        modelUsed: this.config.model,
      };
    } catch (error) {
      console.error("[ProgressiveEvaluator] Failed to parse synthesis:", error);
      return this.buildFallbackEvaluation();
    }
  }

  /**
   * Build fallback evaluation from collected state
   */
  private buildFallbackEvaluation(): EvaluationReport {
    const hintPenalty = this.state.hintsUsed * 0.2;

    return {
      overallScore: Math.round(this.calculateOverallScore()),
      dimensions: {
        problemSolving: Math.round(this.state.scores.problemSolving),
        coding: Math.max(1, Math.round(this.state.scores.coding - hintPenalty)),
        communication: Math.round(this.state.scores.communication),
        verification: Math.round(this.state.scores.verification),
        timeManagement: Math.round(this.state.scores.timeManagement),
      },
      feedback: {
        strengths: this.extractFeedback("strength"),
        weaknesses: this.extractFeedback("weakness"),
        actionItems: this.extractFeedback("improvement").concat(["Practice similar problems"]),
        followUpQuestions: [],
      },
      generatedAt: Date.now(),
      modelUsed: "fallback-from-observations",
    };
  }

  /**
   * Calculate overall score from dimension scores
   */
  private calculateOverallScore(): number {
    const weights = {
      problemSolving: 0.3,
      coding: 0.3,
      communication: 0.2,
      verification: 0.1,
      timeManagement: 0.1,
    };

    let total = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      total += this.state.scores[dim as keyof DimensionScores] * weight;
    }

    return total;
  }

  /**
   * Extract feedback items from observations
   */
  private extractFeedback(type: Observation["type"]): string[] {
    return this.state.observations
      .filter((o) => o.type === type)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((o) => o.content);
  }
}

// ============================================
// Factory
// ============================================

export function createProgressiveEvaluator(
  aiService: AIService,
  config: ProviderConfig,
  problem: InterviewProblem,
  onStateUpdate?: OnStateUpdateCallback,
  restoredState?: SerializableEvaluationState
): ProgressiveEvaluator {
  return new ProgressiveEvaluator(aiService, config, problem, onStateUpdate, restoredState);
}
