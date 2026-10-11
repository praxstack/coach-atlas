# Graph Report - coach-atlas  (2026-10-05)

## Corpus Check
- 168 files · ~427,448 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, (none) 2, .lockb 1)

## Summary
- 2181 nodes · 3224 edges · 134 communities (128 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46776676`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 📝 Files Changed (137 selected)
- dependencies
- cn
- WebViewBridge.ts
- Coach Atlas - WebView Integration Strategy
- Coach Atlas - Technical Context
- Project Workflow - Coach Atlas
- Testing Style Guide - Coach Atlas
- Product Guidelines - Coach Atlas
- sidebar.tsx
- 🔬 Comprehensive Codebase Audit Report - Coach Atlas
- TypeScript Style Guide - Coach Atlas
- React Style Guide - Coach Atlas
- ARD-001: Markdown Viewer Pro Integration
- shared/utils.ts
- Coach Atlas - System Patterns & Architecture
- ARD-002: BYOK (Bring Your Own Key) Strategy
- interview/index.ts
- react
- Coach Atlas - Product Context
- hooks/use-toast.ts
- package.json
- Technology Stack - Coach Atlas
- Feature Design: Interview Mode Simulator
- Coach Atlas - Chat Persistence Strategy
- storageService
- form.tsx
- pagination.tsx
- Phase 1: Discovery & Cataloging Report
- devDependencies
- types/index.ts
- AIRequest
- Coach Atlas - Progress Log
- Coach Atlas - Project Brief
- InterviewPage.tsx
- 🔬 Codebase Audit Report - Iteration 2
- command.tsx
- ErrorBoundary.tsx
- compilerOptions
- Coach Atlas - Active Context
- ProgressiveEvaluator
- Product Guide - Coach Atlas
- class-variance-authority
- ARD-003: Progressive Real-Time Evaluation System
- interview.ts
- SettingsPage.tsx
- 🔴 Issues I MISSED (Antigravity Found)
- Phase 2: Documentation Deep-Dive Report
- components.json
- MarkdownRenderer.tsx
- App.tsx
- bedrockAdapter
- OpenAIAdapter.ts
- compilerOptions
- 🤖 Comprehensive Review Checklist
- carousel.tsx
- InterviewProblem
- saveConfig
- Implementation Roadmap: Iteration 2 (Refactoring)
- ProgressiveEvaluator.ts
- Coach Atlas - Implementation Plan
- Source Code (`src/`)
- compilerOptions
- chart.tsx
- IStorageService
- Action Plan
- dropdown-menu.tsx
- services/index.ts
- Coach Atlas - Business Requirements Document (BRD)
- Tasks
- Detailed Steps
- Detailed Steps
- Coach Atlas
- sheet.tsx
- Audit Iteration 2 - Fixes Status Check
- 🚀 How to Deploy Coach Atlas to Vercel
- Phase 2: Core Chat Enhancement (Days 6-12)
- Phase 5: WebView & Polish (Days 27-32)
- 2.1 `AIService` (Polymorphic)
- Task 003: Service Layer Implementation (BYOK)
- navigation-menu.tsx
- select.tsx
- drawer.tsx
- useTimer.ts
- InterviewContext.tsx
- retryUtils.ts
- Codebase Audit Report: Iteration 1 (Antigravity)
- 🏆 Best Free Options
- Tailwind CSS Style Guide - Coach Atlas
- Phase 1: Foundation (Days 1-5)
- Phase 3: Advanced Rendering (Days 13-19)
- Phase 4: Modes & Features (Days 20-26)
- Phase 2: Documentation Deep-Dive Report (Antigravity)
- 🛡️ Security Posture
- 13. Implementation Phases
- 4. Functional Requirements
- scripts
- modules.d.ts
- 🎨 Theme & Accessibility
- 3.1 User Personas
- 5. Non-Functional Requirements
- eslint.config.js
- input-otp.tsx
- vite.config.ts
- Contributing to Coach Atlas
- Component Patterns
- 1. Executive Summary
- 6. User Stories
- 9. WebView Requirements
- LLD-001: Screaming Architecture & Module Structure
- AppFooter.tsx
- Animations
- Responsive Design
- 10. Acceptance Criteria
- 14. Appendix
- 7. Technical Requirements
- Resource Requirements
- Accessibility
- The `cn()` Utility
- Performance
- Dark Mode
- Color Conventions
- Spacing Conventions
- Customization
- Flexbox & Grid
- Typography
- Hover & Focus States
- 8. Integration Requirements
- Risk Mitigation
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- tailwindcss

## God Nodes (most connected - your core abstractions)
1. `cn()` - 226 edges
2. `📝 Files Changed (137 selected)` - 138 edges
3. `react` - 64 edges
4. `lucide-react` - 33 edges
5. `storageService` - 29 edges
6. `Button` - 26 edges
7. `ProgressiveEvaluator` - 25 edges
8. `Message` - 23 edges
9. `aiService` - 21 edges
10. `WebViewBridgeService` - 21 edges

## Surprising Connections (you probably didn't know these)
- `4. Why?` --references--> `aiService`  [INFERRED]
  docs/lld/002-service-layer.md → src/services/ai/AIService.ts
- `Deliverables` --references--> `aiService`  [INFERRED]
  docs/tasks/task-003-service-layer.md → src/services/ai/AIService.ts
- `🚨 Critical Findings (P0/P1)` --references--> `bedrockAdapter`  [INFERRED]
  star-team-antigravity/audit-iteration-1/consolidated-audit-report.md → src/services/ai/adapters/BedrockAdapter.ts
- `⚠️ Weaknesses` --references--> `bedrockAdapter`  [INFERRED]
  star-team-antigravity/audit-iteration-1/consolidated-audit-report.md → src/services/ai/adapters/BedrockAdapter.ts
- `2.2 `StorageService` (Repository)` --references--> `storageService`  [INFERRED]
  docs/lld/002-service-layer.md → src/services/storage/StorageService.ts

## Import Cycles
- None detected.

## Communities (134 total, 6 thin omitted)

### Community 0 - "📝 Files Changed (137 selected)"
Cohesion: 0.01
Nodes (138): ✨ `docs/ard/001-markdown-viewer-integration.md` **[ADDED]**, ✨ `docs/ard/002-byok-api-key-strategy.md` **[ADDED]**, ✨ `docs/brd/BRD-coach-atlas.md` **[ADDED]**, ✨ `docs/hld/implementation-plan.md` **[ADDED]**, ✨ `docs/hld/webview-integration-strategy.md` **[ADDED]**, ✨ `docs/lld/001-module-architecture.md` **[ADDED]**, ✨ `docs/lld/002-service-layer.md` **[ADDED]**, ✨ `docs/lld/persistence-strategy.md` **[ADDED]** (+130 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (58): dependencies, class-variance-authority, clsx, cmdk, date-fns, dexie, dompurify, embla-carousel-react (+50 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (49): @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-menubar, @radix-ui/react-tabs, AccordionContent, AccordionItem, AccordionTrigger (+41 more)

### Community 3 - "WebViewBridge.ts"
Cohesion: 0.09
Nodes (21): BridgeMessage, BridgeMessageType, BridgeResponse, BridgeResponseType, BridgeState, InitialContextPayload, isInitialContextPayload(), isNavigatePayload() (+13 more)

### Community 4 - "Coach Atlas - WebView Integration Strategy"
Cohesion: 0.05
Nodes (43): 1.1 What is WebView Integration?, 1.2 Architecture, 1.3 Benefits, 1.4 Trade-offs, 1. Overview, 2.1 Supported Platforms, 2.2 Browser Features Required, 2.3 API Compatibility (+35 more)

### Community 5 - "Coach Atlas - Technical Context"
Cohesion: 0.05
Nodes (40): Build Configuration, CI/CD Configuration, Coach Atlas - Technical Context, Content Security Policy, Core Technologies, Current Issues, Current Setup, Current State (+32 more)

### Community 6 - "Project Workflow - Coach Atlas"
Cohesion: 0.05
Nodes (39): API Key Handling, Branch Strategy (Trunk-Based), Build Pipeline (Vercel), Bundle Size Monitoring, Code Quality Standards, Code Review Checklist, Code Security, Commit After Every Task (+31 more)

### Community 7 - "Testing Style Guide - Coach Atlas"
Cohesion: 0.05
Nodes (37): Anti-Patterns to Avoid, API Adapter Pattern, Arrange-Act-Assert (AAA) Pattern, Async Functions, Async Testing, Basic Component Test, Best Practices Summary, Component Tests (+29 more)

### Community 8 - "Product Guidelines - Coach Atlas"
Cohesion: 0.05
Nodes (37): 1. AI Voice & Tone, 1. Bundle Size Targets, 1. Color Palette (Dark Theme First), 1. Loading States, 1. Requirements, 1. Sidebar Layout (App Shell), 1. Timing Functions, 2. Duration Standards (+29 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.07
Nodes (29): Input, Separator, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+21 more)

### Community 10 - "🔬 Comprehensive Codebase Audit Report - Coach Atlas"
Cohesion: 0.05
Nodes (36): A. Files Reviewed (127), Accessibility Issues (WCAG 2.1 AA), 📌 Appendix, Architectural Issues, Architecture Scores (1-10), B. Dependencies (Notable), C. Recommended Tools, 🔬 Comprehensive Codebase Audit Report - Coach Atlas (+28 more)

### Community 11 - "TypeScript Style Guide - Coach Atlas"
Cohesion: 0.06
Nodes (35): Always Handle Errors, Annotate Function Return Types, Anti-Patterns to Avoid, Async/Await, Avoid `!` Non-null Assertion, Builder Pattern, Common Patterns, Configuration (+27 more)

### Community 12 - "React Style Guide - Coach Atlas"
Cohesion: 0.06
Nodes (34): Accessibility (a11y), Anti-Patterns to Avoid, Children Prop, Component File Structure, Component Structure, Components, Conditional Rendering, Context (+26 more)

### Community 13 - "ARD-001: Markdown Viewer Pro Integration"
Cohesion: 0.06
Nodes (34): 1. Context, 1. Directory Structure Setup, 2. Component Logic (`MarkdownRenderer.tsx`), 2. Decision, 3.1 Files to Port, 3.2 React Component: MarkdownRenderer, 3.3 Theme Integration, 3.4 Export Service (+26 more)

### Community 14 - "shared/utils.ts"
Cohesion: 0.06
Nodes (23): @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-slider, @radix-ui/react-switch (+15 more)

### Community 15 - "Coach Atlas - System Patterns & Architecture"
Cohesion: 0.06
Nodes (32): 1. Chat Domain, 1. Provider Pattern (AI Providers), 2. Component Architecture, 2. Provider Domain, 3. Markdown Domain (NEW - Markdown Viewer Pro Integration), 3. State Management Pattern, 4. Tutorial Domain (NEW), API Key Protection (+24 more)

### Community 16 - "ARD-002: BYOK (Bring Your Own Key) Strategy"
Cohesion: 0.06
Nodes (31): 1. Context, 2. Decision, 3.1 Settings Page - Key Entry, 3.2 Storage - Browser Only, 3.3 API Calls - Direct to Provider, 3.4 No Backend Required, 3. Implementation, 4.1 Landing Page Messaging (+23 more)

### Community 17 - "interview/index.ts"
Cohesion: 0.15
Nodes (24): 7. Implementation Plan, Phase 1: Context & Basic UI (3 days), Phase 2: Problem Generation & Persistence (3 days), Phase 3: Evaluation & Reporting (3 days), Phase 4: Polish & Mobile (2 days), DIMENSION_LABELS, DimensionBar(), DimensionBarProps (+16 more)

### Community 18 - "react"
Cohesion: 0.16
Nodes (18): lucide-react, react, SidebarLayout(), Index(), Sidebar(), SidebarProps, getAllPersonas(), ChatInterface() (+10 more)

### Community 19 - "Coach Atlas - Product Context"
Cohesion: 0.07
Nodes (29): Accessibility, Chat Experience, Coach Atlas - Product Context, Competitive Landscape, Direct Competitors, Ethical Considerations, Fairness, Flow 1: First-Time Setup (+21 more)

### Community 20 - "hooks/use-toast.ts"
Cohesion: 0.12
Nodes (25): @radix-ui/react-toast, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+17 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (27): name, private, type, version, autoprefixer, clsx, date-fns, eslint (+19 more)

### Community 22 - "Technology Stack - Coach Atlas"
Cohesion: 0.07
Nodes (26): Adapter Architecture, Additional UI Components, Build Configuration, Build Output, Bundle Analysis (Production), Component Library (shadcn/ui + Radix), Content Pipeline, Core Framework (+18 more)

### Community 23 - "Feature Design: Interview Mode Simulator"
Cohesion: 0.08
Nodes (25): 10. Open Questions, 1. Overview, 2.1 The Split Interface, 2.2 The Flow, 2. User Experience (UX), 3.1 Data Models (`src/services/types/interview.ts`), 3.2 State Management (`src/features/interview/InterviewContext.tsx`), 3.3 New Components (`src/features/interview/`) (+17 more)

### Community 24 - "Coach Atlas - Chat Persistence Strategy"
Cohesion: 0.08
Nodes (25): Benefits Summary, Coach Atlas - Chat Persistence Strategy, Context Restoration Flow, Context Window Management, Conversation Operations, Data Access Layer, Database Schema, Document History (+17 more)

### Community 25 - "storageService"
Cohesion: 0.14
Nodes (9): dexie, ServiceContextValue, CoachAtlasDB, db, generateId(), storageService, Conversation, Message (+1 more)

### Community 26 - "form.tsx"
Cohesion: 0.10
Nodes (22): @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList (+14 more)

### Community 27 - "pagination.tsx"
Cohesion: 0.10
Nodes (22): @radix-ui/react-alert-dialog, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+14 more)

### Community 28 - "Phase 1: Discovery & Cataloging Report"
Cohesion: 0.08
Nodes (24): App Layer (`src/app/`), By Layer (Source Code), By Type, Custom Components (`src/shared/components/`) - 8 files, Documentation Structure (`docs/`), Features Layer (`src/features/`), 📋 File Classification Summary, Hooks (`src/shared/hooks/`) - 3 files (+16 more)

### Community 29 - "devDependencies"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+16 more)

### Community 30 - "types/index.ts"
Cohesion: 0.17
Nodes (11): Naming Conventions, aiService, AIResponse, ConversationMetadata, IAIService, MessageMetadata, MessageRole, ProviderConfig (+3 more)

### Community 31 - "AIRequest"
Cohesion: 0.14
Nodes (10): vitest, anthropicAdapter, AnthropicMessage, AnthropicResponse, mockFetch, googleAdapter, GoogleContent, GoogleResponse (+2 more)

### Community 32 - "Coach Atlas - Progress Log"
Cohesion: 0.09
Nodes (21): Build Status, Coach Atlas - Progress Log, Delivered, Delivered, Delivered, Dependencies Added (Phase 1), Files Created, Files Created/Modified (+13 more)

### Community 33 - "Coach Atlas - Project Brief"
Cohesion: 0.09
Nodes (21): Acceptance Criteria for "Done", Accessibility, Coach Atlas - Project Brief, Core Mission, Document History, Executive Summary, In Scope, Key Stakeholders (+13 more)

### Community 34 - "InterviewPage.tsx"
Cohesion: 0.19
Nodes (17): ServiceContext, useAIService(), useServices(), useStorageService(), Chat(), UIMessage, InterviewSetupModal(), ProblemPanelSkeleton() (+9 more)

### Community 35 - "🔬 Codebase Audit Report - Iteration 2"
Cohesion: 0.09
Nodes (21): BYOK Security, 🔬 Codebase Audit Report - Iteration 2, Critical (All Fixed), CSP Implementation, 📊 Executive Dashboard, Files Added, 📊 Final Scorecard, Findings (+13 more)

### Community 36 - "command.tsx"
Cohesion: 0.12
Nodes (18): cmdk, @radix-ui/react-dialog, Command, CommandDialog(), CommandDialogProps, CommandEmpty, CommandGroup, CommandInput (+10 more)

### Community 37 - "ErrorBoundary.tsx"
Cohesion: 0.10
Nodes (5): ChatErrorBoundary, ErrorBoundary, Props, SettingsErrorBoundary, State

### Community 38 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 39 - "Coach Atlas - Active Context"
Cohesion: 0.10
Nodes (19): AntiGravity (Principal SDE), Cline (Senior Developer), Coach Atlas - Active Context, Current Architecture, Current Status: Phase 1 Complete ✅, Features Enabled, Next Session, Phase 1 Delivery Summary (+11 more)

### Community 40 - "ProgressiveEvaluator"
Cohesion: 0.19
Nodes (3): ProgressiveEvaluator, retryWithBackoff(), EvaluationReport

### Community 41 - "Product Guide - Coach Atlas"
Cohesion: 0.11
Nodes (18): 1. **AI Chat Mode**, 2. **Interview Practice Mode**, 3. **Tutorial Generation**, 4. **System Design Practice**, Brand Identity & Tone, Core Value Proposition, Differentiation, Key Features (+10 more)

### Community 42 - "class-variance-authority"
Cohesion: 0.14
Nodes (15): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge() (+7 more)

### Community 43 - "ARD-003: Progressive Real-Time Evaluation System"
Cohesion: 0.11
Nodes (17): 1. Observation Model, 2. Progressive Evaluation State, 3. Context Compactor, 4. Micro-Evaluation Prompt, API Design, Architecture Overview, ARD-003: Progressive Real-Time Evaluation System, Benefits (+9 more)

### Community 44 - "interview.ts"
Cohesion: 0.12
Nodes (16): BEHAVIORAL_TOPICS, CODING_TOPICS, DIFFICULTIES, INTERVIEW_TYPES, InterviewSetupModalProps, SYSTEM_DESIGN_TOPICS, CodeExample, Difficulty (+8 more)

### Community 45 - "SettingsPage.tsx"
Cohesion: 0.20
Nodes (14): Settings(), StoredConfig, DiscoveredModel, fetchAnthropicModels(), fetchBedrockModels(), fetchGoogleModels(), fetchOpenAIModels(), formatModelName() (+6 more)

### Community 46 - "🔴 Issues I MISSED (Antigravity Found)"
Cohesion: 0.11
Nodes (17): 1. Speculative/Hallucinated Model IDs 🆕, 2. Stream Error Data Loss 🆕, 3. Brittle EventStream Parser 🆕, 4. Redundant DB Fetch in Chat 🆕, 5. DOMPurify iframe Allowlist 🆕, 6. Vite Version Anomaly 🆕, 8. Schema Migration Strategy Missing 🆕, ✅ Action Items for Iteration 2 (+9 more)

### Community 47 - "Phase 2: Documentation Deep-Dive Report"
Cohesion: 0.11
Nodes (17): 📚 BRD Analysis Summary, BRD vs Implementation Discrepancies, 🚨 Critical Issues Summary, Critical Missing (P0), 🔴 CRITICAL: README.md is Generic Template, 🔴 Documentation Gaps (15+ items), 📊 Documentation Inventory, Existing Documentation (19 files) (+9 more)

### Community 48 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 49 - "MarkdownRenderer.tsx"
Cohesion: 0.14
Nodes (14): dompurify, katex, marked, marked-footnote, mermaid, prismjs, alertExtension, initializeInteractiveBlocks() (+6 more)

### Community 50 - "App.tsx"
Cohesion: 0.18
Nodes (12): next-themes, react-dom, react-router-dom, sonner, App(), BridgeInitializer(), queryClient, ServiceProvider() (+4 more)

### Community 51 - "bedrockAdapter"
Cohesion: 0.16
Nodes (9): bedrockAdapter, 1. Speculative/Hallucinated Model IDs, 2. Stream Error Data Loss, 3. Brittle EventStream Parser, 4. Redundant Initial Fetch in Chat, 5. DOMPurify Configuration, 🔍 Deep-Dive Findings, 📊 Logic Quality Assessment (+1 more)

### Community 52 - "OpenAIAdapter.ts"
Cohesion: 0.15
Nodes (9): openAIAdapter, OpenAIMessage, OpenAIResponse, mockFetch, Analysis, 🚫 Critical Gap: Zero Automation, Phase 5: QA & Testing Audit (Antigravity), Recommendation (Immediate Actions) (+1 more)

### Community 53 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 54 - "🤖 Comprehensive Review Checklist"
Cohesion: 0.13
Nodes (14): 📊 Change Summary, Code Organization, ✅ Code Quality & Standards, 🔍 Code Review - 12/22/2025, 2:55:10 PM, 🤖 Comprehensive Review Checklist, Documentation Needs, 💡 Improvement Suggestions, 🔍 Logic & Functionality (+6 more)

### Community 55 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 56 - "InterviewProblem"
Cohesion: 0.26
Nodes (8): ProblemPanelProps, InterviewContextValue, InterviewState, InterviewService, InterviewConfig, InterviewProblem, InterviewSession, InterviewStatus

### Community 57 - "saveConfig"
Cohesion: 0.16
Nodes (12): loadConfig(), saveConfig(), 🏗️ Architecture Analysis, 🔦 Database Architecture (IndexedDB), Pattern: Client-Side "Screaming Architecture", Phase 3: Architectural Review (Antigravity), 📋 Recommendations, Strengths (+4 more)

### Community 58 - "Implementation Roadmap: Iteration 2 (Refactoring)"
Cohesion: 0.14
Nodes (13): Implementation Roadmap: Iteration 2 (Refactoring), Phase 1: Stabilization (Week 1), Phase 2: Testing Infrastructure (Week 1-2), Phase 3: Security Hardening (Week 2), Phase 4: Documentation (Week 2), Task 1.1: Fix Chat Data Loss (BUG-001), Task 1.2: Remove Speculative Models (LOGIC-001), Task 1.3: Downgrade/Verify Vite (+5 more)

### Community 59 - "ProgressiveEvaluator.ts"
Cohesion: 0.18
Nodes (9): Phase 1: Core Infrastructure, AsyncMutex, DimensionScores, MessageExchange, MicroEvaluationResult, Observation, OnStateUpdateCallback, ProgressiveEvaluationState (+1 more)

### Community 60 - "Coach Atlas - Implementation Plan"
Cohesion: 0.15
Nodes (12): Appendix: File Creation Order, Coach Atlas - Implementation Plan, Current State Analysis, Dependencies, Executive Summary, External Dependencies, Internal Dependencies, Launch Success (+4 more)

### Community 61 - "Source Code (`src/`)"
Cohesion: 0.15
Nodes (12): App Core (`src/app/`), Documentation (`docs/`, `memory-bank/`), Features (`src/features/`), Lib (`src/lib/`), 🛑 Missing Standard Files, Phase 1: Discovery & Cataloging Report (Antigravity), ✅ Phase 1 Validation, 📊 Repository Statistics (+4 more)

### Community 62 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+4 more)

### Community 63 - "chart.tsx"
Cohesion: 0.24
Nodes (11): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent (+3 more)

### Community 65 - "Action Plan"
Cohesion: 0.18
Nodes (10): 1. Analysis of Current State, 2. Recommendation (No Immediate Code Changes Required), 3. Future "Nuclear" Option (Compressing Mermaid), Action Plan, Impact, Optimization Plan: Bundle Size & Build Warnings, Step 1: Verify Transitive Dependency, Step 2: Suppress the Warning (+2 more)

### Community 66 - "dropdown-menu.tsx"
Cohesion: 0.18
Nodes (10): @radix-ui/react-dropdown-menu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut() (+2 more)

### Community 67 - "services/index.ts"
Cohesion: 0.47
Nodes (9): SYSTEM_PROMPT, ContextInfo, estimateMessageTokens(), estimateTokens(), getAvailableTokens(), getContextInfo(), getContextLimit(), MODEL_CONTEXT_LIMITS (+1 more)

### Community 68 - "Coach Atlas - Business Requirements Document (BRD)"
Cohesion: 0.20
Nodes (9): 11.1 Constraints, 11.2 Assumptions, 11. Constraints & Assumptions, 12. Risk Assessment, 2.1 Primary Objectives, 2.2 Secondary Objectives, 2. Business Objectives, Coach Atlas - Business Requirements Document (BRD) (+1 more)

### Community 69 - "Tasks"
Cohesion: 0.20
Nodes (10): 6.1 Unit Testing, 6.2 Integration Testing, 6.3 E2E Testing, 6.4 Documentation, 6.5 Deployment, Acceptance Criteria, Deliverables, Objectives (+2 more)

### Community 70 - "Detailed Steps"
Cohesion: 0.20
Nodes (9): Context, Deliverables, Detailed Steps, Objectives, Step 1: Directory Restructuring, Step 2: Feature Migration, Step 3: TypeScript Hardening, Step 4: Cleanup (+1 more)

### Community 71 - "Detailed Steps"
Cohesion: 0.20
Nodes (9): Context, Deliverables, Detailed Steps, Objectives, Step 1: Dependencies, Step 2: Logic Porting (The Hard Part), Step 3: Theme Integration, Step 4: React Component (+1 more)

### Community 72 - "Coach Atlas"
Cohesion: 0.20
Nodes (9): Coach Atlas, Development, 🚀 Features, 🛠️ Getting Started, Installation, 📄 License, Prerequisites, 🛡️ Security (+1 more)

### Community 73 - "sheet.tsx"
Cohesion: 0.24
Nodes (9): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants (+1 more)

### Community 74 - "Audit Iteration 2 - Fixes Status Check"
Cohesion: 0.20
Nodes (9): Audit Iteration 2 - Fixes Status Check, ✅ FIXED Issues, Footer Update, Issues from Iteration 1, New Features Added (Since Iteration 1), 🔴 NOT FIXED Issues, 🔶 PARTIALLY FIXED Issues, Persona System (+1 more)

### Community 75 - "🚀 How to Deploy Coach Atlas to Vercel"
Cohesion: 0.20
Nodes (9): "404 Not Found" on Refresh, "Build Failed", 🚀 How to Deploy Coach Atlas to Vercel, 🌐 Optional: Custom Domain, ✅ Prerequisites, 🛠️ Step 1: Push Code to GitHub, ☁️ Step 2: Deploy on Vercel, 🎉 Step 3: Verify Deployment (+1 more)

### Community 76 - "Phase 2: Core Chat Enhancement (Days 6-12)"
Cohesion: 0.22
Nodes (9): 2.1 Markdown Rendering, 2.2 Streaming Responses, 2.3 Chat Persistence, 2.4 Message UX, Acceptance Criteria, Deliverables, Objectives, Phase 2: Core Chat Enhancement (Days 6-12) (+1 more)

### Community 77 - "Phase 5: WebView & Polish (Days 27-32)"
Cohesion: 0.22
Nodes (9): 5.1 WebView Compatibility, 5.2 Native Bridge, 5.3 Accessibility, 5.4 Performance, Acceptance Criteria, Deliverables, Objectives, Phase 5: WebView & Polish (Days 27-32) (+1 more)

### Community 78 - "2.1 `AIService` (Polymorphic)"
Cohesion: 0.22
Nodes (8): 1. Architecture, 2.1 `AIService` (Polymorphic), 2.2 `StorageService` (Repository), 2.3 `BridgeService` (WebView), 2. The Services, 3. React Integration, 4. Why?, LLD-002: Service Layer Abstraction

### Community 79 - "Task 003: Service Layer Implementation (BYOK)"
Cohesion: 0.22
Nodes (8): Context, Deliverables, Detailed Steps, Objectives, Step 1: Storage Service, Step 2: AI Service adapters, Step 3: Provider Injection, Task 003: Service Layer Implementation (BYOK)

### Community 80 - "navigation-menu.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 81 - "select.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 82 - "drawer.tsx"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 83 - "useTimer.ts"
Cohesion: 0.31
Nodes (8): TimerDisplayProps, formatTime(), getUrgency(), useTimer(), UseTimerOptions, UseTimerReturn, INTERVIEW_CONSTANTS, TimerState

### Community 84 - "InterviewContext.tsx"
Cohesion: 0.31
Nodes (8): formatTime(), getUrgency(), initialState, InterviewAction, InterviewContext, InterviewProvider(), InterviewProviderProps, interviewReducer()

### Community 85 - "retryUtils.ts"
Cohesion: 0.47
Nodes (7): calculateBackoff(), DEFAULT_RETRY_CONFIG, isRetryableError(), RetryConfig, sleep(), withRetry(), withStreamRetry()

### Community 86 - "Codebase Audit Report: Iteration 1 (Antigravity)"
Cohesion: 0.22
Nodes (8): 🏗️ Architecture Assessment, Codebase Audit Report: Iteration 1 (Antigravity), 🚨 Critical Findings (P0/P1), Executive Summary, 🗓️ Next Steps, 📊 Scorecard, ✅ Strengths, ⚠️ Weaknesses

### Community 87 - "🏆 Best Free Options"
Cohesion: 0.25
Nodes (7): 🏆 Best Free Options, 🚀 Deployment Guide, 🐳 Docker Deployment, 🔑 Environment Variables, Option 1: Vercel (Recommended), Option 2: Netlify, Option 3: GitHub Pages

### Community 88 - "Tailwind CSS Style Guide - Coach Atlas"
Cohesion: 0.25
Nodes (7): Anti-Patterns, Class Organization, Configuration, Overview, Recommended Order, tailwind.config.ts, Tailwind CSS Style Guide - Coach Atlas

### Community 89 - "Phase 1: Foundation (Days 1-5)"
Cohesion: 0.25
Nodes (8): 1.1 Project Infrastructure, 1.2 Error Handling, 1.3 Loading States, Acceptance Criteria, Deliverables, Objectives, Phase 1: Foundation (Days 1-5), Tasks

### Community 90 - "Phase 3: Advanced Rendering (Days 13-19)"
Cohesion: 0.25
Nodes (8): 3.1 Mermaid Diagrams, 3.2 Math Rendering, 3.3 Theme Integration, Acceptance Criteria, Deliverables, Objectives, Phase 3: Advanced Rendering (Days 13-19), Tasks

### Community 91 - "Phase 4: Modes & Features (Days 20-26)"
Cohesion: 0.25
Nodes (8): 4.1 Interview Mode, 4.2 Tutorial Mode, 4.3 Export Functionality, Acceptance Criteria, Deliverables, Objectives, Phase 4: Modes & Features (Days 20-26), Tasks

### Community 92 - "Phase 2: Documentation Deep-Dive Report (Antigravity)"
Cohesion: 0.25
Nodes (7): 🏗️ Architectural Alignment Check, Critical Gaps (Missing/Poor), 📊 Documentation Inventory, High-Value Documentation, Phase 2: Documentation Deep-Dive Report (Antigravity), 📋 Recommendations, ⚠️ Requirements vs. Reality (Gap Analysis)

### Community 93 - "🛡️ Security Posture"
Cohesion: 0.25
Nodes (7): 1. API Key Management (BYOK), 2. XSS Prevention, 3. Dependency Security, 4. CSP (Content Security Policy), Phase 6: Security Deep-Dive (Antigravity), 🚨 Security Findings Log, 🛡️ Security Posture

### Community 94 - "13. Implementation Phases"
Cohesion: 0.29
Nodes (7): 13. Implementation Phases, Phase 1: Foundation (Week 1), Phase 2: Core Chat Enhancement (Week 2), Phase 3: Advanced Rendering (Week 3), Phase 4: Modes & Features (Week 4), Phase 5: WebView & Polish (Week 5), Phase 6: Testing & Launch (Week 6)

### Community 95 - "4. Functional Requirements"
Cohesion: 0.29
Nodes (7): 4.1 Core Chat Functionality, 4.2 Provider & Settings, 4.3 Interview Coach Mode, 4.4 Tutorial Creator Mode, 4.5 Markdown Viewer Pro Integration, 4.6 User Interface, 4. Functional Requirements

### Community 96 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, build:dev, dev, lint, preview, test

### Community 97 - "modules.d.ts"
Cohesion: 0.29
Nodes (6): katex, katex/dist/katex.min.css, KatexOptions, mermaid, MermaidConfig, RenderResult

### Community 98 - "🎨 Theme & Accessibility"
Cohesion: 0.29
Nodes (6): 1. Visual Design, 2. Accessibility (WCAG), 3. UX Flows, Phase 7: UI/UX Audit (Antigravity), 📋 Recommendations, 🎨 Theme & Accessibility

### Community 99 - "3.1 User Personas"
Cohesion: 0.33
Nodes (6): 3.1 User Personas, 3.2 Technical Stakeholders, 3. Stakeholders, Primary: "Anxious Alex" - Interview Candidate, Secondary: "Teaching Taylor" - Educator, Tertiary: "Self-Learner Sam" - Career Changer

### Community 100 - "5. Non-Functional Requirements"
Cohesion: 0.33
Nodes (6): 5.1 Performance, 5.2 Security, 5.3 Accessibility, 5.4 Reliability, 5.5 Maintainability, 5. Non-Functional Requirements

### Community 101 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 102 - "input-otp.tsx"
Cohesion: 0.33
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 103 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 104 - "Contributing to Coach Atlas"
Cohesion: 0.40
Nodes (4): 🏗️ Architectural Principles, Contributing to Coach Atlas, 💻 Development Workflow, 📦 Pull Requests

### Community 105 - "Component Patterns"
Cohesion: 0.40
Nodes (5): Button Variants, Cards, Chat Bubbles, Component Patterns, Input Fields

### Community 106 - "1. Executive Summary"
Cohesion: 0.40
Nodes (5): 1.1 Product Vision, 1.2 Problem Statement, 1.3 Solution Overview, 1.4 Success Metrics, 1. Executive Summary

### Community 107 - "6. User Stories"
Cohesion: 0.40
Nodes (5): 6. User Stories, Epic 1: Core Chat Experience, Epic 2: Interview Coaching, Epic 3: Tutorial Creation, Epic 4: WebView Integration

### Community 108 - "9. WebView Requirements"
Cohesion: 0.40
Nodes (5): 9.1 Compatibility Matrix, 9.2 WebView Bridge API, 9.3 Safe Area Handling, 9.4 WebView-Specific Features, 9. WebView Requirements

### Community 109 - "LLD-001: Screaming Architecture & Module Structure"
Cohesion: 0.40
Nodes (4): 1. Directory Structure, 2. Rules, 3. Migration Plan (Phase 1), LLD-001: Screaming Architecture & Module Structure

### Community 110 - "AppFooter.tsx"
Cohesion: 0.40
Nodes (3): CONFIG, Region, SupportConfig

### Community 111 - "Animations"
Cohesion: 0.50
Nodes (4): Animations, Avoid Excessive Animation, Tailwind Animate Plugin, Transitions

### Community 112 - "Responsive Design"
Cohesion: 0.50
Nodes (4): Breakpoint Reference, Breakpoint Usage, Common Responsive Patterns, Responsive Design

### Community 113 - "10. Acceptance Criteria"
Cohesion: 0.50
Nodes (4): 10.1 MVP Acceptance, 10.2 Tutorial Mode Acceptance, 10.3 Interview Mode Acceptance, 10. Acceptance Criteria

### Community 114 - "14. Appendix"
Cohesion: 0.50
Nodes (4): 14.1 Coach Atlas System Prompt (Ultimate), 14.2 Glossary, 14.3 References, 14. Appendix

### Community 115 - "7. Technical Requirements"
Cohesion: 0.50
Nodes (4): 7.1 Frontend Architecture, 7.2 Dependencies to Add, 7.3 API Integration Patterns, 7. Technical Requirements

### Community 116 - "Resource Requirements"
Cohesion: 0.50
Nodes (4): Budget, Development, Infrastructure, Resource Requirements

### Community 117 - "Accessibility"
Cohesion: 0.67
Nodes (3): Accessibility, Color Contrast, Focus Indicators

### Community 118 - "The `cn()` Utility"
Cohesion: 0.67
Nodes (3): Always Use for Dynamic Classes, The `cn()` Utility, Usage Patterns

### Community 119 - "Performance"
Cohesion: 0.67
Nodes (3): Avoid Arbitrary Values in Production, Performance, Purging Unused CSS

### Community 120 - "Dark Mode"
Cohesion: 0.67
Nodes (3): Class-Based Dark Mode, Current Approach, Dark Mode

### Community 121 - "Color Conventions"
Cohesion: 0.67
Nodes (3): Color Conventions, Project Color Palette, Use Semantic Colors

### Community 122 - "Spacing Conventions"
Cohesion: 0.67
Nodes (3): Consistent Scale, Container Patterns, Spacing Conventions

### Community 123 - "Customization"
Cohesion: 0.67
Nodes (3): Custom Utilities (Rare), Customization, Extending Theme

### Community 124 - "Flexbox & Grid"
Cohesion: 0.67
Nodes (3): Flexbox & Grid, Flexbox Patterns, Grid Patterns

### Community 125 - "Typography"
Cohesion: 0.67
Nodes (3): Font Sizes, Prose Content (Markdown), Typography

### Community 126 - "Hover & Focus States"
Cohesion: 0.67
Nodes (3): Group Hover, Hover & Focus States, Interactive Elements

### Community 127 - "8. Integration Requirements"
Cohesion: 0.67
Nodes (3): 8.1 Markdown Viewer Pro Integration, 8.2 AI Provider APIs, 8. Integration Requirements

### Community 128 - "Risk Mitigation"
Cohesion: 0.67
Nodes (3): Risk Mitigation, Schedule Risks, Technical Risks

## Knowledge Gaps
- **1140 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+1135 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `cn`, `WebViewBridge.ts`, `sidebar.tsx`, `shared/utils.ts`, `interview/index.ts`, `hooks/use-toast.ts`, `package.json`, `form.tsx`, `pagination.tsx`, `InterviewPage.tsx`, `command.tsx`, `ErrorBoundary.tsx`, `class-variance-authority`, `interview.ts`, `SettingsPage.tsx`, `MarkdownRenderer.tsx`, `App.tsx`, `carousel.tsx`, `chart.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `navigation-menu.tsx`, `select.tsx`, `drawer.tsx`, `useTimer.ts`, `InterviewContext.tsx`, `input-otp.tsx`, `AppFooter.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _1140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `📝 Files Changed (137 selected)` be split into smaller, more focused modules?**
  _Cohesion score 0.014492753623188406 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `dropdown-menu.tsx`, `command.tsx`, `input-otp.tsx`, `sidebar.tsx`, `class-variance-authority`, `sheet.tsx`, `shared/utils.ts`, `navigation-menu.tsx`, `select.tsx`, `react`, `drawer.tsx`, `hooks/use-toast.ts`, `carousel.tsx`, `form.tsx`, `pagination.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Why does `ProgressiveEvaluator` connect `ProgressiveEvaluator` to `InterviewProblem`, `InterviewPage.tsx`, `ProgressiveEvaluator.ts`, `types/index.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06363636363636363 - nodes in this community are weakly interconnected._