import { expect, type Page } from '@playwright/test';

const SEED_SECRET = process.env.E2E_SEED_SECRET ?? 'local-e2e-seed';
const PRESEEDED = process.env.E2E_PROOF_PRESEEDED === '1';

async function waitForReady(page: Page, retries = 120) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const readiness = await page.request.get('/generated-content').catch(() => null);
    if (readiness?.ok()) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

export async function bootstrapOnePagerProof(page: Page) {
  const ready = await waitForReady(page);
  expect(ready).toBe(true);
  if (PRESEEDED) return;

  let seeded = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
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
  for (let attempt = 0; attempt < 30; attempt += 1) {
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
