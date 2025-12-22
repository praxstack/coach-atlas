/**
 * ProblemPanel Component
 *
 * Displays the interview problem in the left panel:
 * - Title & difficulty badge
 * - Description (markdown)
 * - Examples with input/output
 * - Constraints
 * - Progressive hints (collapsible)
 */
import { MarkdownRenderer } from "@/lib/markdown-viewer/MarkdownRenderer";
import { cn } from "@/lib/utils";
import type { InterviewProblem } from "@/services/types/interview";
import { useInterview } from "../context/InterviewContext";

interface ProblemPanelProps {
  problem: InterviewProblem;
  className?: string;
}

export function ProblemPanel({ problem, className }: ProblemPanelProps) {
  const { hintsRemaining, canRequestHint, useHint, session } = useInterview();

  // Get hints already revealed for current problem
  const problemIndex = session?.currentProblemIndex || 0;
  const hintsUsedCount = session?.hintsUsedPerProblem[problemIndex] || 0;
  const revealedHints = problem.hints.slice(0, hintsUsedCount);

  const difficultyColors = {
    easy: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">{problem.title}</h1>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              difficultyColors[problem.difficulty]
            )}
          >
            {problem.difficulty}
          </span>
        </div>
        {/* Topics */}
        <div className="mt-2 flex flex-wrap gap-1">
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Description */}
        <section className="mb-6">
          <MarkdownRenderer content={problem.description} />
        </section>

        {/* Examples */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Examples
          </h2>
          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3"
              >
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Input:
                  </span>
                  <pre className="mt-1 rounded bg-gray-900 p-2 text-sm text-gray-300 overflow-x-auto">
                    {example.input}
                  </pre>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Output:
                  </span>
                  <pre className="mt-1 rounded bg-gray-900 p-2 text-sm text-green-400 overflow-x-auto">
                    {example.output}
                  </pre>
                </div>
                {example.explanation && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Explanation:
                    </span>
                    <p className="mt-1 text-sm text-gray-400">
                      {example.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Constraints */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Constraints
          </h2>
          <ul className="space-y-1">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-blue-400">•</span>
                <code className="rounded bg-gray-800 px-1 text-xs">
                  {constraint}
                </code>
              </li>
            ))}
          </ul>
        </section>

        {/* Hints Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Hints ({hintsRemaining} remaining)
            </h2>
            <button
              onClick={() => useHint()}
              disabled={!canRequestHint}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                canRequestHint
                  ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                  : "cursor-not-allowed bg-gray-700 text-gray-500"
              )}
            >
              {canRequestHint ? "🔍 Request Hint" : "No hints left"}
            </button>
          </div>

          {/* Revealed Hints */}
          {revealedHints.length > 0 && (
            <div className="space-y-2">
              {revealedHints.map((hint, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-400 text-xs font-medium">
                      Hint {idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      (-0.2 score penalty)
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {/* Hint Cost Warning */}
          {canRequestHint && revealedHints.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              💡 Hints cost -0.2 on your coding dimension score. Use wisely!
            </p>
          )}
        </section>

        {/* Test Cases (if visible) */}
        {problem.testCases && problem.testCases.filter((tc) => !tc.hidden).length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Test Cases
            </h2>
            <div className="space-y-2">
              {problem.testCases
                .filter((tc) => !tc.hidden)
                .map((tc, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-gray-700 bg-gray-800/30 p-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Input:</span>
                        <pre className="mt-0.5 text-gray-300">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected:</span>
                        <pre className="mt-0.5 text-green-400">{tc.expected}</pre>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Loading/placeholder state for ProblemPanel
 */
export function ProblemPanelSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="border-b border-gray-700 bg-gray-900 px-4 py-3">
        <div className="h-6 w-48 rounded bg-gray-700" />
        <div className="mt-2 flex gap-1">
          <div className="h-5 w-16 rounded bg-gray-700" />
          <div className="h-5 w-20 rounded bg-gray-700" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="h-4 w-full rounded bg-gray-700" />
        <div className="h-4 w-3/4 rounded bg-gray-700" />
        <div className="h-4 w-5/6 rounded bg-gray-700" />
        <div className="h-32 w-full rounded bg-gray-700" />
        <div className="h-24 w-full rounded bg-gray-700" />
      </div>
    </div>
  );
}

export default ProblemPanel;
