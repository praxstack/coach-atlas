import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  // Exclude external folder from processing (reference only)
  build: {
    rollupOptions: {
      external: [/src\/lib\/external\/.*/],
    },
  },
  // Exclude external folder from optimization
  optimizeDeps: {
    exclude: ['src/lib/external'],
  },
}));
