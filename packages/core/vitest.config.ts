import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
      // packages/core holds the money rules: every line and branch must be tested.
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
