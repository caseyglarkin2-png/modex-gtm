import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    '**/account-page-send-proof.spec.ts',
    '**/account-command-center-proof.spec.ts',
    '**/account-command-center-performance.spec.ts',
  ],
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bash -lc "ALLOW_PROOF_SEED_IN_PRODUCTION=1 npm run build && PORT=3001 ALLOW_PROOF_SEED_IN_PRODUCTION=1 npm run start"',
    url: 'http://127.0.0.1:3001/api/auth/session',
    timeout: 600_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
