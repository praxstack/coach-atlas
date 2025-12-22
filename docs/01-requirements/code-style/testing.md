# Testing Style Guide - Coach Atlas

## Overview

This guide defines testing conventions for Coach Atlas. We use **Vitest** for unit/integration tests and **React Testing Library** for component tests.

---

## Configuration

### vitest.config.ts
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Test Setup File
```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });
```

---

## File Naming & Organization

### Test File Location
```
src/
├── services/
│   ├── ai/
│   │   ├── AIService.ts
│   │   ├── AIService.test.ts        # Co-located test
│   │   └── adapters/
│   │       ├── OpenAIAdapter.ts
│   │       └── OpenAIAdapter.test.ts
│   └── retryUtils.ts
│       └── retryUtils.test.ts
├── features/
│   └── interview/
│       ├── InterviewPage.tsx
│       └── InterviewPage.test.tsx   # Component test
└── test/
    ├── setup.ts                     # Global setup
    ├── mocks/                       # Shared mocks
    │   └── aiService.mock.ts
    └── utils/                       # Test utilities
        └── renderWithProviders.tsx
```

### Naming Conventions
```typescript
// Unit tests
MyService.test.ts
retryUtils.test.ts

// Component tests
Button.test.tsx
ChatInterface.test.tsx

// Integration tests
InterviewFlow.integration.test.ts
```

---

## Test Structure

### Arrange-Act-Assert (AAA) Pattern
```typescript
describe("calculateScore", () => {
  it("should return sum of all answer scores", () => {
    // Arrange
    const answers = [
      { id: "1", score: 3 },
      { id: "2", score: 4 },
      { id: "3", score: 5 },
    ];

    // Act
    const result = calculateScore(answers);

    // Assert
    expect(result).toBe(12);
  });
});
```

### Describe/It Blocks
```typescript
describe("AIService", () => {
  describe("sendMessage", () => {
    it("should send message to provider", async () => { ... });
    it("should throw on invalid API key", async () => { ... });
    it("should handle network errors", async () => { ... });
  });

  describe("streamMessage", () => {
    it("should yield chunks progressively", async () => { ... });
    it("should complete with done flag", async () => { ... });
  });
});
```

### Test Naming
```typescript
// ✅ Good - Descriptive, starts with "should"
it("should return null when user is not found", () => { ... });
it("should retry 3 times before failing", () => { ... });
it("should render loading state initially", () => { ... });

// ✅ Good - Describes condition
it("returns empty array when input is empty", () => { ... });

// ❌ Avoid - Vague
it("works correctly", () => { ... });
it("test sendMessage", () => { ... });
```

---

## Unit Tests

### Pure Functions
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn, formatDuration } from "./utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("should dedupe Tailwind classes", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
  });
});

describe("formatDuration", () => {
  it("should format seconds to mm:ss", () => {
    expect(formatDuration(90)).toBe("01:30");
    expect(formatDuration(3661)).toBe("61:01");
  });

  it("should handle zero", () => {
    expect(formatDuration(0)).toBe("00:00");
  });
});
```

### Async Functions
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryWithBackoff } from "./retryUtils";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve on first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await retryWithBackoff(fn);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const promise = retryWithBackoff(fn, 3, 100);

    // Advance through retries
    await vi.advanceTimersByTimeAsync(100); // First retry delay
    await vi.advanceTimersByTimeAsync(200); // Second retry delay (2x)

    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```

---

## Service/Adapter Tests

### API Adapter Pattern
```typescript
// src/services/ai/adapters/OpenAIAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIAdapter } from "./OpenAIAdapter";

describe("OpenAIAdapter", () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    adapter = new OpenAIAdapter();
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should call OpenAI API with correct payload", async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: "Hello!" } }],
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adapter.sendMessage({
        messages: [{ role: "user", content: "Hi" }],
        config: { apiKey: "test-key", model: "gpt-4" },
      });

      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
          }),
        })
      );
      expect(result.content).toBe("Hello!");
    });

    it("should throw on 401 response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(
        adapter.sendMessage({
          messages: [{ role: "user", content: "Hi" }],
          config: { apiKey: "invalid", model: "gpt-4" },
        })
      ).rejects.toThrow(/401/);
    });
  });
});
```

---

## Component Tests

### Basic Component Test
```typescript
// src/shared/ui/button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("should render children", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Component with Context
```typescript
// src/features/interview/InterviewPage.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InterviewPage } from "./InterviewPage";
import { ServiceProvider } from "@/app/ServiceContext";

// Test utilities
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ServiceProvider
        aiService={mockAIService}
        storageService={mockStorageService}
      >
        {ui}
      </ServiceProvider>
    </MemoryRouter>
  );
}

