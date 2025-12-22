# Coach Atlas - WebView Integration Strategy

**Document Version**: 1.0
**Date**: 2024-12-22
**Status**: Draft
**Purpose**: Define how Coach Atlas can be embedded in mobile apps via WebView

---

## Table of Contents

1. [Overview](#1-overview)
2. [WebView Compatibility](#2-webview-compatibility)
3. [Integration Patterns](#3-integration-patterns)
4. [Bridge API Specification](#4-bridge-api-specification)
5. [Platform-Specific Guides](#5-platform-specific-guides)
6. [Configuration Options](#6-configuration-options)
7. [Security Considerations](#7-security-considerations)
8. [Performance Optimization](#8-performance-optimization)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

### 1.1 What is WebView Integration?

Coach Atlas is designed as a standalone web application that can be embedded within native mobile applications using WebView technology. This allows mobile developers to:

- Add AI interview coaching to existing apps
- Build dedicated Coach Atlas mobile apps without native development
- Share codebase between web and mobile platforms
- Leverage web technologies for rapid iteration

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Native Mobile App                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │                    WebView Container               │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │              Coach Atlas SPA                 │  │  │
│  │  │  ┌─────────────────────────────────────┐   │  │  │
│  │  │  │         React Application            │   │  │  │
│  │  │  │  - Chat Interface                    │   │  │  │
│  │  │  │  - Settings Management               │   │  │  │
│  │  │  │  - Tutorial Display                  │   │  │  │
│  │  │  └─────────────────────────────────────┘   │  │  │
│  │  │                     │                        │  │  │
│  │  │              WebView Bridge                  │  │  │
│  │  └─────────────────────┼───────────────────────┘  │  │
│  │                        │                          │  │
│  │              Native Bridge Handler                │  │
│  └────────────────────────┼──────────────────────────┘  │
│                           │                              │
│              Native Features (Share, Storage, etc.)      │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Benefits

| Benefit | Description |
|---------|-------------|
| **Single Codebase** | One React app for web, iOS, and Android |
| **Rapid Updates** | Update content without app store review |
| **Full Features** | All web features work in WebView |
| **Cost Effective** | No native development required |
| **Easy Integration** | Drop-in component for existing apps |

### 1.4 Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| Performance | Code splitting, lazy loading, optimized bundle |
| Native Feel | Haptic feedback, native share, proper animations |
| Storage | Use native storage via bridge for large data |
| Offline | Service Worker for basic offline support |

---

## 2. WebView Compatibility

### 2.1 Supported Platforms

| Platform | WebView Engine | Min Version | Status |
|----------|---------------|-------------|--------|
| iOS | WKWebView | iOS 14+ | ✅ Supported |
| Android | Chromium WebView | Android 7+ (API 24) | ✅ Supported |
| React Native | react-native-webview | 11.0+ | ✅ Supported |
| Flutter | webview_flutter | 4.0+ | ✅ Supported |
| Capacitor | Capacitor WebView | 5.0+ | ✅ Supported |
| Electron | Chromium | Any | ✅ Supported |

### 2.2 Browser Features Required

| Feature | Usage | Fallback |
|---------|-------|----------|
| ES2020 | Core JavaScript | Transpile with Vite |
| CSS Grid | Layout | Flexbox fallback |
| CSS Variables | Theming | Static values |
| Fetch API | API calls | Polyfill |
| LocalStorage | Persistence | Native bridge storage |
| IntersectionObserver | Lazy loading | Eager load |

### 2.3 API Compatibility

| API | Support | Notes |
|-----|---------|-------|
| OpenAI | ✅ Full | CORS enabled |
| Anthropic | ✅ Full | CORS enabled |
| Google AI | ✅ Full | CORS enabled |
| AWS Bedrock | ⚠️ Partial | Requires proxy or native bridge |

---

## 3. Integration Patterns

### 3.1 Pattern A: Full Replacement

Replace entire screen with Coach Atlas WebView.

```
┌──────────────────────┐
│     Native App       │
├──────────────────────┤
│                      │
│   ┌──────────────┐   │
│   │   Coach      │   │
│   │   Atlas      │   │
│   │   WebView    │   │
│   │   (100%)     │   │
│   └──────────────┘   │
│                      │
└──────────────────────┘
```

**Use Case**: Dedicated Coach Atlas app or section

**Pros**: Full experience, simple implementation

**Cons**: Navigation between native/web

### 3.2 Pattern B: Modal/Sheet

Display Coach Atlas as a modal overlay.

```
┌──────────────────────┐
│     Native App       │
│  ┌────────────────┐  │
│  │  Modal Header  │  │
│  ├────────────────┤  │
│  │                │  │
│  │  Coach Atlas   │  │
│  │   WebView      │  │
│  │                │  │
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

**Use Case**: Chat assistant within larger app

**Pros**: Context preserved, easy dismiss

**Cons**: Smaller viewport, limited features

### 3.3 Pattern C: Embedded Component

Embed specific features (e.g., tutorial view only).

```
┌──────────────────────┐
│     Native App       │
├──────────────────────┤
│    Native Content    │
├──────────────────────┤
│   Coach Atlas        │
│   Tutorial View      │
│   (Embedded)         │
├──────────────────────┤
│   Native Content     │
└──────────────────────┘
```

**Use Case**: Display tutorials in learning app

**Pros**: Seamless integration

**Cons**: Complex bridge communication

### 3.4 Recommended Pattern

**For Mobile Apps**: Pattern A (Full Replacement) with native navigation header

**For Existing Apps**: Pattern B (Modal/Sheet) for assistant functionality

---

## 4. Bridge API Specification

### 4.1 React → Native Communication

```typescript
// src/lib/webview.ts

interface WebViewBridge {
  /**
   * Check if running inside WebView
   */
  isWebView(): boolean;

  /**
   * Share content using native share sheet
   */
  share(options: ShareOptions): Promise<void>;

  /**
   * Copy text to native clipboard
   */
  copyToClipboard(text: string): Promise<void>;

  /**
   * Open URL in external browser
   */
  openExternal(url: string): void;

  /**
   * Trigger haptic feedback
   */
  haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;

  /**
   * Request native storage
   */
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };

  /**
   * Get device info
   */
  getDeviceInfo(): Promise<DeviceInfo>;

  /**
   * Close WebView (if in modal)
   */
  close(): void;
}

interface ShareOptions {
  title?: string;
  text: string;
  url?: string;
  format: 'text' | 'markdown' | 'html';
}

interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  safeAreaTop: number;
  safeAreaBottom: number;
}
```

### 4.2 Native → React Communication

```typescript
// Messages sent from native to React

type NativeMessage =
  | { type: 'CONFIG_UPDATE'; payload: ConfigPayload }
  | { type: 'THEME_CHANGE'; payload: { theme: 'light' | 'dark' } }
  | { type: 'SAFE_AREA_UPDATE'; payload: { top: number; bottom: number } }
  | { type: 'BACK_PRESSED'; payload: null }
  | { type: 'KEYBOARD_STATE'; payload: { visible: boolean; height: number } }
  | { type: 'APP_STATE'; payload: { state: 'active' | 'background' | 'inactive' } };

interface ConfigPayload {
  apiKey?: string;
  provider?: string;
  model?: string;
}
```

### 4.3 Implementation

```typescript
// src/lib/webview.ts

const isWebView = (): boolean => {
  return !!(
    (window as any).ReactNativeWebView ||
    (window as any).flutter_inappwebview ||
    (window as any).webkit?.messageHandlers?.nativeBridge
  );
};

const postMessage = (type: string, payload: any) => {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });

  // React Native
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(message);
    return;
  }

  // Flutter
  if ((window as any).flutter_inappwebview) {
    (window as any).flutter_inappwebview.callHandler('nativeBridge', message);
    return;
  }

  // iOS WKWebView (native app)
  if ((window as any).webkit?.messageHandlers?.nativeBridge) {
    (window as any).webkit.messageHandlers.nativeBridge.postMessage(message);
    return;
  }

  // Fallback: web
  console.log('[WebView Bridge] No native handler:', type, payload);
};

export const bridge: WebViewBridge = {
  isWebView,

  share: async (options) => {
    if (isWebView()) {
      postMessage('SHARE', options);
    } else if (navigator.share) {
      await navigator.share({ title: options.title, text: options.text, url: options.url });
    } else {
      await navigator.clipboard.writeText(options.text);
    }
  },

  copyToClipboard: async (text) => {
    if (isWebView()) {
      postMessage('COPY_CLIPBOARD', { text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  },

  openExternal: (url) => {
    if (isWebView()) {
      postMessage('OPEN_EXTERNAL', { url });
    } else {
      window.open(url, '_blank');
    }
  },

  haptic: (type) => {
    if (isWebView()) {
      postMessage('HAPTIC', { type });
    }
  },

  storage: {
    get: async (key) => {
      if (isWebView()) {
        return new Promise((resolve) => {
          const handler = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'STORAGE_GET_RESPONSE' && data.key === key) {
              window.removeEventListener('message', handler);
              resolve(data.value);
            }
          };
          window.addEventListener('message', handler);
          postMessage('STORAGE_GET', { key });
        });
      }
      return localStorage.getItem(key);
    },
    set: async (key, value) => {
      if (isWebView()) {
        postMessage('STORAGE_SET', { key, value });
      } else {
        localStorage.setItem(key, value);
      }
    },
    remove: async (key) => {
      if (isWebView()) {
        postMessage('STORAGE_REMOVE', { key });
      } else {
        localStorage.removeItem(key);
      }
    }
  },

  getDeviceInfo: async () => {
    if (isWebView()) {
      return new Promise((resolve) => {
        const handler = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'DEVICE_INFO_RESPONSE') {
            window.removeEventListener('message', handler);
            resolve(data.payload);
          }
        };
        window.addEventListener('message', handler);
        postMessage('GET_DEVICE_INFO', {});
      });
    }
    return {
      platform: 'web',
      version: navigator.userAgent,
      safeAreaTop: 0,
      safeAreaBottom: 0
    };
  },

  close: () => {
    if (isWebView()) {
      postMessage('CLOSE', {});
    }
  }
};
```

---

## 5. Platform-Specific Guides

### 5.1 React Native Integration

```typescript
// App.tsx (React Native)
import { WebView } from 'react-native-webview';
import { SafeAreaView, StyleSheet } from 'react-native';

const CoachAtlasScreen = () => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'SHARE':
        Share.share({
          message: message.payload.text,
          title: message.payload.title,
        });
        break;
      case 'COPY_CLIPBOARD':
        Clipboard.setString(message.payload.text);
        break;
      case 'HAPTIC':
        Haptics.impactAsync(
          message.payload.type === 'light'
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        );
        break;
      case 'CLOSE':
        navigation.goBack();
        break;
    }
  };

  const injectSafeArea = () => {
    const safeArea = useSafeAreaInsets();
    webViewRef.current?.injectJavaScript(`
      window.postMessage(JSON.stringify({
        type: 'SAFE_AREA_UPDATE',
        payload: { top: ${safeArea.top}, bottom: ${safeArea.bottom} }
      }), '*');
    `);
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://coach-atlas.vercel.app' }}
        onMessage={handleMessage}
        onLoadEnd={injectSafeArea}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1a', // Match Coach Atlas background
  },
});
```

### 5.2 Flutter Integration

```dart
// lib/screens/coach_atlas_screen.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';

