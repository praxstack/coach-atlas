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
 * GitHub-style Alerts Extension
 * Supports: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
 */
const alertExtension: TokenizerAndRendererExtension = {
  name: "alert",
  level: "block",
  start(src: string) {
    return src.match(/^>\s*\[!/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*(?:\n|$))*)/i;
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
    };
    const alertToken = token as Tokens.Generic & { alertType: string; content: string };
    const alertType = alertToken.alertType;
    const content = alertToken.content;
    const icon = icons[alertType] || "📌";
    const title = alertType.charAt(0).toUpperCase() + alertType.slice(1);
    const parsedContent = marked.parse(content) as string;

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
  } as Parameters<typeof mermaid.default.initialize>[0]);
  mermaidInitialized = true;
}

async function renderMermaidDiagrams(container: HTMLElement) {
  const mermaidBlocks = container.querySelectorAll("code.language-mermaid");
  if (mermaidBlocks.length === 0) return;

  await initMermaid();
  const mermaid = await import("mermaid");

  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    const pre = block.parentElement;
    if (!pre) continue;

    const code = block.textContent || "";
    const id = `mermaid-${Date.now()}-${i}`;

    try {
      const { svg } = await mermaid.default.render(id, code);
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-diagram";
      wrapper.innerHTML = svg;
      pre.replaceWith(wrapper);
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      pre.innerHTML = `<div class="mermaid-error">Diagram error: ${error}</div>`;
    }
  }
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
    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "rel", "class", "style"],
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
  }, [content]);

  return <div ref={containerRef} className={`markdown-body ${className}`} />;
});

export default MarkdownRenderer;
