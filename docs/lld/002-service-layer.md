# LLD-002: Service Layer Abstraction

**Status**: Approved
**Date**: 2024-12-22
**Author**: AntiGravity (Principal SDE)
**Context**: API calls and DB logic are currently mixed into React components (`Chat.tsx` calling `fetch`). This violates clean architecture, makes testing impossible, and breaks with WebView limitations.

## 1. Architecture

We will implement a **Service-Repository Pattern** adapted for the Client-Side.

```mermaid
graph TD
    UI[React Components] --> Hooks[Custom Hooks]
    Hooks --> Context[React Context Providers]
    Context --> Services[Service Classes (Singleton)]
    Services --> APIs[External APIs / DB]
```

## 2. The Services

We will define these core services in `src/services/`:

### 2.1 `AIService` (Polymorphic)
*   **Interface**: `sendMessage(messages: Message[], config: Config): Promise<Stream<string>>`
*   **Adapters**: `OpenAIAdapter`, `AnthropicAdapter`, `GoogleAdapter`.
*   **Responsibility**: Handles raw HTTP requests, error parsing, and stream transformation. **BYOK logic lives here.**

### 2.2 `StorageService` (Repository)
*   **Technology**: `Dexie.js` (IndexedDB).
*   **Repositories**:
    *   `ConversationRepository`: Save/Load chats.
    *   `SettingsRepository`: Save/Load API keys (encrypted/safe storage).
*   **Responsibility**: Abstract the specific DB technology. Allow swapping `localStorage` for `IndexedDB` seamlessly.

### 2.3 `BridgeService` (WebView)
*   **Responsibility**: Handle `window.postMessage` communication with native apps.
*   **Signals**: `onTokenUpdate`, `onNavigation`, `onShare`.

## 3. React Integration

Services are **Pure TypeScript Classes** (no React). They are injected via **React Context**.

```tsx
// src/app/providers.tsx
const aiService = new AIService();
const storageService = new StorageService();

export function AppProviders({ children }) {
  return (
    <ServicesContext.Provider value={{ aiService, storageService }}>
      {children}
    </ServicesContext.Provider>
  )
}
```

## 4. Why?
*   **Testability**: We can unit test `AIService` without rendering React components.
*   **Portability**: The same services can be used in a React Native implementation later.
*   **Separation**: `ChatPage.tsx` focuses on UI state, not `fetch` error handling.
