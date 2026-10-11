# coach-atlas setup (Mac, verified 2026-10-05, HEAD 4677667)

Stack: Vite + React + TS + shadcn, client-only BYOK AI coach (keys entered in the browser UI, stored in IndexedDB). No env vars required. No Xcode needed.

## Install / build / lint / test
```
cd coach-atlas
npm ci            # node 24; ok. 3 install scripts blocked by npm allowScripts (@swc/core, esbuild, fsevents) - build and tests still work
npm run build     # OK (3.8s); warns about chunks >600kB (mermaid 1.6MB, cytoscape 645kB)
npm run lint      # FAILS: 8 errors, 12 warnings (see findings)
npx vitest run    # use "run"; plain `npm test` starts watch mode. Result: 5 files, 36 tests passed, 0 failed, 0 skipped
```
## Run
- Dev: `npm run dev` -> http://localhost:8080 (vite.config.ts binds host "::", i.e. all interfaces; use `npx vite --host 127.0.0.1` to restrict).
- Prod smoke (done): `npx vite preview --host 127.0.0.1 --port 4173` -> `/`, `/index.html` returned 200 with the app shell and CSP meta tag. Stopped afterwards.
- To actually use coaching, enter your own OpenAI/Anthropic/Google/Bedrock key in the app Settings UI (manual; not tested). Network is limited by the CSP to those provider hosts.

## Known failures
- ESLint errors: ProblemPanel.tsx:136 (hook `useHint` called in onClick, rules-of-hooks), InterviewContext.tsx:119,145,146 (case-block declarations), MarkdownRenderer.tsx:149 (useless escape), command.tsx:24 and textarea.tsx:5 (empty interface), tailwind.config.ts:100 (require import).
- No e2e tests; tests cover only AI adapters + retryUtils.
