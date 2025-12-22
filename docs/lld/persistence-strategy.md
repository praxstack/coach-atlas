# Coach Atlas - Chat Persistence Strategy

**Document Version**: 1.0
**Date**: 2024-12-22
**Status**: Approved
**Pattern**: Offline-First with IndexedDB

---

## Executive Summary

This document defines how Coach Atlas stores chat history and context persistently, even when the web app is closed. The strategy uses **IndexedDB** (via Dexie.js) for unlimited, structured, offline-first storage that is completely free and privacy-respecting.

---

## Why IndexedDB over localStorage?

| Feature | localStorage | IndexedDB |
|---------|-------------|-----------|
| Storage Limit | ~5MB | ~50% of disk (100s of MB) |
| Data Structure | Key-value strings only | Complex objects, arrays |
| Querying | Manual parsing | Indexed queries |
| Performance | Synchronous (blocks UI) | Asynchronous (non-blocking) |
| Offline Support | ✅ Yes | ✅ Yes |
| Free | ✅ Yes | ✅ Yes |
| Privacy | ✅ Device-only | ✅ Device-only |

**Verdict**: IndexedDB is the professional choice for any app with significant data.

---

## Library Choice: Dexie.js

[Dexie.js](https://dexie.org/) wraps IndexedDB with a clean, Promise-based API.

```bash
npm install dexie
```

**Why Dexie?**
- Zero configuration
- TypeScript-first
- Reactive queries (live updates)
- 15KB gzipped (tiny footprint)
- Battle-tested (millions of users)

---

## Database Schema

### Schema Design

```typescript
// src/lib/db/schema.ts
import Dexie, { type Table } from 'dexie';

export interface Conversation {
  id?: number;            // Auto-increment primary key
  title: string;          // "Two Sum Problem" or auto-generated
  mode: 'chat' | 'interview' | 'tutorial';
  provider: string;       // 'openai', 'anthropic', etc.
  model: string;          // 'gpt-4o', 'claude-sonnet-4-5'
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  summary?: string;       // AI-generated summary of conversation
  tags?: string[];        // ['arrays', 'two-pointer']
  starred?: boolean;      // User bookmark
}

export interface Message {
  id?: number;            // Auto-increment primary key
  conversationId: number; // Foreign key to Conversation
  role: 'user' | 'assistant' | 'system';
  content: string;        // Full message content (markdown)
  timestamp: Date;
  tokens?: number;        // Token count (for analytics)
  metadata?: {
    model?: string;
    finishReason?: string;
    latency?: number;     // Response time in ms
  };
}

export interface Settings {
  id: string;             // 'config' (singleton)
  provider: string;
  model: string;
  credentials: Record<string, string>;
  theme: 'dark' | 'light';
  preferences: {
    autoSave: boolean;
    streamingEnabled: boolean;
    markdownEnabled: boolean;
  };
}

export class CoachAtlasDB extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  settings!: Table<Settings>;

  constructor() {
    super('coach-atlas');

    this.version(1).stores({
      conversations: '++id, mode, provider, createdAt, updatedAt, *tags',
      messages: '++id, conversationId, role, timestamp',
      settings: 'id'
    });
  }
}

export const db = new CoachAtlasDB();
```

### Index Explanation

| Table | Index | Purpose |
|-------|-------|---------|
| conversations | `++id` | Auto-increment primary key |
| conversations | `mode` | Filter by chat/interview/tutorial |
| conversations | `provider` | Filter by AI provider |
| conversations | `createdAt` | Sort by date |
| conversations | `*tags` | Multi-entry index for tag search |
| messages | `conversationId` | Fetch all messages for a chat |
| messages | `timestamp` | Sort messages chronologically |

---

## Data Access Layer

### Conversation Operations

```typescript
// src/lib/db/conversations.ts
import { db, type Conversation } from './schema';

export const conversations = {
  // Create new conversation
  async create(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>): Promise<number> {
    return db.conversations.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    });
  },

  // Get all conversations (sorted by recent)
  async getAll(): Promise<Conversation[]> {
    return db.conversations
      .orderBy('updatedAt')
      .reverse()
      .toArray();
  },

  // Get conversation by ID
  async getById(id: number): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  },

  // Update conversation
  async update(id: number, changes: Partial<Conversation>): Promise<void> {
    await db.conversations.update(id, {
      ...changes,
      updatedAt: new Date()
    });
  },

  // Delete conversation and its messages
  async delete(id: number): Promise<void> {
    await db.transaction('rw', db.conversations, db.messages, async () => {
      await db.messages.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    });
  },

  // Search conversations
  async search(query: string): Promise<Conversation[]> {
    const lowerQuery = query.toLowerCase();
    return db.conversations
      .filter(conv =>
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.summary?.toLowerCase().includes(lowerQuery) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  // Get by tag
  async getByTag(tag: string): Promise<Conversation[]> {
    return db.conversations.where('tags').equals(tag).toArray();
  },

  // Get starred
  async getStarred(): Promise<Conversation[]> {
    return db.conversations.filter(conv => conv.starred === true).toArray();
  }
};
```

### Message Operations

```typescript
// src/lib/db/messages.ts
import { db, type Message, conversations } from './schema';

export const messages = {
  // Add message to conversation
  async add(conversationId: number, data: Omit<Message, 'id' | 'conversationId' | 'timestamp'>): Promise<number> {
    const id = await db.messages.add({
      ...data,
      conversationId,
      timestamp: new Date()
    });

    // Update conversation metadata
    const conv = await db.conversations.get(conversationId);
    if (conv) {
      await db.conversations.update(conversationId, {
        messageCount: conv.messageCount + 1,
        updatedAt: new Date()
      });
    }

    return id;
  },

  // Get all messages for conversation
  async getByConversation(conversationId: number): Promise<Message[]> {
    return db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');
  },

  // Get last N messages (for context window)
  async getLastN(conversationId: number, n: number): Promise<Message[]> {
    const allMessages = await this.getByConversation(conversationId);
    return allMessages.slice(-n);
  },

  // Delete message
  async delete(id: number): Promise<void> {
    const message = await db.messages.get(id);
    if (message) {
      await db.messages.delete(id);
      const conv = await db.conversations.get(message.conversationId);
      if (conv) {
        await db.conversations.update(message.conversationId, {
          messageCount: Math.max(0, conv.messageCount - 1)
        });
      }
    }
  },

  // Clear all messages in conversation
  async clearConversation(conversationId: number): Promise<void> {
    await db.messages.where('conversationId').equals(conversationId).delete();
    await db.conversations.update(conversationId, {
      messageCount: 0,
      updatedAt: new Date()
    });
  }
};
```

### Settings Operations

```typescript
// src/lib/db/settings.ts
import { db, type Settings } from './schema';

const DEFAULT_SETTINGS: Settings = {
  id: 'config',
  provider: '',
  model: '',
  credentials: {},
  theme: 'dark',
  preferences: {
    autoSave: true,
    streamingEnabled: true,
    markdownEnabled: true
  }
};

export const settings = {
  // Get settings (create default if not exists)
  async get(): Promise<Settings> {
    const existing = await db.settings.get('config');
    if (!existing) {
      await db.settings.add(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return existing;
  },

  // Update settings
  async update(changes: Partial<Omit<Settings, 'id'>>): Promise<void> {
    const existing = await this.get();
    await db.settings.put({
      ...existing,
      ...changes,
      id: 'config'
    });
  },

  // Clear all settings
  async clear(): Promise<void> {
    await db.settings.delete('config');
  }
};
```

---

## React Hooks

### useConversations Hook

```typescript
// src/hooks/useConversations.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { conversations } from '@/lib/db/conversations';

export function useConversations() {
  // Live query - automatically updates when data changes
  const allConversations = useLiveQuery(
    () => db.conversations.orderBy('updatedAt').reverse().toArray()
  );

  return {
    conversations: allConversations ?? [],
    isLoading: allConversations === undefined,
    create: conversations.create,
    update: conversations.update,
    delete: conversations.delete,
    search: conversations.search
  };
}
```

### useChat Hook

```typescript
// src/hooks/useChat.ts
import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { messages } from '@/lib/db/messages';
import { conversations } from '@/lib/db/conversations';

export function useChat(conversationId: number | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live query for messages
  const chatMessages = useLiveQuery(
    () => conversationId
      ? db.messages.where('conversationId').equals(conversationId).sortBy('timestamp')
      : [],
    [conversationId]
  );

  // Live query for conversation metadata
  const conversation = useLiveQuery(
    () => conversationId ? db.conversations.get(conversationId) : undefined,
    [conversationId]
  );

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save user message
      await messages.add(conversationId, {
        role: 'user',
        content
      });

      // Get AI response (implementation in useAI hook)
      // ...

      // Save assistant message
      await messages.add(conversationId, {
        role: 'assistant',
        content: response,
        metadata: { model, latency }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  return {
    messages: chatMessages ?? [],
    conversation,
    isLoading,
    error,
    sendMessage,
    clearMessages: () => conversationId && messages.clearConversation(conversationId)
  };
}
```

---

## Export/Import Functionality

### Export to JSON

```typescript
// src/lib/db/export.ts
import { db } from './schema';

export async function exportAllData(): Promise<string> {
  const [convs, msgs, config] = await Promise.all([
    db.conversations.toArray(),
    db.messages.toArray(),
    db.settings.get('config')
  ]);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations: convs,
    messages: msgs,
    settings: config
  };

  return JSON.stringify(exportData, null, 2);
}

export async function exportConversation(conversationId: number): Promise<string> {
  const [conv, msgs] = await Promise.all([
    db.conversations.get(conversationId),
    db.messages.where('conversationId').equals(conversationId).toArray()
  ]);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversation: conv,
    messages: msgs
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Import from JSON

```typescript
// src/lib/db/import.ts
import { db, type Conversation, type Message } from './schema';

interface ImportData {
  version: number;
  conversations?: Conversation[];
  messages?: Message[];
  conversation?: Conversation;
}

export async function importData(jsonString: string): Promise<{
  conversations: number;
  messages: number;
}> {
  const data: ImportData = JSON.parse(jsonString);

  let conversationCount = 0;
  let messageCount = 0;

  await db.transaction('rw', db.conversations, db.messages, async () => {
    // Handle full export format
    if (data.conversations) {
      for (const conv of data.conversations) {
        const { id, ...convData } = conv;
        await db.conversations.add(convData as Conversation);
        conversationCount++;
      }
    }

    if (data.messages) {
      for (const msg of data.messages) {
        const { id, ...msgData } = msg;
        await db.messages.add(msgData as Message);
        messageCount++;
      }
    }

    // Handle single conversation format
    if (data.conversation) {
      const { id, ...convData } = data.conversation;
      const newId = await db.conversations.add(convData as Conversation);
      conversationCount++;

      if (data.messages) {
        for (const msg of data.messages) {
          await db.messages.add({
            ...msg,
            conversationId: newId
          } as Message);
          messageCount++;
        }
      }
    }
  });

  return { conversations: conversationCount, messages: messageCount };
}
```

---

## Context Restoration Flow

### How Context is Restored When Opening a Past Chat

```
┌─────────────────────────────────────────────────────────┐
│                   User Opens App                         │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  1. Load conversation list from IndexedDB               │
│     (useLiveQuery: db.conversations.orderBy...)         │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  2. User clicks on past conversation                    │
│     (conversationId selected)                           │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  3. Fetch all messages for conversation                 │
│     (db.messages.where('conversationId').equals(id))    │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  4. Display messages in chat UI                         │
│     (Messages render with markdown)                     │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│  5. When user sends new message:                        │
│     - Get last N messages for context                   │
│     - Send to AI with conversation history              │
│     - AI has full context to continue                   │
└─────────────────────────────────────────────────────────┘
```

### Context Window Management

```typescript
// src/lib/ai/context.ts
import { messages } from '@/lib/db/messages';
import type { Message } from '@/lib/db/schema';

const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_TOKENS = 8000; // Leave room for response

export async function buildContextMessages(
  conversationId: number,
  systemPrompt: string
): Promise<Array<{ role: string; content: string }>> {
  // Get recent messages
  const recentMessages = await messages.getLastN(conversationId, MAX_CONTEXT_MESSAGES);

  // Build context array
  const context = [
    { role: 'system', content: systemPrompt }
  ];

  // Add messages, respecting token limit
  let totalTokens = estimateTokens(systemPrompt);

  for (const msg of recentMessages) {
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens > MAX_CONTEXT_TOKENS) break;

    context.push({
      role: msg.role,
      content: msg.content
    });
    totalTokens += msgTokens;
  }

  return context;
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

---

## Storage Quota Management

```typescript
// src/lib/db/quota.ts
export async function checkStorageQuota(): Promise<{
  used: number;
  available: number;
  percentUsed: number;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const available = estimate.quota ?? 0;

    return {
      used,
      available,
      percentUsed: available > 0 ? (used / available) * 100 : 0
    };
  }

  return { used: 0, available: 0, percentUsed: 0 };
}

export async function cleanOldConversations(keepDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);

  const oldConversations = await db.conversations
    .where('updatedAt')
    .below(cutoffDate)
    .filter(conv => !conv.starred) // Don't delete starred
    .toArray();

  let deletedCount = 0;

  for (const conv of oldConversations) {
    if (conv.id) {
      await db.messages.where('conversationId').equals(conv.id).delete();
      await db.conversations.delete(conv.id);
      deletedCount++;
    }
  }

  return deletedCount;
}
```

---

## Migration from localStorage

For users who have existing data in localStorage:

```typescript
// src/lib/db/migrate.ts
import { db } from './schema';
import { loadConfig, clearConfig } from '@/lib/providers';

export async function migrateFromLocalStorage(): Promise<boolean> {
  const oldConfig = loadConfig();

  if (oldConfig) {
    await db.settings.put({
      id: 'config',
      provider: oldConfig.provider,
      model: oldConfig.model,
      credentials: oldConfig.credentials,
      theme: 'dark',
      preferences: {
        autoSave: true,
        streamingEnabled: true,
        markdownEnabled: true
      }
    });

    // Clear old localStorage after migration
    clearConfig();

    return true;
  }

  return false;
}
```

---

## File Structure

```
src/lib/db/
├── schema.ts          # Dexie database schema
├── conversations.ts   # Conversation CRUD operations
├── messages.ts        # Message CRUD operations
├── settings.ts        # Settings operations
├── export.ts          # Export functionality
├── import.ts          # Import functionality
├── context.ts         # Context window management
├── quota.ts           # Storage quota management
├── migrate.ts         # localStorage migration
└── index.ts           # Barrel export
```

---

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Offline-First** | View all past chats without internet |
| **Private** | Data never leaves the device |
| **Fast** | Async operations, no UI blocking |
| **Unlimited** | 100s of MB vs 5MB localStorage |
| **Structured** | Query by date, tags, starred status |
| **Exportable** | Backup to JSON anytime |
| **Reactive** | UI auto-updates with Dexie live queries |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Cline | Initial creation |
