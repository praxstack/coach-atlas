# coach-atlas review: branch fix/audit-2026-10

Reviewer: independent Opus review, 2026-10-08. Separate fix worktree, HEAD `884faa5`, merge-base with `origin/main` = `4677667`. I made no changes to the branch. I ran probes only in throwaway worktrees, and I removed both afterwards.

> Note: this review is of the first four commits. Minors 1-5 and nit 1 were addressed by later commits on PR #1 before merge.

## Verdict: approve-with-nits

All four commits fix the root cause of the cited finding. Each new behavioural test fails on base and passes on head. Tests, typecheck and build pass. The commits add no new errors to lint, but they do add 3 warnings. I found no blockers and no majors. The minors below are latent edge cases or partial-fix limits, and FIXES.md already discloses most of them.

Counts: blocker 0, major 0, minor 5, nit 7.

## Per-commit verdicts

| Commit | Finding | Verdict | Notes |
|---|---|---|---|
| 6091946 | COA-024 P0, COA-025 P1 | approve-with-nits | Finish (`InterviewLayout.tsx:128` -> context `submit`) and timeout both reach `submitted`, and `useEvaluateOnSubmit` runs the evaluation once per entry into that status. The countdown is derived from `startTime`/`totalPausedTime`, and the pause math is correct. One latent problem: NEXT_PROBLEM now times out immediately. There is also a stale-evaluation race across sessions (minor). |
| ab63a71 | COA-033 P1 | approve-with-nits | Pattern resolution is correct for every model in the static lists and most discovered ids. A few legacy ids not in any list now get an overestimated window (minor). |
| 65a0ade | COA-034 P1 (plausible) | approve-with-nits | It switches to `max_completion_tokens` for o*/gpt-5 and sends the developer role. o1-preview/o1-mini get the system prompt folded into the first user turn. Both send paths are updated, and temperature is never sent. The 4096-token default is shared with reasoning tokens (minor). FIXES.md honestly marks this one "partial". |
| 884faa5 | COA-017 P1 | approve | The error node is built with `textContent`, and mermaid now uses `securityLevel: "strict"`. Remaining mermaid-path hardening items: details kept privately by the owner. |

## Findings

### Minor

1. **NEXT_PROBLEM now times out instantly (latent)**. `src/features/interview/context/InterviewContext.tsx:201-215` with `:391-405`. NEXT_PROBLEM resets `remainingMs` to the full duration but keeps the original `startTime`/`totalPausedTime`. The new countdown effect derives the remaining time from those fields, so it ticks to 0 and dispatches TIMEOUT on the first tick. In the page, that would start a second evaluation.
   - Evidence: a probe in the head worktree. I confirmed, advanced 61s, ran setEvaluation, then nextProblem. Status was `submitted` with `remainingMs` 0 straight away.
   - Impact: latent only, because nothing in `src/` calls `nextProblem` (`rg nextProblem`). RESTORE_SESSION has no caller either.
   - Fix: in NEXT_PROBLEM, reset `session.startTime = Date.now()` and `totalPausedTime = 0` (or track a per-problem start).

2. **A stale evaluation can land on a new session**. `InterviewContext.tsx:183-187` and `InterviewPage.tsx:278-363`. The new SET_EVALUATION guard checks status only. The sequence is: Finish, then Cancel while synthesis is in flight, then Start New Interview, then Finish again before the old promise settles. The old report is then applied to the new session, and the new session's own result is dropped, because the status is already `review`.
   - Evidence: a probe in the head worktree that reproduced it. The new session ended in `review` with the old `{modelUsed:"OLD"}` evaluation.
   - Impact: the window is narrow (one evaluation can take up to about 60s).
   - Fix: carry the session id in SET_EVALUATION and ignore the result if it doesn't match. Or use a generation counter/AbortController in `runEvaluation`.

3. **The reasoning-model output budget is shared with reasoning tokens**. `src/services/ai/adapters/OpenAIAdapter.ts:90,132`. `maxTokens` still defaults to 4096 (no caller passes it). For o1/o3/gpt-5, `max_completion_tokens` includes the hidden reasoning tokens. Long prompts can therefore return `finish_reason: "length"` with empty content, and the stream parser yields nothing without any error.
   - Fix: use a larger default for reasoning models (for example 16-32k), and/or `reasoning_effort: "low"`, and surface an empty-content + length response as an error.
   - FIXES.md says this is not verified against the live API, which is fair.

4. **The pattern table overestimates some legacy ids**, so oversized requests can return 400s where the old 8000 fallback would have truncated safely. `src/services/ai/ContextManager.ts:60-70`. Affected ids:
   - `meta.llama3-8b/70b-instruct` (Llama 3.0, 8k) -> 128000 via `/llama3/`
   - `mistral.mistral-large-2402` (32k) -> 128000
   - `anthropic.claude-instant-v1` / `anthropic.claude-v2` (100k) -> 200000
   - `gpt-3.5-turbo-instruct` / `-0613` (4k) -> 16385
   - unknown ids -> 32000 (for example Titan Lite at 4k)

   None of these are in `providers.ts`. Only the Bedrock discovery (anthropic-only filter) could still surface claude-instant/v2, and those are EOL. Every model the UI actually offers resolves to a correct or conservative value.
   - Fix: narrow to `/llama3-[1-9]/`, `/mistral-large-2407/`, and `claude-(3|sonnet|opus|haiku)`.

