import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      allowExternal: true,
    },
  },
  resolve: {
    alias: {
      "@glitches/xlsx-json-converter": resolve(__dirname, "../core/src/index.ts"),
    },
  },
});
