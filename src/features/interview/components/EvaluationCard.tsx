/**
 * EvaluationCard Component
 *
 * Displays the interview evaluation results:
 * - Overall score with visual indicator
 * - Dimension scores (radar chart style)
 * - Detailed feedback (strengths, weaknesses, action items)
 * - Percentile comparison
 */
import { cn } from "@/lib/utils";
import type { EvaluationReport } from "@/services/types/interview";

interface EvaluationCardProps {
  evaluation: EvaluationReport;
  className?: string;
}

const SCORE_LABELS = {
  1: { label: "Strong No Hire", color: "text-red-400", bg: "bg-red-500" },
  2: { label: "No Hire", color: "text-orange-400", bg: "bg-orange-500" },
  3: { label: "Lean No Hire / Lean Hire", color: "text-amber-400", bg: "bg-amber-500" },
  4: { label: "Hire", color: "text-green-400", bg: "bg-green-500" },
  5: { label: "Strong Hire", color: "text-emerald-400", bg: "bg-emerald-500" },
};

const DIMENSION_LABELS: Record<string, { label: string; icon: string }> = {
  problemSolving: { label: "Problem Solving", icon: "🧩" },
  coding: { label: "Coding", icon: "💻" },
  communication: { label: "Communication", icon: "💬" },
  verification: { label: "Testing", icon: "✅" },
  timeManagement: { label: "Time Management", icon: "⏱️" },
};

export function EvaluationCard({ evaluation, className }: EvaluationCardProps) {
  const scoreConfig = SCORE_LABELS[evaluation.overallScore as keyof typeof SCORE_LABELS] || SCORE_LABELS[3];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Overall Score Banner */}
      <div className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-400">
              Interview Result
            </h2>
            <div className={cn("mt-2 text-3xl font-bold", scoreConfig.color)}>
              {scoreConfig.label}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white",
                scoreConfig.bg
              )}
            >
              {evaluation.overallScore}
            </div>
            <span className="mt-1 text-xs text-gray-500">out of 5</span>
          </div>
        </div>

        {/* Percentile */}
        {evaluation.comparison?.percentile && (
          <div className="mt-4 rounded-lg bg-gray-800/50 px-4 py-2">
            <span className="text-sm text-gray-400">
              You performed better than{" "}
              <span className="font-bold text-blue-400">
                {evaluation.comparison.percentile}%
              </span>{" "}
              of candidates on similar problems
            </span>
          </div>
        )}
      </div>

      {/* Dimension Scores */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Performance Breakdown
        </h3>
        <div className="space-y-3">
          {Object.entries(evaluation.dimensions).map(([key, score]) => {
            const config = DIMENSION_LABELS[key] || { label: key, icon: "📊" };
            return (
              <DimensionBar
                key={key}
                label={config.label}
                icon={config.icon}
                score={score}
              />
            );
          })}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <FeedbackSection
          title="💪 Strengths"
          items={evaluation.feedback.strengths}
          variant="success"
        />

        {/* Areas for Improvement */}
        <FeedbackSection
          title="📈 Areas for Improvement"
          items={evaluation.feedback.weaknesses}
          variant="warning"
        />
      </div>

      {/* Action Items */}
      {evaluation.feedback.actionItems.length > 0 && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="mb-3 text-sm font-semibold text-blue-400">
            🎯 Action Items for Next Time
          </h3>
          <ul className="space-y-2">
            {evaluation.feedback.actionItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-blue-400">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Questions */}
      {evaluation.feedback.followUpQuestions.length > 0 && (
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">
            🤔 Follow-up Questions to Consider
          </h3>
          <ul className="space-y-2">
            {evaluation.feedback.followUpQuestions.map((q, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-400"
              >
                <span className="text-purple-400">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Similar Problems */}
      {evaluation.comparison?.similarProblems &&
        evaluation.comparison.similarProblems.length > 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-400">
              📚 Practice Similar Problems
            </h3>
            <div className="flex flex-wrap gap-2">
              {evaluation.comparison.similarProblems.map((problem, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  {problem}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface DimensionBarProps {
  label: string;
  icon: string;
  score: number;
}

function DimensionBar({ label, icon, score }: DimensionBarProps) {
  const percentage = (score / 5) * 100;
  const getColor = (score: number) => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-center">{icon}</span>
      <span className="w-32 text-sm text-gray-300">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor(score))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold text-gray-300">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

interface FeedbackSectionProps {
  title: string;
  items: string[];
  variant: "success" | "warning";
}

function FeedbackSection({ title, items, variant }: FeedbackSectionProps) {
  if (items.length === 0) return null;

  const styles = {
    success: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      bullet: "text-green-400",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      bullet: "text-amber-400",
    },
  };

  const style = styles[variant];

  return (
    <div className={cn("rounded-xl border p-4", style.border, style.bg)}>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-gray-300"
          >
            <span className={style.bullet}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Loading skeleton for evaluation
 */
export function EvaluationCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
        <div className="h-4 w-24 rounded bg-gray-700" />
        <div className="mt-2 h-8 w-48 rounded bg-gray-700" />
        <div className="mt-4 h-16 w-full rounded bg-gray-700" />
      </div>
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
        <div className="h-6 w-32 rounded bg-gray-700" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default EvaluationCard;
