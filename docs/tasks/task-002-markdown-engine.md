# Task 002: Visual Learning Engine (Markdown Integration)

**Assigned To**: Cline (Senior Developer)
**Approver**: AntiGravity (Principal SDE)
**Prerequisites**: Task 001, ARD-001

## Context
We need to integrate the "Pro" markdown rendering logic from the user's `markdown-viewer-app` into Coach Atlas to support Mermaid, Math, and Alerts.

## Objectives
1.  Port the rendering logic as a local library (`src/lib/markdown-viewer`).
2.  Create a React wrapper component.

## Detailed Steps

### Step 1: Dependencies
- [ ] Install: `npm install marked marked-footnote dompurify mermaid prismjs katex` (exact versions from ARD-001 if possible).
- [ ] Install types: `npm install -D @types/marked ...`

### Step 2: Logic Porting (The Hard Part)
- [ ] Create `src/lib/markdown-viewer/core/parser.ts`.
    - Copy logic from `script.js` (lines 562-846). Adapted to TS.
    - Export a `parseMarkdown(text: string): string` function.
- [ ] Port `src/js/services/MermaidService.js` to `src/lib/markdown-viewer/services/MermaidService.ts`.
    - Ensure it uses the new `colorHelpers.ts` util.

### Step 3: Theme Integration
- [ ] Copy all `.css` files from `external/markdown-viewer-app/themes/` to `src/lib/markdown-viewer/themes/files/`.
- [ ] Create a loader in `src/lib/markdown-viewer/themes/index.ts` that can inject these styles into `<head>`.

### Step 4: React Component
- [ ] Create `src/shared/components/MarkdownRenderer.tsx`.
    - Uses `useEffect` to trigger `mermaid.render` after HTML injection.
    - Uses `useEffect` to trigger `Prism.highlightAll`.

## Deliverables
- `<MarkdownRenderer content="# Hello \n $$E=mc^2$$" />` renders correctly.
- Mermaid diagrams render with the correct colors.
