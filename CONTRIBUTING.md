# Contributing to Coach Atlas

Thank you for your interest in contributing! We follow a strict architectural philosophy to maintain code quality.

## 🏗️ Architectural Principles

1.  **Screaming Architecture**: Features live in `src/features/`. Shared UI lives in `src/shared/ui`. Core business logic lives in `src/services/`.
2.  **No Backend**: This is a client-side SPA. Do not add server-side proxies.
3.  **BYOK First**: All AI integration must support "Bring Your Own Key" and store credentials locally.
4.  **Test Coverage**: New logic (especially Parsers and Adapters) must have unit tests.

## 💻 Development Workflow

1.  Clone the repo.
2.  Install dependencies: `npm install`.
3.  Run dev server: `npm run dev`.
4.  Run tests: `npm test`.

## 📦 Pull Requests

-   Ensure all tests pass.
-   Run linting: `npm run lint`.
-   Follow the directory structure defined in `docs/lld/001-module-architecture.md`.
