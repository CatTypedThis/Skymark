import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Two test projects split by environment:
 *   - "node":  pure-logic unit tests under tests/unit (.test.ts) -- the historical suite.
 *   - "jsdom": React component / DOM tests (.test.tsx) -- renders real
 *              components into a fake browser so assertions can query rendered
 *              output, roles, and accessible labels.
 *
 * Both projects `extends: true` to inherit the React plugin (JSX transform for
 * .tsx files), the `@` path alias, and `globals`. Vitest 4 removed the old
 * `environmentMatchGlobs` glob; `test.projects` is the supported replacement.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
    ],
  },
});
