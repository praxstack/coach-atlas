import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: `I'm Coach Atlas - your technical interview mentor and tutorial creator.

I help you through:
• Interview prep (coding, system design, behavioral)
• Problem-solving with guided discovery
• Comprehensive tutorials on any technical topic

What brings you here today?`,
  },
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };
    
    setMessages([...messages, newMessage]);
    setInput("");
    
    // Simulate response
    setTimeout(() => {
      const response: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "Great question! Let me guide you through this with some probing questions first. What's your initial approach to solving this problem?",
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your <span className="text-gradient">Learning Journey</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Experience guided discovery and honest feedback in real-time.
          </p>
        </div>
        
        {/* Chat container */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Coach Atlas</h3>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="w-3 h-3" />
                  <span>Online • Ready to help</span>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-6 space-y-4">
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-line text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t border-border bg-secondary/20">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question or describe a problem..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <Button 
                  onClick={handleSend} 
                  size="icon" 
                  className="h-12 w-12 rounded-xl"
                  disabled={!input.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["TUTORIAL: Binary Search", "Design a URL Shortener", "Two Sum Problem"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
