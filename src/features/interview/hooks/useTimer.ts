/**
 * useTimer Hook
 * Precision timer using Date.now() deltas (not setInterval--)
 * Prevents drift over 45-minute sessions
 */
import {
  INTERVIEW_CONSTANTS,
  TimerState,
} from "@/services/types/interview";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  /** Duration in milliseconds */
  durationMs: number;
  /** Callback when timer expires */
  onExpire?: () => void;
  /** Auto-start on mount */
  autoStart?: boolean;
}

interface UseTimerReturn {
  timer: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addTime: (ms: number) => void;
}

/**
 * Format milliseconds to "MM:SS" or "HH:MM:SS" display
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Determine urgency level based on remaining time
 */
function getUrgency(
  remainingMs: number
): "normal" | "warning" | "critical" {
  if (remainingMs <= INTERVIEW_CONSTANTS.CRITICAL_THRESHOLD_MS) {
    return "critical";
  }
  if (remainingMs <= INTERVIEW_CONSTANTS.WARNING_THRESHOLD_MS) {
    return "warning";
  }
  return "normal";
}

/**
 * High-precision countdown timer hook
 * Uses Date.now() delta calculation to prevent drift
 */
export function useTimer({
  durationMs,
  onExpire,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  // State
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);

  // Refs for precise timing
  const startTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef(durationMs);
  const rafIdRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /**
   * Animation frame loop for precision timing
   * This uses delta time calculation, not interval decrement
   */
  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = pausedRemainingRef.current - elapsed;

    if (remaining <= 0) {
      setRemainingMs(0);
      setIsRunning(false);
      setIsExpired(true);
      startTimeRef.current = null;
      onExpireRef.current?.();
      return;
    }

    setRemainingMs(remaining);
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  /**
   * Start the timer
   */
  const start = useCallback(() => {
    if (isExpired) return;

    startTimeRef.current = Date.now();
    pausedRemainingRef.current = remainingMs;
    setIsRunning(true);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [isExpired, remainingMs, tick]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    if (!isRunning || !startTimeRef.current) return;

    // Calculate remaining time at pause moment
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = pausedRemainingRef.current - elapsed;

    pausedRemainingRef.current = remaining;
    setRemainingMs(remaining);
    setIsRunning(false);
    startTimeRef.current = null;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [isRunning]);

  /**
   * Resume the timer from paused state
   */
  const resume = useCallback(() => {
    if (isRunning || isExpired) return;

    startTimeRef.current = Date.now();
    setIsRunning(true);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [isRunning, isExpired, tick]);

  /**
   * Reset timer to initial duration
   */
  const reset = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    startTimeRef.current = null;
    pausedRemainingRef.current = durationMs;
    setRemainingMs(durationMs);
    setIsRunning(false);
    setIsExpired(false);
  }, [durationMs]);

  /**
   * Add time to the timer (e.g., bonus time)
   */
  const addTime = useCallback((ms: number) => {
    const newRemaining = remainingMs + ms;
    pausedRemainingRef.current = newRemaining;
    setRemainingMs(newRemaining);

    if (isExpired && newRemaining > 0) {
      setIsExpired(false);
    }
  }, [remainingMs, isExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isRunning && !isExpired) {
      start();
    }
  }, [autoStart, isRunning, isExpired, start]);

  // Build timer state object
  const timer: TimerState = {
    remainingMs,
    isRunning,
    isExpired,
    display: formatTime(remainingMs),
    urgency: getUrgency(remainingMs),
  };

  return {
    timer,
    start,
    pause,
    resume,
    reset,
    addTime,
  };
}

export default useTimer;
