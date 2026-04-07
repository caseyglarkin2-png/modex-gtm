import { expect, test } from '@playwright/test';

test('frito-lay overview switches into a named-person variant with distinct copy', async ({ page }) => {
  const response = await page.goto('/for/frito-lay', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await page.getByRole('link', { name: 'Bob Fanslow' }).click();

  await expect(page).toHaveURL(/\/for\/frito-lay\/bob-fanslow$/);
  await expect(page.getByRole('heading', { name: 'Bob, the daily yard scramble is still stealing time from the team.' })).toBeVisible();
  await expect(page.getByText('You should not need tribal knowledge to decide which trailer goes to which door next.')).toBeVisible();
});

test('general mills overview switches into a customer-operations variant with distinct copy', async ({ page }) => {
  const response = await page.goto('/for/general-mills', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await page.getByRole('link', { name: 'Zoe Bracey' }).click();

  await expect(page).toHaveURL(/\/for\/general-mills\/zoe-bracey$/);
  await expect(page.getByRole('heading', { name: 'Zoe, the customer promise breaks at the dock before it breaks on the shelf.' })).toBeVisible();
  await expect(page.getByText('Retail service levels start breaking in the yard before the customer ever sees the miss.')).toBeVisible();
});