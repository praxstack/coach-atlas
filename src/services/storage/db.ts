/**
 * Dexie Database Schema
 * IndexedDB wrapper for Coach Atlas
 */
import Dexie, { type Table } from "dexie";
import type { Conversation, Message, Settings } from "../types";

export class CoachAtlasDB extends Dexie {
  messages!: Table<Message, string>;
  conversations!: Table<Conversation, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("CoachAtlasDB");

    // Schema versioning - increment version when schema changes
    this.version(1).stores({
      // Primary key is 'id', indexes on conversationId and timestamp
      messages: "id, conversationId, timestamp",
      // Primary key is 'id', indexes on createdAt and updatedAt
      conversations: "id, createdAt, updatedAt",
      // Primary key is 'key'
      settings: "key",
    });
  }
}

// Singleton database instance
export const db = new CoachAtlasDB();

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
