/**
 * MarkdownRenderer - Pro Visual Learning Engine
 *
 * Features:
 * - Syntax highlighting (Prism.js)
 * - Math rendering (KaTeX)
 * - Mermaid diagrams
 * - GitHub-style alerts ([!NOTE], [!WARNING], etc.)
 * - Footnotes
 * - Copy-to-clipboard for code blocks
 * - XSS protection (DOMPurify)
 */
import DOMPurify from "dompurify";
import katex from "katex";
import { marked, type TokenizerAndRendererExtension, type Tokens } from "marked";
import markedFootnote from "marked-footnote";
import Prism from "prismjs";
import { memo, useEffect, useRef } from "react";

// Prism languages
import "prismjs/components/prism-bash";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";

// Styles
import "katex/dist/katex.min.css";
import "prismjs/themes/prism-tomorrow.css";
import "./markdown.css";

// ============================================
// Custom Marked Extensions
// ============================================

/**
 * GitHub-style Alerts Extension (Extended for Guided Discovery)
 * Supports: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION], [!HINT], [!SOLUTION]
 */
const alertExtension: TokenizerAndRendererExtension = {
  name: "alert",
  level: "block",
  start(src: string) {
    return src.match(/^>\s*\[!/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|HINT|SOLUTION)\]\n((?:>.*(?:\n|$))*)/i;
    const match = rule.exec(src);
    if (match) {
      const type = match[1].toLowerCase();
      const rawContent = match[2]
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n")
        .trim();
      return {
        type: "alert",
        raw: match[0],
        alertType: type,
        content: rawContent,
      };
    }
    return undefined;
  },
  renderer(token) {
    const icons: Record<string, string> = {
      note: "ℹ️",
      tip: "💡",
      important: "❗",
      warning: "⚠️",
      caution: "🔴",
      hint: "🔍",
      solution: "✅",
    };
    const alertToken = token as Tokens.Generic & { alertType: string; content: string };
    const alertType = alertToken.alertType;
    const content = alertToken.content;
    const icon = icons[alertType] || "📌";
    const title = alertType.charAt(0).toUpperCase() + alertType.slice(1);
    const parsedContent = marked.parse(content) as string;

    // Special handling for SOLUTION blocks (collapsible/blurred)
    if (alertType === "solution") {
      return `<div class="markdown-alert markdown-alert-solution" data-revealed="false">
        <div class="solution-header">
          <p class="markdown-alert-title">${icon} ${title}</p>
          <button class="reveal-btn" aria-label="Reveal solution">
            <span class="reveal-text">Reveal</span>
          </button>
        </div>
        <div class="solution-content markdown-alert-content">${parsedContent}</div>
      </div>`;
    }

    // Special handling for HINT blocks (collapsible)
    if (alertType === "hint") {
      return `<div class="markdown-alert markdown-alert-hint" data-expanded="true">
        <div class="hint-header">
          <p class="markdown-alert-title">${icon} ${title}</p>
          <button class="toggle-hint-btn" aria-label="Toggle hint">
            <span class="toggle-icon">▼</span>
          </button>
        </div>
        <div class="hint-content markdown-alert-content">${parsedContent}</div>
      </div>`;
    }

    return `<div class="markdown-alert markdown-alert-${alertType}">
      <p class="markdown-alert-title">${icon} ${title}</p>
      <div class="markdown-alert-content">${parsedContent}</div>
    </div>`;
  },
};

// ============================================
// Math Rendering (KaTeX)
// ============================================

/**
 * Render math expressions using KaTeX
 * Supports: $inline$ and $$block$$
 */
function renderMath(html: string): string {
  // Block math: $$...$$ (can be multiline)
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="math-error">Math error: ${tex}</span>`;
    }
  });

  // Inline math: $...$ (single line, not greedy)
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="math-error">Math error: ${tex}</span>`;
    }
  });

  return html;
}

// ============================================
// Mermaid Rendering
// ============================================

let mermaidInitialized = false;

async function initMermaid() {
  if (mermaidInitialized) return;

  const mermaid = await import("mermaid");
  // Use type assertion as mermaid types may be outdated
  mermaid.default.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    suppressErrorRendering: true, // Don't render error diagrams
  } as Parameters<typeof mermaid.default.initialize>[0]);
  mermaidInitialized = true;
}

