/**
 * Runs `evaluate` exactly once each time the interview enters "submitted"
 * (Finish button or timer expiry). Re-arms when status leaves "submitted".
 */
import { useEffect, useRef } from "react";

export function useEvaluateOnSubmit(
  status: string,
  evaluate: () => void | Promise<void>
): void {
  const startedRef = useRef(false);
  const evaluateRef = useRef(evaluate);
  evaluateRef.current = evaluate;

  useEffect(() => {
    if (status !== "submitted") {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    void evaluateRef.current();
  }, [status]);
}
