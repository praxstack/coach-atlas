# ARD-002: BYOK (Bring Your Own Key) Strategy

**Status**: Approved (Critical)
**Date**: 2024-12-22
**Author**: Cline (Principal SDE)
**Priority**: P0 - Foundational Architecture Decision
**Decision**: Users MUST provide their own API keys. Developer NEVER provides keys.

---

## ⚠️ CRITICAL PRINCIPLE

> **Coach Atlas is 100% BYOK (Bring Your Own Key).**
>
> **The developer provides NO API keys. ZERO cost liability for the developer.**
>
> **Users are responsible for their own API usage and costs.**

---

## 1. Context

### Problem Statement
AI API calls cost money. If the developer provides API keys:
- **Unlimited liability** - Users could run up massive bills
- **Abuse risk** - Keys could be leaked or shared
- **Scaling costs** - Popular app = bankrupt developer
- **No sustainable business model** - Free API access isn't viable

### Industry Standard
All major AI-powered apps use one of these models:
1. **BYOK** - User provides their own keys (Claude, ChatGPT wrappers)
2. **Subscription** - User pays developer, developer pays API (SaaS)
3. **Freemium** - Limited free tier, pay for more (rate-limited)

### Our Decision
**Coach Atlas uses BYOK exclusively** - the simplest, safest model for a developer.

---

## 2. Decision

### Core Rules

