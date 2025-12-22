# React Style Guide - Coach Atlas

## Overview

This guide defines React coding standards for Coach Atlas. We use **React 18** with **functional components**, **hooks**, and **TypeScript**.

---

## Component Structure

### File Organization
```
src/features/interview/
├── index.ts                    # Public exports
├── InterviewPage.tsx           # Page component
├── components/                 # Feature-specific components
│   ├── InterviewLayout.tsx
│   ├── ProblemPanel.tsx
│   └── EvaluationCard.tsx
├── hooks/                      # Feature-specific hooks
│   └── useTimer.ts
├── context/                    # Feature-specific context
│   └── InterviewContext.tsx
├── services/                   # Feature-specific services
│   └── InterviewService.ts
└── types.ts                    # Feature-specific types
```

### Component File Structure
```typescript
// 1. Imports (organized)
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { useAIService } from "@/app/ServiceContext";

import { ProblemPanel } from "./components/ProblemPanel";
import type { InterviewConfig } from "./types";

// 2. Types/Interfaces
interface InterviewPageProps {
  initialConfig?: InterviewConfig;
}

// 3. Component
export function InterviewPage({ initialConfig }: InterviewPageProps) {
  // 3a. Hooks (in consistent order)
  const navigate = useNavigate();
  const aiService = useAIService();

  // 3b. State
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(initialConfig);

  // 3c. Derived state (useMemo if expensive)
  const isValid = config?.difficulty != null;

  // 3d. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3e. Callbacks
  const handleSubmit = useCallback(() => {
    // ...
  }, []);

  // 3f. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

---

## Components

### Functional Components Only
```typescript
// ✅ Good - Functional component
export function ChatMessage({ message }: ChatMessageProps) {
  return <div className="...">{message.content}</div>;
}

// ✅ Good - Arrow function for simple components
export const Avatar = ({ src, alt }: AvatarProps) => (
  <img src={src} alt={alt} className="rounded-full" />
);

// ❌ Avoid - Class components
class ChatMessage extends React.Component { ... }
```

### Props Interface Naming
```typescript
// ✅ Good - ComponentNameProps pattern
interface ButtonProps {
  variant?: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
}

// ✅ Good - Extend HTML attributes when needed
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
```

### Destructure Props
```typescript
// ✅ Good - Destructure in parameter
function Button({ variant = "primary", onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ Avoid - Props object access
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### Children Prop
```typescript
// ✅ Good - Explicit React.ReactNode
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// ✅ Good - PropsWithChildren helper
import type { PropsWithChildren } from "react";

interface CardProps {
  title: string;
}

function Card({ title, children }: PropsWithChildren<CardProps>) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

---

## Hooks

### Custom Hook Naming
```typescript
// ✅ Good - useXxx convention
function useTimer(duration: number) { ... }
function useAIService() { ... }
function useLocalStorage<T>(key: string) { ... }

// ❌ Avoid - Non-standard naming
function getTimer(duration: number) { ... }
function aiServiceHook() { ... }
```

### Hook Dependencies
```typescript
// ✅ Good - Include all dependencies
const handleSubmit = useCallback(() => {
  submitForm(formData, config);
}, [formData, config]);

// ✅ Good - Use refs for stable references
const configRef = useRef(config);
configRef.current = config;

const handleSubmit = useCallback(() => {
  submitForm(formData, configRef.current);
}, [formData]); // config not needed in deps

// ❌ Avoid - Missing dependencies
const handleSubmit = useCallback(() => {
  submitForm(formData, config);
}, []); // Missing formData and config!
```

### useEffect Patterns
```typescript
// ✅ Good - Cleanup function
useEffect(() => {
  const subscription = eventSource.subscribe(handleEvent);
  return () => subscription.unsubscribe();
}, [handleEvent]);

// ✅ Good - AbortController for async
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    try {
      const data = await fetch(url, { signal: controller.signal });
      setData(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error);
      }
    }
  }

  fetchData();
  return () => controller.abort();
}, [url]);

// ❌ Avoid - Async effect without cleanup
useEffect(async () => {
  const data = await fetchData();
  setData(data); // May set state on unmounted component
}, []);
```

### State Updates
```typescript
// ✅ Good - Functional update for dependent state
setCount(prev => prev + 1);

// ✅ Good - Batch related updates
setMessages(prev => [...prev, newMessage]);
setIsLoading(false);

// ❌ Avoid - Multiple sequential setState calls
setCount(count + 1); // Uses stale count if called multiple times
```

---

## Context

### Context Structure
```typescript
// context/InterviewContext.tsx

import { createContext, useContext, useReducer, type ReactNode } from "react";

// 1. Types
interface InterviewState {
  status: "idle" | "active" | "review";
  session: InterviewSession | null;
}

type InterviewAction =
  | { type: "START"; payload: InterviewSession }
  | { type: "END" }
  | { type: "RESET" };

interface InterviewContextValue {
  state: InterviewState;
  dispatch: React.Dispatch<InterviewAction>;
}

// 2. Context
const InterviewContext = createContext<InterviewContextValue | null>(null);

