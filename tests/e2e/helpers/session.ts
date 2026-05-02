import { expect, type Page } from '@playwright/test';

const AUTH_EMAIL = 'casey@freightroll.com';

async function waitForLoginPage(page: Page, retries = 15): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await page.request.get('/login').catch(() => null);
    if (response?.ok()) return true;
    await page.waitForTimeout(750);
  }
  return false;
}

async function hasAuthenticatedSession(page: Page, retries = 8): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const sessionRes = await page.request.get('/api/auth/session').catch(() => null);
    if (!sessionRes) {
      await page.waitForTimeout(500);
      continue;
    }

    if (sessionRes.status() === 404) {
      await page.waitForTimeout(500);
      continue;
    }

    if (!sessionRes.ok()) return false;
    const contentType = sessionRes.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) return false;
    const session = (await sessionRes.json()) as { user?: { email?: string } } | null;
    return session?.user?.email?.toLowerCase() === AUTH_EMAIL;
  }

  return false;
}

export async function loginAsCasey(page: Page): Promise<boolean> {
  if (await hasAuthenticatedSession(page)) return true;

  const authReady = await waitForLoginPage(page);
  if (!authReady) return false;

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const emailField = page.getByPlaceholder('casey@freightroll.com');
  if ((await emailField.count()) === 0) return false;
  await emailField.fill(AUTH_EMAIL);
  await page.getByRole('button', { name: /Sign in with Email/i }).click();
  await page.waitForLoadState('networkidle');

  return hasAuthenticatedSession(page);
}

export async function openRoutablePage(page: Page, path: string, expectedHeading: string): Promise<boolean> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  const headingText = await heading.innerText().catch(() => '');
  if (headingText === 'Page Not Found') return false;
  await expect(heading).toContainText(expectedHeading);
  return true;
}
