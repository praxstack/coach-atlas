/**
 * Services Index
 * Clean exports for all services
 */

// Types
export * from "./types";

// Storage Service
export { db, generateId } from "./storage/db";
export { StorageService, storageService } from "./storage/StorageService";

// AI Service
export { AIService, aiService, SYSTEM_PROMPT } from "./ai/AIService";

// Context Manager
export {
  estimateTokens, getAvailableTokens, getContextInfo, getContextLimit, selectContext, type ContextInfo
} from "./ai/ContextManager";

// Adapters (rarely needed directly, but exported for testing)
export { anthropicAdapter } from "./ai/adapters/AnthropicAdapter";
export { googleAdapter } from "./ai/adapters/GoogleAdapter";
export { openAIAdapter } from "./ai/adapters/OpenAIAdapter";
