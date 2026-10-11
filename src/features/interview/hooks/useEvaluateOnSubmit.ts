/**
 * Runs `evaluate` once each time the interview enters "submitted"
 * (Finish button or timer expiry). The signal it receives is aborted when the
 * status leaves "submitted" (e.g. Cancel & Return) or the page unmounts, so
 * provider requests for a cancelled evaluation stop.
 */
import { useEffect, useRef } from "react";

export function useEvaluateOnSubmit(
  status: string,
  evaluate: (signal: AbortSignal) => void | Promise<void>
): void {
  const evaluateRef = useRef(evaluate);
  evaluateRef.current = evaluate;

  useEffect(() => {
    if (status !== "submitted") return;
    const controller = new AbortController();
    void evaluateRef.current(controller.signal);
    return () => controller.abort();
  }, [status]);
}
