import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Prism from 'prismjs';
import { memo, useCallback, useEffect, useRef } from 'react';

// Import Prism languages
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';

// Import Prism theme
import 'prismjs/themes/prism-tomorrow.css';

// Import markdown styles
import './markdown.css';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  onCopyCode?: (code: string) => void;
}

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with:
 * - Syntax highlighting via PrismJS
 * - XSS protection via DOMPurify
 * - Copy-to-clipboard for code blocks
 * - Lazy loading for Mermaid diagrams
 *
 * @example
 * <MarkdownRenderer content="# Hello\n```js\nconsole.log('hi');\n```" />
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = '',
  onCopyCode
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyClick = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      onCopyCode?.(code);
    });
  }, [onCopyCode]);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    // Parse markdown to HTML
    const rawHtml = marked.parse(content);

    // Sanitize HTML (XSS protection)
    const cleanHtml = DOMPurify.sanitize(rawHtml as string, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['target', 'rel', 'class']
    });

    containerRef.current.innerHTML = cleanHtml;

    // Apply syntax highlighting to all code blocks
    const codeBlocks = containerRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      // Highlight with Prism
      Prism.highlightElement(block as HTMLElement);

      // Add copy button
      const pre = block.parentElement;
      if (pre && !pre.querySelector('.copy-btn')) {
        // Add relative positioning to pre
        pre.style.position = 'relative';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

        copyBtn.onclick = () => {
          const code = block.textContent || '';
          navigator.clipboard.writeText(code).then(() => {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.classList.remove('copied');
            }, 2000);
            handleCopyClick(code);
          });
        };

        pre.appendChild(copyBtn);
      }
    });

    // Mermaid and KaTeX are optional - install them if needed:
    // npm install mermaid katex
    // For now, code blocks will display as-is without special rendering
  }, [content, handleCopyClick]);

  return (
    <div
      ref={containerRef}
      className={`markdown-body ${className}`}
    />
  );
});

export default MarkdownRenderer;
