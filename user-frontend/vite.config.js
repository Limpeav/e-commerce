import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router/") ||
            id.includes("/react-router-dom/")
          ) {
            return "vendor-react";
          }

          if (id.includes("/framer-motion/")) {
            return "vendor-motion";
          }

          if (
            id.includes("/i18next/") ||
            id.includes("/react-i18next/")
          ) {
            return "vendor-i18n";
          }

          if (
            id.includes("/axios/") ||
            id.includes("/socket.io-client/") ||
            id.includes("/engine.io-client/")
          ) {
            return "vendor-network";
          }

          if (id.includes("/lucide-react/")) {
            return "vendor-icons";
          }

          if (
            id.includes("/@react-oauth/google/") ||
            id.includes("/react-helmet-async/")
          ) {
            return "vendor-auth";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["10.100.100.79.sslip.io"],
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
