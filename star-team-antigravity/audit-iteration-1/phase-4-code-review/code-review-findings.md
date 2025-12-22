# Phase 4: Code Review Findings (Antigravity)

**Audit Date**: December 22, 2025
**Auditor**: CodeBaseGPT-Pro (Antigravity)

---

## 🔍 Deep-Dive Findings

### 1. Speculative/Hallucinated Model IDs
**File**: `src/services/modelDiscovery.ts`, `src/services/providers.ts`
**Severity**: 🟡 Medium
**Issue**: The codebase references non-existent future models:
- `gpt-5`, `gpt-5-mini`
- `claude-3-7-sonnet-20250219`
- `claude-sonnet-4-5`
- `gemini-2.5-pro`
**Risk**: Requests to these models will fail (404/400) if selected by the user.
**Recommendation**: Remove speculative models. Stick to `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`.

### 2. Stream Error Data Loss
**File**: `src/features/chat/ChatPage.tsx`
**Severity**: 🟠 High
**Issue**: In `handleSend`, if `aiService.streamChat` throws an error mid-stream, `streamingContent` is cleared before saving.
```typescript
} catch (err) {
  // ...
  setStreamingContent(""); // Clears visual content
  // Partial content is NEVER saved to 'messages'
}
```
**Risk**: User loses the paragraphs generated before the error occurred.
**Recommendation**: Save `streamingContent` to `messages` even on error.

### 3. Brittle EventStream Parser
**File**: `src/services/ai/adapters/BedrockAdapter.ts`
**Severity**: 🟡 Medium
**Issue**: The `streamMessage` method manually parses binary Amazon EventStream format (Prelude, Headers, CRC, Payload).
**Risk**: While impressive, manual binary parsing is fragile. If AWS changes the padding or header format slightly, this breaks.
**Recommendation**: Use `@aws-sdk/eventstream-codec` or similar lightweight library if possible, though strict "No SDK" rule (ARD-002 constraints?) makes this tricky. Keep as is but add robust unit tests.

### 4. Redundant Initial Fetch in Chat
**File**: `src/features/chat/ChatPage.tsx`
**Severity**: 🟢 Low (Performance)
**Issue**: `handleSend` re-fetches full history from IndexedDB:
`const historyMessages = await storageService.getMessages(conversation.id);`
**Risk**: Unnecessary DB read. The `messages` state already holds the history.
**Recommendation**: Use `messages` state directly (mapped back to Service `Message` type).

### 5. DOMPurify Configuration
**File**: `src/lib/markdown-viewer/MarkdownRenderer.tsx`
**Severity**: 🟡 Medium
**Issue**: `ADD_TAGS: ["iframe"]` allows iframes.
**Risk**: If standard Markdown allows generic iframes, XSS risk increases.
**Recommendation**: Restrict iframes to specific domains (YouTube, etc.) via `DOMPurify` hooks.

---

## 📊 Logic Quality Assessment

| Component | Logic Quality | Logic Complexity | Notes |
|-----------|---------------|------------------|-------|
| `ChatPage` | ✅ High | Medium | Good state handling. |
| `AIService` | ✅ High | Low | Clean facade pattern. |
| `BedrockAdapter` | ⚠️ Risky | High | Manual binary parsing is risky. |
| `SettingsPage` | ✅ High | Medium | Clean form/fetch logic. |
| `MarkdownRenderer` | ✅ High | High | Complex but well-structured. |

---
