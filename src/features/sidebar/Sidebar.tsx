/**
 * Sidebar - Conversation History Navigation
 * Lists all conversations with actions
 */
import { useStorageService } from "@/app/ServiceContext";
import type { Conversation } from "@/services/types";
import { Button } from "@/shared/ui/button";
import {
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const storageService = useStorageService();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const convs = await storageService.getAllConversations();
      setConversations(convs);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create new conversation
  const handleNewChat = async () => {
    try {
      const newConv = await storageService.createConversation();
      setConversations((prev) => [newConv, ...prev]);
      navigate(`/chat/${newConv.id}`);
      onClose?.();
    } catch (err) {
      console.error("Failed to create conversation:", err);
      toast.error("Failed to create new chat");
    }
  };

  // Delete conversation
  const handleDelete = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation(); // Prevent navigation

    if (!confirm("Delete this conversation?")) return;

    try {
      await storageService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));

      // If deleted current conversation, go to first remaining or create new
      if (conversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].id}`);
        } else {
          handleNewChat();
        }
      }

      toast.success("Conversation deleted");
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      toast.error("Failed to delete conversation");
    }
  };

  // Select conversation
  const handleSelect = (convId: string) => {
    navigate(`/chat/${convId}`);
    onClose?.();
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">Coach Atlas</span>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
                  conversationId === conv.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(conv.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            navigate("/settings");
            onClose?.();
          }}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
