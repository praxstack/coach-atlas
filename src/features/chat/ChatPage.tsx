/**
 * ChatPage - Main Chat Interface
 * Uses AIService and StorageService for persistence
 */
import { useAIService, useStorageService } from "@/app/ServiceContext";
import { MarkdownRenderer } from "@/lib/markdown-viewer";
import { providers } from "@/services/providers";
import type { Conversation, Message, ProviderConfig, ProviderId } from "@/services/types";
import { Button } from "@/shared/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Loader2,
  Send,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// UI message type (extends service Message with optional fields during loading)
interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const aiService = useAIService();
  const storageService = useStorageService();

  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>(""); // Real-time streaming content
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize: Load config and conversation from IndexedDB
  const initialize = useCallback(async () => {
    try {
      // Load provider config
      const storedConfig = await storageService.loadProviderConfig();
      if (!storedConfig) {
        toast.error("Please configure your API key first");
        navigate("/settings");
        return;
      }

      setConfig({
        provider: storedConfig.provider as ProviderId,
        apiKey: storedConfig.apiKey,
        model: storedConfig.model,
        region: storedConfig.region,
      });

      // Load conversation by ID if provided, otherwise get/create default
      let conv: Conversation | undefined;

      if (urlConversationId) {
        conv = await storageService.getConversation(urlConversationId);
        if (!conv) {
          // Invalid conversation ID - redirect to /chat
          toast.error("Conversation not found");
          navigate("/chat");
          return;
        }
      } else {
        // No ID provided - get or create default
        conv = await storageService.getOrCreateDefaultConversation();
        // Redirect to proper URL with ID
        navigate(`/chat/${conv.id}`, { replace: true });
        return;
      }

      setConversation(conv);

      // Load existing messages
      const storedMessages = await storageService.getMessages(conv.id);

      if (storedMessages.length > 0) {
        // Convert to UI format
        setMessages(
          storedMessages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      } else {
        // First time: show welcome message
        const welcomeMessage: Message = {
          id: "welcome",
          conversationId: conv.id,
          role: "assistant",
          content: `I'm Coach Atlas, your technical interview mentor and tutorial creator.

I help you through:
• **Interview prep** (coding, system design, behavioral)
• **Problem-solving** with guided discovery
• **Comprehensive tutorials** on any technical topic

What brings you here today?`,
          timestamp: Date.now(),
        };

        // Save welcome message
        const saved = await storageService.saveMessage({
          conversationId: conv.id,
          role: "assistant",
          content: welcomeMessage.content,
          timestamp: Date.now(),
        });

        setMessages([
          {
            id: saved.id,
            role: "assistant",
            content: saved.content,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to initialize chat:", err);
      toast.error("Failed to load chat. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  }, [navigate, storageService, urlConversationId]);

  useEffect(() => {
    // Reset state when conversation changes
    setMessages([]);
    setIsInitializing(true);
    setError(null);
    initialize();
  }, [initialize, urlConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message using AIService with STREAMING
  const handleSend = async () => {
    if (!input.trim() || !config || !conversation || isLoading) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // 1. Save user message to IndexedDB
      const userMessage = await storageService.saveMessage({
        conversationId: conversation.id,
        role: "user",
        content: userContent,
        timestamp: Date.now(),
      });

      // 2. Update UI immediately with user message
      const newUserMsg: UIMessage = {
        id: userMessage.id,
        role: "user",
        content: userContent,
      };
      setMessages((prev) => [...prev, newUserMsg]);

      // 3. Get full conversation history from IndexedDB (for history injection)
      const historyMessages = await storageService.getMessages(conversation.id);

      // 4. Stream response from AIService
      let fullContent = "";

      for await (const chunk of aiService.streamChat(userContent, historyMessages, config)) {
        if (chunk.done) break;

        fullContent += chunk.content;
        setStreamingContent(fullContent);
      }

      // 5. Save complete assistant response to IndexedDB
      const assistantMessage = await storageService.saveMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: fullContent,
        timestamp: Date.now(),
        metadata: {
          model: config.model,
          provider: config.provider,
        },
      });

      // 6. Move streaming content to permanent messages
      setStreamingContent("");
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessage.id,
          role: "assistant",
          content: fullContent,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      setStreamingContent(""); // Clear streaming on error
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Get provider info for display
  const providerInfo = config
    ? providers.find((p) => p.id === config.provider)
    : null;
  const modelInfo = providerInfo?.models.find((m) => m.id === config?.model);

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">Coach Atlas</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>
                    {providerInfo?.name} • {modelInfo?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "user" ? "bg-secondary" : "bg-primary/20"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary rounded-bl-md"
                }`}
              >
                {message.role === "assistant" ? (
                  <MarkdownRenderer
                    content={message.content}
                    className="text-sm"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message - shows real-time content */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[85%] bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                {streamingContent ? (
                  <MarkdownRenderer
                    content={streamingContent}
                    className="text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Ask a question or describe a problem..."
              disabled={isLoading}
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="h-12 w-12 rounded-xl"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "TUTORIAL: Binary Search",
              "Design a URL Shortener",
              "Two Sum Problem",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
