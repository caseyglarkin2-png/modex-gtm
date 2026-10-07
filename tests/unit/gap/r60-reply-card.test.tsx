/**
 * R60: a reply card says its fact once, by name. The first walk read "Someone replied: lisa@...", "A buyer replied",
 * "Read lisa@...'s reply ... Nobody at X gets a cold email until then", "lisa@..." and "lisa@... wrote on Oct 7. No
 * cold email to anyone at X until it is recorded" on ONE card, beside a reply panel that already said "Lisa Scratch".
 * Pins: the replier by name; the person line and the generic hold left to the panel; a deal's or HubSpot's hold still
 * shown; a remembered summary that still holds a lane link opens the account's own action instead.
 */
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));

import { buildWorkList, GENERIC_REPLY_BLOCKERS, type WorkInput } from '@/lib/gap/work/list';
import type { PursuitSummary } from '@/lib/gap/pursuit/summary';
import { WorkList } from '@/components/gap/work-list';

const NOW = new Date('2026-10-07T15:00:00Z');
const LISA = { accountName: 'Fedex Co', contactEmail: 'lisa@fedex.example.com', fromName: 'Lisa Scratch', subject: 'Re: trailer turns', snippet: 'Could you send over the case study?', receivedAt: '2026-10-07T12:22:00Z', id: 'm1', threadId: 't1' };
const input = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NOW,
  candidates: [],
  replies: [LISA],
  motions: [],
  inDeals: { status: 'complete', accounts: [] },
  held: new Map(),
  ...over,
});
const replied = (over: Partial<PursuitSummary> = {}): PursuitSummary => ({
  accountName: 'Fedex Co',
  state: 'replied',
  stateLine: 'Someone replied: Lisa Scratch, Oct 7',
  person: { name: 'Lisa Scratch', title: null },
  blocker: 'Lisa Scratch wrote on Oct 7. No cold email to anyone at Fedex Co until it is recorded.',
  coldTouchAllowed: false,
  nextText: "Read Lisa Scratch's reply of Oct 7 and record what they said. Nobody at Fedex Co gets a cold email until then.",
  at: NOW.toISOString(),
  ...over,
});

describe('R60: a reply card says it once, by name', () => {
  it('the replier is named, never their address, when the message carries the name', () => {
    const [c] = buildWorkList(input());
    expect(c.person?.name).toBe('Lisa Scratch');
    expect(c.why).toMatch(/^Lisa Scratch wrote Oct 7: "Re: trailer turns"\./);
  });
  it('a summary-sourced reply card drops the generic hold (its sentence and the panel say it); a deal hold stays', () => {
    const [c] = buildWorkList(input({ summaries: new Map([['Fedex Co', replied()]]) }));
    expect(c.why).toBe("Read Lisa Scratch's reply of Oct 7 and record what they said. Nobody at Fedex Co gets a cold email until then.");
    expect(c.blocker).toBeNull();
    const deal = buildWorkList(input({ inDeals: { status: 'complete', accounts: [{ accountName: 'Fedex Co', deals: [{ name: 'YardFlow - Fedex', stage: 'Contract sent' }] }] }, summaries: new Map([['Fedex Co', replied()]]) }))[0];
    expect(deal.blocker).toMatch(/^An open HubSpot deal here \("YardFlow - Fedex" \(Contract sent\)\): answer them as deal work/);
  });
  it('a summary remembered with a lane link opens the account\'s own action instead (records written before R60)', () => {
    const s = replied({ actionable: { intent: 'record_reply', allowed: { label: 'Open the reply', href: '/gap?lane=replies' }, preparation: null, completion: null, hypothesisId: null } as unknown as PursuitSummary['actionable'] });
    const [c] = buildWorkList(input({ summaries: new Map([['Fedex Co', s]]) }));
    expect(c.next).toEqual({ label: 'Open the reply', href: '/gap/accounts/fedex-co#record-reply' });
    const kept = replied({ actionable: { intent: 'record_reply', allowed: { label: 'Open the reply', href: '/gap/accounts/fedex-co#record-reply' }, preparation: null, completion: null, hypothesisId: null } as unknown as PursuitSummary['actionable'] });
    expect(buildWorkList(input({ summaries: new Map([['Fedex Co', kept]]) }))[0].next?.href).toBe('/gap/accounts/fedex-co#record-reply');
  });
  it('the card renders no person line and no generic hold beside the reply panel; a hold of its own still shows', () => {
    const [c] = buildWorkList(input());
    expect(GENERIC_REPLY_BLOCKERS.has(c.blocker ?? '')).toBe(true);
    const { unmount } = render(<WorkList cards={[{ ...c, index: 0, href: '/gap/accounts/fedex-co?from=work&i=0', source: 'cockpit' }]} />);
    const row = screen.getByTestId('work-card');
    expect(row.querySelector('[data-testid="work-card-person"]')).toBeNull();
    expect(row.querySelector('[data-testid="work-card-blocker"]')).toBeNull();
    expect(row.querySelector('[data-testid="reply-prep-label"]')).toHaveTextContent('Lisa Scratch (lisa@fedex.example.com)');
    unmount();
    render(<WorkList cards={[{ ...c, blocker: 'An open HubSpot deal here: answer them as deal work, never a cold first touch.', index: 0, href: '/gap/accounts/fedex-co?from=work&i=0', source: 'cockpit' }]} />);
    expect(screen.getByTestId('work-card-blocker')).toHaveTextContent('An open HubSpot deal here');
  });
  it('the account read takes this account\'s replies (never the newest 200 across every account) with their names', () => {
    const load = readFileSync('src/lib/gap/pursuit/load.ts', 'utf8');
    expect(load).toMatch(/listReplies\(prisma, \{ state: 'all', limit: 200, accountName \}\)/);
    expect(load).toMatch(/name: r\.fromName\?\.trim\(\) \|\| null/);
  });
});
