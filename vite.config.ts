import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Force complete cache invalidation
const CACHE_BUST = Date.now();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: `.vite-cache-${CACHE_BUST}`,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    force: true, // Force re-bundle dependencies
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-tooltip",
      "@tanstack/react-query",
    ],
    exclude: ["react/jsx-dev-runtime"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
}));
