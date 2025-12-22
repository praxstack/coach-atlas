# Optimization Plan: Bundle Size & Build Warnings

**Objective**: Address Vercel build warnings regarding large chunk sizes (`vendor-mermaid`: 1.6MB, `vendor-cytoscape`: 644kB) without removing functionality.

## 1. Analysis of Current State
The build logs show efficient code splitting is **already working**:
-   `index.js`: ~106kB (Core App)
-   `vendor-react`: ~162kB
-   `vendor-mermaid`: ~1.6MB (Lazy Loaded)
-   `vendor-cytoscape`: ~644kB (Lazy Loaded)

### Why are they so big?
-   **Mermaid**: Contains a massive compiler for Flowcharts, Sequence diagrams, Gantt charts, etc. It is inherently large.
-   **Cytoscape**: Confirmed via `npm list cytoscape` as a direct dependency of `mermaid@11.12.2`. It is required for graph layout algorithms.

### Impact
-   **Initial Load**: **Good**. Since these are in separate chunks, they do **NOT** block the initial page load. The user sees the app immediately.
-   **On Demand**: When the user scrolls to a diagram, the browser fetches the 1.6MB chunk. This might take 1-2s on mobile.

## 2. Recommendation (No Immediate Code Changes Required)

Since we are already using **Lazy Loading** (Dynamic Imports) in `MarkdownRenderer.tsx`, functionality is optimized. The "warning" is just Vite telling us "Hey, this file is big".

### Action Plan

#### Step 1: Verify Transitive Dependency
**Status**: ✅ Confirmed. `cytoscape` is a dependency of `mermaid`. It cannot be removed without breaking Mermaid.

#### Step 2: Suppress the Warning
In `vite.config.ts`, you can increase the `chunkSizeWarningLimit` to 2500kB. This acknowledges that we *know* Mermaid+Cytoscape is big (~2.3MB total) and we are handling it correctly via lazy loading.

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2500, // Supress warnings for chunks < 2.5MB
  }
})
```

#### Step 3: Visual Feedback (Implementation Phase)
Ensure that `MarkdownRenderer` shows a "Loading Diagram..." spinner while fetching the large chunk. (This is already part of the design).

## 3. Future "Nuclear" Option (Compressing Mermaid)
If 1.6MB is truly unacceptable, the only path forward is to replace `mermaid` with a lighter alternative:
1.  **Server-Side Rendering (SSR)**: Generate SVG on the server (Vercel Function) and send only the SVG image to the client. This reduces client bundle by 1.6MB but adds API latency.
2.  **Kroki / PlantUML**: Use an external API (`kroki.io`) to render images. (Privacy concern: sends user data to 3rd party).

**Verdict**: Stick with Current Lazy Loading. It is secure (Client-side) and robust.
