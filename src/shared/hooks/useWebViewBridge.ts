/**
 * useWebViewBridge - React hook for WebView bridge integration
 * Provides reactive state and utilities for native communication
 */
import { webViewBridge } from "@/services/bridge/WebViewBridge";
import type { BridgeState } from "@/services/bridge/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook to integrate WebView bridge with React
 *
 * Features:
 * - Initializes bridge on mount
 * - Provides reactive bridge state
 * - Connects navigation callback to React Router
 * - Auto-cleans up on unmount
 */
export function useWebViewBridge() {
  const navigate = useNavigate();
  const [state, setState] = useState<BridgeState>(webViewBridge.getState());

  useEffect(() => {
    // Initialize bridge (idempotent)
    webViewBridge.initialize();

    // Connect navigation to React Router
    webViewBridge.setNavigationCallback((path) => {
      navigate(path);
    });

    // Subscribe to state changes
    const unsubscribe = webViewBridge.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return {
    /** Current bridge state */
    state,
    /** Whether we're running in a native WebView */
    isNativeHost: state.isNativeHost,
    /** Whether native has sent configuration */
    hasNativeConfig: webViewBridge.hasNativeConfig(),
    /** Initial context from native (if any) */
    initialContext: webViewBridge.getInitialContext(),
    /** Notify native of user message (for analytics) */
    notifyUserMessage: webViewBridge.notifyUserMessage.bind(webViewBridge),
    /** Set callback for initial message injection */
    setInitialMessageCallback: webViewBridge.setInitialMessageCallback.bind(webViewBridge),
    /** Send custom message to native */
    sendToNative: webViewBridge.sendToNative.bind(webViewBridge),
  };
}

/**
 * Simplified hook that just initializes the bridge
 * Use in App.tsx to ensure bridge is always ready
 */
export function useInitializeBridge() {
  useEffect(() => {
    webViewBridge.initialize();
  }, []);
}

export default useWebViewBridge;
