import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/one-pager-proof.spec.ts', '**/one-pager-proof-contacts.spec.ts'],
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/onepager-proof-report.json' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'NEXTAUTH_URL=http://localhost:3100 AUTH_URL=http://localhost:3100 NEXT_PUBLIC_APP_URL=http://localhost:3100 ONE_PAGER_PROOF_MODE=1 APOLLO_API_KEY= CODEX_APOLLO_API_KEY_MASTER= npm run dev -- --hostname localhost --port 3100',
    port: 3100,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
