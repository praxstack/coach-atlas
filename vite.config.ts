import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build optimization
  build: {
    rollupOptions: {
      external: [/src\/lib\/external\/.*/],
      output: {
        // Code splitting: Create granular chunks for better caching
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // UI libraries (Radix, Lucide)
          if (id.includes("@radix-ui/") ||
              id.includes("lucide-react") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")) {
            return "vendor-ui";
          }
          // Markdown rendering (heavy)
          if (id.includes("marked") ||
              id.includes("prismjs") ||
              id.includes("dompurify")) {
            return "vendor-markdown";
          }
          // Math rendering (heavy fonts)
          if (id.includes("katex")) {
            return "vendor-katex";
          }
          // Data & utilities
          if (id.includes("dexie") ||
              id.includes("@tanstack/")) {
            return "vendor-data";
          }
          // Sonner toasts
          if (id.includes("sonner")) {
            return "vendor-toast";
          }
          // Mermaid (heavy - lazy loaded)
          if (id.includes("mermaid")) {
            return "vendor-mermaid";
          }
          // Cytoscape (heavy - lazy loaded)
          if (id.includes("cytoscape")) {
            return "vendor-cytoscape";
          }
          // Date libraries
          if (id.includes("date-fns") || id.includes("dayjs")) {
            return "vendor-date";
          }
        },
      },
    },
    // Increase chunk size warning limit (Mermaid is intentionally lazy-loaded)
    chunkSizeWarningLimit: 600,
  },
  // Exclude external folder from optimization
  optimizeDeps: {
    exclude: ['src/lib/external'],
  },
}));
