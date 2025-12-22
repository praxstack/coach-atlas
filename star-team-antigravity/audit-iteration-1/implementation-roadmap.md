# Implementation Roadmap: Iteration 2 (Refactoring)

**Goal**: Address Critical (P0) and High (P1) findings from Audit Iteration 1.

## Phase 1: Stabilization (Week 1)

### Task 1.1: Fix Chat Data Loss (BUG-001)
- **File**: `src/features/chat/ChatPage.tsx`
- **Action**: Update `handleSend` catch block to commit `streamingContent` to `messages` state and `StorageService` before handling error.

### Task 1.2: Remove Speculative Models (LOGIC-001)
- **File**: `src/services/modelDiscovery.ts`
- **Action**: Remove `gpt-5`, `claude-3-7`, `gemini-2.5` etc.
- **Action**: Verify `providers.ts` for consistency.

### Task 1.3: Downgrade/Verify Vite
- **File**: `package.json`
- **Action**: Check if `vite: "^7.3.0"` is a valid constraint or a hallucination/alpha. Revert to `^6.0.0` if needed.

## Phase 2: Testing Infrastructure (Week 1-2)

### Task 2.1: Install Vitest (QA-001)
- **Action**: `npm install -D vitest @testing-library/react jsdom`
- **Action**: Create `vitest.config.ts`.
- **Action**: Add `test` script to `package.json`.

### Task 2.2: Add Critical Tests
- **Action**: Create `src/services/ai/adapters/BedrockAdapter.test.ts`.
- **Scope**: Test `parseEventStream` logic with mock binary data.

## Phase 3: Security Hardening (Week 2)

### Task 3.1: Content Security Policy (SEC-001)
- **File**: `index.html`
- **Action**: Add `<meta>` tag with strict CSP (connect-src: allowed providers).

### Task 3.2: Iframe Restriction (SEC-002)
- **File**: `src/lib/markdown-viewer/MarkdownRenderer.tsx`
- **Action**: Update `DOMPurify` config to check `iframe.src` against whitelist.

## Phase 4: Documentation (Week 2)

### Task 4.1: Updates
- **File**: `README.md` (Rewrite for Coach Atlas).
- **File**: `CONTRIBUTING.md` (Add).
