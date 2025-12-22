# ARD-001: Markdown Viewer Pro Integration

**Status**: Approved
**Date**: 2024-12-22
**Author**: AntiGravity, Cline (Principal SDE Review)
**Decision**: Integrate `markdown-viewer-app` as internal library for all rendering

---

## 1. Context

### Problem Statement
Coach Atlas requires rich markdown rendering across multiple views:
1. **Chat Interface** - AI responses with code, diagrams, math
2. **Tutorial View** - Full-screen structured content
3. **Interview Mode** - Interactive problems with hints

### Detailed Implementation Plan

### 1. Directory Structure Setup
We will establish a dedicated module for the markdown logic to keep it isolated from the main app logic.

```
src/
└── lib/
    └── markdown-viewer/
        ├── index.ts              # Main export
        ├── MarkdownRenderer.tsx  # React Component Wrapper
        ├── core/
        │   ├── parser.ts         # Port of script.js (marked config)
        │   └── renderer.ts       # Port of marked renderer
        ├── services/
        │   ├── MermaidService.ts # Port of MermaidService.js
        │   └── PrismService.ts   # Port of PrismService.js
        ├── themes/
        │   ├── index.ts         # Theme loader
        │   └── files/           # CSS files (copied directly)
        └── utils/
            └── colorHelpers.ts   # Port of colorHelpers.js
```

### 2. Component Logic (`MarkdownRenderer.tsx`)
This component will serve as the bridge between React and the Vanilla JS logic of the viewer.
*   **Props**: `content: string`, `theme?: string`
*   **Effect**:
    1.  Initialize `MermaidService` (lazy loaded).
    2.  Parse content using `marked` (configured with `markedFootnote` and custom extensions).
    3.  Sanitize using `DOMPurify`.
    4.  Render HTML to a `div`.
    5.  Post-process: trigger `Mermaid.render` on `.mermaid-diagram` class.
    6.  Post-process: trigger `Prism.highlightAll` on code blocks.

### 3. Theme System
*   Themes will be imported as raw CSS strings (via Vite `?inline` or standard import) and injected into a `<style id="theme-style">` tag in the head.
*   `MermaidService` will continue to use `getCssVariable` to read the active theme colors for dynamic diagram styling.

### 4. Dependencies
We need to install the exact versions used in the viewer to ensure compatibility:
*   `marked`
*   `marked-footnote`
*   `dompurify`
*   `mermaid`
*   `prismjs`
*   `katex`

### 5. Why Not `react-markdown`?
The previous plan suggested `react-markdown`, but `markdown-viewer-app` uses `marked` directly with custom extensions (alerts, custom heading IDs for TOC). To achieve **100% parity**, we must use `marked` and port the exact extensions found in `script.js` (lines 562-846).

## Action Items
1.  **Dependency Install**: `npm install marked marked-footnote dompurify mermaid prismjs katex`
2.  **Code Porting**:
    *   Copy `themes/*.css` -> `src/lib/markdown-viewer/themes/files/`
    *   Port `script.js` (Marked config) -> `src/lib/markdown-viewer/core/parser.ts`
    *   Port `MermaidService.js` -> `src/lib/markdown-viewer/services/MermaidService.ts`
3.  **Component Creation**: Build `<MarkdownRenderer />`.

### Existing Asset
We have a production-ready markdown viewer at:
```
src/lib/external/markdown-viewer-app/
```

**Features Available:**
- ✅ 15 professional themes (dark/light variants)
- ✅ PrismJS syntax highlighting (20+ languages)
- ✅ Mermaid diagrams (flowcharts, sequences, etc.)
- ✅ HTML export with embedded styles
- ✅ PDF export capability
- ✅ Storage management
- ✅ 85%+ test coverage

### Principle
> **Don't reinvent the wheel** - Reuse proven, tested code.

---

## 2. Decision

**We will use `markdown-viewer-app` as the single source of truth for all markdown rendering in Coach Atlas.**

### Integration Architecture

```
src/lib/external/markdown-viewer-app/    # Source (read-only reference)
│
└─── Services to use:
     ├── PrismService.js      → Syntax highlighting
     ├── MermaidService.js    → Diagram rendering
     ├── HTMLService.js       → HTML export
     ├── PDFService.js        → PDF export
     └── ThemeManager.js      → Theme switching

src/components/markdown/                  # React wrappers (NEW)
├── MarkdownRenderer.tsx     # Main component
├── CodeBlock.tsx            # Prism-highlighted code
├── MermaidDiagram.tsx       # Diagram rendering
└── index.ts                 # Barrel export

src/styles/markdown-themes/              # Theme CSS (copy from external)
├── nebula-dark.css          # Default theme
├── nebula-light.css
└── [13 more themes]
```

---

## 3. Implementation Specification

