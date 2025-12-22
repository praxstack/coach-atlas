# Coach Atlas - Active Context

## Current Session Focus

**Date**: 2024-12-22
**Objective**: Complete Sr Principal SDE code review, identify gaps, create implementation plan

## Recent Analysis Summary

### Code Review Findings (Critical Issues)

#### 1. **Chat.tsx - Production Gaps**

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| No streaming support | High | `callOpenAI`, `callAnthropic`, `callGoogle` | Poor UX, long wait times |
| No markdown rendering | Critical | Message display | Raw markdown shown to users |
| No error retry logic | Medium | API calls | Failed requests not retried |
| No conversation persistence | High | State management | Chat lost on refresh |
| AWS Bedrock not functional | Medium | `handleSend` switch | Provider unusable |
| No rate limiting | Medium | API calls | Risk of API abuse/costs |
| No input sanitization | High | User input | XSS vulnerability potential |

#### 2. **Settings.tsx - Validation Gaps**

| Issue | Severity | Impact |
|-------|----------|--------|
| No API key validation | High | Users don't know if key is valid until chat |
| No model availability check | Medium | Selected model may not be accessible |
| No credential encryption | Medium | Keys stored in plain text |

#### 3. **Index.tsx (Landing Page) - Completeness**

| Issue | Severity | Impact |
|-------|----------|--------|
| ChatInterface is demo only | Medium | Misleading users |
| Sign In/Get Started non-functional | Low | UI elements do nothing |
| No actual navigation from feature cards | Low | Dead-end interactions |

#### 4. **System Prompt - Underutilized**

The excellent system prompt in Chat.tsx is underutilized:
- No mode switching (Interview vs Tutorial)
- No structured output parsing
- No context awareness for follow-ups
- No escalating hint system implementation

### Architectural Gaps

1. **No Error Boundaries** - App can crash on render errors
2. **No Loading Skeletons** - Jarring content pops
3. **No Virtualization** - Long conversations will lag
4. **No Code Splitting** - Single bundle loaded
5. **No Service Worker** - No offline capability
6. **No Analytics** - No usage insights
7. **No A11y Implementation** - WCAG not addressed

### Missing Features (Per BRD Requirements)

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown rendering in chat | ❌ Missing | P0 |
| Syntax highlighting | ❌ Missing | P0 |
| Mermaid diagrams | ❌ Missing | P1 |
| KaTeX math rendering | ❌ Missing | P2 |
| Streaming responses | ❌ Missing | P0 |
| Chat history persistence | ❌ Missing | P0 |
| Tutorial mode | ❌ Missing | P1 |
| Interview mode toggle | ❌ Missing | P1 |
| Export functionality | ❌ Missing | P2 |
| WebView compatibility | ❌ Missing | P1 |

## Markdown Viewer Pro Integration Plan

### Repository Analysis
From https://github.com/PrakharMNNIT/markdown-viewer-app:

**Key Features to Port:**
1. Real-time markdown preview
2. 12 themes (6 base × 2 variants)
3. PrismJS syntax highlighting (20+ languages)
4. Mermaid diagram support
5. KaTeX math rendering
6. Export to HTML/PDF
7. Custom theme builder

**Integration Strategy:**
```
Option A: Extract Core Modules
- Copy markdown rendering logic
- Copy Prism + Mermaid initialization
- Adapt themes to Tailwind
- Bundle size impact: ~150KB

Option B: Create Shared Package
- Publish @coach-atlas/markdown-renderer
- Import in both projects
- Maintain separately
- Bundle size impact: ~100KB (tree-shaken)

Option C: WebView Hybrid (RECOMMENDED)
- Use Markdown Viewer Pro as iframe/WebView for tutorials
- Use simplified markdown for chat bubbles
- Best of both worlds
- Bundle size impact: ~50KB in main app
```

### Files to Port from Markdown Viewer Pro

```
From: markdown-viewer-app/src/js/
├── markdown/
│   ├── parser.js      → src/lib/markdown/parser.ts
│   ├── renderer.js    → src/lib/markdown/renderer.ts
│   └── sanitizer.js   → src/lib/markdown/sanitizer.ts
├── syntax/
│   └── prism-init.js  → src/lib/syntax/prism.ts
├── diagrams/
│   └── mermaid-init.js→ src/lib/diagrams/mermaid.ts
└── math/
    └── katex-init.js  → src/lib/math/katex.ts

From: markdown-viewer-app/themes/
└── *.css              → src/styles/markdown-themes/
```

## Open Questions

1. **Should tutorials open in full-screen mode?** - Like Markdown Viewer Pro's Zen mode
2. **Should we implement conversation branching?** - Fork from any message
3. **Should code execution be supported?** - Run code snippets (security implications)
4. **How to handle very long tutorials?** - Virtual scrolling vs pagination

## Immediate Next Steps

1. Create comprehensive BRD document
2. Create implementation plan with phases
3. Set up proper project structure
4. Install missing dependencies
5. Implement markdown rendering component
6. Add streaming support to Chat

## Technical Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Use Option C for Markdown integration | Minimal main bundle, full features for tutorials | 2024-12-22 |
| Add Vitest over Jest | Faster, native ESM, Vite integration | 2024-12-22 |
| Use marked + DOMPurify over react-markdown | Better performance, more control | 2024-12-22 |
| Add Error Boundaries at route level | Graceful degradation | 2024-12-22 |

