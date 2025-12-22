/**
 * Interview Service
 *
 * Handles AI interactions for Interview Mode:
 * - Problem generation from AI
 * - Evaluation generation
 * - Session persistence to IndexedDB
 */
import type { AIService } from "@/services/ai/AIService";
import type { ProviderConfig } from "@/services/types";
import type {
  EvaluationReport,
  InterviewConfig,
  InterviewProblem,
  InterviewSession,
} from "@/services/types/interview";

// ============================================
// Prompts
// ============================================

const PROBLEM_GENERATION_PROMPT = `You are generating a coding interview problem.

**Topic**: {topic}
**Difficulty**: {difficulty}

Generate a realistic interview problem similar to what you'd find at Google, Meta, or Amazon.

**Output ONLY valid JSON** (no markdown code blocks, no explanations):
{
  "id": "unique-id",
  "title": "Problem Name",
  "description": "Clear description of the problem in 2-4 paragraphs. Include context and what the function should do.",
  "examples": [
    {"input": "specific input example", "output": "expected output", "explanation": "brief explanation"},
    {"input": "another example", "output": "output"}
  ],
  "constraints": ["1 <= n <= 10^5", "O(n) time complexity expected", "etc"],
  "hints": ["First hint (easiest)", "Second hint (medium)", "Third hint (most helpful)"],
  "difficulty": "{difficulty}",
  "topics": ["{topic}", "related topic"],
  "testCases": [
    {"input": "test input", "expected": "expected output", "hidden": false},
    {"input": "edge case", "expected": "output", "hidden": true}
  ]
}`;

const EVALUATION_PROMPT = `You are an experienced technical interviewer at a top tech company.

Analyze the complete interview session and provide a detailed evaluation.

**Problem Given**:
{problem_title}
{problem_description}

**Candidate's Conversation**:
{chat_history}

**Time Taken**: {time_taken} minutes (out of {total_time} minutes)
**Hints Used**: {hints_used}

Evaluate the candidate based on:
1. Problem Solving (approach, algorithm choice, optimization)
2. Coding (syntax, correctness, edge cases, code quality)
3. Communication (explaining thoughts, asking questions, clarity)
4. Verification (testing, debugging, finding bugs)
5. Time Management (pacing, prioritization)

Each dimension is scored 1-5:
- 1 = Poor, significant issues
- 2 = Below average, noticeable gaps
- 3 = Average, meets basic expectations
- 4 = Good, above average performance
- 5 = Excellent, outstanding performance

Overall Score:
- 1 = Strong No Hire
- 2 = No Hire
- 3 = Lean No Hire / Lean Hire
- 4 = Hire
- 5 = Strong Hire

**Output ONLY valid JSON** (no markdown, no explanations):
{
  "overallScore": 3,
  "dimensions": {
    "problemSolving": 3,
    "coding": 4,
    "communication": 3,
    "verification": 2,
    "timeManagement": 4
  },
  "feedback": {
    "strengths": ["Clear communication", "Good algorithm choice"],
    "weaknesses": ["Missed edge case X", "No testing performed"],
    "actionItems": ["Practice boundary conditions", "Always dry-run with examples"],
    "followUpQuestions": ["What if the input was empty?", "How would you optimize for space?"]
  },
  "comparison": {
    "percentile": 65,
    "similarProblems": ["Two Sum", "Valid Parentheses"]
  },
  "generatedAt": ${Date.now()},
  "modelUsed": "assistant"
}`;

// ============================================
// Service Class
// ============================================

export class InterviewService {
  constructor(
    private aiService: AIService,
    private providerConfig: ProviderConfig
  ) {}

  /**
   * Update provider config (e.g., when user changes model)
   */
  setProviderConfig(config: ProviderConfig) {
    this.providerConfig = config;
  }

  /**
   * Generate a problem from AI based on config
   */
  async generateProblem(config: InterviewConfig): Promise<InterviewProblem> {
    const prompt = PROBLEM_GENERATION_PROMPT
      .replace(/{topic}/g, config.topic)
      .replace(/{difficulty}/g, config.difficulty);

    const response = await this.aiService.sendMessage({
      messages: [
        {
          id: `interview-problem-${Date.now()}`,
          conversationId: "interview-setup",
          role: "user",
          content: prompt,
          timestamp: Date.now(),
        },
      ],
      config: this.providerConfig,
    });

    // Extract JSON from response
    const jsonStr = this.extractJson(response.content);
    const problem = this.parseAndValidateProblem(jsonStr, config);
    return problem;
  }

  /**
   * Generate evaluation report from AI
   */
  async generateEvaluation(
    session: InterviewSession,
    chatHistory: string
  ): Promise<EvaluationReport> {
    console.log("[InterviewService] Starting evaluation generation...");

    const problem = session.problems[session.currentProblemIndex];
    const timeUsedMs = Date.now() - session.startTime - session.totalPausedTime;
    const timeUsedMinutes = Math.floor(timeUsedMs / 60000);
    const hintsUsed = session.hintsUsedPerProblem[session.currentProblemIndex] || 0;

    // Truncate chat history to avoid token limits
    const truncatedHistory = chatHistory.slice(0, 3000);

    const prompt = EVALUATION_PROMPT
      .replace("{problem_title}", problem.title)
      .replace("{problem_description}", problem.description.slice(0, 500))
      .replace("{chat_history}", truncatedHistory)
      .replace("{time_taken}", String(timeUsedMinutes))
      .replace("{total_time}", String(session.durationMinutes))
      .replace("{hints_used}", String(hintsUsed));

    console.log("[InterviewService] Sending evaluation request to AI...", {
      provider: this.providerConfig.provider,
      model: this.providerConfig.model,
      promptLength: prompt.length,
    });

    try {
      const response = await this.aiService.sendMessage({
        messages: [
          {
            id: `interview-eval-${Date.now()}`,
            conversationId: session.id,
            role: "user",
            content: prompt,
            timestamp: Date.now(),
          },
        ],
        config: this.providerConfig,
      });

      console.log("[InterviewService] AI response received", {
        contentLength: response.content?.length,
      });

      // Extract and validate JSON
      const jsonStr = this.extractJson(response.content);
      const evaluation = this.parseAndValidateEvaluation(jsonStr, hintsUsed);
      console.log("[InterviewService] Evaluation parsed successfully");
      return evaluation;
    } catch (error) {
      console.error("[InterviewService] AI request failed:", error);
      throw error;
    }
  }

