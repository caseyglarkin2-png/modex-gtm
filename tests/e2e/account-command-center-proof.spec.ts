import { expect, test, type Page, type Route } from '@playwright/test';
import { bootstrapAccountCommandCenterProof } from './helpers/onepager-proof';
import { loginAsCasey } from './helpers/session';
import { buildSeededAccountContentContext } from '@/lib/proof/account-command-center-fixture';

test.describe.configure({ timeout: 180_000 });

async function login(page: Page) {
  const authenticated = await loginAsCasey(page);
  expect(authenticated).toBe(true);
}

async function gotoSeededAccountPage(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto('/accounts/e2e-boston-beer-company', { waitUntil: 'domcontentloaded' });

    const accountHeading = page.getByRole('heading', { level: 1, name: 'E2E Boston Beer Company' });
    if (await accountHeading.isVisible().catch(() => false)) {
      return;
    }

    const transientError = page.getByRole('heading', { level: 2, name: 'Something went wrong' });
    if (await transientError.isVisible().catch(() => false)) {
      const tryAgain = page.getByRole('button', { name: 'Try again' });
      if (await tryAgain.isVisible().catch(() => false)) {
        await tryAgain.click();
      }
    }

    await page.waitForTimeout(1000 * (attempt + 1));
  }
}

async function fulfillAgentActions(route: Route) {
  const payload = route.request().postDataJSON() as {
    action?: string;
  };

  if (payload.action === 'content_context') {
    const refreshed = buildSeededAccountContentContext(new Date('2026-05-05T13:00:00.000Z'));
    refreshed.summary = 'Research refresh pulled in one more logistics contact and tightened the next move to send the updated draft.';
    refreshed.cards = refreshed.cards.map((card) => (
      card.title === 'Contact Coverage'
        ? { ...card, body: '4 mapped contacts across operator, executive, and logistics lanes. Contact coverage expanded after refresh.' }
        : card
    ));
    refreshed.nextActions = ['Send the updated draft to Pat Brewer and Jamie Yardley.', 'Turn the positive reply into a meeting.'];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(refreshed),
    });
    return;
  }

  if (payload.action === 'draft_outreach') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        action: 'draft_outreach',
        provider: 'sales_agent',
        status: 'ok',
        summary: 'Draft rebuilt from live intel.',
        cards: [],
        data: {
          draft: {
            subject: 'updated proof draft for E2E Boston Beer Company',
            body: 'Pat, the short version is that the account page now keeps the valid path moving even when contact quality is mixed.',
          },
        },
        freshness: buildSeededAccountContentContext(new Date('2026-05-05T13:00:00.000Z')).freshness,
        nextActions: ['Send updated draft'],
      }),
    });
    return;
  }

  await route.fallback();
}

test('seeded account page runs the refresh -> promote -> draft -> send -> learn loop', async ({ page }) => {
  await login(page);
  await bootstrapAccountCommandCenterProof(page);

  await page.route('**/api/agent-actions', fulfillAgentActions);
  let sendBulkAttempts = 0;
  await page.route('**/api/email/send-bulk', async (route) => {
    sendBulkAttempts += 1;
    const payload = route.request().postDataJSON() as {
      accountName: string;
      recipients: Array<{ to: string }>;
      cc?: string[];
      subject: string;
      generatedContentId?: number | null;
      workflowMetadata?: Record<string, unknown>;
    };

    expect(payload.accountName).toBe('E2E Boston Beer Company');
    expect(payload.subject).toContain('updated proof draft');
    expect(payload.recipients).toEqual([
      expect.objectContaining({
        to: 'pat.brewer@e2ebostonbeer.com',
      }),
    ]);
    expect(payload.cc).toEqual(['jamie.yardley@e2ebostonbeer.com']);
    expect(payload.workflowMetadata).toMatchObject({
      surface: 'account_page',
      shell: 'account_outreach',
      variant: 'email_draft',
    });

    if (sendBulkAttempts === 1) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Generated content approval required before send.',
          code: 'APPROVAL_REQUIRED',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        sent: 1,
        failed: 0,
        total: 1,
      }),
    });
  });

  await gotoSeededAccountPage(page);
  await expect(page.getByRole('heading', { level: 1, name: 'E2E Boston Beer Company' })).toBeVisible();
  await expect(page.getByText('Promote the staged logistics contact, send the proof asset, and turn the warm reply into a meeting.').first()).toBeVisible();
  await expect(page.getByText('Engagement Summary')).toBeVisible();
  await expect(page.getByText('Source Evidence')).toBeVisible();
  await expect(page.getByText(/fresh · .*aging · .*stale/i)).toBeVisible();

  const refreshResponse = page.waitForResponse((response) => (
    response.url().includes('/api/agent-actions') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Refresh Intel' }).click();
  await refreshResponse;
  await expect(page.getByText(/Research refresh pulled in one more logistics contact/i).first()).toBeVisible();
  await expect(page.getByText(/contact coverage expanded/i).first()).toBeVisible();

  await page.getByRole('tab', { name: /Contacts/i }).click();
  await expect(page.getByRole('listitem').filter({ hasText: /^Jamie Yardley$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Promote' }).click();
  await expect(page.locator('[data-sonner-toast]').first()).toContainText('Jamie Yardley promoted into contacts');

  await page.getByRole('button', { name: 'Compose Outreach' }).click();
  await expect(page.getByText(/Outreach Shell/i)).toBeVisible();
  await page.getByRole('button', { name: 'Email Draft' }).click();
  await page.getByRole('button', { name: 'Draft From Intel' }).click();
  await expect(page.getByLabel('Subject')).toHaveValue('updated proof draft for E2E Boston Beer Company');

  await page.getByRole('button', { name: 'Manual' }).click();
  const recipientToggles = page.locator('input[type="checkbox"]');
  await recipientToggles.nth(0).check();
  await expect(page.getByText('1 selected').first()).toBeVisible();
  await page.getByLabel('CC emails (optional)').fill('jamie.yardley@e2ebostonbeer.com');

  await page.getByRole('button', { name: /Send to 1 Recipient/i }).click();
  await expect(page.locator('[data-sonner-toast]').first()).toContainText(/approval required/i);
  await page.getByRole('button', { name: /Send to 1 Recipient/i }).click();
  await expect(page.locator('[data-sonner-toast]').first()).toContainText('Sent to 1 recipient');
  await expect(page.getByText('Send result: 1 sent, 0 failed, 1 total.')).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('button', { name: 'Log Outcome' }).first().click();
  await page.getByRole('button', { name: /^wrong person$/i }).click();
  await page.getByLabel('Notes').fill('This thread needs the logistics director rather than the executive sponsor.');
  await page.getByRole('button', { name: 'Save Outcome' }).click();

  await expect(page.locator('[data-sonner-toast]').first()).toContainText('Outcome logged. Next: Replace the contact before the next send');
  await expect(page.getByText('Replace the contact before the next send')).toBeVisible();
});
