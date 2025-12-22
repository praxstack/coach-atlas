# Coach Atlas

**Coach Atlas** is an AI-powered technical mentor and content creation studio. It helps engineers prepare for technical interviews through guided discovery (Socratic method) and allows educators to create comprehensive, production-grade learning materials.

## 🚀 Features

-   **Interactive AI Coaching**: Supports OpenAI, Anthropic, Google Gemini, and AWS Bedrock (Claude).
-   **Visual Learning**: Renders Mermaid diagrams, KaTeX math, and syntax-highlighted code.
-   **Tutorial Mode**: Generate structured tutorials with Table of Contents and deep dives.
-   **BYOK Architecture**: Bring Your Own Key. API credentials are stored securely in your browser (IndexedDB) and never sent to our servers.
-   **Screaming Architecture**: Clean, modular codebase designed for scalability.

## 🛠️ Getting Started

### Prerequisites

-   Node.js 20+
-   npm or bun

### Installation

```bash
git clone https://github.com/PrakharMNNIT/coach-atlas.git
cd coach-atlas
npm install
```

### Development

```bash
npm run dev
```
Open `http://localhost:8080` to view the app.

### Testing

```bash
npm test
```
Runs the Vitest test suite.

## 🛡️ Security

Coach Atlas uses a **Client-Side Only** architecture.
-   Keys are stored in `IndexedDB`.
-   Requests go directly from Browser -> AI Provider (OpenAI/Anthropic).
-   Strict Content Security Policy (CSP) enforcement.

## 📄 License

MIT
