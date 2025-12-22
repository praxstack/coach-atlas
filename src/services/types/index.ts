/**
 * Service Layer Types
 * Shared types for AI and Storage services
 */

// ============================================
// Message Types
// ============================================

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokensUsed?: number;
  processingTime?: number;
  error?: string;
  partial?: boolean;
}

// ============================================
// Conversation Types
// ============================================

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  messageCount?: number;
  lastModel?: string;
  systemPrompt?: string;
}

// ============================================
// Provider Types
// ============================================

export type ProviderId = "openai" | "anthropic" | "google" | "bedrock";

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
  region?: string; // For AWS Bedrock
}

export interface ProviderModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
}

// ============================================
// Settings Types
// ============================================

export interface Settings {
  key: string;
  value: string;
  encrypted?: boolean;
  updatedAt: number;
}

// ============================================
// AI Service Types
// ============================================

export interface AIRequest {
  messages: Message[];
  config: ProviderConfig;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

// ============================================
// Service Interfaces
// ============================================

export interface IStorageService {
  // Messages
  saveMessage(message: Omit<Message, "id">): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;

  // Conversations
  createConversation(title?: string): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;
  deleteConversation(id: string): Promise<void>;

  // Settings
  saveSetting(key: string, value: string): Promise<void>;
  getSetting(key: string): Promise<string | undefined>;
  deleteSetting(key: string): Promise<void>;
}

export interface IAIService {
  sendMessage(request: AIRequest): Promise<AIResponse>;
  streamMessage?(request: AIRequest): AsyncIterable<StreamChunk>;
  validateApiKey(provider: ProviderId, apiKey: string): Promise<boolean>;
}