### 3.1 Files to Port

| Source File | Target | Purpose |
|------------|--------|---------|
| `src/js/services/PrismService.js` | Use directly or wrap | Syntax highlighting |
| `src/js/services/MermaidService.js` | Lazy load wrapper | Diagram rendering |
| `src/js/services/HTMLService.js` | Use for export | HTML generation |
| `src/js/core/ThemeManager.js` | Adapt to React context | Theme switching |
| `themes/*.css` | Copy to `src/styles/markdown-themes/` | 15 themes |
| `style.css` | Extract markdown-specific rules | Base markdown styles |
| `variables.css` | Merge with Tailwind CSS variables | CSS custom properties |

### 3.2 React Component: MarkdownRenderer

```typescript
// src/components/markdown/MarkdownRenderer.tsx
import { useEffect, useRef, memo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Prism from 'prismjs';

// Import languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  theme?: 'nebula-dark' | 'nebula-light' | 'default-dark' | string;
  onCopyCode?: (code: string) => void;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = '',
  theme = 'nebula-dark',
  onCopyCode
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse markdown to HTML
    const rawHtml = marked.parse(content, {
      gfm: true,
      breaks: true
    });

    // Sanitize HTML (XSS protection)
    const cleanHtml = DOMPurify.sanitize(rawHtml as string, {
      ADD_TAGS: ['iframe'], // For embeds if needed
      ADD_ATTR: ['target', 'rel']
    });

    containerRef.current.innerHTML = cleanHtml;

    // Apply syntax highlighting
    containerRef.current.querySelectorAll('pre code').forEach((block) => {
      Prism.highlightElement(block as HTMLElement);

      // Add copy button
      const pre = block.parentElement;
      if (pre && !pre.querySelector('.copy-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(block.textContent || '');
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
          onCopyCode?.(block.textContent || '');
        };
        pre.appendChild(copyBtn);
      }
    });

    // Render Mermaid diagrams (lazy load)
    const mermaidBlocks = containerRef.current.querySelectorAll('code.language-mermaid');
    if (mermaidBlocks.length > 0) {
      import('mermaid').then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme.includes('dark') ? 'dark' : 'default'
        });

        mermaidBlocks.forEach((block, i) => {
          const code = block.textContent || '';
          const container = document.createElement('div');
          container.className = 'mermaid-container';

          mermaid.render(`mermaid-${i}`, code).then(({ svg }) => {
            container.innerHTML = svg;
            block.parentElement?.replaceWith(container);
          }).catch((err) => {
            container.innerHTML = `<div class="mermaid-error">Diagram error: ${err.message}</div>`;
            block.parentElement?.replaceWith(container);
          });
        });
      });
    }

    // Render KaTeX math (lazy load)
    const mathBlocks = containerRef.current.querySelectorAll('code.language-math');
    if (mathBlocks.length > 0) {
      import('katex').then(({ default: katex }) => {
        import('katex/dist/katex.min.css');

        mathBlocks.forEach((block) => {
          const code = block.textContent || '';
          const container = document.createElement('div');
          container.className = 'math-container';

          try {
            katex.render(code, container, { displayMode: true });
            block.parentElement?.replaceWith(container);
          } catch (err) {
            container.innerHTML = `<div class="math-error">Math error: ${(err as Error).message}</div>`;
            block.parentElement?.replaceWith(container);
          }
        });
      });
    }
  }, [content, theme, onCopyCode]);

  return (
    <div
      ref={containerRef}
      className={`markdown-body markdown-theme-${theme} ${className}`}
    />
  );
});
```

### 3.3 Theme Integration

```typescript
// src/hooks/useMarkdownTheme.ts
import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'nebula-dark' | 'nebula-light' | 'default-dark' | 'default-light' |
             'forest-dark' | 'forest-light' | 'neon-dark' | 'neon-light' |
             'obsidian-dark' | 'obsidian-light' | 'ocean-dark' | 'ocean-light' |
             'sunset-dark' | 'sunset-light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
}

const MarkdownThemeContext = createContext<ThemeContextValue | null>(null);

export function MarkdownThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('nebula-dark');

  useEffect(() => {
    // Load theme CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/styles/markdown-themes/${theme}.css`;
    link.id = 'markdown-theme';

    const existing = document.getElementById('markdown-theme');
    if (existing) existing.remove();

    document.head.appendChild(link);
  }, [theme]);

  return (
    <MarkdownThemeContext.Provider value={{
      theme,
      setTheme,
      availableThemes: [
        'nebula-dark', 'nebula-light',
        'default-dark', 'default-light',
        'forest-dark', 'forest-light',
        'neon-dark', 'neon-light',
        'obsidian-dark', 'obsidian-light',
        'ocean-dark', 'ocean-light',
        'sunset-dark', 'sunset-light'
      ]
    }}>
      {children}
    </MarkdownThemeContext.Provider>
  );
}

