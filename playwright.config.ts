import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright end-to-end test configuration.
 *
 * Port 8080 is not Vite's stock default (5173) — it is the port this project's
 * dev server is pinned to in vite.config.ts. Keep the two in sync.
 */
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  // Scoped to ./e2e so Playwright does not also collect the Vitest unit tests
  // under src/**, which match Playwright's default *.test.ts pattern.
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the build if a test.only was committed by accident.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
