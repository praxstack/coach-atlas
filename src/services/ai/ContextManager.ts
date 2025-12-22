/**
 * ContextManager - Token Management with Sliding Window
 *
 * Prevents context length errors by intelligently selecting messages
 * that fit within the model's token limit.
 *
 * Strategy:
 * 1. Always include system prompt
 * 2. Always include the last user message
 * 3. Fill remaining space with recent history (newest first)
 * 4. Maintain message pairs (user/assistant) when possible
 */
import type { Message } from "../types";
import { SYSTEM_PROMPT } from "./AIService";

/**
 * Model context window configurations
 * Values are max input tokens (leaving room for output)
 */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // OpenAI
  "gpt-5": 128000,
  "gpt-5-mini": 128000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4-turbo": 128000,
  "gpt-4": 8192,
  "gpt-3.5-turbo": 16385,

  // Anthropic (Claude)
  "claude-sonnet-4-5": 200000,
  "claude-opus-4-1-20250805": 200000,
  "claude-3-5-haiku-20241022": 200000,
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-opus-20240229": 200000,
  "claude-3-sonnet-20240229": 200000,
  "claude-3-haiku-20240307": 200000,

  // Google (Gemini)
  "gemini-2.5-pro": 1000000,
  "gemini-2.5-flash": 1000000,
  "gemini-2.5-flash-lite": 1000000,
  "gemini-1.5-pro": 1000000,
  "gemini-1.5-flash": 1000000,
  "gemini-pro": 32000,

  // AWS Bedrock
  "anthropic.claude-3-5-sonnet-20241022-v2:0": 200000,
  "anthropic.claude-3-5-haiku-20241022-v1:0": 200000,
  "amazon.titan-text-premier-v1:0": 32000,
  "meta.llama3-2-90b-instruct-v1:0": 128000,
  "mistral.mistral-large-2407-v1:0": 128000,
};

// Default context limit if model not found
const DEFAULT_CONTEXT_LIMIT = 8000;

// Safety buffer: reserve tokens for response generation
const OUTPUT_TOKEN_RESERVE = 4096;

// Additional safety margin
const SAFETY_BUFFER = 500;

/**
 * Estimate token count for a string
 * Uses approximation: ~4 characters per token for English text
 * This is a rough estimate - actual tokenization varies by model
 */
export function estimateTokens(text: string): number {
  // Average of 4 characters per token for English
  // Add 10% buffer for safety
  return Math.ceil((text.length / 4) * 1.1);
}

/**
 * Estimate tokens for a message (includes role overhead)
 */
export function estimateMessageTokens(message: Message): number {
  // Role tokens (user/assistant/system) + formatting overhead
  const roleOverhead = 4;
  return estimateTokens(message.content) + roleOverhead;
}

/**
 * Get the context limit for a model
 */
export function getContextLimit(model: string): number {
  return MODEL_CONTEXT_LIMITS[model] || DEFAULT_CONTEXT_LIMIT;
}

/**
 * Get the available tokens for context (after reserves)
 */
export function getAvailableTokens(model: string): number {
  const limit = getContextLimit(model);
  return limit - OUTPUT_TOKEN_RESERVE - SAFETY_BUFFER;
}

/**
 * Select messages that fit within the context window
 * using the Sliding Window algorithm
 *
 * Priority:
 * 1. System prompt (always included)
 * 2. Last user message (always included)
 * 3. Recent history (fill from newest to oldest)
 *
 * @param messages - All conversation messages
 * @param model - Model ID for context limit lookup
 * @param systemPrompt - System prompt (defaults to SYSTEM_PROMPT)
 * @returns Messages that fit within context
 */
export function selectContext(
  messages: Message[],
  model: string,
  systemPrompt: string = SYSTEM_PROMPT
): Message[] {
  if (messages.length === 0) {
    return [];
  }

  const availableTokens = getAvailableTokens(model);
  let usedTokens = 0;

  // 1. Account for system prompt (always included)
  const systemTokens = estimateTokens(systemPrompt) + 4;
  usedTokens += systemTokens;

  // 2. The last message is the new user message (always include)
  const lastMessage = messages[messages.length - 1];
  const lastMessageTokens = estimateMessageTokens(lastMessage);
  usedTokens += lastMessageTokens;

  // If just system + last message exceeds limit, return only last message
  if (usedTokens > availableTokens) {
    console.warn("Context overflow: Even single message exceeds limit");
    return [lastMessage];
  }

  // 3. Fill remaining space with recent history (newest to oldest)
  const selectedMessages: Message[] = [];
  const historyMessages = messages.slice(0, -1); // Exclude the last message

  // Iterate from most recent to oldest
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msg = historyMessages[i];
    const msgTokens = estimateMessageTokens(msg);

    if (usedTokens + msgTokens <= availableTokens) {
      selectedMessages.unshift(msg); // Add to beginning to maintain order
      usedTokens += msgTokens;
    } else {
      // No more space - stop adding messages
      break;
    }
  }

  // 4. Add the last message at the end
  selectedMessages.push(lastMessage);

  // Log context usage for debugging
  const totalMessages = messages.length;
  const selectedCount = selectedMessages.length;
  const droppedCount = totalMessages - selectedCount;

  if (droppedCount > 0) {
    console.log(
      `[ContextManager] Using ${selectedCount}/${totalMessages} messages ` +
      `(dropped ${droppedCount} oldest). Tokens: ~${usedTokens}/${availableTokens}`
    );
  }

  return selectedMessages;
}

/**
 * Context info for UI display
 */
export interface ContextInfo {
  totalMessages: number;
  selectedMessages: number;
  droppedMessages: number;
  estimatedTokens: number;
  maxTokens: number;
  percentUsed: number;
}

/**
 * Get context usage information
 */
export function getContextInfo(
  messages: Message[],
  model: string,
  systemPrompt: string = SYSTEM_PROMPT
): ContextInfo {
  const selected = selectContext(messages, model, systemPrompt);
  const availableTokens = getAvailableTokens(model);

  let estimatedTokens = estimateTokens(systemPrompt) + 4;
  for (const msg of selected) {
    estimatedTokens += estimateMessageTokens(msg);
  }

  return {
    totalMessages: messages.length,
    selectedMessages: selected.length,
    droppedMessages: messages.length - selected.length,
    estimatedTokens,
    maxTokens: availableTokens,
    percentUsed: Math.round((estimatedTokens / availableTokens) * 100),
  };
}
