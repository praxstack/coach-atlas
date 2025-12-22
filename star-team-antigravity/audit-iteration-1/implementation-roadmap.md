# Implementation Roadmap: Iteration 2 (Refactoring)

**Goal**: Address Critical (P0) and High (P1) findings from Audit Iteration 1.

## Phase 1: Stabilization (Week 1)

### Task 1.1: Fix Chat Data Loss (BUG-001)
- [x] **File**: `src/features/chat/ChatPage.tsx`
- [x] **Action**: Update `handleSend` catch block to commit `streamingContent` to `messages` state and `StorageService`.

### Task 1.2: Remove Speculative Models (LOGIC-001)
- [x] **File**: `src/services/modelDiscovery.ts`
- [x] **Action**: Remove `gpt-5`, `claude-3-7`, `gemini-2.5` etc.
- [x] **Action**: Verify `providers.ts` for consistency.

### Task 1.3: Downgrade/Verify Vite
- [x] **File**: `package.json`
- [x] **Action**: Check if `vite: "^7.3.0"` is a valid constraint. Downgraded to `^6.0.0`.

## Phase 2: Testing Infrastructure (Week 1-2)

### Task 2.1: Install Vitest (QA-001)
- [x] **Action**: `npm install -D vitest @testing-library/react jsdom`
- [x] **Action**: Create `vitest.config.ts`.
- [x] **Action**: Add `test` script to `package.json`.

### Task 2.2: Add Critical Tests
- [x] **Action**: Create `src/services/ai/adapters/BedrockAdapter.test.ts`.
- [x] **Scope**: Test `parseEventStream` logic with mock binary data.

## Phase 3: Security Hardening (Week 2)

### Task 3.1: Content Security Policy (SEC-001)
- [x] **File**: `index.html`
- [x] **Action**: Add `<meta>` tag with strict CSP (connect-src: allowed providers).

### Task 3.2: Iframe Restriction (SEC-002)
- [x] **File**: `src/lib/markdown-viewer/MarkdownRenderer.tsx`
- [x] **Action**: Update `DOMPurify` config to check `iframe.src` against whitelist.

## Phase 4: Documentation (Week 2)

### Task 4.1: Updates
- [x] **File**: `README.md` (Rewrite for Coach Atlas).
- [x] **File**: `CONTRIBUTING.md` (Add).
