import { defineConfig } from "@playwright/test";

// The Next.js dev server is started directly by globalSetup (e2e/global-setup.mts)
// which handles: Testcontainers startup → migrations → seed → spawn dev server
// → wait for port 3000. We intentionally omit the `webServer` config to avoid
// a deadlock: Playwright's webServer plugin runs before globalSetup in the task
// queue, so using webServer would mean globalSetup never gets to run.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  globalSetup: "./e2e/global-setup.mts",
  globalTeardown: "./e2e/global-teardown.mts",
});
