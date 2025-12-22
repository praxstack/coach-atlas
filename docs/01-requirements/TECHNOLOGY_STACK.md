# Technology Stack - Coach Atlas

## Overview

Coach Atlas is a **client-side only** React application that communicates directly with LLM APIs. There is no backend server - all processing happens in the browser.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                                  │
│  ├─ UI: Tailwind CSS + shadcn/ui (Radix primitives)            │
│  ├─ State: React Query + React Context                          │
│  ├─ Storage: IndexedDB (Dexie) + localStorage                  │
│  └─ Rendering: Marked + Mermaid + KaTeX + Prism.js             │
├─────────────────────────────────────────────────────────────────┤
│                    Direct API Calls (CORS)                      │
├─────────────────────────────────────────────────────────────────┤
│  LLM Providers (BYOK - Bring Your Own Key)                     │
│  ├─ OpenAI API                                                 │
│  ├─ Anthropic API                                              │
│  ├─ Google Generative AI                                       │
│  └─ AWS Bedrock                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 6.0.0 | Build tool & dev server |
| **React Router DOM** | 6.30.1 | Client-side routing |

### Build Configuration
- Plugin: `@vitejs/plugin-react-swc` (SWC for fast compilation)
- Code splitting: Automatic chunk splitting for vendors
- Dev server: Hot Module Replacement (HMR)

---

## UI Layer

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |
| **tailwindcss-animate** | 1.0.7 | Animation utilities |
| **@tailwindcss/typography** | 0.5.16 | Prose styling |
| **tailwind-merge** | 2.6.0 | Merge class utilities |
| **clsx** | 2.1.1 | Conditional classnames |
| **class-variance-authority** | 0.7.1 | Component variants |

### Component Library (shadcn/ui + Radix)
All UI components are built on **Radix UI primitives**:

| Component | Package |
|-----------|---------|
| Accordion | `@radix-ui/react-accordion` |
| Alert Dialog | `@radix-ui/react-alert-dialog` |
| Avatar | `@radix-ui/react-avatar` |
| Checkbox | `@radix-ui/react-checkbox` |
| Collapsible | `@radix-ui/react-collapsible` |
| Context Menu | `@radix-ui/react-context-menu` |
| Dialog | `@radix-ui/react-dialog` |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` |
| Hover Card | `@radix-ui/react-hover-card` |
| Label | `@radix-ui/react-label` |
| Menubar | `@radix-ui/react-menubar` |
| Navigation Menu | `@radix-ui/react-navigation-menu` |
| Popover | `@radix-ui/react-popover` |
| Progress | `@radix-ui/react-progress` |
| Radio Group | `@radix-ui/react-radio-group` |
| Scroll Area | `@radix-ui/react-scroll-area` |
| Select | `@radix-ui/react-select` |
| Separator | `@radix-ui/react-separator` |
| Slider | `@radix-ui/react-slider` |
| Slot | `@radix-ui/react-slot` |
| Switch | `@radix-ui/react-switch` |
| Tabs | `@radix-ui/react-tabs` |
| Toast | `@radix-ui/react-toast` |
| Toggle | `@radix-ui/react-toggle` |
| Toggle Group | `@radix-ui/react-toggle-group` |
| Tooltip | `@radix-ui/react-tooltip` |

### Additional UI Components
| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | 0.462.0 | Icon library |
| **Sonner** | 1.7.4 | Toast notifications |
| **Vaul** | 0.9.9 | Drawer component |
| **cmdk** | 1.1.1 | Command palette |
| **react-resizable-panels** | 2.1.9 | Resizable split panes |
| **embla-carousel-react** | 8.6.0 | Carousel component |
| **Recharts** | 2.15.4 | Charts & graphs |
| **react-day-picker** | 8.10.1 | Calendar/date picker |
| **input-otp** | 1.4.2 | OTP input component |

---

## State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **@tanstack/react-query** | 5.83.0 | Async state management |
| **React Context** | (built-in) | App-level state |
| **useReducer** | (built-in) | Complex local state |

### State Architecture
```
┌─────────────────────────────────────────┐
│           ServiceContext                 │
│  ├─ AIService (provider adapters)       │
│  └─ StorageService (IndexedDB)          │
├─────────────────────────────────────────┤
│          InterviewContext                │
│  ├─ Session state                       │
│  ├─ Timer state                         │
│  └─ Evaluation state                    │
├─────────────────────────────────────────┤
│           React Query                    │
│  └─ Provider config cache               │
└─────────────────────────────────────────┘
```

---

## Data Persistence

| Technology | Version | Purpose |
|------------|---------|---------|
| **Dexie** | 4.2.1 | IndexedDB wrapper |
| **localStorage** | (built-in) | API keys, preferences |

### Storage Schema
```typescript
// IndexedDB (via Dexie)
conversations: { id, title, createdAt, updatedAt }
messages: { id, conversationId, role, content, timestamp }
interviews: { id, status, problems, evaluation }