class CoachAtlasScreen extends StatefulWidget {
  @override
  _CoachAtlasScreenState createState() => _CoachAtlasScreenState();
}

class _CoachAtlasScreenState extends State<CoachAtlasScreen> {
  late WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'nativeBridge',
        onMessageReceived: _handleMessage,
      )
      ..loadRequest(Uri.parse('https://coach-atlas.vercel.app'));
  }

  void _handleMessage(JavaScriptMessage message) {
    final data = jsonDecode(message.message);

    switch (data['type']) {
      case 'SHARE':
        Share.share(data['payload']['text']);
        break;
      case 'COPY_CLIPBOARD':
        Clipboard.setData(ClipboardData(text: data['payload']['text']));
        break;
      case 'HAPTIC':
        HapticFeedback.lightImpact();
        break;
      case 'CLOSE':
        Navigator.pop(context);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
```

### 5.3 iOS Native Integration

```swift
// CoachAtlasViewController.swift
import UIKit
import WebKit

class CoachAtlasViewController: UIViewController {
    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeBridge")
        config.userContentController = contentController

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)

        if let url = URL(string: "https://coach-atlas.vercel.app") {
            webView.load(URLRequest(url: url))
        }
    }
}

extension CoachAtlasViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? String,
              let data = body.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        switch type {
        case "SHARE":
            if let payload = json["payload"] as? [String: String],
               let text = payload["text"] {
                let activityVC = UIActivityViewController(
                    activityItems: [text],
                    applicationActivities: nil
                )
                present(activityVC, animated: true)
            }
        case "COPY_CLIPBOARD":
            if let payload = json["payload"] as? [String: String],
               let text = payload["text"] {
                UIPasteboard.general.string = text
            }
        case "HAPTIC":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "CLOSE":
            dismiss(animated: true)
        default:
            break
        }
    }
}
```

### 5.4 Android Native Integration

```kotlin
// CoachAtlasActivity.kt
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class CoachAtlasActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowContentAccess = true

            addJavascriptInterface(WebViewBridge(), "AndroidBridge")

            webViewClient = WebViewClient()
            loadUrl("https://coach-atlas.vercel.app")
        }

        setContentView(webView)
    }

    inner class WebViewBridge {
        @JavascriptInterface
        fun postMessage(message: String) {
            val json = JSONObject(message)
            when (json.getString("type")) {
                "SHARE" -> {
                    val payload = json.getJSONObject("payload")
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, payload.getString("text"))
                    }
                    startActivity(Intent.createChooser(intent, "Share"))
                }
                "COPY_CLIPBOARD" -> {
                    val payload = json.getJSONObject("payload")
                    val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(
                        ClipData.newPlainText("Coach Atlas", payload.getString("text"))
                    )
                }
                "HAPTIC" -> {
                    val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
                    vibrator.vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
                }
                "CLOSE" -> finish()
            }
        }
    }
}
```

---

## 6. Configuration Options

### 6.1 URL Parameters

Coach Atlas accepts configuration via URL parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `mode` | `chat` \| `tutorial` | Initial mode | `chat` |
| `theme` | `dark` \| `light` | Color theme | `dark` |
| `embedded` | `true` \| `false` | Hide navigation | `false` |
| `provider` | `openai` \| `anthropic` \| `google` | Pre-select provider | None |

**Example:**
```
https://coach-atlas.vercel.app/chat?mode=chat&theme=dark&embedded=true
```

### 6.2 Programmatic Configuration

```typescript
// Send config from native to web
webView.injectJavaScript(`
  window.postMessage(JSON.stringify({
    type: 'CONFIG_UPDATE',
    payload: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      apiKey: '${apiKey}',
      theme: 'dark'
    }
  }), '*');
`);
```

---

## 7. Security Considerations

### 7.1 API Key Handling

| Approach | Security | Recommendation |
|----------|----------|----------------|
| Store in WebView localStorage | Medium | OK for BYOK model |
| Pass via URL parameter | ❌ Low | Never do this |
| Pass via native bridge | ✅ High | Best for managed keys |
| Store in native Keychain/Keystore | ✅ Highest | Best security |

### 7.2 Secure Bridge Implementation

```typescript
// Only accept messages from trusted origins
window.addEventListener('message', (event) => {
  // Verify origin
  if (event.origin !== 'https://coach-atlas.vercel.app') {
    console.warn('Rejected message from untrusted origin:', event.origin);
    return;
  }

  // Process message
  handleNativeMessage(event.data);
});
```

### 7.3 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  connect-src 'self'
    https://api.openai.com
    https://api.anthropic.com
    https://generativelanguage.googleapis.com;
  img-src 'self' data: blob:;
">
```

