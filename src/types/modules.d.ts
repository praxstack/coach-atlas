// Type declarations for dynamically imported modules
// These are lazy-loaded and may not be installed

declare module 'mermaid' {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: 'default' | 'dark' | 'forest' | 'neutral' | 'base';
    securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  }

  interface RenderResult {
    svg: string;
    bindFunctions?: (element: Element) => void;
  }

  const mermaid: {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, text: string) => Promise<RenderResult>;
    parse: (text: string) => Promise<boolean>;
  };

  export default mermaid;
}

declare module 'katex' {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
    strict?: boolean | string | ((errorCode: string, errorMsg: string, token: unknown) => string);
    trust?: boolean | ((context: { command: string; url: string; protocol: string }) => boolean);
  }

  const katex: {
    render: (tex: string, element: HTMLElement, options?: KatexOptions) => void;
    renderToString: (tex: string, options?: KatexOptions) => string;
  };

  export default katex;
}

declare module 'katex/dist/katex.min.css' {
  const content: string;
  export default content;
}