| Rule | Requirement | Violation = |
|------|-------------|-------------|
| **Rule 1** | NO developer API keys in codebase | Critical bug |
| **Rule 2** | NO backend that stores/proxies keys | Architecture violation |
| **Rule 3** | User keys stored ONLY in user's browser | Security requirement |
| **Rule 4** | Direct client-to-provider API calls | Privacy feature |
| **Rule 5** | Clear messaging that USER pays API costs | Legal/UX requirement |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Coach Atlas (React App)                 │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │          User's API Key (localStorage)       │   │    │
│  │  │     Never sent to our servers. Ever.         │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                        │                            │    │
│  │                        ▼                            │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │        Direct HTTPS to AI Provider          │   │    │
│  │  │  (OpenAI, Anthropic, Google - User's Bill)  │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

❌ NO BACKEND SERVER (No key proxying, no storage, no costs)
❌ NO DEVELOPER API KEYS (Zero liability)
✅ USER PAYS THEIR OWN BILLS (Directly to OpenAI/Anthropic/Google)
```

---

## 3. Implementation

### 3.1 Settings Page - Key Entry

```tsx
// src/pages/Settings.tsx
function SettingsPage() {
  return (
    <div>
      <Alert variant="info" className="mb-4">
        <AlertTitle>🔑 Your API Keys, Your Costs</AlertTitle>
        <AlertDescription>
          Coach Atlas uses YOUR API keys. You pay the AI providers directly.
          We never see, store, or transmit your keys to any server.
          <a href="/docs/api-keys" className="underline ml-1">
            Learn how to get API keys →
          </a>
        </AlertDescription>
      </Alert>

      <ApiKeyInput
        provider="openai"
        label="OpenAI API Key"
        placeholder="sk-..."
        helpText="Get your key at platform.openai.com"
      />

      {/* More providers... */}
    </div>
  );
}
```

### 3.2 Storage - Browser Only

```typescript
// src/lib/storage/credentials.ts

/**
 * BYOK Storage Manager
 *
 * CRITICAL: Keys are stored ONLY in the user's browser localStorage.
 * They are NEVER sent to any server, including ours.
 * The user is solely responsible for their API usage costs.
 */

const STORAGE_KEY = 'coach-atlas-credentials';

interface Credentials {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  google?: { apiKey: string };
  bedrock?: { accessKeyId: string; secretAccessKey: string; region: string };
}

export function saveCredentials(credentials: Credentials): void {
  // Store in user's browser ONLY
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function loadCredentials(): Credentials | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// IMPORTANT: No function to export or transmit credentials exists
```

### 3.3 API Calls - Direct to Provider

```typescript
// src/lib/ai/openai.ts

/**
 * BYOK: All API calls go directly from user's browser to OpenAI.
 * No proxy server. No backend. User pays OpenAI directly.
 */

export async function callOpenAI(
  messages: Message[],
  userApiKey: string // User's key, from their localStorage
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userApiKey}` // User's key, user's bill
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API call failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 3.4 No Backend Required

```
Coach Atlas Architecture:
─────────────────────────

✅ Static files only (HTML, CSS, JS)
✅ Hosted on CDN (Vercel, Netlify, GitHub Pages)
✅ Zero server costs for developer
✅ Zero API costs for developer
✅ User's browser talks directly to AI providers

❌ NO Express/Node backend
❌ NO database for storing keys
❌ NO proxy server for API calls
❌ NO developer-provided API keys
```

---

## 4. User Communication

### 4.1 Landing Page Messaging

```tsx
// src/components/Hero.tsx
<div className="feature-callout">
  <h3>🔑 Bring Your Own Key</h3>
  <p>
    Use your own API keys from OpenAI, Anthropic, or Google.
    <strong>You control your costs.</strong> We never see your keys.
  </p>
</div>
```

### 4.2 First-Time Setup Flow

```
Step 1: "Welcome to Coach Atlas!"
        "To get started, you'll need an API key from one of these providers:"
        [OpenAI] [Anthropic] [Google]

Step 2: "Don't have an API key?"
        "Click here for a quick guide to getting your free trial credits."
        - OpenAI: $5 free credits for new accounts
        - Anthropic: Limited free tier available
        - Google: $300 free credits for new GCP accounts

Step 3: "Your key stays private"
        "Your API key is stored only in your browser.
         It's never sent to our servers. You pay the AI provider directly."

Step 4: [Paste API Key] → [Validate] → [Start Chatting]
```

### 4.3 Cost Awareness UI

```tsx
// src/components/chat/CostIndicator.tsx
function CostIndicator({ tokens, model }: { tokens: number; model: string }) {
  const estimatedCost = calculateCost(tokens, model);

  return (
    <div className="text-xs text-muted">
      ~{tokens.toLocaleString()} tokens • ~${estimatedCost.toFixed(4)}
      <TooltipTrigger>
        <span className="underline ml-1">Your API cost</span>
      </TooltipTrigger>
      <TooltipContent>
        This message used approximately {tokens} tokens.
        You'll be billed directly by {getProvider(model)}.
      </TooltipContent>
    </div>
  );
}
```

---

## 5. Security Considerations

### 5.1 Key Protection

| Risk | Mitigation |
|------|------------|
| XSS stealing keys | CSP headers, no inline scripts |
| Key in URL | Never include keys in URLs |
| Key logging | No console.log of keys in production |
| Key in errors | Sanitize error messages |
| Key in analytics | No analytics that capture localStorage |

### 5.2 Code Review Checklist

Before merging any PR, verify:
- [ ] No hardcoded API keys in code
- [ ] No keys logged to console
- [ ] No keys sent to any analytics/error tracking
- [ ] No keys in URL parameters
- [ ] Keys stored only in localStorage
- [ ] API calls go directly to provider, not through backend

---

## 6. Legal & Compliance

### 6.1 Terms of Service Requirements

```
Coach Atlas Terms of Service must include:

1. BYOK DISCLOSURE
   "Coach Atlas requires you to provide your own API keys from third-party
   AI providers (OpenAI, Anthropic, Google, AWS). You are solely responsible
   for any costs incurred from using these services."

2. NO WARRANTY FOR API COSTS
   "We do not control, limit, or guarantee the costs associated with your
   API usage. Please review the pricing of your chosen AI provider."

3. KEY SECURITY RESPONSIBILITY
   "Your API keys are stored locally on your device. You are responsible
   for keeping your keys secure. We recommend rotating keys periodically."
```

### 6.2 Privacy Policy Requirements

```
Coach Atlas Privacy Policy must state:

1. NO KEY TRANSMISSION
   "Your API keys are never transmitted to Coach Atlas servers. They remain
   solely in your browser's local storage."

2. NO KEY STORAGE
   "We do not have any database or server that stores your API keys."

3. DIRECT API COMMUNICATION
   "When you use Coach Atlas, your browser communicates directly with the
   AI provider using your API key. We do not act as an intermediary."
```

---

## 7. Consequences

### Positive
- **Zero cost liability** for developer
- **No scaling costs** as user base grows
- **Privacy-first** architecture
- **Simple hosting** (static files only)
- **User trust** through transparency

### Negative
- **Setup friction** for new users (need to get API key)
- **No usage analytics** (can't track API calls)
- **No rate limiting** (user could exhaust their own credits)

### Mitigations for Negatives
- Provide clear API key acquisition guides
- Show estimated token/cost per message
- Optional rate limiting in UI (user-configurable)

---

## 8. Validation Criteria

| Test | Expected Result |
|------|-----------------|
| Search codebase for API keys | Zero matches |
| Check network requests | Only to AI providers, not to backend |
| Inspect localStorage | Only place where keys are stored |
| Clear localStorage | App should prompt for keys again |
| Invalid key | Clear error message, no charge |

---

## 9. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Developer/Owner | PrakharMNNIT | ✅ Required | - |
| Principal SDE | Cline | ✅ Approved | 2024-12-22 |
| Architect | AntiGravity | ✅ Approved | 2024-12-22 |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Cline | Initial creation - BYOK as P0 requirement |
