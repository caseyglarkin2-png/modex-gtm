/**
 * Send preview emails via the deployed Vercel API (production has Gmail credentials).
 * Usage: PLAYWRIGHT_BASE_URL=https://modex-gtm.vercel.app npx playwright test tests/e2e/send-previews.spec.ts
 */

import { test, expect } from '@playwright/test';

const PREVIEW_EMAIL = 'caseyglarkin@gmail.com';

async function login(page: import('@playwright/test').Page) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await page.request.post('/api/auth/callback/credentials', {
    form: { email: 'casey@freightroll.com', csrfToken, json: 'true' },
  });
}

test('send one-pager preview email', async ({ page }) => {
  await login(page);

  // Get the one-pager content from public API
  const proposalRes = await page.request.get('/api/proposal/general-mills');
  expect(proposalRes.status()).toBe(200);
  const proposalData = (await proposalRes.json()) as { content: unknown };
  expect(proposalData.content).toBeTruthy();

  // Navigate to account page and use the one-pager dialog
  await page.goto('/accounts/general-mills', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('General Mills');

  // Find and click One-Pager button
  const onePagerBtn = page.getByRole('button', { name: /One-Pager/i }).first();
  await expect(onePagerBtn).toBeVisible();
  await onePagerBtn.click();

  // Generate the one-pager
  const generateBtn = page.getByRole('button', { name: /Generate/i }).first();
  await expect(generateBtn).toBeVisible({ timeout: 5000 });
  await generateBtn.click();

  // Wait for generation (up to 30s)
  await expect(page.getByText('For General Mills', { exact: true })).toBeVisible({ timeout: 30000 });

  // Click "Send as Email"
  const sendBtn = page.getByRole('button', { name: /Send as Email/i });
  await expect(sendBtn).toBeVisible();
  await sendBtn.click();

  // Fill email and send
  const emailInput = page.locator('input[type="email"][placeholder*="Recipient"]');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(PREVIEW_EMAIL);

  const confirmSend = page.getByRole('button', { name: /^Send$/ }).last();
  await confirmSend.click();

  // Wait for either success or error toast
  const toastLocator = page.locator('[data-sonner-toast]').first();
  await expect(toastLocator).toBeVisible({ timeout: 20000 });
  const toastText = await toastLocator.textContent();
  console.log('Toast message:', toastText);
  // Should contain "sent to"
  expect(toastText?.toLowerCase()).toContain('sent to');
});

test('send cold email preview via generator', async ({ page }) => {
  await login(page);
  await page.goto('/accounts/general-mills', { waitUntil: 'domcontentloaded' });

  // Open the AI generator
  const genBtn = page.getByRole('button', { name: /Generate Content/i }).first();
  await expect(genBtn).toBeVisible();
  await genBtn.click();

  // Make sure "Cold Email" type is selected (default)
  await expect(page.getByText('Cold Email')).toBeVisible({ timeout: 5000 });

  // Click Generate
  const generateBtn = page.getByRole('button', { name: /^Generate$/ }).first();
  await generateBtn.click();

  // Wait for content generation
  await expect(page.locator('textarea, .prose')).toBeVisible({ timeout: 30000 });

  // Click Send
  const sendBtn = page.getByRole('button', { name: /^Send$/ }).last();
  await expect(sendBtn).toBeVisible({ timeout: 5000 });
  await sendBtn.click();

  // Fill email
  const emailInput = page.locator('input[type="email"][placeholder*="Recipient"]');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(PREVIEW_EMAIL);

  // Confirm send
  const confirmSend = page.getByRole('button', { name: /^Send$/ }).last();
  await confirmSend.click();

  // Wait for success
  await expect(page.getByText(/sent to/i)).toBeVisible({ timeout: 15000 });
});

test('send follow-up preview via generator', async ({ page }) => {
  await login(page);
  await page.goto('/accounts/general-mills', { waitUntil: 'domcontentloaded' });

  // Open AI generator
  const genBtn = page.getByRole('button', { name: /Generate Content/i }).first();
  await expect(genBtn).toBeVisible();
  await genBtn.click();

  // Switch to Follow-Up type
  const typeDropdown = page.getByRole('button', { name: /Cold Email/i }).first();
  await typeDropdown.click();
  const followUpOption = page.getByText('Follow-Up Email');
  await followUpOption.click();

  // Generate
  const generateBtn = page.getByRole('button', { name: /^Generate$/i }).first();
  await generateBtn.click();

  // Wait for content
  await expect(page.locator('textarea, .prose')).toBeVisible({ timeout: 30000 });

  // Click Send
  const sendBtn = page.getByRole('button', { name: /^Send$/ }).last();
  await expect(sendBtn).toBeVisible({ timeout: 5000 });
  await sendBtn.click();

  // Fill email
  const emailInput = page.locator('input[type="email"][placeholder*="Recipient"]');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(PREVIEW_EMAIL);

  // Confirm send
  const confirmSend = page.getByRole('button', { name: /^Send$/ }).last();
  await confirmSend.click();

  // Wait for success
  await expect(page.getByText(/sent to/i)).toBeVisible({ timeout: 15000 });
});

test('proposal page loads publicly (no auth)', async ({ page }) => {
  // No login — this should be public
  const res = await page.goto('/proposal/general-mills', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(200);
  await expect(page.getByText('For General Mills').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book a Network Audit' }).first()).toBeVisible();
});
