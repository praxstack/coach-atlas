# Product Guidelines - Coach Atlas

## UI/UX Philosophy

Coach Atlas adopts a **"Focus-First, Rich-When-Needed"** approach:

| Context | UI Style | Rationale |
|---------|----------|-----------|
| **Chat Mode** | Minimalist & Distraction-Free | User needs to focus on thinking, not UI |
| **Interview Mode** | Clean Split-Pane | Problem on left, conversation on right |
| **Evaluation Reports** | Information-Dense | Post-interview review benefits from detail |
| **Diagrams/Code** | Rich Rendering | Beautiful code and Mermaid diagrams aid learning |

### Core Principle
> **"Get out of the way during problem-solving, shine during review."**

---

## Design System

### 1. Color Palette (Dark Theme First)

Coach Atlas uses a dark theme by default to reduce eye strain during extended study sessions.

```
Background Layers:
├─ Base:        #030712 (gray-950)
├─ Surface:     #111827 (gray-900)
├─ Elevated:    #1f2937 (gray-800)
└─ Border:      #374151 (gray-700)

Text Hierarchy:
├─ Primary:     #f9fafb (gray-50)
├─ Secondary:   #9ca3af (gray-400)
└─ Muted:       #6b7280 (gray-500)

Accent Colors:
├─ Primary:     #3b82f6 (blue-500)     → User messages, primary actions
├─ Success:     #22c55e (green-500)    → AI interviewer, correct answers
├─ Warning:     #f59e0b (amber-500)    → Hints, time warnings
├─ Danger:      #ef4444 (red-500)      → Errors, wrong approaches
└─ Info:        #8b5cf6 (violet-500)   → System messages
```

### 2. Typography

```
Font Stack:
├─ UI:          Inter, system-ui, sans-serif
├─ Code:        JetBrains Mono, Fira Code, monospace
└─ Math:        KaTeX (rendered)

Size Scale (rem):
├─ xs:   0.75   (12px)
├─ sm:   0.875  (14px)  → Chat messages
├─ base: 1      (16px)  → Body text
├─ lg:   1.125  (18px)  → Headings
├─ xl:   1.25   (20px)
├─ 2xl:  1.5    (24px)  → Page titles
└─ 3xl:  1.875  (30px)
```

### 3. Spacing System (Tailwind)

```
Scale:
├─ 1:  0.25rem (4px)
├─ 2:  0.5rem  (8px)
├─ 3:  0.75rem (12px)
├─ 4:  1rem    (16px)  → Standard padding
├─ 6:  1.5rem  (24px)
├─ 8:  2rem    (32px)  → Section spacing
└─ 12: 3rem    (48px)
```

### 4. Component Patterns

#### Chat Bubbles
```
User Message:
├─ Background: blue-600
├─ Text: white
├─ Radius: rounded-2xl rounded-br-md
└─ Position: right-aligned

AI Message:
├─ Background: gray-800
├─ Text: gray-100
├─ Radius: rounded-2xl rounded-bl-md
└─ Position: left-aligned
```

#### Avatars
```
User Avatar:
├─ Icon: User (lucide)
├─ Background: blue-600
└─ Size: 32x32px (w-8 h-8)

AI Avatar:
├─ Icon: Bot (lucide)
├─ Background: green-600
└─ Size: 32x32px (w-8 h-8)
```

---

## Layout Guidelines

### 1. Sidebar Layout (App Shell)

```
┌──────────────────────────────────────────────────────────┐
│  ┌────────┐  ┌─────────────────────────────────────────┐ │
│  │        │  │                                         │ │
│  │ Side   │  │             Main Content                │ │
│  │ bar    │  │                                         │ │
│  │        │  │                                         │ │
│  │ 256px  │  │            flex-grow                    │ │
│  │        │  │                                         │ │
│  │        │  │                                         │ │
│  └────────┘  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 2. Interview Mode (Split Pane)

```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────────────────┬───────────────────────────────┐ │
│  │                     │                               │ │
│  │   Problem Panel     │      Chat Interface          │ │
│  │                     │                               │ │
│  │   - Title           │   - Messages                 │ │
│  │   - Description     │   - Input (fixed bottom)     │ │
│  │   - Examples        │                               │ │
│  │   - Constraints     │                               │ │
│  │                     │                               │ │
│  │      40-50%         │         50-60%               │ │
│  └─────────────────────┴───────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 3. Mobile Layout (Responsive)

On screens < 768px:
- Sidebar collapses to hamburger menu
- Interview mode switches to tabbed view (Problem | Chat)
- Chat input remains fixed at bottom
- Simplified evaluation cards