// 3. Reducer
function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case "START":
      return { status: "active", session: action.payload };
    case "END":
      return { ...state, status: "review" };
    case "RESET":
      return { status: "idle", session: null };
    default:
      return state;
  }
}

// 4. Provider
export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interviewReducer, {
    status: "idle",
    session: null,
  });

  return (
    <InterviewContext.Provider value={{ state, dispatch }}>
      {children}
    </InterviewContext.Provider>
  );
}

// 5. Hook
export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within InterviewProvider");
  }
  return context;
}
```

---

## Event Handlers

### Naming Convention
```typescript
// ✅ Good - handleXxx for handlers
function handleClick() { ... }
function handleSubmit(e: React.FormEvent) { ... }
function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) { ... }

// ✅ Good - onXxx for props
interface ButtonProps {
  onClick: () => void;
  onHover?: () => void;
}
```

### Prevent Default
```typescript
// ✅ Good - Prevent default for forms
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  // ...
}

// ✅ Good - Stop propagation when needed
function handleClick(e: React.MouseEvent) {
  e.stopPropagation();
  // ...
}
```

---

## Conditional Rendering

### Patterns
```typescript
// ✅ Good - Early return for loading/error states
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  return <Profile user={user} />;
}

// ✅ Good - Ternary for simple conditions
return (
  <div>
    {isLoggedIn ? <Dashboard /> : <LoginForm />}
  </div>
);

// ✅ Good - && for presence checks (careful with numbers!)
return (
  <div>
    {user && <UserBadge user={user} />}
    {items.length > 0 && <ItemList items={items} />}
  </div>
);

// ❌ Avoid - && with numbers (renders 0)
return (
  <div>
    {count && <Badge count={count} />} {/* Renders 0 if count is 0 */}
  </div>
);
```

---

## Lists & Keys

### Key Best Practices
```typescript
// ✅ Good - Unique, stable ID
{messages.map((message) => (
  <ChatMessage key={message.id} message={message} />
))}

// ✅ Good - Compound key when needed
{items.map((item, index) => (
  <ListItem key={`${item.categoryId}-${item.id}`} item={item} />
))}

// ❌ Avoid - Index as key (causes bugs with reordering)
{messages.map((message, index) => (
  <ChatMessage key={index} message={message} />
))}

// ❌ Avoid - Random key (causes re-renders)
{messages.map((message) => (
  <ChatMessage key={Math.random()} message={message} />
))}
```

---

## Performance

### useMemo / useCallback
```typescript
// ✅ Good - Expensive computation
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ Good - Callback passed to optimized child
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ❌ Avoid - Over-optimization (simple computation)
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
// Just use: const fullName = `${firstName} ${lastName}`;
```

### React.memo
```typescript
// ✅ Good - Expensive component with stable props
const ExpensiveChart = memo(function ExpensiveChart({ data }: ChartProps) {
  // Complex rendering...
});

// ✅ Good - Custom comparison
const MessageItem = memo(
  function MessageItem({ message }: MessageItemProps) { ... },
  (prev, next) => prev.message.id === next.message.id
);

// ❌ Avoid - Memo on components that always re-render anyway
const Button = memo(function Button({ onClick }: ButtonProps) {
  // onClick changes every render if not memoized
});
```

### Lazy Loading
```typescript
// ✅ Good - Lazy load routes/heavy components
const InterviewPage = lazy(() => import("./features/interview/InterviewPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Error Boundaries

```typescript
// ✅ Good - Error boundary component
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

---

## Form Handling

### React Hook Form Pattern
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.string(),
});

type FormData = z.infer<typeof schema>;

function SettingsForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    saveSettings(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("apiKey")} />
      {errors.apiKey && <span>{errors.apiKey.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
}
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ Direct DOM manipulation
document.getElementById("root").innerHTML = "...";

// ❌ Mutating props
props.items.push(newItem);

// ❌ setState in render
function Component() {
  const [count, setCount] = useState(0);
  setCount(1); // Infinite loop!
  return <div>{count}</div>;
}

// ❌ Missing dependency array
useEffect(() => {
  fetchData();
}); // Runs on every render!

// ❌ Object/array in dependency causing infinite loop
useEffect(() => {
  doSomething(config);
}, [{ key: "value" }]); // New object every render!

// ❌ Inline object props (re-renders children)
<ChildComponent style={{ color: "red" }} /> // Creates new object each render
```

---

## Accessibility (a11y)

```typescript
// ✅ Good - Semantic HTML
<button onClick={handleClick}>Submit</button>

// ❌ Avoid - Non-semantic clickable div
<div onClick={handleClick}>Submit</div>

// ✅ Good - ARIA labels
<button aria-label="Close dialog" onClick={handleClose}>
  <XIcon />
</button>

// ✅ Good - Form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Good - Focus management
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

---

## Testing Considerations

```typescript
// ✅ Good - Testable component (dependency injection)
function ChatInterface({ aiService }: { aiService: AIService }) {
  // ...
}

// ✅ Good - Data attributes for testing
<button data-testid="submit-button" onClick={handleSubmit}>
  Submit
</button>

// ✅ Good - Accessible queries first
// In tests:
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
