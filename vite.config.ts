import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import PrerenderPlugin from "vite-plugin-prerender";

const Renderer = (PrerenderPlugin as any).PuppeteerRenderer;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" &&
      PrerenderPlugin({
        staticDir: path.resolve(__dirname, "dist"),
        routes: ["/"],
        renderer: new Renderer({
          headless: true,
          renderAfterTime: 5000,
        }),
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-tooltip"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
}));
