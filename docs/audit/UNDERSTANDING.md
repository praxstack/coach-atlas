# Coach Atlas - Understanding (comprehension lead)

Repo: praxstack/coach-atlas (PUBLIC), HEAD 4677667 (2025-12-22), branch main only, 63 commits, single author. Working tree clean. No .github dir (no CI). GitHub: 0 open issues, 0 PRs, 0 workflow runs (gh output empty).

## Purpose
Client-only React SPA: an AI technical-interview coach / tutorial studio. BYOK (OpenAI, Anthropic, Google Gemini, AWS Bedrock Claude via bearer token), chat with rich markdown (Mermaid, KaTeX, Prism, GitHub alerts), persona system, multi-conversation sidebar, "Interview Mode" simulator with progressive background evaluation, and a WebView bridge for a planned native iOS/Android shell.

## Stack
Vite 6, React 18, TypeScript (strict), Tailwind + shadcn/Radix UI, Dexie (IndexedDB), marked + marked-footnote, DOMPurify, mermaid 11, KaTeX, Prism, react-router 6, TanStack Query (instantiated, effectively unused), Vitest 4. Lockfiles: package-lock.json AND bun.lockb (dual).

## Document authority
- Authoritative-ish: README.md (thin, stale clone URL), docs/lld/*, docs/ard/*, docs/features/001-interview-mode.md, docs/01-requirements/* (added last, Dec 22).
- Historical/stale: memory-bank/* (Phase 1 snapshot, dates say 2024-12-22 but commits are 2025-12-22; checklists unchecked for features later shipped), docs/hld/implementation-plan.md (all acceptance boxes unchecked), star-team-audit/* and star-team-antigravity/* (point-in-time audits; FIXES_STATUS.md says CSP "NOT FIXED" but CSP was added in commit 14ab80e), AI_REVIEW.md (63k-line generated dump from "AI Visual Code Review" tool; committed noise, trufflehog false positives inside).
- DEPLOYMENT.md / VERCEL_DEPLOYMENT.md: deploy guides; no vercel.json in repo.

## Module map (src/, ~15k LOC TS/TSX incl. shadcn ui)
- app/: main.tsx, App.tsx (routes /, /settings, chat, interview, 404; BridgeInitializer), ServiceContext.tsx (DI of storage+ai), SidebarLayout.tsx.
- features/chat/ChatPage.tsx (436): streaming chat, persistence, persona, error handling.
- features/interview/: InterviewPage (563), context/InterviewContext (476 reducer), services/InterviewService (problem generation), services/ProgressiveEvaluator (695: micro evaluations in background, retries, 45s timeout), components (setup modal, problem panel, timer, evaluation card), hooks/useTimer.
- features/settings/SettingsPage (472): provider/key/model/region, model discovery. features/sidebar/Sidebar, features/landing/IndexPage.
- services/ai/: AIService (router + SYSTEM_PROMPT, sliding-window via ContextManager), adapters (OpenAI, Anthropic, Google, Bedrock) with streaming, retryUtils (backoff), ContextManager (token budget). services/modelDiscovery, providers.ts (static model lists), personas/index.ts (815 lines of prompts), storage/ (Dexie db + StorageService), bridge/ (WebViewBridge postMessage protocol), types/.
- lib/markdown-viewer/: MarkdownRenderer (DOMPurify + iframe allowlist), css. shared/: ui (shadcn, ~50 files), components (Hero, Navbar, Footer, AppFooter, ChatInterface, ModeShowcase...), hooks.

## Flows and data
- Config (provider, apiKey, model, region) stored as rows in IndexedDB `settings` table (StorageService.ts:131-162). Messages and conversations in Dexie db "CoachAtlasDB" v1 (db.ts). No schema migrations beyond v1.
- Chat: ChatPage -> aiService.streamChat -> adapter.streamMessage -> provider API directly from browser (CSP connect-src allowlist). Partial content saved on error.
- Interview: setup modal -> InterviewService generates problem via AI -> user answers/hints -> ProgressiveEvaluator runs background micro-evals and final evaluation; timers in useTimer.
- WebView bridge: window message listener + iOS webkit handler / AndroidBridge; navigation callback into router.
- External services: OpenAI, Anthropic, Google GenerativeLanguage, AWS Bedrock runtime (bearer token), Google Fonts. No backend, no background jobs.
- Env vars: none required (user supplies keys in UI).

## Build / run / test
npm install; npm run dev (vite, port 8080 per README); npm run build; npm run lint; npm test (vitest). Verified here: vitest 5 files / 36 tests pass (adapters x4 + retryUtils; nothing for interview, storage, ContextManager, bridge, markdown); `tsc -p tsconfig.app.json --noEmit` clean; `vite build` succeeds in ~4.6s (build.log), warns on vendor-mermaid 1.66 MB and cytoscape 645 kB chunks; eslint: 8 errors, 12 warnings.

## CI
None: no .github/. No gh runs. Lint errors are unguarded.

## Git/GitHub backlog
Single branch origin/main; no unmerged branches; no issues/PRs. Commit cadence: burst on 2025-12-22 (plus earlier Lovable scaffold "Changes", "Add BYO API key page"); last commit 2025-12-22, stagnant since.

## Roadmap vs reality (10+ claims spot-checked)
1. memory-bank progress.md lists "Streaming (SSE)", "Token management", "Multi-conversation", "Conversation sidebar", "Code splitting", "Interview mode" as unchecked (progress.md:134-145) but code exists: AIService.streamChat (AIService.ts:130), selectContext sliding window (AIService.ts:114,151), Sidebar.tsx, InterviewPage; code splitting in vite build output. Docs stale (true in reality).
2. FIXES_STATUS says CSP missing: index.html:7 has CSP (true now). Stale.
3. "Retry logic + error boundaries": retryUtils.ts + ErrorBoundary.tsx exist. Confirmed.
4. "Unit tests for all AI adapters": 4 adapter test files exist. Confirmed (tests mostly shallow).
5. "XSS protection (DOMPurify)": MarkdownRenderer.tsx:416 sanitizes; iframe allowlist hook at :400. Confirmed.
6-8. Security-related claims (CSP, key storage, WebView bridge origin checks) were spot-checked; details kept privately by the owner.
9. Search/filter history, Export to PDF/Markdown, themes (3+), "Works in iOS/Android WebView": no search/export/theme code found in Sidebar/ChatPage; WebView untestable without native host. Genuinely unbuilt.
10. useWebViewBridge hook (shared/hooks) imported by nobody; AppFooter.tsx unused (landing uses Footer); TanStack Query client created but no queries.
11. Antigravity audit "Zero test coverage": now 36 tests but only adapters/retry.
12. README clone URL points at PrakharMNNIT/coach-atlas, repo is praxstack/coach-atlas.

## Risk areas
- Security-related risk areas (key handling, rendering of model output, dependency advisories, bridge messaging): details kept privately by the owner.
- ProgressiveEvaluator (695 lines, untested), InterviewContext reducer (case-block lexical declarations), timers.
- Streaming parsers (Bedrock EventStream parsing, SSE for other providers) and error paths.
- Dexie v1 schema with no migration plan; ids use Math.random.
- Secret scan: no leaked secrets found (scanner hits were sample strings or generated caches).