---

## Interaction Patterns

### 1. Loading States

| Context | Pattern |
|---------|---------|
| Initial page load | Full-page spinner with message |
| AI thinking | Pulsing dots in chat bubble |
| Streaming response | Progressive text reveal |
| Evaluation generation | Progress indicator with cancel option |

### 2. Input Behavior

```
Chat Input:
├─ Enter: Send message
├─ Shift+Enter: New line
├─ Disabled during: AI streaming, paused interview
└─ Placeholder: Context-aware ("Explain your approach...")
```

### 3. Toast Notifications

| Type | Use Case | Duration |
|------|----------|----------|
| Success | Message sent, settings saved | 3s |
| Error | API failure, validation error | 5s (or manual dismiss) |
| Info | Hint revealed, mode change | 3s |
| Warning | Time running low, rate limit | 5s |

---

## Content Guidelines

### 1. AI Voice & Tone

| Characteristic | Example |
|----------------|---------|
| **Professional** | "Let's analyze the time complexity." |
| **Encouraging** | "Good thinking! What about edge cases?" |
| **Direct** | "That approach has O(n²) complexity. Can we do better?" |
| **Never Condescending** | ❌ "Obviously..." ✅ "Consider that..." |

### 2. Error Messages

```
Pattern: What happened → What to do

Examples:
✅ "API key invalid. Please check your key in Settings."
✅ "Request timed out. Click to retry."
❌ "Error: 401 Unauthorized"
❌ "Something went wrong"
```

### 3. Empty States

| Context | Message |
|---------|---------|
| No conversations | "Start a new conversation to begin your interview prep." |
| No evaluation yet | "Complete the interview to receive your evaluation." |
| No API key | "Configure your API key to start chatting." |

---

## Accessibility

### 1. Requirements

| Standard | Implementation |
|----------|----------------|
| Keyboard Navigation | All interactive elements focusable with Tab |
| Screen Readers | ARIA labels on icons, semantic HTML |
| Color Contrast | WCAG 2.1 AA (4.5:1 for text, 3:1 for UI) |
| Focus Indicators | Visible focus rings (ring-2 ring-blue-500) |
| Motion | Respect prefers-reduced-motion |

### 2. Semantic Structure

```html
<main role="main">
  <aside role="complementary">Sidebar</aside>
  <section aria-label="Chat">
    <div role="log" aria-live="polite">Messages</div>
    <form role="form">Input</form>
  </section>
</main>
```

---

## Performance Guidelines

### 1. Bundle Size Targets

| Chunk | Target | Current |
|-------|--------|---------|
| Initial JS | < 200KB | ~150KB |
| Markdown Viewer | < 100KB | ~80KB (lazy-loaded) |
| Mermaid | < 500KB | ~450KB (lazy-loaded) |
| Total (gzipped) | < 1MB | ~780KB |

### 2. Loading Priorities

```
Critical Path (blocking):
├─ React runtime
├─ Router
├─ UI framework (Tailwind)
└─ App shell

Lazy Loaded (on demand):
├─ Markdown renderer
├─ Mermaid diagrams
├─ KaTeX math
├─ Interview mode
└─ Settings page
```

### 3. Caching Strategy

| Resource | Cache | TTL |
|----------|-------|-----|
| Static assets | Immutable | 1 year |
| API responses | No cache | - |
| Local storage | Persistent | - |
| IndexedDB | Persistent | - |

---

## Animation Guidelines

### 1. Timing Functions

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
```

### 2. Duration Standards

| Type | Duration |
|------|----------|
| Micro-interactions | 100-150ms |
| State changes | 200-300ms |
| Modal/page transitions | 300-400ms |
| Attention-grabbing | 500ms+ |

### 3. Motion Principles

- **Purposeful**: Animation should guide, not distract
- **Subtle**: Prefer opacity/transform over complex animations
- **Responsive**: Disable animations on prefers-reduced-motion
- **Consistent**: Same elements, same animations throughout

---

## Do's and Don'ts

### Do ✅

- Use skeleton loaders for async content
- Provide clear feedback for all user actions
- Keep chat input visible and accessible
- Show progress during long operations
- Use icons with text labels where space allows

### Don't ❌

- Block UI during AI responses (stream instead)
- Auto-scroll aggressively (only on new messages)
- Use colors as only indicator (add icons/text)
- Hide critical errors (surface prominently)
- Use jargon in user-facing messages

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-22 | Initial guidelines based on existing codebase patterns |
