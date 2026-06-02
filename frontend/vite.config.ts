import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split stable vendor code so it caches across deploys. TipTap stays
        // out of here on purpose — it's lazy-loaded as its own dynamic chunk.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "@tanstack/react-query", "axios"],
        },
      },
    },
  },
});
