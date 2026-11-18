import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

const backend = "http://localhost:8080";

function siteUrlPlugin(siteUrl: string): Plugin {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  return {
    name: "site-url",
    transformIndexHtml: (html) =>
      html.replaceAll("%SITE_URL%", normalizedSiteUrl),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    siteUrlPlugin(
      loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL ??
        "http://localhost:5173",
    ),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/axios")) {
            return "axios";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (
            id.includes("/src/components/ui/") ||
            id.includes("/src/hooks/") ||
            id.includes("/src/services/") ||
            id.includes("/src/utils/")
          ) {
            return "shared";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    fs: { allow: [".."] },
    proxy: {
      "/api": backend,
      "/media": backend,
      "/oauth2": backend,
      "/login/oauth2": backend,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    pool: "vmThreads",
    testTimeout: 15000,
  },
}));
