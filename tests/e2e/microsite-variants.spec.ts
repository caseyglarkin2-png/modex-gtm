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

test('ab inbev overview switches into a global supply variant with distinct copy', async ({ page }) => {
  const response = await page.goto('/for/ab-inbev', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await page.getByRole('link', { name: 'Ricardo Moreira' }).click();

  await expect(page).toHaveURL(/\/for\/ab-inbev\/ricardo-moreira$/);
  await expect(page.getByRole('heading', { name: 'Ricardo, the supply network is standardized on paper. The yard still varies by site.' })).toBeVisible();
  await expect(page.getByText('You have led logistics, procurement, distribution, and post-acquisition integration across AB InBev.')).toBeVisible();
});

test('coca-cola overview switches into a north america finance-and-supply variant with distinct copy', async ({ page }) => {
  const response = await page.goto('/for/coca-cola', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await page.getByRole('link', { name: 'Mark Eppert' }).click();

  await expect(page).toHaveURL(/\/for\/coca-cola\/mark-eppert$/);
  await expect(page.getByRole('heading', { name: 'Mark, North America feels the yard problem in both the P&L and the supply plan.' })).toBeVisible();
  await expect(page.getByText('Detention and dwell are not just operating issues. They are one of the few leaks that hits cost, service, and working capital at the same time across the North America network.')).toBeVisible();
});

test('dannon overview keeps the warm-intro path on a named-person variant', async ({ page }) => {
  const response = await page.goto('/for/dannon', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await page.getByRole('link', { name: 'Heiko Gerling' }).click();

  await expect(page).toHaveURL(/\/for\/dannon\/heiko-gerling$/);
  await expect(page.getByRole('heading', { name: 'Heiko, 13 facilities. Four temperature profiles. One yard protocol. That is the standard Danone North America needs.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Heiko, this conversation is routed through Mark Shaughnessy' })).toBeVisible();
});