# LLD-001: Screaming Architecture & Module Structure

**Status**: Approved
**Date**: 2024-12-22
**Author**: AntiGravity (Principal SDE)
**Context**: The current structure is "Lovable" boilerplate (flat components). For a production-ready application, we need a scalable "Screaming Architecture" that clearly separates features, services, and shared UI.

## 1. Directory Structure

We will move from `src/components/*` to a Feature-based architecture.

```text
src/
├── app/                    # App-wide setup
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   ├── providers.tsx       # Global providers (Query, Theme, AI)
│   └── router.tsx          # Route definitions
├── features/               # Feature Modules (SCREAMING ARCHITECTURE)
│   ├── chat/               # The Core Chat Feature
│   │   ├── components/     # Chat-specific UI (MessageBubble, Input)
│   │   ├── hooks/          # Chat logic (useChatStream)
│   │   └── ChatPage.tsx    # Page Entry
│   ├── tutorials/          # Tutorial Mode
│   ├── interview/          # Interview Mode
│   └── settings/           # Settings Feature
├── shared/                 # Shared across features
│   ├── ui/                 # Atomic UI (shadcn/ui buttons, cards)
│   ├── layouts/            # Layout components (MainLayout, Sidebar)
│   └── utils/              # Pure utility functions
├── services/               # Core Business Logic (Singleton/Class-based)
│   ├── ai/                 # AI Service (OpenAI, Anthropic wrappers)
│   ├── storage/            # IndexedDB / LocalStorage wrappers
│   └── bridge/             # WebView Bridge Service
├── lib/                    # Heavy external integrations
│   └── markdown-viewer/    # The ported Markdown Engine (ARD-001)
├── assets/                 # Static assets
└── types/                  # Global TS types
```

## 2. Rules

1.  **Strict Boundaries**: `server` code (if any) never touches `ui`. `shared` never imports from `features`.
2.  **Feature Isolation**: A feature should contain everything it needs. `features/chat` has its own components.
3.  **UI Library**: `shared/ui` is strictly for dumb, presentational components (shadcn/ui).
4.  **Service Layer**: All side-effects (API calls, DB writes) happen in `services/`, not inside React components.

## 3. Migration Plan (Phase 1)
1.  Create the new directory structure.
2.  Move `src/components/ui` -> `src/shared/ui`.
3.  Move `src/pages/Chat.tsx` -> `src/features/chat/ChatPage.tsx`.
4.  Move `src/pages/Settings.tsx` -> `src/features/settings/SettingsPage.tsx`.
5.  Refactor imports.
