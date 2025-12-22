import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { loadConfig, providers, StoredConfig } from "@/lib/providers";
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Settings, 
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Coach Atlas, a world-class technical mentor who combines deep interview preparation coaching with comprehensive tutorial creation. You teach through guided discovery, provide brutally honest feedback, and create production-ready learning resources.

Your core principles:
1. Build Problem Solvers, Not Solution Memorizers
2. Guided Discovery First - Ask questions before giving answers
3. Brutal Honesty Always - Tell it like it is, no sugarcoating
4. Visual Learning - Use diagrams, tables, and structured examples
5. Production-Ready - Everything you teach should work in real jobs

For interview coaching: Use the Socratic method with escalating hints.
For tutorials: Create comprehensive, beginner-to-advanced guides with code examples.
For system design: Guide through requirements, capacity, API design, database, architecture, and trade-offs.

Always be direct, professional, and focused on building real skills.`;

const Chat = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<StoredConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedConfig = loadConfig();
    if (!storedConfig) {
      toast.error("Please configure your API key first");
      navigate("/settings");
      return;
    }
    setConfig(storedConfig);
    
    // Initial greeting
    setMessages([{
      id: 1,
      role: "assistant",
      content: `I'm Coach Atlas, your technical interview mentor and tutorial creator.

I help you through:
• **Interview prep** (coding, system design, behavioral)
• **Problem-solving** with guided discovery
• **Comprehensive tutorials** on any technical topic

What brings you here today?`
    }]);
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callOpenAI = async (allMessages: Message[]) => {
    if (!config) return null;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...allMessages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 4096,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callAnthropic = async (allMessages: Message[]) => {
    if (!config) return null;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.credentials.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: allMessages.map(m => ({ role: m.role, content: m.content }))
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API error");
    }
    
    const data = await response.json();
    return data.content[0].text;
  };

  const callGoogle = async (allMessages: Message[]) => {
    if (!config) return null;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.credentials.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...allMessages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          ],
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Google AI API error");
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleSend = async () => {
    if (!input.trim() || !config || isLoading) return;
    
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);
    
    try {
      let response: string | null = null;
      
      switch (config.provider) {
        case "openai":
          response = await callOpenAI(newMessages);
          break;
        case "anthropic":
          response = await callAnthropic(newMessages);
          break;
        case "google":
          response = await callGoogle(newMessages);
          break;
        case "bedrock":
          throw new Error("AWS Bedrock requires server-side integration. Please use a different provider or set up an edge function.");
        default:
          throw new Error("Unknown provider");
      }
      
      if (response) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          role: "assistant",
          content: response,
        }]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const providerInfo = config ? providers.find(p => p.id === config.provider) : null;
  const modelInfo = providerInfo?.models.find(m => m.id === config?.model);

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
                  <span>{providerInfo?.name} • {modelInfo?.name}</span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === "user" 
                  ? "bg-secondary" 
                  : "bg-primary/20"
              }`}>
                {message.role === "user" 
                  ? <User className="w-4 h-4 text-foreground" />
                  : <Bot className="w-4 h-4 text-primary" />
                }
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
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
            {["TUTORIAL: Binary Search", "Design a URL Shortener", "Two Sum Problem"].map((suggestion) => (
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