/**
 * Validate mermaid diagram syntax before rendering
 * Returns true if the diagram looks complete and valid
 */
function isMermaidDiagramComplete(code: string): boolean {
  const trimmed = code.trim();

  // Must have at least one valid diagram type declaration
  const validStarts = [
    /^flowchart\s+(TB|TD|BT|RL|LR)/m,
    /^graph\s+(TB|TD|BT|RL|LR)/m,
    /^sequenceDiagram/m,
    /^classDiagram/m,
    /^stateDiagram/m,
    /^erDiagram/m,
    /^journey/m,
    /^gantt/m,
    /^pie/m,
    /^mindmap/m,
    /^timeline/m,
    /^gitgraph/m,
  ];

  const hasValidStart = validStarts.some(regex => regex.test(trimmed));
  if (!hasValidStart) return false;

  // Basic completeness checks
  // - Should have at least 2 lines (declaration + content)
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;

  // - Flowcharts/graphs need at least one node connection (-->)
  if (/^(flowchart|graph)\s/m.test(trimmed)) {
    if (!trimmed.includes('-->') && !trimmed.includes('---') && !trimmed.includes('-.-')) {
      return false;
    }
    // Check for incomplete arrows at end of lines (streaming artifact)
    // e.g., "ptr -->" without a target node
    if (/-->\s*$/m.test(trimmed) || /---\s*$/m.test(trimmed) || /-\.-\s*$/m.test(trimmed)) {
      return false;
    }
  }

  // - Check for unclosed brackets that indicate incomplete streaming
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) return false;

  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) return false;

  // - Check for unclosed quotes
  const doubleQuotes = (trimmed.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) return false;

  // - Subgraphs must be closed
  const subgraphCount = (trimmed.match(/\bsubgraph\b/g) || []).length;
  const endCount = (trimmed.match(/\bend\b/g) || []).length;
  if (subgraphCount > endCount) return false;

  return true;
}

// Track rendered mermaid blocks to avoid re-rendering
const renderedMermaidBlocks = new WeakSet<Element>();

async function renderMermaidDiagrams(container: HTMLElement) {
  const mermaidBlocks = container.querySelectorAll("code.language-mermaid");
  if (mermaidBlocks.length === 0) return;

  await initMermaid();
  const mermaid = await import("mermaid");

  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    const pre = block.parentElement;
    if (!pre) continue;

    // Skip already rendered blocks
    if (renderedMermaidBlocks.has(pre)) continue;

    const code = block.textContent || "";

    // Validate diagram completeness before rendering
    if (!isMermaidDiagramComplete(code)) {
      // Show "rendering..." placeholder for incomplete diagrams
      if (!pre.classList.contains('mermaid-pending')) {
        pre.classList.add('mermaid-pending');
        const placeholder = document.createElement('div');
        placeholder.className = 'mermaid-placeholder';
        placeholder.innerHTML = '<span class="mermaid-loading">⏳ Diagram loading...</span>';
        pre.parentElement?.insertBefore(placeholder, pre.nextSibling);
      }
      continue;
    }

    const id = `mermaid-${Date.now()}-${i}`;

    try {
      const { svg } = await mermaid.default.render(id, code);
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-diagram";
      wrapper.innerHTML = svg;

      // Remove placeholder if exists
      const placeholder = pre.parentElement?.querySelector('.mermaid-placeholder');
      placeholder?.remove();

      pre.replaceWith(wrapper);
      renderedMermaidBlocks.add(wrapper);
    } catch (error) {
      // Silently skip incomplete diagrams during streaming
      // Only show error if diagram looks complete but still fails
      if (isMermaidDiagramComplete(code)) {
        console.warn("Mermaid rendering error (complete diagram):", error);
        const errorWrapper = document.createElement("div");
        errorWrapper.className = "mermaid-error";
        errorWrapper.innerHTML = `<span>⚠️ Diagram syntax error</span><pre>${code.slice(0, 100)}...</pre>`;
        pre.replaceWith(errorWrapper);
        renderedMermaidBlocks.add(errorWrapper);
      }
      // For incomplete diagrams, just wait for more content
    }
  }
}

// ============================================
// Interactive Blocks (HINT & SOLUTION)
// ============================================

