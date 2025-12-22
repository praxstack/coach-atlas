# Task 001: Foundation & Architecture Migration

**Assigned To**: Cline (Senior Developer)
**Approver**: AntiGravity (Principal SDE)
**Prerequisites**: None

## Context
We are upgrading a "Lovable" boilerplate prototype into a production-ready "Screaming Architecture" (LLD-001).

## Objectives
1.  Structure the codebase according to `docs/lld/001-module-architecture.md`.
2.  Enable **Strict Type Safety**.
3.  Clean up unrelated boilerplate (broken AI code).

## Detailed Steps

### Step 1: Directory Restructuring
- [ ] Create `src/app`, `src/features`, `src/shared`, `src/services`, `src/lib`.
- [ ] Move `src/App.tsx` and `src/main.tsx` into `src/app/`.
- [ ] Move standard UI components into `src/shared/ui/` (buttons, inputs).
- [ ] Delete `src/components/` (once empty).

### Step 2: Feature Migration
- [ ] Create `src/features/chat/`, `src/features/settings/`.
- [ ] Move `src/pages/Chat.tsx` -> `src/features/chat/ChatPage.tsx`.
- [ ] Move `src/pages/Settings.tsx` -> `src/features/settings/SettingsPage.tsx`.

### Step 3: TypeScript Hardening
- [ ] Edit `tsconfig.json`:
    - Set `"noImplicitAny": true`
    - Set `"strictNullChecks": true`
    - Set `"strict": true`
- [ ] Run `tsc --noEmit` and fix *all* resulting type errors. (This will be the bulk of the work).

### Step 4: Cleanup
- [ ] Remove hardcoded `SYSTEM_PROMPT` from UI components (preparing for Service Layer).
- [ ] Remove inline `fetch` calls (replace with TODOs or mock services for now).

## Deliverables
- Clean `src` folder matching LLD-001.
- `npm run build` passes with zero type errors.
- Application boots up and navigates (even if features are dummies).
