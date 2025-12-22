# Task 003: Service Layer Implementation (BYOK)

**Assigned To**: Cline (Senior Developer)
**Approver**: AntiGravity (Principal SDE)
**Prerequisites**: Task 001, ARD-002, LLD-002

## Context
We need to implement the core business logic in a framework-agnostic Service Layer.

## Objectives
1.  Implement `StorageService` (Dexie.js wrapper).
2.  Implement `AIService` (OpenAI/Anthropic integration).
3.  Inject into React via Context.

## Detailed Steps

### Step 1: Storage Service
- [ ] Install `dexie`.
- [ ] Create `src/services/storage/db.ts` (Dexie schema defined in LLD-002).
- [ ] Implement `src/services/storage/StorageService.ts`:
    - `saveMessage(msg)`
    - `getConversation(id)`
    - `saveSettings(key, value)` (Encryption optional for Phase 1, but interface should support it).

### Step 2: AI Service adapters
- [ ] Create `src/services/ai/types.ts` (`Message`, `StreamChunk`).
- [ ] Create `src/services/ai/adapters/OpenAIAdapter.ts`.
    - **CRITICAL**: Use `fetch`, not `openai` SDK (for smaller bundle size & direct control).
    - Headers: `Authorization: Bearer ${apiKey}`.
- [ ] Create `src/services/ai/AIService.ts` (The Facade).
    - Method `sendMessage(messages, providerConfig)`.

### Step 3: Provider Injection
- [ ] Create `src/app/providers.tsx` (if not exists).
- [ ] Initialize singletons: `const ai = new AIService();`.
- [ ] Provide to `ServiceContext`.

## Deliverables
- Users can save API keys (persisted to IndexDB or LocalStorage).
- Users can send a message using `AIService` and see the raw response log to console.