---

## 8. Performance Optimization

### 8.1 Preloading

```typescript
// React Native: Preload WebView
const PreloadedWebView = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Preload in background
    Image.prefetch('https://coach-atlas.vercel.app');
  }, []);

  return (
    <WebView
      source={{ uri: 'https://coach-atlas.vercel.app' }}
      onLoadEnd={() => setLoaded(true)}
      style={{ opacity: loaded ? 1 : 0 }}
    />
  );
};
```

### 8.2 Caching

```typescript
// Enable aggressive caching
webView.settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK;
```

### 8.3 Bundle Optimization

Coach Atlas optimizes for WebView with:
- Code splitting (route-level)
- Lazy loading (Mermaid, KaTeX)
- Compressed assets (gzip)
- Service Worker caching

**Target Metrics:**
- Initial load: < 2s
- Bundle size: < 500KB gzipped
- Time to interactive: < 3s

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank screen | JavaScript disabled | Enable `javaScriptEnabled` |
| API calls fail | CORS | Check provider CORS headers |
| Storage not working | DOM storage disabled | Enable `domStorageEnabled` |
| Keyboard covers input | No safe area | Implement keyboard avoidance |
| Slow performance | No caching | Enable WebView cache |
| Dark theme flash | Light default | Set WebView background color |

### 9.2 Debug Mode

```typescript
// Enable debug logging
if (__DEV__) {
  const originalPostMessage = webView.postMessage;
  webView.postMessage = (message) => {
    console.log('[WebView OUT]', message);
    originalPostMessage(message);
  };
}
```

### 9.3 Testing Checklist

- [ ] App loads in WebView
- [ ] Chat functionality works
- [ ] Markdown renders correctly
- [ ] Code blocks syntax highlighted
- [ ] Share button works
- [ ] Copy button works
- [ ] Settings persist
- [ ] Safe area respected
- [ ] Keyboard handling works
- [ ] Back button handled

---

## Appendix: Sample Apps

### A. Minimal React Native App

```bash
# Create new React Native project
npx react-native init CoachAtlasApp
cd CoachAtlasApp

# Install WebView
npm install react-native-webview

# iOS setup
cd ios && pod install && cd ..

# Run
npx react-native run-ios
npx react-native run-android
```

### B. Deploy Your Own Instance

```bash
# Fork and clone
git clone https://github.com/PrakharMNNIT/coach-atlas.git
cd coach-atlas

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
npx vercel
```

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Cline | Initial creation |