5. **No test exercises the page wiring**. `src/features/interview/__tests__/submitAndTimer.test.tsx`. The hook and reducer are tested in isolation. Nothing renders `InterviewContent` to prove that Finish or timeout actually calls `runEvaluation` and leaves `submitted`, which was the P0 symptom.
   - The wiring is correct on reading: Finish calls context `submit`, `useEvaluateOnSubmit(status, runEvaluation)` sits at `InterviewPage.tsx:363`, and it runs before every early return. But FIXES.md says no UI run was done, so the end-to-end path is unproven.
   - Fix: add a render test with mocked `useAIService`/`useStorageService`.

### Nit

1. `InterviewContext.tsx:59,80`: `initialState` and `interviewReducer` are now exported but nothing uses them. Together with `computeRemainingMs` they add 3 new `react-refresh/only-export-components` warnings: lint goes from 20 problems (8 errors, 12 warnings) to 23 (8 errors, 15 warnings). FIXES.md says the lint state is "pre-existing", which is slightly overstated. Fix: move the helpers to a non-component module or drop the unused exports.
2. `OpenAIAdapter.test.ts`: the test is named "for o3/gpt-5" but only checks `gpt-5`. The streaming path (`streamMessage`) request body is not asserted.
3. `OpenAIAdapter.ts:44,80`: `formatMessages` went from private to public, and `tokenLimitParam` is public, only so the tests can call them. Consider testing through the `sendMessage` body instead.
4. `OpenAIAdapter.ts:29-31`: `isReasoningModel` also catches `gpt-5-chat-latest` (not a reasoning model). This is harmless, because that model accepts both `max_completion_tokens` and `developer`. Sending `max_completion_tokens` for every chat model would be simpler.
5. `OpenAIAdapter.ts:62-75`: for o1-preview/o1-mini, if the conversation has no user message, the system prompt is silently dropped. This can't happen with current callers.
6. `mermaidError.test.ts` tests the helper but not `renderMermaidDiagrams`. Strict mode also escapes HTML tags other than `<br>` inside labels, which changes rendering for AI-generated diagrams that use inline HTML. That is acceptable, but it is an untested behaviour change.
7. `InterviewPage.tsx:62`: `isEvaluating` is still set and never read (pre-existing dead state, now more obviously dead).

## Focus-area notes

- **Evaluate-on-submit double evaluation**: none found. `startedRef` latches per entry into `submitted` and re-arms only when the status leaves it. `evaluateRef` gets the latest closure, which includes the `submitted` session. There is no StrictMode in `src/`. Even under StrictMode the ref survives the simulated remount, so the evaluation would not fire twice. TIMEOUT and TICK fire in the same callback, and TIMEOUT is ignored once the status is not active or paused.
- **Cancel races**: a late result after Cancel to idle is correctly ignored. I verified that the test fails on base (`expected 'review' to be 'idle'`) and passes on head. The cross-session race is open (minor 2).
- **Pause math**: correct. A probe paused for 30s, and remaining time was frozen at 40000. After resume plus 1s it read 39000. RESUME adds `pausedDuration` to `totalPausedTime`. The interval restarts whenever the session object changes, which is harmless.
- **Context-limit patterns**: the `o[1-9]` alternation needs a non-letter before the `o`. I checked it against all static Claude, Bedrock, Gemini, Llama and Titan ids and found no false positives. The pattern order is correct. Every id in the static lists resolves correctly or conservatively.
- **OpenAI reasoning params**: correct for both send paths. See minor 3 and nits 2-5.
- **Mermaid XSS**: the error-path sink is fixed. Remaining hardening items on this path: details kept privately by the owner.

## Check results (head 884faa5 vs base 4677667)

| Check | Base | Head |
|---|---|---|
| `npx vitest run` | 5 files, 36 tests pass (SETUP.md) | 8 files, 56 tests pass |
| New tests run against base sources | n/a | 13 assertions fail on base: ContextManager 11/12, OpenAI 2/3. `submitAndTimer` and `mermaidError` fail on import because the modules don't exist on base. I copied the cancel test into base without the new imports, and it failed with `expected 'review' to be 'idle'`. |
| `tsc -p tsconfig.app.json --noEmit` | clean (SETUP.md) | clean |
| `npm run build` | OK | OK (built in 54s; chunk-size warnings only) |
| `npm run lint` (measured both) | 8 errors, 12 warnings | 8 errors, 15 warnings. The errors are identical. The +3 warnings are all react-refresh in `InterviewContext.tsx`. |

Scope and hygiene: no dependency or lockfile changes, no unrelated files, no secrets. Each commit message matches its diff. Nothing was pushed.

## FIXES.md claims I could not confirm

- COA-024/025 end-to-end in the UI: FIXES.md says no browser run was done, and I didn't do one either. I confirmed the wiring by static reading and with hook/reducer tests only.
- COA-034 behaviour against the live OpenAI API: not verified, and live calls are out of bounds for this review.
- "lint not clean (pre-existing errors)": the errors are pre-existing, but the branch adds 3 warnings.
- I confirmed all other claims: 56 tests, the tsc and build results, "11 fail on old code", and "fails on old reducer".
