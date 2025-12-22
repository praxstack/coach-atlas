/**
 * InterviewLayout Component
 *
 * Split-pane layout for Interview Mode:
 * - Left Panel (40%): Problem Statement
 * - Right Panel (60%): Chat Interface
 * - Top Bar: Timer + Controls
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useInterview } from "../context/InterviewContext";
import { TimerDisplay } from "./TimerDisplay";

interface InterviewLayoutProps {
  problemPanel: ReactNode;
  chatPanel: ReactNode;
  className?: string;
}

export function InterviewLayout({
  problemPanel,
  chatPanel,
  className,
}: InterviewLayoutProps) {
  const {
    timer,
    status,
    canPause,
    pausesRemaining,
    pause,
    resume,
    submit,
    cancel,
  } = useInterview();

  const isActive = status === "active";
  const isPaused = status === "paused";

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Top Bar - Timer & Controls */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-3">
        {/* Left: Interview Mode Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  isActive && "animate-ping bg-green-400",
                  isPaused && "bg-amber-400",
                  !isActive && !isPaused && "bg-gray-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-3 w-3 rounded-full",
                  isActive && "bg-green-500",
                  isPaused && "bg-amber-500",
                  !isActive && !isPaused && "bg-gray-500"
                )}
              />
            </span>
            <span className="text-sm font-medium text-gray-300">
              {isActive
                ? "Interview Active"
                : isPaused
                  ? "Paused"
                  : "Interview Mode"}
            </span>
          </div>
        </div>

        {/* Center: Timer */}
        <TimerDisplay timer={timer} />

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Pause/Resume Button */}
          {(isActive || isPaused) && (
            <button
              onClick={isPaused ? resume : pause}
              disabled={!canPause && !isPaused}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isPaused
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30",
                !canPause && !isPaused && "cursor-not-allowed opacity-50"
              )}
              title={
                !canPause && !isPaused
                  ? "No pauses remaining"
                  : isPaused
                    ? "Resume interview"
                    : `Pause (${pausesRemaining} left)`
              }
            >
              {isPaused ? (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Resume
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pause
                </span>
              )}
            </button>
          )}

          {/* Finish Button */}
          {(isActive || isPaused) && (
            <button
              onClick={submit}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Finish
            </button>
          )}

          {/* Cancel Button */}
          {status !== "idle" && status !== "review" && (
            <button
              onClick={cancel}
              className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      {/* Main Content - Split Pane */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Statement (40%) */}
        <div className="w-2/5 overflow-y-auto border-r border-gray-700 bg-gray-900/50">
          {problemPanel}
        </div>

        {/* Right Panel - Chat Interface (60%) */}
        <div className="flex w-3/5 flex-col overflow-hidden bg-gray-900">
          {chatPanel}
        </div>
      </main>
    </div>
  );
}

/**
 * Mobile-optimized layout with stacked panels
 */
export function InterviewLayoutMobile({
  problemPanel,
  chatPanel,
  className,
}: InterviewLayoutProps) {
  const { timer, status } = useInterview();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Compact Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-3 py-2">
        <span className="text-sm font-medium text-gray-300">
          {status === "active" ? "🎯 Active" : status}
        </span>
        <TimerDisplay timer={timer} showLabel={false} />
      </header>

      {/* Tabbed/Stacked Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Problem (collapsible) */}
        <details className="border-b border-gray-700 bg-gray-900/50">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800">
            📝 Problem Statement
          </summary>
          <div className="max-h-64 overflow-y-auto px-4 py-2">{problemPanel}</div>
        </details>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">{chatPanel}</div>
      </main>
    </div>
  );
}

export default InterviewLayout;
