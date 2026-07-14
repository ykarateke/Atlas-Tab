import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts: the CRXJS plugin there expects to process
// manifest.config.ts for an extension build, which isn't relevant (and can error) under
// the Vitest test runner.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
  },
});
