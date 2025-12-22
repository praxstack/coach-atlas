/**
 * WebViewBridge - Bidirectional communication with native host
 * Singleton service that handles postMessage events
 */
import { storageService } from "../storage/StorageService";
import type {
  BridgeMessage,
  BridgeResponse,
  BridgeState,
  InitialContextPayload,
  NavigatePayload,
  SetUserPayload,
  ThemeChangePayload
} from "./types";
import {
  isInitialContextPayload,
  isNavigatePayload,
  isSetConfigPayload,
  isSetUserPayload,
  isThemeChangePayload,
} from "./types";

/**
 * Callback types for bridge events
 */
export type BridgeEventCallback = (state: BridgeState) => void;
export type NavigationCallback = (path: string) => void;
export type InitialMessageCallback = (message: string) => void;

class WebViewBridgeService {
  private state: BridgeState = {
    isConnected: false,
    isNativeHost: false,
  };

  private listeners: Set<BridgeEventCallback> = new Set();
  private navigationCallback: NavigationCallback | null = null;
  private initialMessageCallback: InitialMessageCallback | null = null;
  private initialized = false;

  /**
   * Initialize the bridge and start listening for messages
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Detect if running in native WebView
    this.state.isNativeHost = this.detectNativeHost();

    // Listen for messages from native host
    window.addEventListener("message", this.handleMessage.bind(this));

    // Send READY signal to native host
    this.sendToNative({ type: "READY" });

    console.log("[WebViewBridge] Initialized", {
      isNativeHost: this.state.isNativeHost,
    });
  }

  /**
   * Detect if we're running inside a native WebView
   */
  private detectNativeHost(): boolean {
    // Check for common WebView indicators
    const ua = navigator.userAgent.toLowerCase();
    const isWebView =
      ua.includes("wv") || // Android WebView
      ua.includes("webview") ||
      // iOS WKWebView (no Safari version)
      (ua.includes("iphone") && !ua.includes("safari")) ||
      (ua.includes("ipad") && !ua.includes("safari")) ||
      // ReactNative WebView
      typeof (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";

    return isWebView;
  }

  /**
   * Handle incoming messages from native host
   */
  private handleMessage(event: MessageEvent): void {
    // Security: validate message origin in production
    // For now, accept all origins during development

    const message = event.data as BridgeMessage;

    // Validate message structure
    if (!message || typeof message.type !== "string") {
      return; // Ignore non-bridge messages
    }

    console.log("[WebViewBridge] Received:", message.type, message.payload);

    this.state.isConnected = true;
    this.state.lastMessage = message;

    // Handle message types
    switch (message.type) {
      case "SET_CONFIG":
        this.handleSetConfig(message.payload);
        break;

      case "INITIAL_CONTEXT":
        this.handleInitialContext(message.payload);
        break;

      case "THEME_CHANGE":
        this.handleThemeChange(message.payload);
        break;

      case "NAVIGATE":
        this.handleNavigate(message.payload);
        break;

      case "SET_USER":
        this.handleSetUser(message.payload);
        break;

      default:
        console.warn("[WebViewBridge] Unknown message type:", message.type);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Handle SET_CONFIG message - save API configuration
   */
  private async handleSetConfig(payload: unknown): Promise<void> {
    if (!isSetConfigPayload(payload)) {
      this.sendError("Invalid SET_CONFIG payload");
      return;
    }

    try {
      // Save to storage
      await storageService.saveProviderConfig({
        provider: payload.provider,
        model: payload.model || this.getDefaultModel(payload.provider),
        apiKey: payload.apiKey,
      });

      this.state.config = payload;

      // Respond to native
      this.sendToNative({
        type: "CONFIG_UPDATED",
        payload: { success: true },
      });

      console.log("[WebViewBridge] Config saved:", payload.provider);
    } catch (err) {
      console.error("[WebViewBridge] Failed to save config:", err);
      this.sendError("Failed to save configuration");
    }
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: string): string {
    switch (provider) {
      case "openai":
        return "gpt-4o";
      case "anthropic":
        return "claude-sonnet-4-5";
      case "google":
        return "gemini-2.5-flash";
      default:
        return "";
    }
  }

  /**
   * Handle INITIAL_CONTEXT message - set conversation context
   */
  private handleInitialContext(payload: unknown): void {
    if (!isInitialContextPayload(payload)) {
      this.sendError("Invalid INITIAL_CONTEXT payload");
      return;
    }

    this.state.context = payload as InitialContextPayload;

    // If there's an initial message, trigger the callback
    if (payload.initialMessage && this.initialMessageCallback) {
      this.initialMessageCallback(payload.initialMessage);
    }

    // If there's a conversation ID, navigate to it
    if (payload.conversationId && this.navigationCallback) {
      this.navigationCallback(`/chat/${payload.conversationId}`);
    }
  }

  /**
   * Handle THEME_CHANGE message - update app theme
   */
  private handleThemeChange(payload: unknown): void {
    if (!isThemeChangePayload(payload)) {
      this.sendError("Invalid THEME_CHANGE payload");
      return;
    }

    this.state.theme = (payload as ThemeChangePayload).theme;

    // Apply theme to document
    const root = document.documentElement;
    if (this.state.theme === "dark") {
      root.classList.add("dark");
    } else if (this.state.theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }

  /**
   * Handle NAVIGATE message - trigger navigation
   */
  private handleNavigate(payload: unknown): void {
    if (!isNavigatePayload(payload)) {
      this.sendError("Invalid NAVIGATE payload");
      return;
    }

    const path = (payload as NavigatePayload).path;

    if (this.navigationCallback) {
      this.navigationCallback(path);
      this.sendToNative({
        type: "NAVIGATION_COMPLETE",
        payload: { path },
      });
    }
  }

  /**
   * Handle SET_USER message - store user info
   */
  private handleSetUser(payload: unknown): void {
    if (!isSetUserPayload(payload)) {
      this.sendError("Invalid SET_USER payload");
      return;
    }

    this.state.user = payload as SetUserPayload;
  }

  /**
   * Send message to native host
   */
  sendToNative(response: BridgeResponse): void {
    // ReactNative WebView
    const rn = (window as unknown as { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView;
    if (rn?.postMessage) {
      rn.postMessage(JSON.stringify(response));
      return;
    }

    // iOS WKWebView
    const webkit = (window as unknown as { webkit?: { messageHandlers?: { bridge?: { postMessage: (msg: unknown) => void } } } }).webkit;
    if (webkit?.messageHandlers?.bridge?.postMessage) {
      webkit.messageHandlers.bridge.postMessage(response);
      return;
    }

    // Android WebView
    const android = (window as unknown as { AndroidBridge?: { postMessage: (msg: string) => void } }).AndroidBridge;
    if (android?.postMessage) {
      android.postMessage(JSON.stringify(response));
      return;
    }

    // Fallback: parent window (for iframe testing)
    if (window.parent !== window) {
      window.parent.postMessage(response, "*");
    }
  }

  /**
   * Send error response to native
   */
  private sendError(message: string): void {
    this.sendToNative({
      type: "ERROR",
      error: message,
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: BridgeEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Set navigation callback (called by React Router)
   */
  setNavigationCallback(callback: NavigationCallback): void {
    this.navigationCallback = callback;
  }

  /**
   * Set initial message callback (called by ChatPage)
   */
  setInitialMessageCallback(callback: InitialMessageCallback): void {
    this.initialMessageCallback = callback;
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.state));
  }

  /**
   * Get current bridge state
   */
  getState(): BridgeState {
    return { ...this.state };
  }

  /**
   * Check if config has been injected by native
   */
  hasNativeConfig(): boolean {
    return this.state.isConnected && !!this.state.config;
  }

  /**
   * Get initial context if set
   */
  getInitialContext(): InitialContextPayload | undefined {
    return this.state.context;
  }

  /**
   * Send user message event to native (for analytics)
   */
  notifyUserMessage(message: string): void {
    this.sendToNative({
      type: "USER_MESSAGE",
      payload: { message: message.substring(0, 100) }, // Truncate for privacy
    });
  }
}

// Singleton export
export const webViewBridge = new WebViewBridgeService();
