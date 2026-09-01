import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const sharedSrc = fileURLToPath(new URL("./src/shared", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_PROXY_TARGET || "https://backend-80bu.onrender.com";
  const origin = env.VITE_PROXY_ORIGIN || "https://cherishbabykhstore.store";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@shared": sharedSrc,
      },
    },
    build: {
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

            if (id.includes("/@react-oauth/google/")) {
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
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: origin,
            Referer: origin,
          },
        },
        "/socket.io": {
          target,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: origin,
            Referer: origin,
          },
        },
      },
    },
  };
});
