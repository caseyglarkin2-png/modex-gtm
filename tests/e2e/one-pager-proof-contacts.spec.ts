import { expect, test } from '@playwright/test';
import { bootstrapContactsIntakeProof } from './helpers/onepager-proof';

test.setTimeout(180_000);

test.beforeEach(async ({ page }) => {
  await bootstrapContactsIntakeProof(page);
});

test('contacts intake supports deterministic import and enrich flow', async ({ page }) => {
  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();

  await page.getByRole('button', { name: /Load Recent HubSpot Contacts/i }).click();
  await expect(page.locator('body')).toContainText('new.ops@intakeco.com');

  await page.getByRole('button', { name: /Import Selected/i }).click();
  await expect(page.locator('body')).toContainText(/Imported|linked|blocked|errors/i);

  await page.getByRole('checkbox', { name: /Select New Ops/i }).check();
  await page.getByRole('button', { name: /Enrich Selected \(Apollo\)/i }).click();
  await expect(page.locator('body')).toContainText(/Enriched \d+ matched, \d+ no-match/i);

  await expect(page.locator('body')).toContainText(/Matched|No Match/);
});