  /**
   * Create a new session object
   */
  createSession(config: InterviewConfig, problems: InterviewProblem[]): InterviewSession {
    const now = Date.now();
    return {
      id: `interview-${now}`,
      type: config.type,
      status: "active",
      startTime: now,
      pausedAt: undefined,
      totalPausedTime: 0,
      durationMinutes: config.durationMinutes,
      problems,
      currentProblemIndex: 0,
      hintsUsedPerProblem: problems.map(() => 0),
      pauseCount: 0,
      chatMessageIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  // ========== Private Helpers ==========

  private extractJson(text: string): string {
    // Try to find JSON in the response
    // First, try direct parse
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed;
    }

    // Look for JSON in markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Look for first { to last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1);
    }

    throw new Error("Could not extract JSON from AI response");
  }

  private parseAndValidateProblem(
    jsonStr: string,
    config: InterviewConfig
  ): InterviewProblem {
    try {
      const data = JSON.parse(jsonStr);

      // Validate required fields
      if (!data.title || !data.description || !data.examples) {
        throw new Error("Missing required fields in problem JSON");
      }

      // Ensure arrays
      const problem: InterviewProblem = {
        id: data.id || `problem-${Date.now()}`,
        title: String(data.title),
        description: String(data.description),
        examples: Array.isArray(data.examples)
          ? data.examples.map((ex: { input: string; output: string; explanation?: string }) => ({
              input: String(ex.input || ""),
              output: String(ex.output || ""),
              explanation: ex.explanation ? String(ex.explanation) : undefined,
            }))
          : [],
        constraints: Array.isArray(data.constraints)
          ? data.constraints.map(String)
          : [],
        hints: Array.isArray(data.hints)
          ? data.hints.map(String)
          : ["Consider the brute force approach first", "Think about data structures", "Optimize for time complexity"],
        difficulty: config.difficulty,
        topics: Array.isArray(data.topics)
          ? data.topics.map(String)
          : [config.topic],
        testCases: Array.isArray(data.testCases)
          ? data.testCases.map((tc: { input: string; expected: string; hidden?: boolean }) => ({
              input: String(tc.input || ""),
              expected: String(tc.expected || ""),
              hidden: Boolean(tc.hidden),
            }))
          : undefined,
      };

      return problem;
    } catch (error) {
      console.error("Failed to parse problem JSON:", error);
      throw new Error(`Invalid problem JSON: ${error}`);
    }
  }

  private parseAndValidateEvaluation(
    jsonStr: string,
    hintsUsed: number
  ): EvaluationReport {
    try {
      const data = JSON.parse(jsonStr);

      // Apply hint penalty
      const hintPenalty = hintsUsed * 0.2;
      const codingScore = Math.max(1, (data.dimensions?.coding || 3) - hintPenalty);

      const evaluation: EvaluationReport = {
        overallScore: data.overallScore || 3,
        dimensions: {
          problemSolving: data.dimensions?.problemSolving || 3,
          coding: codingScore,
          communication: data.dimensions?.communication || 3,
          verification: data.dimensions?.verification || 3,
          timeManagement: data.dimensions?.timeManagement || 3,
        },
        feedback: {
          strengths: Array.isArray(data.feedback?.strengths)
            ? data.feedback.strengths.map(String)
            : [],
          weaknesses: Array.isArray(data.feedback?.weaknesses)
            ? data.feedback.weaknesses.map(String)
            : [],
          actionItems: Array.isArray(data.feedback?.actionItems)
            ? data.feedback.actionItems.map(String)
            : [],
          followUpQuestions: Array.isArray(data.feedback?.followUpQuestions)
            ? data.feedback.followUpQuestions.map(String)
            : [],
        },
        comparison: data.comparison
          ? {
              percentile: data.comparison.percentile,
              similarProblems: Array.isArray(data.comparison.similarProblems)
                ? data.comparison.similarProblems.map(String)
                : [],
            }
          : undefined,
        generatedAt: Date.now(),
        modelUsed: data.modelUsed || "unknown",
      };

      return evaluation;
    } catch (error) {
      console.error("Failed to parse evaluation JSON:", error);
      throw new Error(`Invalid evaluation JSON: ${error}`);
    }
  }
}

// ============================================
// Factory
// ============================================

let interviewServiceInstance: InterviewService | null = null;

export function getInterviewService(
  aiService: AIService,
  providerConfig: ProviderConfig
): InterviewService {
  if (!interviewServiceInstance) {
    interviewServiceInstance = new InterviewService(aiService, providerConfig);
  } else {
    // Update config if changed
    interviewServiceInstance.setProviderConfig(providerConfig);
  }
  return interviewServiceInstance;
}

export default InterviewService;
