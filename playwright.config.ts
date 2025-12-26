import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Setup project - runs first to authenticate
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Test project - uses stored auth state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "DATABASE_URL=postgresql://seamless:seamless@localhost:5432/seamless_interactions?schema=public pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: false, // Always start fresh server for tests
    timeout: 120000,
  },
});
