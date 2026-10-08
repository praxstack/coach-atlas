/**
 * InterviewPage - Full Interview Mode Experience
 *
 * Orchestrates the complete interview flow:
 * 1. Setup modal → Configure interview
 * 2. Active interview → Split-pane with problem + chat
 * 3. Review → Evaluation results
 */
import { useAIService, useStorageService } from "@/app/ServiceContext";
import { MarkdownRenderer } from "@/lib/markdown-viewer";
import type { Message, ProviderConfig, ProviderId } from "@/services/types";
import type { InterviewConfig } from "@/services/types/interview";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Bot, Loader2, Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EvaluationCard } from "./components/EvaluationCard";
import { InterviewLayout } from "./components/InterviewLayout";
import { InterviewSetupModal } from "./components/InterviewSetupModal";
import { ProblemPanel, ProblemPanelSkeleton } from "./components/ProblemPanel";
import {
  InterviewProvider,
  useInterview,
} from "./context/InterviewContext";
import { useEvaluateOnSubmit } from "./hooks/useEvaluateOnSubmit";
import { getInterviewService } from "./services/InterviewService";
import {
  createProgressiveEvaluator,
  type ProgressiveEvaluator,
  type SerializableEvaluationState,
} from "./services/ProgressiveEvaluator";

// LocalStorage key for evaluation state persistence
const EVAL_STATE_KEY = "coach-atlas-progressive-eval-state";

// ============================================
// Inner Component (uses context)
// ============================================

