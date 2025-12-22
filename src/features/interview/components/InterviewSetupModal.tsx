/**
 * InterviewSetupModal Component
 *
 * Modal for configuring interview settings before starting:
 * - Interview type (coding, system-design, behavioral)
 * - Topic selection
 * - Difficulty level
 * - Duration
 */
import { cn } from "@/lib/utils";
import type { Difficulty, InterviewConfig, InterviewType } from "@/services/types/interview";
import { INTERVIEW_CONSTANTS } from "@/services/types/interview";
import { useState } from "react";

interface InterviewSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: InterviewConfig) => void;
  isLoading?: boolean;
}

const INTERVIEW_TYPES: { value: InterviewType; label: string; icon: string; desc: string }[] = [
  {
    value: "coding",
    label: "Coding Round",
    icon: "💻",
    desc: "Data structures, algorithms, problem solving",
  },
  {
    value: "system-design",
    label: "System Design",
    icon: "🏗️",
    desc: "Architecture, scalability, trade-offs",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    icon: "🗣️",
    desc: "STAR method, leadership, teamwork",
  },
];

const CODING_TOPICS = [
  "Arrays & Strings",
  "Hash Tables",
  "Linked Lists",
  "Stacks & Queues",
  "Trees & Graphs",
  "Dynamic Programming",
  "Recursion & Backtracking",
  "Sorting & Searching",
  "Bit Manipulation",
  "Math & Geometry",
];

const SYSTEM_DESIGN_TOPICS = [
  "URL Shortener",
  "Chat System",
  "Feed/Timeline",
  "File Storage",
  "Rate Limiter",
  "Search Autocomplete",
  "Notification Service",
  "Video Streaming",
];

const BEHAVIORAL_TOPICS = [
  "Leadership",
  "Conflict Resolution",
  "Failure & Learning",
  "Technical Decision Making",
  "Cross-team Collaboration",
  "Mentoring",
  "Project Ownership",
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; time: number }[] = [
  { value: "easy", label: "Easy", color: "text-green-400", time: 30 },
  { value: "medium", label: "Medium", color: "text-amber-400", time: 45 },
  { value: "hard", label: "Hard", color: "text-red-400", time: 60 },
];

export function InterviewSetupModal({
  isOpen,
  onClose,
  onStart,
  isLoading = false,
}: InterviewSetupModalProps) {
  const [type, setType] = useState<InterviewType>("coding");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [duration, setDuration] = useState<number>(INTERVIEW_CONSTANTS.DEFAULT_DURATION_MINUTES);
  const [problemCount, setProblemCount] = useState<number>(1);

  const topics =
    type === "coding"
      ? CODING_TOPICS
      : type === "system-design"
        ? SYSTEM_DESIGN_TOPICS
        : BEHAVIORAL_TOPICS;

  // Reset topic when type changes
  const handleTypeChange = (newType: InterviewType) => {
    setType(newType);
    setTopic("");
  };

  // Update duration based on difficulty
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    const defaultTime = DIFFICULTIES.find((d) => d.value === newDifficulty)?.time || 45;
    setDuration(defaultTime);
  };

  const handleStart = () => {
    if (!topic) return;
    onStart({
      type,
      topic,
      difficulty,
      durationMinutes: duration,
      problemCount,
    });
  };

  const canStart = topic.length > 0 && !isLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            🎯 Start Mock Interview
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Configure your interview session
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interview Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    "rounded-lg border p-3 text-center transition-all",
                    type === t.value
                      ? "border-blue-500 bg-blue-500/20 text-white"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  )}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div className="mt-1 text-xs font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-all",
                    topic === t
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Custom topic input */}
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Or type a custom topic..."
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleDifficultyChange(d.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-center transition-all",
                    difficulty === d.value
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  )}
                >
                  <span className={cn("font-medium", d.color)}>{d.label}</span>
                  <div className="text-xs text-gray-500">{d.time} min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Duration
              </label>
              <span className="text-sm text-blue-400 font-mono">{duration} min</span>
            </div>
            <input
              type="range"
              min={15}
              max={90}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15 min</span>
              <span>90 min</span>
            </div>
          </div>

          {/* Problem Count (for coding only) */}
          {type === "coding" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Problems
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setProblemCount(count)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-center transition-all",
                      problemCount === count
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                    )}
                  >
                    {count} {count === 1 ? "problem" : "problems"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "rounded-lg px-6 py-2 text-sm font-medium transition-colors",
              canStart
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-700 text-gray-500"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "🚀 Start Interview"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSetupModal;
