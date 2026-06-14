import { defineConfig, devices } from '@playwright/test';

const isDeployed = Boolean(process.env.E2E_BASE_URL || process.env.CI);

export default defineConfig({
  testDir: './e2e',
  timeout: isDeployed ? 90_000 : 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: isDeployed ? 3 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