function InterviewContent() {
  const navigate = useNavigate();
  const aiService = useAIService();
  const storageService = useStorageService();

  // Interview context
  const {
    status,
    session,
    currentProblem,
    startSetup,
    confirmSetup,
    cancel,
    setEvaluation,
  } = useInterview();

  // Local state
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Chat state for interview
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Progressive evaluator instance
  const progressiveEvaluatorRef = useRef<ProgressiveEvaluator | null>(null);

  // Settles when the in-flight chat exchange has been recorded (or failed), so
  // final evaluation can include an answer sent just before Finish or timeout.
  const pendingExchangeRef = useRef<Promise<void> | null>(null);

  // Persisted evaluation state (survives page refresh)
  const [persistedEvalState, setPersistedEvalState] = useState<SerializableEvaluationState | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(EVAL_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SerializableEvaluationState;
        console.log("[Interview] Loaded persisted evaluation state", {
          problemId: parsed.problemId,
          observations: parsed.state.observations.length,
          exchanges: parsed.exchanges.length,
        });
        setPersistedEvalState(parsed);
      }
    } catch (error) {
      console.warn("[Interview] Failed to load persisted eval state:", error);
    }
  }, []);

  // Persistence callback for ProgressiveEvaluator
  const handleEvalStateUpdate = useCallback((state: SerializableEvaluationState) => {
    try {
      localStorage.setItem(EVAL_STATE_KEY, JSON.stringify(state));
      setPersistedEvalState(state);
    } catch (error) {
      console.warn("[Interview] Failed to persist eval state:", error);
    }
  }, []);

  // Clear persisted state when starting new interview
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(EVAL_STATE_KEY);
    setPersistedEvalState(null);
  }, []);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      setIsConfigLoading(true);
      try {
        const storedConfig = await storageService.loadProviderConfig();
        if (!storedConfig) {
          toast.error("Please configure your API key first");
          navigate("/settings");
          return;
        }
        setConfig({
          provider: storedConfig.provider as ProviderId,
          apiKey: storedConfig.apiKey,
          model: storedConfig.model,
          region: storedConfig.region,
        });
      } finally {
        setIsConfigLoading(false);
      }
    };
    loadConfig();
  }, [storageService, navigate]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Handle interview start
  const handleStartInterview = useCallback(async (interviewConfig: InterviewConfig) => {
    if (!config) return;

    setIsGenerating(true);
    try {
      startSetup(interviewConfig);

      // Generate problem from AI
      const interviewService = getInterviewService(aiService, config);
      const problem = await interviewService.generateProblem(interviewConfig);

      // Create session
      const newSession = interviewService.createSession(interviewConfig, [problem]);
      confirmSetup(newSession);

      // Clear any old persisted state since we're starting fresh
      clearPersistedState();

      // Initialize progressive evaluator with persistence callback
      progressiveEvaluatorRef.current = createProgressiveEvaluator(
        aiService,
        config,
        problem,
        handleEvalStateUpdate,
        undefined // No restored state for new interviews
      );
      console.log("[Interview] Progressive evaluator initialized for real-time evaluation");

      // Add initial interviewer message
      setMessages([
        {
          id: "interviewer-intro",
          role: "assistant",
          content: `👋 Welcome to your mock interview!\n\n**Problem:** ${problem.title}\n\nI'll be your interviewer today. Please read the problem on the left panel carefully. When you're ready, start by explaining your initial thoughts on how to approach this problem.\n\nRemember:\n- Think out loud\n- Ask clarifying questions\n- Discuss trade-offs\n\nGood luck! ⏱️`,
        },
      ]);

      setIsSetupOpen(false);
    } catch (error) {
      toast.error(`Failed to generate problem: ${error}`);
      cancel();
    } finally {
      setIsGenerating(false);
    }
  }, [config, aiService, startSetup, confirmSetup, cancel]);

  // Handle message send (interview chat)
  const handleSend = async () => {
    if (!input.trim() || !config || !session || isLoading) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    let settleExchange!: () => void;
    pendingExchangeRef.current = new Promise<void>((resolve) => (settleExchange = resolve));

    try {
      // Add user message
      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: userContent,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Build context with problem info for interviewer persona
      const problemContext = currentProblem
        ? `[INTERVIEW CONTEXT: The candidate is solving "${currentProblem.title}" - ${currentProblem.difficulty} difficulty. Topics: ${currentProblem.topics.join(", ")}. Help them without giving away the answer directly. Use Socratic method.]`
        : "";

      const historyMessages: Message[] = messages.map((m) => ({
        id: m.id,
        conversationId: session.id,
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
      }));

      // Stream response
      let fullContent = "";
      const messageCount = messages.length;
      const interviewerPrompt = `You are a senior software engineer conducting a technical interview. ${problemContext}

**CONVERSATION CONTEXT:** This is message #${messageCount + 1} in this interview.

Your role:
- Guide the candidate using the Socratic method (ask leading questions)
- Point out issues in their approach without giving solutions
- Ask about time/space complexity
- Test edge cases they might miss
- Keep responses CONCISE (2-4 paragraphs max)

**INTERVIEW FLOW GUIDELINES:**
- After 3-4 back-and-forth exchanges where the candidate shows understanding, acknowledge their solution
- If the candidate has provided a working solution with correct complexity analysis, say something like: "Great job! You've demonstrated a solid understanding of this problem. Click the **Finish** button when you're ready to see your evaluation."
- If the candidate asks to move on or says they're done, acknowledge and suggest clicking Finish
- Don't keep drilling infinitely - real interviews have time limits

Do NOT:
- Give away the solution directly
- Write complete code for them (unless they're completely stuck)
- Keep asking endless follow-up questions after a good solution
- Be overly critical if they've solved it correctly`;

      for await (const chunk of aiService.streamChat(
        userContent,
        historyMessages,
        config,
        interviewerPrompt
      )) {
        if (chunk.done) break;
        fullContent += chunk.content;
        setStreamingContent(fullContent);
      }

      // Add assistant message
      setStreamingContent("");
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant" as const,
        content: fullContent,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Record exchange for progressive evaluation (background, non-blocking)
      if (progressiveEvaluatorRef.current) {
        progressiveEvaluatorRef.current.onMessageExchange(userContent, fullContent).catch((err) => {
          console.warn("[Interview] Background evaluation error (non-fatal):", err);
        });
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsLoading(false);
      settleExchange();
    }
  };

  // Handle interview submission - Uses Progressive Evaluator for fast synthesis
  // Runs once the interview status becomes "submitted" (Finish button or timeout).
  // The signal is aborted when the user cancels or leaves the page.
  const runEvaluation = useCallback(async (signal: AbortSignal) => {
    if (!config || !session) return;
    // Tag the result with this session so a late reply cannot land on a newer one.
    const sessionId = session.id;

    setIsEvaluating(true);

    try {
      // Let an answer that is still streaming reach the evaluator first.
      await pendingExchangeRef.current;
      if (signal.aborted) return;
      console.log("[Interview] Starting final synthesis with Progressive Evaluator...");

      // Use Progressive Evaluator for fast synthesis
      if (progressiveEvaluatorRef.current) {
        const state = progressiveEvaluatorRef.current.getState();
        console.log("[Interview] Progressive state:", {
          evaluationCount: state.evaluationCount,
          observationCount: state.observations.length,
          scores: state.scores,
        });

        // Fast synthesis - uses pre-computed observations and scores
        const evaluation = await progressiveEvaluatorRef.current.synthesizeFinalReport(signal);
        setEvaluation(evaluation, sessionId);
        console.log("[Interview] Fast evaluation complete:", evaluation);
      } else {
        // Fallback to old approach if progressive evaluator not available
        console.warn("[Interview] Progressive evaluator not available, using fallback");
        const interviewService = getInterviewService(aiService, config);
        const chatHistory = messages
          .slice(-10)
          .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content.slice(0, 500)}`)
          .join("\n\n");
        const evaluation = await interviewService.generateEvaluation(session, chatHistory);
        setEvaluation(evaluation, sessionId);
      }
    } catch (error) {
      // Cancelled by the user: no fallback report and no error toast.
      if (signal.aborted) return;
      console.error("[Interview] Evaluation failed:", error);
      toast.error("Evaluation failed. Using fallback report.");

      // Fallback from progressive evaluator state if available
      if (progressiveEvaluatorRef.current) {
        const fallbackEval = progressiveEvaluatorRef.current.getState();
        setEvaluation({
          overallScore: Math.round(
            (fallbackEval.scores.problemSolving + fallbackEval.scores.coding + fallbackEval.scores.communication) / 3
          ),
          dimensions: {
            problemSolving: Math.round(fallbackEval.scores.problemSolving),
            coding: Math.round(fallbackEval.scores.coding),
            communication: Math.round(fallbackEval.scores.communication),
            verification: Math.round(fallbackEval.scores.verification),
            timeManagement: Math.round(fallbackEval.scores.timeManagement),
          },
          feedback: {
            strengths: fallbackEval.observations.filter((o) => o.type === "strength").map((o) => o.content).slice(0, 3),
            weaknesses: fallbackEval.observations.filter((o) => o.type === "weakness").map((o) => o.content).slice(0, 3),
            actionItems: ["Practice similar problems", "Review edge cases"],
            followUpQuestions: [],
          },
          generatedAt: Date.now(),
          modelUsed: "fallback-from-observations",
        }, sessionId);
      } else {
        setEvaluation({
          overallScore: 3,
          dimensions: {
            problemSolving: 3,
            coding: 3,
            communication: 3,
            verification: 3,
            timeManagement: 3,
          },
          feedback: {
            strengths: ["You completed the interview"],
            weaknesses: ["Evaluation could not be generated"],
            actionItems: ["Practice more problems"],
            followUpQuestions: [],
          },
          generatedAt: Date.now(),
          modelUsed: "fallback",
        }, sessionId);
      }
    } finally {
      setIsEvaluating(false);
    }
  }, [config, session, messages, aiService, setEvaluation]);

  useEvaluateOnSubmit(status, runEvaluation);

  // ============================================
  // Render based on status
  // ============================================

  // Loading config
  if (isConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading Interview Mode...
          </h2>
          <p className="text-gray-400">Checking API configuration</p>
        </div>
      </div>
    );
  }

  // Idle/Setup: Show modal
  if (status === "idle" || status === "setup") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <InterviewSetupModal
          isOpen={isSetupOpen}
          onClose={() => navigate("/chat")}
          onStart={handleStartInterview}
          isLoading={isGenerating}
        />
      </div>
    );
  }

  // Submitted: Show loading with cancel option
  if (status === "submitted") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Evaluating Your Performance...
          </h2>
          <p className="text-gray-400 mb-4">
            Our AI interviewer is analyzing your responses.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            This may take up to 60 seconds...
          </p>
          <Button
            variant="outline"
            onClick={() => {
              cancel();
              toast.info("Evaluation cancelled");
            }}
          >
            Cancel & Return
          </Button>
        </div>
      </div>
    );
  }

  // Review: Show evaluation
  if (status === "review" && session?.evaluation) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Interview Results</h1>
          </div>
          <EvaluationCard evaluation={session.evaluation} />
          <div className="mt-6 flex gap-4">
            <Button
              onClick={() => {
                cancel();
                setIsSetupOpen(true);
              }}
              className="flex-1"
            >
              Start New Interview
            </Button>
            <Button variant="outline" onClick={() => navigate("/chat")}>
              Return to Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active/Paused: Show interview layout
  return (
    <InterviewLayout
      className="min-h-screen"
      problemPanel={
        currentProblem ? (
          <ProblemPanel problem={currentProblem} />
        ) : (
          <ProblemPanelSkeleton />
        )
      }
      chatPanel={
        <div className="flex flex-col h-full relative">
          {/* Messages - scrollable area with padding for fixed input */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user" ? "bg-blue-600" : "bg-green-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 rounded-br-md [&_.markdown-body]:text-white [&_.markdown-body_code]:bg-blue-500/50 [&_.markdown-body_pre]:bg-blue-700/50 [&_.markdown-body_pre]:border-blue-500/30"
                        : "bg-gray-800 text-gray-100 rounded-bl-md"
                    }`}
                  >
                    <MarkdownRenderer content={message.content} className="text-sm" />
                  </div>
                </div>
              ))}

              {/* Streaming */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[80%] bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                    {streamingContent ? (
                      <MarkdownRenderer content={streamingContent} className="text-sm" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-950 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Explain your approach..."
                disabled={isLoading || status === "paused"}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="h-12 w-12 rounded-xl"
                disabled={!input.trim() || isLoading || status === "paused"}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
}

// ============================================
// Page Component (wraps with Provider)
// ============================================

export default function InterviewPage() {
  return (
    <InterviewProvider>
      <InterviewContent />
    </InterviewProvider>
  );
}
