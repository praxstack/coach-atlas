# coach-atlas fixes (branch fix/audit-2026-10)

Checks after final commit: `npx vitest run` 8 files / 56 tests pass (baseline 36); `tsc -p tsconfig.app.json --noEmit` clean; `npm run build` OK. `npm run lint` not clean (pre-existing errors, COA-005 P3, out of scope). Nothing pushed.

| ID | Sev | Status | Commit | Test evidence | Remains |
|---|---|---|---|---|---|
| COA-024 | P0 | fixed | 6091946 | src/features/interview/__tests__/submitAndTimer.test.tsx: useEvaluateOnSubmit fires once on "submitted"; late SET_EVALUATION after cancel ignored (fails on old reducer) | handleSubmit removed; evaluation now runs from an effect on status "submitted" (Finish and timeout share it). No browser/UI run done. |
| COA-025 | P1 | fixed | 6091946 (same commit as 024, files overlap) | same test file: computeRemainingMs; fake-timer test shows TICK countdown and TIMEOUT -> submitted (failed before: no export/ticking) | Provider drives the clock from session.startTime/totalPausedTime; useTimer hook still unused. |
| COA-033 | P1 | fixed | ab63a71 | src/services/ai/ContextManager.test.ts 12 tests (11 fail on old code) | Fallback raised 8000 -> 32000; table still static, new families need a pattern. |
| COA-034 | P1 (plausible) | partial | 65a0ade | OpenAIAdapter.test.ts: gpt-5 sends max_completion_tokens + developer role; gpt-4o unchanged; o1-mini folds system prompt into first user turn | Not verified against live API. providers.ts still lists o1-preview/o1-mini (retired/unsupported streaming; model-list pruning needs owner decision, see COA-035). |
| COA-017 | P1 | fixed | (see git log, top commit) | src/lib/markdown-viewer/mermaidError.test.ts: payload stays text, no <img> created | Also set mermaid securityLevel "strict". |

Skipped as out of scope (P2/P3): all other findings. Refuted/duplicate not touched.

Later review and Codex follow-ups on PR #1 (timer reset, session-scoped evaluations, reasoning-model token budget, legacy context windows, render tests, evaluation mutex, abortable requests and streams) are recorded in the PR itself.
