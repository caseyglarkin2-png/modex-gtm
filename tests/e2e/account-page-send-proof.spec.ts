import { expect, test } from '@playwright/test';
import { bootstrapAccountCommandCenterProof } from './helpers/onepager-proof';

test.describe.configure({ timeout: 180_000 });

test('account page send flow keeps valid recipient sendable when malformed and unsubscribed contacts are selected', async ({ page }) => {
  let loggedIn = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const csrfRes = await page.request.get('/api/auth/csrf').catch(() => null);
    const contentType = csrfRes?.headers()['content-type'] ?? '';
    if (!csrfRes?.ok() || !contentType.includes('application/json')) {
      await page.waitForTimeout(1000);
      continue;
    }

    const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfToken) {
      await page.waitForTimeout(1000);
      continue;
    }

    await page.request.post('/api/auth/callback/credentials', {
      form: {
        email: 'casey@freightroll.com',
        csrfToken,
        json: 'true',
      },
      maxRedirects: 0,
    }).catch(() => null);
    loggedIn = true;
    break;
  }

  expect(loggedIn).toBe(true);

  await bootstrapAccountCommandCenterProof(page);

  await page.route('**/api/email/send-bulk', async (route) => {
    const payload = route.request().postDataJSON() as {
      accountName: string;
      recipients: Array<{ to: string }>;
      subject: string;
    };

    expect(payload.accountName).toBe('E2E Boston Beer Company');
    expect(payload.subject.toLowerCase()).toContain('yard network scorecard');
    expect(payload.recipients.map((recipient) => recipient.to).sort()).toEqual([
      'not-an-email',
      'pat.brewer@e2ebostonbeer.com',
      'taylor.optout@e2ebostonbeer.com',
    ]);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        sent: 1,
        failed: 0,
        total: 3,
        skipped: [
          { to: 'not-an-email', reason: 'Invalid recipient email address' },
          { to: 'taylor.optout@e2ebostonbeer.com', reason: 'Recipient explicitly unsubscribed' },
        ],
      }),
    });
  });

  await page.goto('/accounts/e2e-boston-beer-company', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'E2E Boston Beer Company', level: 1 })).toBeVisible();

  const sendButton = page.getByRole('button', { name: /Use Recommended Asset|Send Latest Asset/i }).first();
  await expect(sendButton).toBeVisible();
  await sendButton.click();

  await expect(page.getByRole('dialog')).toContainText('Send Asset');
  await expect(page.getByText('pat.brewer@e2ebostonbeer.com')).toBeVisible();
  await expect(page.getByText('not-an-email')).toBeVisible();
  await expect(page.getByText('taylor.optout@e2ebostonbeer.com')).toBeVisible();

  await page.getByRole('button', { name: /Select All \(3\)/i }).click();
  await expect(page.getByText('Recipients (3)')).toBeVisible();

  const finalSend = page.getByRole('button', { name: /Send to 3 Recipients/i });
  await expect(finalSend).toBeEnabled();
  await finalSend.click();

  await expect(page.locator('[data-sonner-toast]').first()).toContainText('Sent to 1 recipient(s)');
  await expect(page.getByText('Send result: 1 sent, 0 failed, 3 total.')).toBeVisible();
  await expect(page.getByText(/Skipped: not-an-email \(Invalid recipient email address\), taylor\.optout@e2ebostonbeer\.com \(Recipient explicitly unsubscribed\)/i)).toBeVisible();
});
