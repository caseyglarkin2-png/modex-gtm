import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('templates HMAC integration', () => {
  const MOCK_SECRET = 'test-secret-for-templates';
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      UNSUBSCRIBE_SECRET: MOCK_SECRET,
      NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadTemplates() {
    return import('@/lib/email/templates');
  }

  it('listUnsubscribeHeaders includes token param', async () => {
    const { listUnsubscribeHeaders } = await loadTemplates();
    const headers = listUnsubscribeHeaders('alice@example.com');
    const url = headers['List-Unsubscribe'].replace(/^<|>$/g, '');
    expect(url).toContain('token=');
    expect(url).toContain('email=alice%40example.com');
  });

  it('wrapHtml includes token in unsubscribe URL', async () => {
    const { wrapHtml } = await loadTemplates();
    const html = wrapHtml('Hello world', 'Acme Corp', 'bob@acme.com');
    expect(html).toContain('token=');
    expect(html).toContain('email=bob%40acme.com');
  });

  it('wrapHtml without recipientEmail falls back to generic unsub URL', async () => {
    const { wrapHtml } = await loadTemplates();
    const html = wrapHtml('Hello world', 'Acme Corp');
    expect(html).toContain('https://test.example.com/unsubscribe');
    expect(html).not.toContain('token=');
  });
});
