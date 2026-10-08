/**
 * Chat streams are cancellable: unmounting the page, switching conversation or
 * superseding a stream aborts the provider request, quietly (no error toast,
 * no partial reply saved as failed).
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

const services = vi.hoisted(() => ({
  ai: { streamChat: (() => {}) as (...args: unknown[]) => unknown },
  storage: {
    loadProviderConfig: async () => ({ provider: "openai", apiKey: "test-key", model: "gpt-4o" }),
    getConversation: async (id: string) => ({ id, title: id, createdAt: 0, updatedAt: 0 }),
    getSetting: async () => undefined,
    getMessages: async (conversationId: string) => [
      { id: `m-${conversationId}`, conversationId, role: "assistant", content: "hello", timestamp: 0 },
    ],
    saveMessage: vi.fn(async (m: Record<string, unknown>) => ({ ...m, id: `saved-${Math.random()}` })),
  },
}));

vi.mock("@/app/ServiceContext", () => ({
  useAIService: () => services.ai,
  useStorageService: () => services.storage,
}));

vi.mock("@/lib/markdown-viewer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

import Chat from "../ChatPage";

let seen: AbortSignal | undefined;

/** Yields one chunk, then waits until its signal aborts (rejecting like fetch). */
function abortableStream() {
  services.ai.streamChat = async function* (...args: unknown[]) {
    const signal = args[4] as AbortSignal | undefined;
    seen = signal;
    yield { content: "partial reply", done: false };
    await new Promise((_, reject) =>
      signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))
    );
  };
}

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/chat/c1"]}>
      <Link to="/chat/c2">other conversation</Link>
      <Routes>
        <Route path="/chat/:conversationId" element={<Chat />} />
      </Routes>
    </MemoryRouter>
  );
}

async function sendMessage() {
  const input = await screen.findByPlaceholderText("Ask a question or describe a problem...");
  fireEvent.change(input, { target: { value: "my question" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await screen.findByText("partial reply");
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  seen = undefined;
  toastError.mockClear();
  services.storage.saveMessage.mockClear();
  abortableStream();
});

afterEach(() => cleanup());

function assistantSaves() {
  return services.storage.saveMessage.mock.calls.filter(([m]) => m.role === "assistant");
}

describe("ChatPage stream cancellation", () => {
  it("unmount during a stream aborts the request quietly", async () => {
    const { unmount } = renderChat();
    await sendMessage();
    expect(seen?.aborted).toBe(false);

    unmount();
    expect(seen?.aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(toastError).not.toHaveBeenCalled();
    expect(assistantSaves()).toHaveLength(0);
  });

  it("switching conversation aborts the stream and saves no partial reply", async () => {
    renderChat();
    await sendMessage();

    await act(async () => fireEvent.click(screen.getByText("other conversation")));
    expect(seen?.aborted).toBe(true);
    await waitFor(() => expect(screen.queryByText("partial reply")).toBeNull());
    expect(toastError).not.toHaveBeenCalled();
    expect(assistantSaves()).toHaveLength(0);
    expect(screen.queryByText(/Response interrupted/)).toBeNull();
  });
});
