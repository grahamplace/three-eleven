import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },

  // CI runs Chromium only; the flows under test are not browser-specific and
  // the other engines triple the runtime. Run them all locally when relevant.
  projects: isCI
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
        { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
      ],

  webServer: {
    // CI tests the production build (`npm run build` runs first in the
    // workflow); locally, reuse or start the dev server.
    command: isCI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