## Blockers

1. **npm install failing** - Need to run `npm install` to fix missing node_modules
2. **No memory-bank existed** - Created fresh (this session)
3. **TypeScript strict mode off** - Will cause refactoring when enabled

## Team Roles & Workflow

### AntiGravity (Principal SDE)
- **Role**: Architect, Reviewer, Approver.
- **Responsibilities**:
    - Define Architecture & Schemas.
    - Review PRs/Codebase against Standards.
    - Identify Security & Performance Risks.
    - **No Code Implementation**.

### Cline (Senior Developer)
- **Role**: Implementer.
- **Responsibilities**:
    - Write Code & Tests.
    - Execute Implementation Plans.
    - manage Dependencies.

## Current Focus
We are currently in the **Planning & Architecture Refinement** phase.
## Current Working Branch

- Main branch: `main`
- Latest commit: `a2452178b19233efa03063d5ce1bcd37ff122f13`
- Status: Needs significant development work

## Session Notes

- Project scaffolded via Lovable.dev
- 40+ shadcn/ui components pre-installed (many unused)
- System prompt is excellent, needs implementation support
- Landing page is polished, functionality is incomplete
- WebView compatibility will be straightforward (static SPA)

---

## Sr Principal SDE Evaluation: Gemini/Antigravity Plan

### Document Reviewed
`/Users/praxlannister/.gemini/antigravity/brain/c287e139-10e4-4803-87d6-10279b216575/implementation_plan.md.resolved`

### Overall Assessment: ✅ APPROVED with Minor Enhancements

The Gemini plan is **solid, well-structured, and production-ready**. It correctly identifies the critical gaps and proposes sensible solutions.

### Strengths
| Aspect | Assessment |
|--------|------------|
| Phase ordering | ✅ Correct - Visual first, then persistence |
| Markdown stack | ✅ `react-markdown` + `remark-gfm` + `rehype-highlight` is industry standard |
| Persistence | ✅ IndexedDB via Dexie.js is the right choice |
| WebView bridge | ✅ `postMessage` protocol is correct |
| Security | ✅ TypeScript strict mode is essential |

### Recommendations (Enhancements)

| Item | Gemini Plan | My Addition | Priority |
|------|-------------|-------------|----------|
| Markdown lib | `react-markdown` | Consider `marked` for smaller bundle | P2 |
| Math support | `rehype-katex` | ✅ Agreed | P2 |
| Diagrams | `mermaid` | Add lazy loading (heavy lib) | P1 |
| History UI | Sidebar | Add search + tags + starred | P2 |
| Export | JSON only | Add Markdown export too | P2 |
| Streaming | Not mentioned | Add streaming for all providers | P0 |

### Key Agreements
1. **IndexedDB + Dexie.js** - Correct choice for offline-first persistence
2. **AIProvider abstraction** - Essential for clean architecture
3. **WebView bridge** - `postMessage` protocol is standard
4. **TypeScript strict** - Non-negotiable for production

### Reconciled Implementation Order

```
Phase 1: Visual Learning (Gemini) → Core Chat (Cline)
├── MarkdownRenderer component
├── Code syntax highlighting (Prism/rehype-highlight)
├── Mermaid diagrams (lazy loaded)
├── Typography styling

Phase 2: WebView (Gemini) + Streaming (Cline)
├── vite.config.ts base path
├── useWebViewBridge hook
├── Streaming for OpenAI, Anthropic, Google
├── Progressive markdown rendering

Phase 3: Architecture (Gemini) + Error Handling (Cline)
├── AIProvider abstraction
├── TypeScript strict mode
├── Error boundaries
├── Loading skeletons

Phase 4: Guided Discovery UI (Gemini)
├── Hint vs Solution styling
├── Interview mode toggle
├── Tutorial mode detection

Phase 5: Persistence (Gemini) + Export (Cline)
├── Dexie.js schema
├── Conversation/Message storage
├── History sidebar with search
├── Export to JSON + Markdown
├── localStorage migration

Phase 6: Testing & Polish (Cline)
├── Vitest setup (85% coverage)
├── E2E tests (Cypress)
├── Accessibility audit
├── Performance optimization
```

### Final Verdict

**The Gemini plan and my analysis are ~90% aligned.** The main additions I recommend:

1. **Streaming responses** - Critical P0 missing from Gemini plan
2. **Markdown export** - Users want `.md` files, not just JSON
3. **Lazy loading Mermaid** - 500KB+ library needs code splitting
4. **Search/filter for history** - Essential UX for many conversations

Both plans can be executed together. I recommend starting with **Phase 1: Visual Learning** as Gemini suggests, since the chat needs to look good before we worry about persistence.

---

## Persistence Strategy Summary

**Technology**: IndexedDB via Dexie.js (free, unlimited, offline-first)

**Schema**:
- `conversations`: id, title, mode, provider, createdAt, tags, starred
- `messages`: id, conversationId, role, content, timestamp, metadata
- `settings`: id, provider, model, credentials, preferences

**Key Features**:
- Live queries (UI auto-updates)
- Context restoration (load last N messages for AI)
- Export/Import JSON
- Storage quota management
- localStorage migration

**Documentation**: `docs/03-database/persistence-strategy.md`
