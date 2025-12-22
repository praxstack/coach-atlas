/**
 * StorageService - IndexedDB Repository
 * Handles all data persistence for Coach Atlas
 */
import type {
  Conversation,
  IStorageService,
  Message,
} from "../types";
import { db, generateId } from "./db";

export class StorageService implements IStorageService {
  // ============================================
  // Message Operations
  // ============================================

  async saveMessage(message: Omit<Message, "id">): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: generateId(),
    };

    await db.messages.add(newMessage);

    // Update conversation's updatedAt timestamp
    await this.updateConversation(message.conversationId, {
      updatedAt: Date.now(),
    });

    return newMessage;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
  }

  async deleteMessage(id: string): Promise<void> {
    await db.messages.delete(id);
  }

  // ============================================
  // Conversation Operations
  // ============================================

  async createConversation(title?: string): Promise<Conversation> {
    const now = Date.now();
    const conversation: Conversation = {
      id: generateId(),
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
    };

    await db.conversations.add(conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.conversations.orderBy("updatedAt").reverse().toArray();
  }

  async updateConversation(
    id: string,
    updates: Partial<Conversation>
  ): Promise<void> {
    await db.conversations.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete all messages in the conversation
    await db.messages.where("conversationId").equals(id).delete();
    // Delete the conversation
    await db.conversations.delete(id);
  }

  // ============================================
  // Settings Operations
  // ============================================

  async saveSetting(key: string, value: string): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.settings.delete(key);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get or create a default conversation
   * Used for simple single-chat scenarios
   */
  async getOrCreateDefaultConversation(): Promise<Conversation> {
    const conversations = await this.getAllConversations();

    if (conversations.length > 0) {
      return conversations[0];
    }

    return this.createConversation("New Chat");
  }

  /**
   * Save provider configuration
   * Stores API key, model selection, and region (for Bedrock)
   */
  async saveProviderConfig(config: {
    provider: string;
    apiKey: string;
    model: string;
    region?: string;
  }): Promise<void> {
    await this.saveSetting("provider", config.provider);
    await this.saveSetting("apiKey", config.apiKey);
    await this.saveSetting("model", config.model);
    if (config.region) {
      await this.saveSetting("region", config.region);
    }
  }

  /**
   * Load provider configuration
   * Returns null if not configured
   */
  async loadProviderConfig(): Promise<{
    provider: string;
    apiKey: string;
    model: string;
    region?: string;
  } | null> {
    const provider = await this.getSetting("provider");
    const apiKey = await this.getSetting("apiKey");
    const model = await this.getSetting("model");
    const region = await this.getSetting("region");

    if (!provider || !apiKey || !model) {
      return null;
    }

    return { provider, apiKey, model, region: region || undefined };
  }

  /**
   * Clear all data (useful for logout/reset)
   */
  async clearAll(): Promise<void> {
    await db.messages.clear();
    await db.conversations.clear();
    await db.settings.clear();
  }
}

// Singleton export
export const storageService = new StorageService();
