# Coach Atlas - System Patterns & Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │   Hooks     │  │    Lib      │    │
│  │  - Index    │  │  - Hero     │  │  - useMobile│  │  - providers│    │
│  │  - Chat     │  │  - Chat     │  │  - useToast │  │  - utils    │    │
│  │  - Settings │  │  - Features │  │  - useChat* │  │  - markdown*│    │
│  │  - NotFound │  │  - UI (40+) │  │  - useStream│  │  - storage  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│                         State Management                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  React Query    │  │  Local State    │  │  LocalStorage   │         │
│  │  (API caching)  │  │  (UI state)     │  │  (persistence)  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Direct API Calls (HTTPS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        External AI Providers                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │  OpenAI   │  │ Anthropic │  │  Google   │  │  Bedrock  │            │
│  │  GPT-4/5  │  │  Claude   │  │  Gemini   │  │  (Future) │            │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Provider Pattern (AI Providers)
```typescript
// Current Implementation in src/lib/providers.ts
interface ProviderConfig {
  id: Provider;
  name: string;
  description: string;
  models: Model[];
  fields: Field[];
}

// Pattern: Strategy Pattern for API calls
interface AIProvider {
  call(messages: Message[], config: Config): Promise<Response>;
  stream(messages: Message[], config: Config): AsyncGenerator<string>;
  validateCredentials(credentials: Record<string, string>): boolean;
}
```

### 2. Component Architecture
```
┌─────────────────────────────────────────────────┐
│                   Page Layer                     │
│  (Route-level components with data fetching)    │
├─────────────────────────────────────────────────┤
│                 Feature Layer                    │
│  (Domain-specific composed components)          │
├─────────────────────────────────────────────────┤
│                    UI Layer                      │
│  (shadcn/ui primitives, design system)          │
└─────────────────────────────────────────────────┘
```

### 3. State Management Pattern
```
┌─────────────────────────────────────────────────┐
│              React Query (Server State)          │
│  - API responses                                 │
│  - Caching & invalidation                        │
│  - Background refetch                            │
├─────────────────────────────────────────────────┤
│              React State (UI State)              │
│  - Form inputs                                   │
│  - Modal open/close                              │
│  - Local UI interactions                         │
├─────────────────────────────────────────────────┤
│              LocalStorage (Persistence)          │
│  - API credentials                               │
│  - Chat history                                  │
│  - User preferences                              │
└─────────────────────────────────────────────────┘
```

## Data Flow

### Chat Message Flow
```
User Input → Message Object → Provider Selection → API Call →
Stream/Response → Markdown Parse → Render → Persist to LocalStorage
```

### Settings Flow
```
User Selection → Form State → Validation → LocalStorage →
Config Context → Available to Chat
```

## Domain Boundaries

### 1. Chat Domain
- **Responsibility**: Message handling, conversation management
- **Components**: ChatInterface, MessageBubble, InputArea
- **State**: Messages array, loading, error, streaming status
- **Persistence**: LocalStorage (chat history)

### 2. Provider Domain
- **Responsibility**: AI provider abstraction, API calls
- **Components**: None (pure logic)
- **State**: Provider config, credentials
- **Persistence**: LocalStorage (credentials)

### 3. Markdown Domain (NEW - Markdown Viewer Pro Integration)
- **Responsibility**: Content rendering, syntax highlighting, diagrams
- **Components**: MarkdownRenderer, CodeBlock, MermaidDiagram
- **State**: Render mode, theme
- **Dependencies**: PrismJS, Mermaid, KaTeX

### 4. Tutorial Domain (NEW)
- **Responsibility**: Structured content generation, export
- **Components**: TutorialView, TutorialExport, TableOfContents
- **State**: Tutorial structure, export format
- **Persistence**: LocalStorage (saved tutorials)

## Error Handling Strategy

### Error Types
```typescript
enum ErrorType {
  NETWORK = 'network',
  API_AUTH = 'api_auth',
  API_RATE_LIMIT = 'api_rate_limit',
  API_CONTENT = 'api_content',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  RENDER = 'render'
}

interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  action?: () => void;
}
```

### Error Boundaries
```
App Error Boundary (crash recovery)
  └─ Route Error Boundary (page-level)
      └─ Feature Error Boundary (chat, tutorial)
          └─ Component Error Boundary (markdown render)
```

## Inter-Component Communication

### Event Patterns
1. **Props Down, Events Up** - Standard React pattern
2. **Context for Cross-Cutting** - Theme, config, providers
3. **Custom Events for WebView** - Bridge to native app

### WebView Communication Protocol
```typescript
interface WebViewBridge {
  // From React to Native
  postMessage(type: string, payload: any): void;

  // From Native to React
  onMessage(handler: (event: MessageEvent) => void): void;
}

// Message Types
type WebViewMessage =
  | { type: 'SHARE_CONTENT', payload: { content: string, format: 'md' | 'pdf' } }
  | { type: 'COPY_CODE', payload: { code: string } }
  | { type: 'OPEN_EXTERNAL', payload: { url: string } }
  | { type: 'CONFIG_UPDATE', payload: StoredConfig };
```

## Scalability Considerations

### Bundle Optimization
- **Code Splitting**: Route-level lazy loading
- **Tree Shaking**: Only import used UI components
- **Dynamic Imports**: Heavy libraries (Mermaid, KaTeX) loaded on demand

### Performance Patterns
- **Virtualization**: Long message lists
- **Debouncing**: Input handling, resize events
- **Memoization**: Markdown render cache
- **Streaming**: SSE for real-time responses

## Security Architecture

### API Key Protection
```
┌─────────────────────────────────────────┐
│           Browser Environment            │
│  ┌───────────────────────────────────┐  │
│  │        LocalStorage               │  │
│  │  - Encrypted at rest (AES-256)    │  │
│  │  - Never included in URLs         │  │
│  │  - Never sent to our servers      │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│                    ▼                     │
│  ┌───────────────────────────────────┐  │
│  │    Direct HTTPS to Providers      │  │
│  │  - TLS 1.3                        │  │
│  │  - Certificate pinning (WebView)  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Content Security
- **XSS Prevention**: DOMPurify for markdown HTML
- **CSP Headers**: Restrict script sources
- **Input Validation**: Sanitize all user inputs

## Testing Strategy

### Test Pyramid
```
        ┌─────────┐
        │   E2E   │  (10%)
        │ Cypress │
        ├─────────┤
       │Integration│ (30%)
       │ Component │
       ├───────────┤
      │    Unit    │ (60%)
      │   Vitest   │
      └────────────┘
```

### Critical Path Tests
1. API configuration flow
2. Chat send/receive
3. Markdown rendering
4. Error handling
5. LocalStorage persistence
6. WebView bridge communication

## Module Dependencies

```
src/
├── pages/          # Entry points
│   └── depends on: components, hooks, lib
├── components/
│   ├── ui/         # No external deps (shadcn primitives)
│   └── feature/    # Depends on: ui, hooks, lib
├── hooks/          # Depends on: lib
├── lib/            # Zero deps (utilities only)
└── types/          # Zero deps (type definitions)
```

## Future Architecture (Phase 2)

### Planned Additions
1. **Worker Thread** - Markdown parsing off main thread
2. **IndexedDB** - Large conversation storage
3. **Service Worker** - Offline capability
4. **WebRTC** - Voice interaction (future)
