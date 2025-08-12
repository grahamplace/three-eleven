import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.dom.ts"],
    include: [
      "src/entities/**/*.test.ts",
      "src/lib/**/*.test.ts",
      "src/store/**/*.test.ts",
      "src/inngest/**/*.test.ts",
      "src/components/**/*.test.tsx",
      "src/contexts/**/*.test.tsx",
    ],
  },
});
