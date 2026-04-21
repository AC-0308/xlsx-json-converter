import { defineConfig } from "oxfmt";

export default defineConfig({
  quoteStyle: "single",
  sortImports: {
    groups: [
      "value-builtin",
      "value-external",
      "value-internal",
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
});