describe("InterviewPage", () => {
  it("should show loading state initially", () => {
    renderWithProviders(<InterviewPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Testing Hooks
```typescript
// src/features/interview/hooks/useTimer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "./useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start counting down from initial value", () => {
    const { result } = renderHook(() => useTimer(60));

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it("should decrement every second when started", () => {
    const { result } = renderHook(() => useTimer(60));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(59);
  });

  it("should call onTimeout when reaching zero", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useTimer(2, onTimeout));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onTimeout).toHaveBeenCalled();
  });
});
```

---

## Mocking

### Mock Functions
```typescript
import { vi } from "vitest";

// Simple mock
const mockFn = vi.fn();
mockFn.mockReturnValue("value");
mockFn.mockResolvedValue("async value");
mockFn.mockImplementation((x) => x * 2);

// Verify calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock Modules
```typescript
// Mock entire module
vi.mock("@/services/ai/AIService", () => ({
  AIService: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn().mockResolvedValue({ content: "response" }),
    streamChat: vi.fn(),
  })),
}));

// Mock specific exports
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
```

### Mock Services
```typescript
// src/test/mocks/aiService.mock.ts
import { vi } from "vitest";
import type { AIService } from "@/services/ai/AIService";

export function createMockAIService(): AIService {
  return {
    sendMessage: vi.fn().mockResolvedValue({ content: "mock response" }),
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { content: "Hello", done: false };
      yield { content: " World", done: false };
      yield { content: "", done: true };
    }),
    validateApiKey: vi.fn().mockResolvedValue(true),
  };
}
```

---

## Query Priorities

### Prefer Accessible Queries
```typescript
// ✅ Best - Accessible to everyone
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/search/i);
screen.getByText(/welcome/i);

// ✅ Good - Semantic queries
screen.getByAltText(/profile/i);
screen.getByTitle(/close/i);

// ⚠️ Fallback - Test IDs
screen.getByTestId("submit-button");

// ❌ Avoid - Implementation details
container.querySelector(".submit-btn");
container.querySelector("#submit");
```

### findBy vs getBy vs queryBy
```typescript
// getBy - Element must exist (throws if not found)
const button = screen.getByRole("button");

// queryBy - Element may not exist (returns null)
const error = screen.queryByText(/error/i);
expect(error).not.toBeInTheDocument();

// findBy - Async, waits for element (for async rendering)
const message = await screen.findByText(/loaded/i);
```

---

## Async Testing

### waitFor Pattern
```typescript
import { waitFor, screen } from "@testing-library/react";

it("should show success message after submit", async () => {
  render(<Form />);

  fireEvent.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### User Events
```typescript
import userEvent from "@testing-library/user-event";

it("should update input value", async () => {
  const user = userEvent.setup();
  render(<Input />);

  const input = screen.getByRole("textbox");
  await user.type(input, "hello");

  expect(input).toHaveValue("hello");
});
```

---

## Coverage & Targets

### Coverage Goals
```
Overall:       ≥ 70%
Services:      ≥ 90%
Utilities:     ≥ 95%
Components:    ≥ 60%
```

### Run Coverage
```bash
npm run test -- --coverage
```

### Coverage Report
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
services/ai/          |   91.23 |    85.71 |   88.89 |   91.23 |
 AIService.ts         |   92.45 |    87.50 |   90.00 |   92.45 |
 adapters/            |   90.00 |    83.33 |   87.50 |   90.00 |
lib/                  |   97.14 |    95.00 |   96.00 |   97.14 |
 utils.ts             |   98.00 |   100.00 |   95.00 |   98.00 |
----------------------|---------|----------|---------|---------|
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ Testing implementation details
expect(component.state.isLoading).toBe(true);

// ❌ Snapshot tests for dynamic content
expect(component).toMatchSnapshot(); // Breaks on any change

// ❌ Testing private methods directly
expect(service._internalMethod()).toBe(true);

// ❌ Tight coupling to DOM structure
expect(container.querySelector("div > span.label")).toBeTruthy();

// ❌ Sleep/fixed delays
await new Promise(r => setTimeout(r, 1000)); // Use waitFor instead

// ❌ Not cleaning up mocks
// Always use beforeEach/afterEach for cleanup

// ❌ Overly complex test setup
// If setup is huge, you might be testing too much at once
```

---

## Best Practices Summary

1. **Test behavior, not implementation**
2. **Use accessible queries**
3. **Keep tests focused (one concept per test)**
4. **Clean up mocks between tests**
5. **Use fake timers for time-dependent code**
6. **Prefer `userEvent` over `fireEvent`**
7. **Avoid snapshot tests for dynamic content**
8. **Write tests that fail for the right reasons**
9. **Co-locate tests with source files**
10. **Mock at boundaries (APIs, storage), not internals**
