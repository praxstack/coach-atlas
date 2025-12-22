/**
 * TimerDisplay Component
 *
 * Visual countdown timer with urgency-based styling:
 * - Normal (>5 min): Calm blue
 * - Warning (1-5 min): Amber
 * - Critical (<1 min): Red with pulse animation
 */
import { cn } from "@/lib/utils";
import type { TimerState } from "@/services/types/interview";

interface TimerDisplayProps {
  timer: TimerState;
  className?: string;
  showLabel?: boolean;
}

export function TimerDisplay({
  timer,
  className,
  showLabel = true,
}: TimerDisplayProps) {
  const { display, urgency, isRunning, isExpired } = timer;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold transition-all duration-300",
        // Background colors based on urgency
        urgency === "normal" && "bg-blue-500/10 text-blue-400",
        urgency === "warning" && "bg-amber-500/20 text-amber-400",
        urgency === "critical" && "bg-red-500/20 text-red-400 animate-pulse",
        // Expired state
        isExpired && "bg-red-500/30 text-red-300",
        // Paused state
        !isRunning && !isExpired && "opacity-60",
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${display}`}
    >
      {/* Timer Icon */}
      <svg
        className={cn(
          "h-5 w-5",
          urgency === "critical" && "animate-bounce"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time Display */}
      <span className="tabular-nums">{display}</span>

      {/* Optional Label */}
      {showLabel && (
        <span className="text-sm font-normal opacity-70">
          {isExpired
            ? "Time's up!"
            : !isRunning
              ? "Paused"
              : "remaining"}
        </span>
      )}
    </div>
  );
}

/**
 * Compact timer for mobile or constrained spaces
 */
export function TimerDisplayCompact({
  timer,
  className,
}: Omit<TimerDisplayProps, "showLabel">) {
  const { display, urgency, isExpired } = timer;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 font-mono text-sm font-bold",
        urgency === "normal" && "bg-blue-500/10 text-blue-400",
        urgency === "warning" && "bg-amber-500/20 text-amber-400",
        urgency === "critical" && "bg-red-500/20 text-red-400 animate-pulse",
        isExpired && "bg-red-500/30 text-red-300",
        className
      )}
      role="timer"
      aria-label={`Time remaining: ${display}`}
    >
      <span className="tabular-nums">{display}</span>
    </div>
  );
}

export default TimerDisplay;
