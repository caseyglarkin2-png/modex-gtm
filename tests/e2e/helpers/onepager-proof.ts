import { expect, type Page } from '@playwright/test';

const SEED_SECRET = process.env.E2E_SEED_SECRET ?? 'local-e2e-seed';
const PRESEEDED = process.env.E2E_PROOF_PRESEEDED === '1';

async function waitForReady(page: Page, retries = 120) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const readiness = await page.request.get('/api/auth/csrf').catch(() => null);
    const contentType = readiness?.headers()['content-type'] ?? '';
    if (readiness?.ok() && contentType.includes('application/json')) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

export async function bootstrapOnePagerProof(page: Page) {
  const ready = await waitForReady(page);
  expect(ready).toBe(true);
  if (PRESEEDED) return;

  let seeded = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const seedResponse = await page.request.post('/api/proof/one-pager-seed', {
      headers: { 'x-e2e-seed-secret': SEED_SECRET },
    }).catch(() => null);
    if (seedResponse?.ok()) {
      seeded = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  expect(seeded).toBe(true);
}

export async function bootstrapContactsIntakeProof(page: Page) {
  const ready = await waitForReady(page);
  expect(ready).toBe(true);
  if (PRESEEDED) return;

  let seeded = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const seedResponse = await page.request.post('/api/proof/contacts-intake-seed', {
      headers: { 'x-e2e-seed-secret': SEED_SECRET },
    }).catch(() => null);
    if (seedResponse?.ok()) {
      seeded = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  expect(seeded).toBe(true);
}

export async function bootstrapAccountCommandCenterProof(page: Page) {
  const ready = await waitForReady(page);
  expect(ready).toBe(true);
  if (PRESEEDED) return;

  let seeded = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const seedResponse = await page.request.post('/api/proof/account-command-center-seed', {
      headers: { 'x-e2e-seed-secret': SEED_SECRET },
    }).catch(() => null);
    if (seedResponse?.ok()) {
      seeded = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  expect(seeded).toBe(true);
}
