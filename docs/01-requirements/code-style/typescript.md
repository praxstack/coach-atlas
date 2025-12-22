# TypeScript Style Guide - Coach Atlas

## Overview

This guide defines TypeScript coding standards for Coach Atlas. We prioritize **type safety**, **readability**, and **maintainability**.

---

## Configuration

### tsconfig.json Base Settings
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## Type Definitions

### Prefer Interfaces for Object Shapes
```typescript
// ✅ Good - Use interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Avoid - Type aliases for simple objects
type User = {
  id: string;
  name: string;
  email: string;
};
```

### Use Type Aliases for Unions, Intersections, and Primitives
```typescript
// ✅ Good - Union types
type Status = "idle" | "loading" | "success" | "error";
type ProviderId = "openai" | "anthropic" | "google" | "bedrock";

// ✅ Good - Intersection types
type AdminUser = User & { permissions: string[] };

// ✅ Good - Primitive aliases for domain concepts
type UserId = string;
type Timestamp = number;
```

### Export Types Separately
```typescript
// ✅ Good - Explicit type exports
export type { User, UserProfile };
export interface ApiResponse<T> { ... }

// ❌ Avoid - Mixing type and value exports without clarity
export { User, createUser }; // Is User a type or class?
```

---

## Type Inference

### Let TypeScript Infer When Obvious
```typescript
// ✅ Good - Inference is clear
const count = 0;
const name = "Coach Atlas";
const items = ["a", "b", "c"];

// ❌ Avoid - Redundant type annotations
const count: number = 0;
const name: string = "Coach Atlas";
const items: string[] = ["a", "b", "c"];
```

### Annotate Function Return Types
```typescript
// ✅ Good - Explicit return types
function calculateScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.score, 0);
}

// ✅ Good - Async functions
async function fetchUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Avoid - Implicit return types on public APIs
function calculateScore(answers: Answer[]) {
  return answers.reduce((sum, a) => sum + a.score, 0);
}
```

### Use `const` Assertions for Literal Types
```typescript
// ✅ Good - Const assertion preserves literal types
const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  INTERVIEW: "/interview",
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES]; // "/" | "/chat" | "/interview"
```

---

## Null Handling

### Use Optional Chaining
```typescript
// ✅ Good
const userName = user?.profile?.name;

// ❌ Avoid
const userName = user && user.profile && user.profile.name;
```

### Use Nullish Coalescing
```typescript
// ✅ Good - Only falls back on null/undefined
const value = input ?? defaultValue;

// ⚠️ Careful - Falls back on all falsy values
const value = input || defaultValue; // Empty string, 0, false also trigger fallback
```

### Avoid `!` Non-null Assertion
```typescript
// ❌ Avoid - Non-null assertion bypasses type safety
const element = document.getElementById("root")!;

// ✅ Good - Handle null explicitly
const element = document.getElementById("root");
if (!element) throw new Error("Root element not found");
```

---

## Generics

### Use Descriptive Generic Names
```typescript
// ✅ Good - Descriptive names for complex generics
interface Repository<Entity, Id = string> {
  findById(id: Id): Promise<Entity | null>;
  save(entity: Entity): Promise<void>;
}

// ✅ Acceptable - Single letter for simple, well-known patterns
function map<T, U>(arr: T[], fn: (item: T) => U): U[] { ... }

// ❌ Avoid - Single letters when meaning is unclear
function process<A, B, C>(a: A, b: B): C { ... }
```

### Constrain Generics When Possible
```typescript
// ✅ Good - Constrained generic
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ❌ Avoid - Unconstrained generic
function getProperty<T>(obj: T, key: string): any {
  return (obj as any)[key];
}
```

---

## Discriminated Unions

### Use for State Machines
```typescript
// ✅ Good - Discriminated union for state
type InterviewState =
  | { status: "idle" }
  | { status: "setup"; config: InterviewConfig }
  | { status: "active"; session: InterviewSession }
  | { status: "submitted"; session: InterviewSession }
  | { status: "review"; session: InterviewSession; evaluation: Evaluation };

function handleState(state: InterviewState) {
  switch (state.status) {
    case "idle":
      // TypeScript knows no other properties
      break;
    case "active":
      // TypeScript knows session exists
      console.log(state.session.id);
      break;
    case "review":
      // TypeScript knows both session and evaluation exist
      console.log(state.evaluation.score);
      break;
  }
}
```

---

## Enums vs Union Types

### Prefer Union Types
```typescript
// ✅ Good - Union type (no runtime cost, better inference)
type Difficulty = "easy" | "medium" | "hard";

// ❌ Avoid - Enum (has runtime cost, awkward to iterate)
enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}
```

### Use `const` Object for Enum-like Values
```typescript
// ✅ Good - When you need both type and runtime values
const Difficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

type Difficulty = typeof Difficulty[keyof typeof Difficulty];
```

---

## Async/Await

### Always Handle Errors
```typescript
// ✅ Good - Try/catch with typed error handling
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Fetch failed:", error.message);
    }
    throw error;
  }
}
```

### Use `Promise.all` for Parallel Operations
```typescript
// ✅ Good - Parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);

// ❌ Avoid - Sequential execution when parallel is possible
const users = await fetchUsers();
const posts = await fetchPosts();
```

---

## Imports/Exports

### Use Path Aliases
```typescript
// ✅ Good - Path aliases from tsconfig
import { Button } from "@/shared/ui/button";
import { useAIService } from "@/app/ServiceContext";

// ❌ Avoid - Relative paths that traverse many levels
import { Button } from "../../../../shared/ui/button";
```

### Organize Imports
```typescript
// ✅ Good - Organized imports
// 1. External packages
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal modules (path aliases)
import { Button } from "@/shared/ui/button";
import { useAIService } from "@/app/ServiceContext";

// 3. Relative imports (same feature)
import { InterviewLayout } from "./components/InterviewLayout";
import type { InterviewConfig } from "./types";

// 4. Types (explicit type imports)
import type { Message, ProviderConfig } from "@/services/types";
```

---

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Variables | camelCase | `userName`, `isLoading` |
| Functions | camelCase | `calculateScore`, `handleSubmit` |
| Classes | PascalCase | `AIService`, `ProgressiveEvaluator` |
| Interfaces | PascalCase | `User`, `ProviderConfig` |
| Types | PascalCase | `ProviderId`, `InterviewStatus` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files (components) | PascalCase | `ChatInterface.tsx`, `ProblemPanel.tsx` |
| Files (utilities) | camelCase | `utils.ts`, `retryUtils.ts` |

---

## Common Patterns

### Result Type for Error Handling
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function parseResponse(response: Response): Promise<Result<Data>> {
  try {
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### Builder Pattern
```typescript
class QueryBuilder<T> {
  private filters: Filter[] = [];

  where(filter: Filter): this {
    this.filters.push(filter);
    return this;
  }

  build(): Query<T> {
    return new Query(this.filters);
  }
}
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ Using `any`
function processData(data: any) { ... }

// ❌ Type assertions without checks
const user = response as User;

// ❌ Ignoring null/undefined
const name = user.name.toUpperCase(); // What if user.name is undefined?

// ❌ Mutating function parameters
function addItem(items: Item[], newItem: Item) {
  items.push(newItem); // Mutation!
}

// ❌ Using `Function` type
const callback: Function = () => {};

// ❌ Empty interfaces
interface EmptyInterface {}
```

---

## Tools & Enforcement

- **ESLint**: `@typescript-eslint/recommended`
- **Prettier**: Consistent formatting
- **IDE**: VSCode with TypeScript extensions
- **CI**: Type-check in build pipeline (`tsc --noEmit`)