export function useMarkdownTheme() {
  const context = useContext(MarkdownThemeContext);
  if (!context) throw new Error('useMarkdownTheme must be used within MarkdownThemeProvider');
  return context;
}
```

### 3.4 Export Service

```typescript
// src/lib/export/exportService.ts
import { MarkdownRenderer } from '@/components/markdown';

export async function exportToHTML(
  content: string,
  title: string,
  theme: string = 'nebula-dark'
): Promise<string> {
  // Load theme CSS
  const themeCSS = await fetch(`/styles/markdown-themes/${theme}.css`).then(r => r.text());

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Coach Atlas</title>
  <style>${themeCSS}</style>
</head>
<body class="markdown-body markdown-theme-${theme}">
  ${marked.parse(content)}
</body>
</html>`;

  return html;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToMarkdown(content: string, filename: string) {
  downloadFile(content, `${filename}.md`, 'text/markdown');
}

export async function exportToHTMLFile(content: string, title: string, theme?: string) {
  const html = await exportToHTML(content, title, theme);
  downloadFile(html, `${title.replace(/\s+/g, '-').toLowerCase()}.html`, 'text/html');
}
```

---

## 4. Dependencies Required

```bash
npm install marked dompurify prismjs mermaid katex
npm install -D @types/dompurify @types/prismjs
```

**Bundle Size Impact:**
| Package | Size (gzip) | Loading |
|---------|-------------|---------|
| marked | ~15KB | Immediate |
| dompurify | ~8KB | Immediate |
| prismjs | ~20KB | Immediate |
| mermaid | ~500KB | **Lazy loaded** |
| katex | ~100KB | **Lazy loaded** |

**Total immediate:** ~43KB
**Total lazy:** ~600KB (loaded only when diagrams/math used)

---

## 5. Usage Examples

### In Chat Component
```tsx
// src/pages/Chat.tsx
import { MarkdownRenderer } from '@/components/markdown';

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      {message.role === 'assistant' ? (
        <MarkdownRenderer content={message.content} />
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  );
}
```

### In Tutorial View
```tsx
// src/pages/Tutorial.tsx
import { MarkdownRenderer } from '@/components/markdown';
import { useMarkdownTheme, MarkdownThemeProvider } from '@/hooks/useMarkdownTheme';

function TutorialPage({ content }: { content: string }) {
  const { theme, setTheme, availableThemes } = useMarkdownTheme();

  return (
    <div className="tutorial-view">
      <select value={theme} onChange={e => setTheme(e.target.value as any)}>
        {availableThemes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <MarkdownRenderer content={content} theme={theme} />
    </div>
  );
}
```

---

## 6. Validation Criteria

| Test | Expected Result |
|------|-----------------|
| Code block renders | Syntax highlighted with correct language |
| Copy button works | Code copied to clipboard, button shows "Copied!" |
| Mermaid diagram renders | SVG diagram displays correctly |
| Math formula renders | KaTeX renders LaTeX correctly |
| Theme switch works | Styles update without page reload |
| XSS attack blocked | Malicious HTML sanitized |
| Export to MD works | Valid markdown file downloads |
| Export to HTML works | Self-contained HTML with embedded CSS |

---

## 7. Migration Path

### Phase 1: Setup (Day 1)
1. Install dependencies
2. Copy theme CSS files to `src/styles/markdown-themes/`
3. Create `MarkdownRenderer` component

### Phase 2: Integration (Day 2)
1. Replace `<p>{message.content}</p>` in Chat.tsx with `<MarkdownRenderer>`
2. Add `MarkdownThemeProvider` to App.tsx
3. Test with various markdown content

### Phase 3: Enhancement (Day 3)
1. Add export functionality
2. Add theme selector to Settings
3. Performance optimization (memo, virtualization)

---

## 8. Consequences

### Positive
- **Consistency**: Same rendering across all views
- **Quality**: Battle-tested code with 85%+ coverage
- **Features**: 15 themes, syntax highlighting, diagrams, math
- **Performance**: Lazy loading for heavy libraries

### Negative
- **Divergence**: Updates to `markdown-viewer-app` require manual sync
- **Bundle**: ~600KB lazy-loaded for diagrams/math

### Mitigations
- Keep `src/lib/external/markdown-viewer-app` as reference (read-only)
- Document any adaptations made
- Consider extracting to shared npm package in future

---

## 9. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Architect | AntiGravity | ✅ Approved | 2024-12-22 |
| Principal SDE | Cline | ✅ Approved | 2024-12-22 |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | AntiGravity | Initial proposal |
| 1.1 | 2024-12-22 | Cline | Added implementation details, code examples |
