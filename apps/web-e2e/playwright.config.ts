import { workspaceRoot } from "@nx/devkit";
import { nxE2EPreset } from "@nx/playwright/preset";
import { defineConfig, devices } from "@playwright/test";

// For CI, you may want to set BASE_URL to the deployed application.
// Prefer IPv4 loopback to avoid IPv6 resolution issues in headless Firefox.
const baseURL = process.env["BASE_URL"] || "http://127.0.0.1:4200";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Reduce flakiness in CI
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: process.env.CI ? false : undefined,
  retries: process.env.CI ? 2 : 0,
  // Cap per-test timeout to avoid hanging forever
  timeout: process.env.CI ? 60000 : 30000,
  ...nxE2EPreset(__filename, { testDir: "./src" }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  expect: { timeout: 7000 },
  use: {
    baseURL,
    // Be conservative but not extreme to keep feedback fast
    actionTimeout: process.env.CI ? 15000 : 7000,
    navigationTimeout: process.env.CI ? 30000 : 15000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npx nx run @god-roll/web:preview",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
