import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const backend = "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/axios")) {
            return "axios";
          }
          return undefined;
        },
      },
    },
  },
  server: {
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
    testTimeout: 15000,
  },
});
