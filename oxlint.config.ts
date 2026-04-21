import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "warn",
  },
  rules: {
    "no-console": "off",
  },
  ignorePatterns: ["prd.md", "dist", "packages/*/dist", "*.d.ts"],
});
