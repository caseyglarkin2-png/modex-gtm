// @vitest-environment node
/**
 * I01 (GAP OS prospecting first, 2026-10-08): the intelligence reader. Casey's course correction, pinned: an older
 * signal is shown with its date and labelled a historical observation, never dropped for its age; a Pounce trigger at a
 * company that is not a GAP account is shown as intelligence with "no account yet"; a person who wrote in and went
 * quiet is a prospect to reengage; Casey's own shares lead; an item he decided is out (a skip comes back after 30
 * days); automated senders, own domains and people at accounts in an open deal are out; the totals say how deep the
 * selection was cut.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { INTEL_LIMIT, PROSPECT_DECISION, SKIP_DAYS, loadIntelligence, rankPeople, rankSignals, rankTriggers, truthOfSignal } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-08T16:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
let site = 0;
// Each fixture signal is its own event (a distinct site number is a distinct mark for C30); a test that wants two reports of one event sets the title.
const sig = (over: Record<string, unknown>) => ({ id: 's', url: 'https://news.example/x', title: `A story at site ${++site}`, source_name: 'news.example', source_class: 'news', published_at: days(3), created_at: days(1), origin: 'discovery', account_name: 'Kenco', account_hint: null, resolution: 'resolved', research_status: 'none', relevance: 'account_context', categories: [], score: 0, event_id: null, feedback: null, feedback_at: null, note: null, ...over });

describe('I01: signals, no age gate', () => {
  it('an older signal is shown as a historical observation with its date; a recent one is an unverified present-day status; a verified fact and a contradiction say so', () => {
    const items = rankSignals([
      sig({ id: 'old', title: 'Kenco opens new innovation lab for warehouse automation testing', published_at: new Date('2026-06-24T12:00:00Z'), relevance: 'outreach_evidence_candidate', score: 6, categories: ['digital_ops'] }),
      sig({ id: 'new', title: 'Kenco expands its Chattanooga testing facility to 30,000 square feet', published_at: days(2), relevance: 'outreach_evidence_candidate', score: 6, categories: ['network_capex'] }),
      sig({ id: 'fact', research_status: 'fact_found', relevance: 'outreach_evidence_candidate', score: 5 }),
      sig({ id: 'contra', research_status: 'contradiction', relevance: 'risk', score: 3 }),
    ], NOW);
    const old = items.find((i) => i.id === 'old')!;
    expect(old).toMatchObject({ kind: 'signal', truth: 'historical_observation', accountName: 'Kenco', key: 'signal:old' });
    expect(old.line).toBe('news.example, published Jun 24, 2026. Historical observation. Themes: digital ops.');
    expect(items.find((i) => i.id === 'new')!.truth).toBe('unverified_status');
    expect(items.find((i) => i.id === 'fact')!.truth).toBe('verified_fact');
    expect(items.find((i) => i.id === 'contra')!.truth).toBe('contradicted');
    expect(items).toHaveLength(4);
  });

  it('Casey\'s shares lead, then outreach candidates, leadership and risk by score, then leads and context with a theme; one item per event; a decided signal is out and a skip comes back after 30 days', () => {
    const items = rankSignals([
      sig({ id: 'ctx', relevance: 'account_context', categories: ['freight'], score: 2 }),
      sig({ id: 'lead', relevance: 'research_lead', score: 4 }),
      sig({ id: 'cand', relevance: 'outreach_evidence_candidate', score: 6 }),
      sig({ id: 'share', origin: 'casey_share', relevance: 'account_context', score: 0 }),
      sig({ id: 'twin', relevance: 'outreach_evidence_candidate', score: 6, event_id: 'cand' }),
      sig({ id: 'decided', feedback: 'use' }),
      sig({ id: 'skipped-fresh', feedback: 'skip', feedback_at: days(3) }),
      sig({ id: 'skipped-old', feedback: 'skip', feedback_at: days(SKIP_DAYS + 1), relevance: 'risk', score: 1 }),
      sig({ id: 'rejected', resolution: 'rejected' }),
    ], NOW);
    expect(items.map((i) => i.id)).toEqual(['share', 'cand', 'skipped-old', 'lead', 'ctx']);
    expect(items[0].line).toMatch(/^You shared it\./);
  });

  it('truthOfSignal: the 45-day line labels, it never excludes', () => {
    expect(truthOfSignal({ research_status: 'none', published_at: days(100), created_at: days(1) }, NOW)).toBe('historical_observation');
    expect(truthOfSignal({ research_status: 'none', published_at: null, created_at: days(1) }, NOW)).toBe('unverified_status');
  });
});

describe('I01: triggers, with or without an account', () => {
  it('a trigger at a company that is not a GAP account is intelligence with no account yet; a matched one names the account; dismissed and decided ones are out', () => {
    const rows = [
      { id: 1, account_name: 'Tractor Supply Company', title: 'Tractor Supply opens Idaho distribution center with automation', url: 'https://x/1', source: 'chainstoreage.com', score: 7, categories: ['network_capex'], published_at: days(1), first_seen_at: days(1), dismissed: false },
      { id: 2, account_name: 'pepsico', title: 'PEP 10-Q mentions: capital expenditure', url: 'https://x/2', source: 'EDGAR', score: 3, categories: [], published_at: null, first_seen_at: days(2), dismissed: false },
      { id: 3, account_name: 'Costco Wholesale', title: 'COST 10-K', url: 'https://x/3', source: 'EDGAR', score: 3, categories: [], published_at: null, first_seen_at: days(3), dismissed: true },
      { id: 4, account_name: 'Daimler Truck North America', title: 'Daimler bets on owning the autonomous truck system', url: 'https://x/4', source: 'FreightWaves', score: 5, categories: ['autonomy'], published_at: new Date('2026-10-01T00:00:00Z'), first_seen_at: days(7), dismissed: false },
    ];
    const items = rankTriggers(rows, new Set(['PepsiCo']), new Set(['trigger:4']), NOW);
    expect(items.map((i) => i.id)).toEqual(['1', '2']);
    expect(items[0]).toMatchObject({ kind: 'trigger', key: 'trigger:1', accountName: null, accountHint: 'Tractor Supply Company', truth: 'unverified_status' });
    expect(items[0].line).toContain('Tractor Supply Company is not a GAP account yet.');
    expect(items[1]).toMatchObject({ accountName: 'PepsiCo', accountHint: null });
  });
});

describe('I01: people who wrote in and went quiet', () => {
  it('a quiet writer is a prospect to reengage with the account the thread or the persona names; recent writers, noise senders, own domains, decided, unsubscribed, do-not-contact and in-deal people are out', () => {
    const rows = [
      { from_email: 'Dave.Kiesling@kencogroup.com', from_name: 'Dave Kiesling', subject: 'Re: yards at Chattanooga', received_at: days(22), thread_account: 'Kenco' },
      { from_email: 'dave.kiesling@kencogroup.com', from_name: 'Dave Kiesling', subject: 'Re: intro', received_at: days(40), thread_account: null },
      { from_email: 'ivanildo.andres@mdlz.com', from_name: null, subject: 'Thanks', received_at: days(24), thread_account: null },
      { from_email: 'recent@acme.example', from_name: 'Pat', subject: 'Hi', received_at: days(3), thread_account: 'Acme' },
      { from_email: 'rewards@infomail.bestwestern.com', from_name: null, subject: 'Points', received_at: days(30), thread_account: null },
      { from_email: 'colleague@yardflow.ai', from_name: null, subject: 'Hi', received_at: days(30), thread_account: null },
      { from_email: 'ooo@acme.example', from_name: null, subject: 'Automatic reply: out of office', received_at: days(30), thread_account: null },
      { from_email: 'gone@acme.example', from_name: null, subject: 'Hi', received_at: days(30), thread_account: 'Acme' },
      { from_email: 'dnc@acme.example', from_name: null, subject: 'Hi', received_at: days(30), thread_account: 'Acme' },
      { from_email: 'deal@kroger.example', from_name: null, subject: 'Hi', received_at: days(30), thread_account: 'Kroger' },
      { from_email: 'decided@acme.example', from_name: null, subject: 'Hi', received_at: days(30), thread_account: 'Acme' },
    ];
    const personas = [{ id: 1, email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', account_name: 'Kenco' }, { id: 2, email: 'dnc@acme.example', name: 'D', title: null, account_name: 'Acme', do_not_contact: true }];
    const items = rankPeople(rows, personas, { now: NOW, decided: new Set(['person:decided@acme.example']), dealAccounts: new Set(['Kroger']), unsubscribed: new Set(['gone@acme.example']) });
    // I05: the person at an account in an open deal is shown and labelled, never dropped; with no deal state read the line says so.
    expect(items.map((i) => i.id)).toEqual(['dave.kiesling@kencogroup.com', 'ivanildo.andres@mdlz.com', 'deal@kroger.example']);
    expect(items[2]).toMatchObject({ inDeal: true, accountName: 'Kroger' });
    expect(items[2].line).toContain('their account is in an open deal: work it from the deal');
    // C04: no complete CRM read is UNKNOWN, never a negative.
    const unread = rankPeople(rows.slice(0, 1), personas, { now: NOW, decided: new Set(), dealAccounts: null, unsubscribed: new Set() })[0];
    expect(unread.line).toContain('open deal unknown');
    expect(unread.line).not.toMatch(/no live opportunity|no open deal found/);
    expect(unread.opportunity).toBe('unknown');
    expect(items[0]).toMatchObject({ kind: 'person', key: 'person:dave.kiesling@kencogroup.com', title: 'Dave Kiesling, VP Operations at Kenco', accountName: 'Kenco', truth: 'historical_observation', person: { messages: 2, name: 'Dave Kiesling' } });
    expect(items[0].line).toMatch(/^Wrote to us Sep 16, 2026 \(2 messages\), last about "Re: yards at Chattanooga"; no open deal found\. Previously contacted/);
    expect(items[1]).toMatchObject({ accountName: null, accountHint: 'mdlz.com' });
    expect(items[1].line).toContain('not a GAP contact yet');
  });
});

describe('I01: the loader', () => {
  it('reads the three sources from the database, applies the decisions on record, and says the totals; a client without the tables answers empty', async () => {
    const db = ledgerDb({
      accounts: ['PepsiCo', 'Kenco'],
      personas: [{ id: 1, email: 'dave@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', account_name: 'Kenco', do_not_contact: false }],
      signals: [sig({ id: 'a', relevance: 'outreach_evidence_candidate', score: 6 }), sig({ id: 'b', feedback: 'ignored' })],
      triggers: [{ id: 7, account_name: 'Tractor Supply Company', title: 'Idaho DC with automation', url: 'https://x/7', source: 'chainstoreage.com', score: 7, categories: [], published_at: days(1), first_seen_at: days(1), dismissed: false }, { id: 8, account_name: 'pepsico', title: 'PEP 10-Q', url: 'https://x/8', source: 'EDGAR', score: 1, categories: [], published_at: null, first_seen_at: days(2), dismissed: false }],
      inbound: [{ id: 'm1', thread_id: 't1', from_email: 'dave@kencogroup.com', from_name: 'Dave', subject: 'Re: yards', received_at: days(20), source: 'gmail', thread: { account_name: 'Kenco' } }],
      audit: [{ id: 'd1', kind: PROSPECT_DECISION, subject_type: 'prospect', subject_id: 'trigger:8', actor: 'casey', created_at: days(1), payload: { decision: 'dismiss' } }],
    }, NOW);
    const x = await loadIntelligence(db.client(), { now: NOW });
    expect(x.signals.map((i) => i.id)).toEqual(['a']);
    expect(x.triggers.map((i) => i.id)).toEqual(['7']);
    expect(x.triggers[0].accountHint).toBe('Tractor Supply Company');
    expect(x.people.map((i) => i.id)).toEqual(['dave@kencogroup.com']);
    // Intelligence wiring (2026-10-09): the producers' imported records are counted apart (none here).
    expect(x.totals).toEqual({ signals: 1, triggers: 1, people: 1, reports: 0, knowledge: 0 });
    expect(x.pursued).toEqual([]);
    expect(INTEL_LIMIT).toBeGreaterThanOrEqual(8);
    expect(await loadIntelligence({}, { now: NOW })).toMatchObject({ signals: [], triggers: [], people: [], pursued: [], totals: { signals: 0, triggers: 0, people: 0 }, selection: { moreSignals: false, morePeople: false } });
  });
});

describe('I05: the signal pulls are by class, never a newest-first window; the total counts the universe', () => {
  it('a Casey share and an outreach candidate older than hundreds of newer context items still enter the selection; the total is the count', async () => {
    const filler = Array.from({ length: 250 }, (_, k) => sig({ id: `ctx-${k}`, relevance: 'account_context', created_at: new Date(NOW.getTime() - k * 60_000), published_at: new Date(NOW.getTime() - k * 60_000), score: 0 }));
    const db = ledgerDb({ accounts: ['Kenco'], signals: [...filler, sig({ id: 'share-old', origin: 'casey_share', created_at: days(120), published_at: days(120), score: 0 }), sig({ id: 'cand-old', relevance: 'outreach_evidence_candidate', score: 6, created_at: days(90), published_at: days(90) })] }, NOW);
    const x = await loadIntelligence(db.client(), { now: NOW, limit: 3 });
    expect(x.signals.map((i) => i.id)).toEqual(['share-old', 'cand-old', expect.stringMatching(/^ctx-/)]);
    expect(x.totals.signals).toBe(252);
  });
});
