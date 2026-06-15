import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create: (...a: unknown[]) => create(...a) }; } }));

import { authorOverride } from '@/lib/for/author-override';

beforeEach(() => { create.mockReset(); process.env.ANTHROPIC_API_KEY = 'k'; });

const pack = { account: { slug: 'acme-foods', displayName: 'Acme Foods', archetype: 'beverage' }, network: { sites: [{ name: 'Acme - Dallas TX' }] } };
const snap = { totalFacilities: 30, siloTax: { auditedCount: 30, dropReady: 24 }, annualValueLabel: '$120.0M/yr' };

it('returns a parsed override and feeds the latest trigger into the prompt (news gate)', async () => {
  create.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify({ problemHook: 'Choke at Dallas.', problemHighlights: ['Dallas'], pilot: { site: 'Acme - Dallas TX', body: 'Start in 60 days.' }, heroHook: 'A hook.' }) }] });
  const o = await authorOverride(pack as never, snap as never, { title: 'Acme buys Gatik', url: 'http://x', source: 'clawd' } as never);
  expect(o.problemHook).toBe('Choke at Dallas.');
  expect(o.pilot.site).toBe('Acme - Dallas TX');
  const sentPrompt = JSON.stringify(create.mock.calls[0][0]);
  expect(sentPrompt).toContain('Acme buys Gatik');
});

it('strips em dashes from authored copy (writing law)', async () => {
  create.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify({ problemHook: 'A choke — really.', problemHighlights: [], pilot: { site: 'Acme - Dallas TX', body: 'Body — here.' } }) }] });
  const o = await authorOverride(pack as never, snap as never, null);
  expect(o.problemHook).not.toContain('—');
  expect(o.pilot.body).not.toContain('—');
});

it('throws a clear error when the model returns non-JSON', async () => {
  create.mockResolvedValue({ content: [{ type: 'text', text: 'sorry, here is some prose' }] });
  await expect(authorOverride(pack as never, snap as never, null)).rejects.toThrow(/parse/i);
});
