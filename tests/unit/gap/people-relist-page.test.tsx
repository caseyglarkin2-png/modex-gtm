/**
 * The undo of `never` (2026-10-10), where it is offered: the decide page (the briefing's never link lands there) and
 * the Work panel's not-a-prospect list. Pinned:
 *   - a never link on a sender already marked says "Not a prospect since <date>; list this sender again?" and carries
 *     a fresh signed relist token (confirmed by its one click), never a second never; the bare GET writes nothing;
 *   - a never just applied offers the undo beside its answer, and that control relists through the one service
 *     (the ledger reads never, then relist);
 *   - a relist link confirms what stands and what stays; with no never standing it says there is nothing to undo;
 *   - the panel lists each standing mark with its date and posts `relist` for exactly that key.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';

const h = vi.hoisted(() => ({ prisma: {} as Record<string, unknown> }));

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: h.prisma }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/components/gap/gap-subnav', () => ({ GapSubnav: () => null }));
vi.mock('@/lib/gap/opportunity/contact-reads', () => ({ hubspotContactByEmail: vi.fn(async () => null) }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
  notFound: () => { throw new Error('NOT_FOUND'); },
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

import { signActionToken, verifyActionToken } from '@/lib/gap/work/action-token';
import { PROSPECT_DECISION, type Intelligence } from '@/lib/gap/work/intel';
import DecidePage from '@/app/gap/decide/page';
import { IntelPanel } from '@/components/gap/intel-panel';

const SECRET = 'test-secret';
const NOW = new Date('2026-10-10T12:00:00Z');
const token = (item: string) => signActionToken({ op: 'decide', item, day: '2026-10-10' }, { secret: SECRET, now: new Date() });
const inbound = { id: 'm1', thread_id: 't-m1', from_email: 'pat@riserify.com', from_name: null, subject: 'Re: a question about the yards', snippet: 'Thanks.', received_at: new Date('2026-09-20T12:00:00Z'), source: 'gmail', thread: { account_name: null } };

let db: ReturnType<typeof ledgerDb>;
const use = (d: ReturnType<typeof ledgerDb>) => {
  db = d;
  for (const k of Object.keys(h.prisma)) delete h.prisma[k];
  Object.assign(h.prisma, d.client());
};
const ledger = () => db.store.gapAuditEvent.filter((e) => e.kind === PROSPECT_DECISION).map((e) => [e.subject_id, (e.payload as { decision: string }).decision]);
const neverRow = (subject_id: string) => ({ id: `ev-never-${subject_id}`, kind: PROSPECT_DECISION, actor: 'casey@freightroll.com', subject_type: 'prospect', subject_id, payload: { decision: 'never', via: 'gmail:link', effects: ['not_a_prospect'] }, created_at: NOW });
const formToken = (form: HTMLElement) => form.querySelector('input[name="t"]')!.getAttribute('value')!;

beforeEach(() => {
  process.env.GAP_ACTION_SECRET = SECRET;
  use(ledgerDb({ accounts: [], personas: [], inbound: [inbound] }, NOW));
});
afterEach(() => {
  delete process.env.GAP_ACTION_SECRET;
  vi.restoreAllMocks();
});

describe('/gap/decide: the undo where the never was taken', () => {
  it('a never link on a sender already marked says "Not a prospect since <date>; list this sender again?" with a fresh relist token; the GET writes nothing', async () => {
    use(ledgerDb({ accounts: [], personas: [], inbound: [inbound], audit: [neverRow('person:pat@riserify.com')] }, NOW));
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('person:pat@riserify.com|never') }) }));
    expect(screen.getByRole('heading').textContent).toBe('Already not a prospect');
    expect(screen.getByTestId('decide-confirm-line').textContent).toContain('Not a prospect since Oct 10, 2026; list this sender again?');
    expect(screen.getByTestId('decide-confirm-line').textContent).toContain('an opt-out, a suppression or do not contact stays');
    const form = screen.getByTestId('decide-relist-form');
    expect(form.querySelector('input[name="confirmed"]')).toHaveAttribute('value', '1');
    const v = verifyActionToken(formToken(form), { secret: SECRET, now: new Date() });
    expect(v.ok && v.payload).toMatchObject({ op: 'decide', item: 'person:pat@riserify.com|relist' });
    expect(screen.getByTestId('decide-relist').textContent).toBe('List this sender again');
    expect(screen.queryByTestId('decide-confirm-form')).toBeNull();
    expect(ledger()).toEqual([['person:pat@riserify.com', 'never']]);
  });

  it('a never just applied offers the undo beside its answer; that control relists through the one service (never, then relist)', async () => {
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('person:pat@riserify.com|never'), confirmed: '1' }) }));
    expect(screen.getByTestId('decide-line').textContent).toBe('Not a prospect: pat@riserify.com is never listed to reengage again. Nothing was sent to anyone.');
    const undo = screen.getByTestId('decide-undo');
    expect(undo.textContent).toContain('This reverses only the not-a-prospect mark.');
    const relist = formToken(within(undo).getByTestId('decide-relist-form'));
    expect(ledger()).toEqual([['person:pat@riserify.com', 'never']]);
    document.body.innerHTML = '';
    render(await DecidePage({ searchParams: Promise.resolve({ t: relist, confirmed: '1' }) }));
    expect(screen.getByTestId('decide-line').textContent).toMatch(/^Listed again: pat@riserify\.com is no longer marked not a prospect \(marked Oct 10, 2026\)/);
    expect(screen.queryByTestId('decide-undo')).toBeNull();
    expect(ledger()).toEqual([['person:pat@riserify.com', 'never'], ['person:pat@riserify.com', 'relist']]);
  });

  it('a relist link confirms what stands and what stays; with no never standing it says there is nothing to undo and writes nothing', async () => {
    use(ledgerDb({ accounts: [], personas: [], inbound: [inbound], audit: [neverRow('domain:riserify.com')] }, NOW));
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('domain:riserify.com|relist') }) }));
    expect(screen.getByTestId('decide-confirm-line').textContent).toBe('Not a prospect since Oct 10, 2026. List anyone at riserify.com again? Only that mark is reversed: an opt-out, a suppression or do not contact stays. Nothing is applied until you confirm; nothing is sent to anyone either way.');
    expect(screen.getByTestId('decide-confirm').textContent).toBe('List anyone at riserify.com again');
    document.body.innerHTML = '';
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('person:pat@riserify.com|relist') }) }));
    expect(screen.getByTestId('decide-line').textContent).toBe('pat@riserify.com is not marked not a prospect, so there is nothing to list again. Nothing was applied.');
    expect(screen.queryByTestId('decide-confirm-form')).toBeNull();
    document.body.innerHTML = '';
    render(await DecidePage({ searchParams: Promise.resolve({ t: token('person:pat@riserify.com|relist'), confirmed: '1' }) }));
    expect(screen.getByTestId('decide-line').textContent).toBe('pat@riserify.com is not marked not a prospect, so there is nothing to list again. Nothing was applied.');
    expect(ledger()).toEqual([['domain:riserify.com', 'never']]);
  });
});

describe('<IntelPanel>: the not-a-prospect list', () => {
  const intel: Intelligence = {
    signals: [], triggers: [], people: [], pursued: [], totals: { signals: 0, triggers: 0, people: 0 },
    notProspects: [
      { key: 'person:claims@goldstaradjusters.com', kind: 'person', id: 'claims@goldstaradjusters.com', since: '2026-10-10T15:00:00.000Z', actor: 'casey@freightroll.com', note: null, via: 'gmail:link', eventId: 'ev1' },
      { key: 'domain:firecrown.com', kind: 'domain', id: 'firecrown.com', since: '2026-10-10T14:00:00.000Z', actor: 'casey@freightroll.com', note: 'a vendor', via: 'app', eventId: 'ev2' },
    ],
  };

  it('lists each standing mark with its date and posts relist for exactly that key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, state: 'accepted', line: 'Listed again.' }), { status: 200 }));
    render(<IntelPanel intel={intel} angles={{}} />);
    const rows = screen.getAllByTestId('intel-not-prospect');
    expect(rows.map((r) => r.getAttribute('data-key'))).toEqual(['person:claims@goldstaradjusters.com', 'domain:firecrown.com']);
    expect(within(rows[0]).getByTestId('intel-not-prospect-since').textContent).toBe('Not a prospect since Oct 10, 2026');
    expect(within(rows[1]).getByTestId('intel-not-prospect-since').textContent).toBe('Not a prospect since Oct 10, 2026; your note: a vendor');
    expect(within(rows[0]).getByTestId('intel-relist').textContent).toBe('List this sender again');
    expect(within(rows[1]).getByTestId('intel-relist').textContent).toBe('List anyone at firecrown.com again');
    expect(screen.getByTestId('intel-not-prospects').textContent).toContain('an opt-out, a suppression or do not contact stays');
    await act(async () => { fireEvent.click(within(rows[1]).getByTestId('intel-relist')); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/gap/decide', expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'domain:firecrown.com', decision: 'relist' }) }));
  });

  it('a panel with no standing mark shows no list', () => {
    render(<IntelPanel intel={{ ...intel, notProspects: [] }} angles={{}} />);
    expect(screen.queryByTestId('intel-not-prospects')).toBeNull();
  });
});