// localStorage
providerConfig: { provider, apiKey, model, region }
progressiveEvalState: { state, exchanges, problemId }
```

---

## Markdown & Rich Content

| Technology | Version | Purpose |
|------------|---------|---------|
| **Marked** | 17.0.1 | Markdown parser |
| **marked-footnote** | 1.4.0 | Footnote support |
| **DOMPurify** | 3.3.1 | XSS sanitization |
| **Prism.js** | 1.30.0 | Syntax highlighting |
| **Mermaid** | 11.12.2 | Diagrams (flowcharts, sequence, etc.) |
| **KaTeX** | 0.16.27 | Math rendering |

### Content Pipeline
```
User Input → Marked (parse MD) → Custom Extensions → DOMPurify (sanitize)
                                       ↓
                              ┌────────┴────────┐
                              ↓        ↓        ↓
                          Prism.js  Mermaid  KaTeX
                          (code)   (diagrams) (math)
                              ↓        ↓        ↓
                              └────────┬────────┘
                                       ↓
                               React DOM (render)
```

---

## Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.61.1 | Form state management |
| **@hookform/resolvers** | 3.10.0 | Schema validation bridge |
| **Zod** | 3.25.76 | Schema validation |

---

## Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 3.6.0 | Date manipulation |
| **next-themes** | 0.3.0 | Theme management |

---

## Development & Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.32.0 | Linting |
| **typescript-eslint** | 8.38.0 | TypeScript linting |
| **eslint-plugin-react-hooks** | 5.2.0 | React hooks rules |
| **eslint-plugin-react-refresh** | 0.4.20 | Fast refresh rules |
| **Vitest** | 4.0.16 | Unit testing |
| **@testing-library/react** | 16.3.1 | React testing utilities |
| **jsdom** | 27.3.0 | DOM environment for tests |

---

## LLM Provider Integration

Coach Atlas supports multiple LLM providers through a unified adapter pattern:

| Provider | API Endpoint | Auth Method |
|----------|--------------|-------------|
| **OpenAI** | `api.openai.com/v1/chat/completions` | Bearer Token |
| **Anthropic** | `api.anthropic.com/v1/messages` | x-api-key header |
| **Google** | `generativelanguage.googleapis.com` | API Key in URL |
| **AWS Bedrock** | `bedrock-runtime.{region}.amazonaws.com` | Bearer Token |

### Adapter Architecture
```typescript
interface IAIService {
  sendMessage(request: AIRequest): Promise<AIResponse>;
  streamMessage(request: AIRequest): AsyncGenerator<StreamChunk>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

// Implementations
class OpenAIAdapter implements IAIService { ... }
class AnthropicAdapter implements IAIService { ... }
class GoogleAdapter implements IAIService { ... }
class BedrockAdapter implements IAIService { ... }
```

---

## Build Output

### Bundle Analysis (Production)

| Chunk | Size (minified) | Size (gzipped) |
|-------|-----------------|----------------|
| Main app | ~150 KB | ~50 KB |
| Vendor (React) | ~140 KB | ~45 KB |
| Markdown viewer | ~170 KB | ~56 KB |
| KaTeX | ~265 KB | ~77 KB |
| Cytoscape | ~645 KB | ~195 KB |
| Mermaid | ~1,658 KB | ~450 KB |
| **Total** | ~3,028 KB | **~873 KB** |

### Optimization Strategies
1. **Lazy Loading**: Mermaid, KaTeX loaded only when needed
2. **Code Splitting**: Automatic vendor chunk separation
3. **Tree Shaking**: Unused Radix components excluded
4. **Compression**: Gzip/Brotli on static hosting

---

## Deployment

| Platform | Configuration |
|----------|---------------|
| **Vercel** | Zero-config deployment |
| **Static Hosting** | Any CDN (dist/ folder) |
| **WebView** | Embeddable in mobile apps |

### Environment
- Node.js: v18+ (development only)
- Browser Support: ES2020+ (Chrome 80+, Firefox 78+, Safari 14+)
- No server runtime required in production

---

## Version Pinning Philosophy

- **Major dependencies** (React, Vite): Follow LTS, upgrade carefully
- **UI components** (Radix): Pin minor versions, test before upgrade
- **Content rendering** (Mermaid, KaTeX): Pin exact versions (rendering changes)
- **Dev tools** (ESLint, Vitest): Keep updated for latest rules/fixes

---

## Future Considerations

| Feature | Technology Under Evaluation |
|---------|----------------------------|
| Offline Support | Service Workers, Workbox |
| PWA | Web App Manifest |
| WebRTC | Real-time collaboration |
| SQLite in Browser | wa-sqlite, sql.js |
