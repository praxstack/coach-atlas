/**
 * WebView Bridge Protocol Types
 * Bidirectional communication between web app and native host
 */

/**
 * Message types for native → web communication
 */
export type BridgeMessageType =
  | "SET_CONFIG"
  | "INITIAL_CONTEXT"
  | "THEME_CHANGE"
  | "NAVIGATE"
  | "SET_USER";

/**
 * Message types for web → native communication
 */
export type BridgeResponseType =
  | "READY"
  | "CONFIG_UPDATED"
  | "ERROR"
  | "NAVIGATION_COMPLETE"
  | "USER_MESSAGE";

/**
 * SET_CONFIG payload - Native injects API configuration
 */
export interface SetConfigPayload {
  apiKey: string;
  provider: "openai" | "anthropic" | "google" | "bedrock";
  model?: string;
}

/**
 * INITIAL_CONTEXT payload - Native sets conversation context
 */
export interface InitialContextPayload {
  /** System prompt override or context */
  prompt?: string;
  /** Pre-defined topic (e.g., "Binary Search Tutorial") */
  topic?: string;
  /** Initial user message to auto-send */
  initialMessage?: string;
  /** Conversation ID to load */
  conversationId?: string;
}

/**
 * THEME_CHANGE payload - Native controls theme
 */
export interface ThemeChangePayload {
  theme: "light" | "dark" | "system";
}

/**
 * NAVIGATE payload - Native triggers navigation
 */
export interface NavigatePayload {
  path: string;
}

/**
 * SET_USER payload - Native provides user info
 */
export interface SetUserPayload {
  userId: string;
  displayName?: string;
  email?: string;
}

/**
 * Inbound message from native app
 */
export interface BridgeMessage<T = unknown> {
  type: BridgeMessageType;
  payload: T;
  /** Optional message ID for request/response correlation */
  messageId?: string;
}

/**
 * Outbound response to native app
 */
export interface BridgeResponse<T = unknown> {
  type: BridgeResponseType;
  payload?: T;
  /** Correlation ID if responding to a specific message */
  messageId?: string;
  /** Error message if type is ERROR */
  error?: string;
}

/**
 * Bridge state for tracking connection status
 */
export interface BridgeState {
  isConnected: boolean;
  isNativeHost: boolean;
  lastMessage?: BridgeMessage;
  config?: SetConfigPayload;
  context?: InitialContextPayload;
  theme?: "light" | "dark" | "system";
  user?: SetUserPayload;
}

/**
 * Type guards for payload types
 */
export function isSetConfigPayload(payload: unknown): payload is SetConfigPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "apiKey" in payload &&
    "provider" in payload
  );
}

export function isInitialContextPayload(payload: unknown): payload is InitialContextPayload {
  return typeof payload === "object" && payload !== null;
}

export function isThemeChangePayload(payload: unknown): payload is ThemeChangePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "theme" in payload &&
    ["light", "dark", "system"].includes((payload as ThemeChangePayload).theme)
  );
}

export function isNavigatePayload(payload: unknown): payload is NavigatePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "path" in payload &&
    typeof (payload as NavigatePayload).path === "string"
  );
}

export function isSetUserPayload(payload: unknown): payload is SetUserPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload
  );
}
