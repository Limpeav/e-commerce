import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const sharedSrc = fileURLToPath(new URL("./src/shared", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": sharedSrc,
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["10.100.100.79.sslip.io"],
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