/**
 * Initialize interactive elements for HINT and SOLUTION blocks
 * - HINT: Toggle expand/collapse
 * - SOLUTION: Reveal hidden content
 */
function initializeInteractiveBlocks(container: HTMLElement) {
  // Initialize SOLUTION reveal buttons
  const solutionBlocks = container.querySelectorAll(".markdown-alert-solution");
  solutionBlocks.forEach((block) => {
    const revealBtn = block.querySelector(".reveal-btn");
    const content = block.querySelector(".solution-content");
    const revealText = block.querySelector(".reveal-text");

    if (revealBtn && content && revealText) {
      // Skip if already initialized
      if (revealBtn.hasAttribute("data-initialized")) return;
      revealBtn.setAttribute("data-initialized", "true");

      revealBtn.addEventListener("click", () => {
        const isRevealed = block.getAttribute("data-revealed") === "true";
        block.setAttribute("data-revealed", isRevealed ? "false" : "true");
        revealText.textContent = isRevealed ? "Reveal" : "Hide";
      });
    }
  });

  // Initialize HINT toggle buttons
  const hintBlocks = container.querySelectorAll(".markdown-alert-hint");
  hintBlocks.forEach((block) => {
    const toggleBtn = block.querySelector(".toggle-hint-btn");
    const content = block.querySelector(".hint-content");
    const toggleIcon = block.querySelector(".toggle-icon");

    if (toggleBtn && content && toggleIcon) {
      // Skip if already initialized
      if (toggleBtn.hasAttribute("data-initialized")) return;
      toggleBtn.setAttribute("data-initialized", "true");

      toggleBtn.addEventListener("click", () => {
        const isExpanded = block.getAttribute("data-expanded") === "true";
        block.setAttribute("data-expanded", isExpanded ? "false" : "true");
        toggleIcon.textContent = isExpanded ? "▶" : "▼";
      });
    }
  });
}

// ============================================
// Configure Marked
// ============================================

// Add extensions
marked.use(markedFootnote());
marked.use({ extensions: [alertExtension] });

marked.setOptions({
  gfm: true,
  breaks: true,
});

// ============================================
// Component
// ============================================

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // 1. Parse markdown to HTML
    let html = marked.parse(content) as string;

    // 2. Render math expressions
    html = renderMath(html);

    // 3. Sanitize HTML (XSS protection)
    // Allow iframes only from trusted sources
    DOMPurify.addHook('uponSanitizeElement', (currentNode, data) => {
      if (data.tagName === 'iframe') {
        const node = currentNode as Element;
        const src = node.getAttribute('src') || '';
        const allowed = [
          'youtube.com/embed/',
          'player.vimeo.com/video/',
          'codesandbox.io/embed/'
        ];
        if (!allowed.some(domain => src.includes(domain))) {
           node.remove();
        }
      }
    });

    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "rel", "class", "style", "allow", "allowfullscreen", "frameborder", "scrolling"],
      ALLOW_DATA_ATTR: true,
    });

    containerRef.current.innerHTML = cleanHtml;

    // 4. Apply Prism syntax highlighting
    const codeBlocks = containerRef.current.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      // Skip mermaid blocks (they'll be rendered separately)
      if (block.classList.contains("language-mermaid")) return;

      Prism.highlightElement(block as HTMLElement);

      // Add copy button
      const pre = block.parentElement;
      if (pre && !pre.querySelector(".copy-btn")) {
        pre.style.position = "relative";

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.setAttribute("aria-label", "Copy code to clipboard");

        copyBtn.onclick = () => {
          const code = block.textContent || "";
          navigator.clipboard.writeText(code).then(() => {
            copyBtn.textContent = "Copied!";
            copyBtn.classList.add("copied");
            setTimeout(() => {
              copyBtn.textContent = "Copy";
              copyBtn.classList.remove("copied");
            }, 2000);
          });
        };

        pre.appendChild(copyBtn);
      }
    });

    // 5. Render Mermaid diagrams (async)
    renderMermaidDiagrams(containerRef.current);

    // 6. Initialize interactive elements (HINT toggle, SOLUTION reveal)
    initializeInteractiveBlocks(containerRef.current);
  }, [content]);

  return <div ref={containerRef} className={`markdown-body ${className}`} />;
});

export default MarkdownRenderer;
