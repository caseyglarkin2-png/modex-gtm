import { expect, type Page } from '@playwright/test';

export async function loginAsCasey(page: Page): Promise<boolean> {
  const csrfRes = await page.request.get('/api/auth/csrf');
  if (!csrfRes.ok()) return false;
  const contentType = csrfRes.headers()['content-type'] ?? '';
  if (!contentType.includes('application/json')) return false;
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) return false;

  const authRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      email: 'casey@freightroll.com',
      csrfToken,
      json: 'true',
    },
  });

  return authRes.ok();
}

export async function openRoutablePage(page: Page, path: string, expectedHeading: string): Promise<boolean> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  const headingText = await heading.innerText().catch(() => '');
  if (headingText === 'Page Not Found') return false;
  await expect(heading).toContainText(expectedHeading);
  return true;
}
