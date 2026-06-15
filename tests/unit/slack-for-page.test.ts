import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/slack/verify', () => ({ verifySlackSignature: () => true }));
const after = vi.fn((fn: () => unknown) => { void fn(); });
vi.mock('next/server', async (orig) => ({ ...(await (orig() as Promise<object>)), after: (fn: () => unknown) => after(fn), unstable_after: (fn: () => unknown) => after(fn) }));
const generatePageRow = vi.fn();
const upsertForPage = vi.fn();
vi.mock('@/lib/for/generate', () => ({ generatePageRow: (...a: unknown[]) => generatePageRow(...a) }));
vi.mock('@/lib/for/store', () => ({ upsertForPage: (...a: unknown[]) => upsertForPage(...a) }));

import { POST } from '@/app/api/slack/for-page/route';

beforeEach(() => { process.env.SLACK_SIGNING_SECRET = 's'; generatePageRow.mockReset(); upsertForPage.mockReset(); after.mockClear(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true })); });

function form(text: string) {
  const body = `command=%2Fyardflow-page&text=${encodeURIComponent(text)}&response_url=${encodeURIComponent('https://hooks.slack.com/x')}`;
  return new Request('http://x/api/slack/for-page', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-slack-signature': 'v0=x', 'x-slack-request-timestamp': '1' }, body });
}

it('acks immediately and kicks off generation', async () => {
  generatePageRow.mockResolvedValue({ slug: 'acme', status: 'live', snap: { annualValueLabel: '$1M/yr', totalFacilities: 30 }, override: { pilot: { site: 'P1' } } });
  upsertForPage.mockResolvedValue(undefined);
  const res = await POST(form('acme') as never);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.text).toMatch(/building/i);
  expect(generatePageRow).toHaveBeenCalledWith('acme');
});

it('rejects an empty account with usage text and does not generate', async () => {
  const res = await POST(form('') as never);
  const json = await res.json();
  expect(json.text).toMatch(/usage/i);
  expect(generatePageRow).not.toHaveBeenCalled();
});

it('posts the live link to response_url on success', async () => {
  generatePageRow.mockResolvedValue({ slug: 'acme', status: 'live', snap: { annualValueLabel: '$1M/yr', totalFacilities: 30 }, override: { pilot: { site: 'P1' } } });
  upsertForPage.mockResolvedValue(undefined);
  await POST(form('acme') as never);
  await new Promise((r) => setTimeout(r, 0));
  const calls = (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  expect(calls.some((c) => String(c[0]).includes('hooks.slack.com') && JSON.stringify(c[1]).includes('/for/acme'))).toBe(true);
});

it('posts a failure note to response_url when generate throws (e.g. no audit yet)', async () => {
  generatePageRow.mockRejectedValue(new Error('no demo pack for "ghost"'));
  await POST(form('ghost') as never);
  await new Promise((r) => setTimeout(r, 0));
  const calls = (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  expect(calls.some((c) => JSON.stringify(c[1]).toLowerCase().includes('could not'))).toBe(true);
});
