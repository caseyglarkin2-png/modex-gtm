// @vitest-environment node
/**
 * B1 and B3 (knowledge program, 2026-10-09): our Sent mail on the account story, and the coverage line that reads
 * what it holds. Every assignment said "Gmail Sent (not read on the account page)": Casey wrote Craig and Dave at
 * Kenco in the morning and the story said "No answer on record" with nothing of our note. Pinned: loadAccountSent asks
 * Sent by the account's domains and its outside addresses through the injected reader (the GAP sender; none
 * configured = not read, said), filters Gmail's loose `to:` by the address list, merges by id newest first; a send
 * today after the buyer's Sep 24 reply makes the story say we wrote last and no answer is owed yet; an older send with
 * no later inbound says "No answer on record"; a Sent row and the ledger's record of the same send are one row with
 * the subject; the coverage row is read with its count or not read with the reason; the line carries the Read part
 * from a fixture vault coverage ("synced 10:39, 92 calls"); loadAccountInputs wires both reads through its deps.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { accountAddressesOf, addressesIn, loadAccountSent, sentTargets, SENT_MAX, type SentRow } from '@/lib/gap/account-intel/sent';
import { loadAccountInputs } from '@/lib/gap/account-intel/load';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectStory } from '@/lib/gap/story/story';
import { mergeTouches } from '@/lib/gap/story/touches';
import { askCoverageOf, coverageFromPage } from '@/lib/gap/ask/context';
import { ASK_COVERAGE_WORDS, coverageLineOf, type AskCoverage } from '@/lib/gap/ask/grounding';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import { sellerMailboxSlots } from '@/lib/gap/execution/seller-sent';

const NOW = new Date('2026-10-09T13:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const SENDER = { refreshToken: 'r', userEmail: 'casey@yardflow.ai' } as const;
/** The 2026-10-10 contract: the reader takes the seller's mailbox slots (here the GAP mailbox alone; account-sent-coverage.test.ts pins both). */
const GAP_ONLY = [{ address: 'casey@yardflow.ai', sender: SENDER }];
const at = (iso: string) => new Date(iso);
const row = (id: string, to: string, subject: string, when: string, snippet = ''): SentRow => ({ id, threadId: `t-${id}`, internalDate: at(when), to, subject, snippet });

beforeEach(() => {
  delete process.env.GAP_GMAIL_USER_EMAIL;
});

describe('B1: loadAccountSent', () => {
  it('asks Sent by the account domains and the outside addresses, filters the loose to: match by the address list, merges by id newest first; the To header is parsed for the buyer address', async () => {
    const asked: string[] = [];
    const listSent = async (_sender: unknown, recipient: string) => {
      asked.push(recipient);
      if (recipient === 'kencogroup.com') return [
        row('s1', 'Craig Morrison <craig.morrison@kencogroup.com>', 'Primo and the yards', '2026-10-09T10:00:00Z', 'Craig, two things from the record...'),
        row('s2', 'dave.kiesling@kencogroup.com, casey@yardflow.ai', 'Re: yards', '2026-09-30T10:00:00Z', 'Dave, Thursday works.'),
        // Gmail's to: matched a display name elsewhere: the address list refuses it.
        row('s3', 'Kenco Fan <fan@gmail.com>', 'Hi', '2026-10-01T10:00:00Z'),
      ];
      if (recipient === 'joe.freemail@gmail.com') return [row('s4', 'joe.freemail@gmail.com', 'Hello Joe', '2026-09-28T10:00:00Z'), row('s1', CRAIG, 'Primo and the yards', '2026-10-09T10:00:00Z')];
      return [];
    };
    const r = await loadAccountSent(null, { accountName: 'Kenco', addresses: [CRAIG, 'joe.freemail@gmail.com', 'casey@yardflow.ai'], domains: ['https://www.kencogroup.com/', 'yardflow.ai'], now: NOW, mailboxes: GAP_ONLY, listSent });
    expect(asked).toEqual(['kencogroup.com', 'joe.freemail@gmail.com']);
    expect(r.read, r.detail ?? '').toBe(true);
    expect(r.detail).toBeNull();
    expect(r.messages.map((m) => [m.id, m.to, m.at.slice(0, 10)])).toEqual([['s1', CRAIG, '2026-10-09'], ['s2', 'dave.kiesling@kencogroup.com', '2026-09-30'], ['s4', 'joe.freemail@gmail.com', '2026-09-28']]);
    expect(r.messages[0]).toMatchObject({ subject: 'Primo and the yards', excerpt: 'Craig, two things from the record...', threadId: 't-s1', mailbox: 'casey@yardflow.ai' });
    expect(r.mailboxes).toEqual([{ address: 'casey@yardflow.ai', status: 'read', at: NOW.toISOString(), detail: null }]);
    expect(sentTargets({ domains: ['Kencogroup.com', 'freightroll.com', 'gmail.com', 'not-a-domain'], addresses: ['A@kencogroup.com', 'joe@gmail.com', 'casey@freightroll.com', 'nobody'] })).toEqual({ domains: ['kencogroup.com'], addresses: ['joe@gmail.com'] });
    expect(addressesIn('Craig Morrison <Craig.Morrison@kencogroup.com>; "Dave" <dave@x.com>')).toEqual(['craig.morrison@kencogroup.com', 'dave@x.com']);
    expect(SENT_MAX).toBe(50);
  });

  it('no mailbox configured: not read, said by the mailbox, and the reader is never asked; nothing to look for is read with its note; a failed query is said (with its mailbox) while the rest stands; every query failing is not read; the deadline skips the rest', async () => {
    let asked = 0;
    const listSent = async () => { asked += 1; return []; };
    const none = await loadAccountSent(null, { accountName: 'Kenco', addresses: [CRAIG], domains: ['kencogroup.com'], now: NOW, mailboxes: [{ address: 'the GAP mailbox', sender: null }], listSent });
    expect(none).toEqual({ messages: [], read: false, detail: 'the GAP mailbox: not configured', mailboxes: [{ address: 'the GAP mailbox', status: 'not_configured', at: null, detail: 'not configured' }] });
    expect(asked).toBe(0);
    const nothing = await loadAccountSent(null, { accountName: 'Kenco', addresses: ['casey@yardflow.ai'], domains: [], now: NOW, mailboxes: GAP_ONLY, listSent });
    expect(nothing).toMatchObject({ messages: [], read: true, detail: 'no address or domain on record to look for' });
    const partly = await loadAccountSent(null, { accountName: 'Kenco', addresses: ['joe@gmail.com'], domains: ['kencogroup.com'], now: NOW, mailboxes: GAP_ONLY, listSent: async (_s, q) => { if (q === 'joe@gmail.com') throw new Error('Gmail sent list failed (503)'); return [row('s1', CRAIG, 'Primo', '2026-10-09T10:00:00Z')]; } });
    expect(partly.read).toBe(true);
    expect(partly.messages.map((m) => m.id)).toEqual(['s1']);
    expect(partly.detail).toBe('casey@yardflow.ai: Gmail Sent read failed for 1 of 2 queries (joe@gmail.com: Gmail sent list failed (503))');
    const failed = await loadAccountSent(null, { accountName: 'Kenco', addresses: [], domains: ['kencogroup.com'], now: NOW, mailboxes: GAP_ONLY, listSent: async () => { throw new Error('Gmail sent list failed (401)'); } });
    expect(failed.read).toBe(false);
    expect(failed.detail).toBe('casey@yardflow.ai: Gmail Sent read failed for 1 of 1 query (kencogroup.com: Gmail sent list failed (401))');
    const slow = await loadAccountSent(null, { accountName: 'Kenco', addresses: [], domains: ['kencogroup.com'], now: NOW, mailboxes: GAP_ONLY, timeoutMs: 5, listSent: () => new Promise((resolve) => setTimeout(() => resolve([]), 400)) });
    expect(slow.read).toBe(false);
    expect(slow.detail).toContain('timed out');
    // The window: 180 days back to a minute past now, in epoch seconds.
    let window: number[] = [];
    await loadAccountSent(null, { accountName: 'Kenco', addresses: [], domains: ['kencogroup.com'], now: NOW, mailboxes: GAP_ONLY, listSent: async (_s, _q, after, before) => { window = [after, before]; return []; } });
    expect(window).toEqual([Math.floor((NOW.getTime() - 180 * 86_400_000) / 1000), Math.floor(NOW.getTime() / 1000) + 60]);
  });

  it('accountAddressesOf gathers the GAP contacts, the inbound senders and the first-touch recipients, lowercased, once each', () => {
    expect(accountAddressesOf({ personas: [{ email: 'Craig.Morrison@kencogroup.com' }, { email: null }] as never, firstTouches: [{ recipient: 'dave.kiesling@kencogroup.com' }] as never, inbound: { messages: [{ from: CRAIG }, { from: 'x@kencogroup.com' }], identityRead: true, detail: null } as never })).toEqual([CRAIG, 'x@kencogroup.com', 'dave.kiesling@kencogroup.com']);
  });
});

const state = { accountName: 'Kenco', state: 'in_deal', stateLine: 'In a deal', person: null, blocker: null, unlock: null, coldTouchAllowed: false, chooseAllowed: false, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: '55608495412' },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;
const craigReply = { from: 'Craig Morrison', at: '2026-09-24T15:00:00.000Z', snippet: 'Poking holes in the Primo record now.', kind: 'human' as const, label: 'replied', address: CRAIG };
function betweenUs(inputs: AccountInputs, replies = [craigReply]) {
  const touches = mergeTouches({ history: [], firstTouches: inputs.firstTouches, clawd: { read: 'ok', sends: [] }, replies, people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), sent: inputs.sent ?? null, now: NOW });
  const brief = buildAccountBrief(inputs, NOW);
  const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief, inputs, whyNow: [], know: [], touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
  return { touches, row: story.rows.find((r) => r.key === 'between_us')! };
}
const sentAt = (iso: string, over: Partial<NonNullable<AccountInputs['sent']>['messages'][number]> = {}): AccountInputs['sent'] => ({ read: true, detail: null, messages: [{ id: 's1', to: CRAIG, subject: 'Primo and the yards', at: iso, excerpt: 'Craig, two things from the record.', threadId: 't1', ...over }] });

describe('B1: our Sent on the story', () => {
  it('a send today after the buyer\'s Sep 24 reply: the story says we wrote Craig Morrison today and no answer is owed yet, never "No answer on record"; the reply stays as Buyer said', () => {
    // The real thread: our Sep 20 note, Craig's Sep 24 reply, our note this morning.
    const sent = sentAt('2026-10-09T10:00:00.000Z');
    sent!.messages.push({ id: 's0', to: CRAIG, subject: 'The record', at: '2026-09-20T10:00:00.000Z', excerpt: 'Craig, here is the record.', threadId: 't1' });
    const { touches, row } = betweenUs(inputsWith({ sent }));
    expect(touches[0]).toMatchObject({ kind: 'send', source: 'Gmail Sent', name: 'Craig Morrison', title: 'VP Operations', address: CRAIG, what: 'Primo and the yards', excerpt: 'Craig, two things from the record.' });
    const texts = row.sentences.map((s) => s.text);
    // The walk fix (2026-10-10): our Oct 9 note followed Craig's Sep 24 reply, so it is his answer, said ONCE with his
    // words ("they wrote; we answered"), never "We wrote" beside "replied" for the same exchange.
    expect(texts[0], texts.join(' | ')).toBe('Craig Morrison, VP Operations wrote Sep 24: "Poking holes in the Primo record now."; we answered Oct 9: "Primo and the yards". No answer owed yet.');
    expect(row.sentences[0].tag).toBe('Buyer said');
    expect(row.sentences[0].basis).toBe('GAP ledger, Sep 24; Gmail Sent, Oct 9');
    expect(texts.join(' ')).not.toContain('No answer on record');
    expect(texts[1]).toBe('2 emails to 1 person since Sep 2026.');
    // A reply with no send of ours before it on any record is still said as answering an email the ledgers lack.
    const { row: orphan } = betweenUs(inputsWith({ sent: sentAt('2026-10-09T10:00:00.000Z') }));
    expect(orphan.sentences[0].text).toBe('Craig Morrison, VP Operations wrote Sep 24: "Poking holes in the Primo record now."; we answered Oct 9: "Primo and the yards". No answer owed yet. The email it answered is not in GAP\'s ledgers.');
  });

  it('an older send with no later inbound says "No answer on record" from OUR last send; a send the buyer answered carries no silence; without a Sent read the ledgers keep "Last email to"', () => {
    // The walk fix: the Sep 28 send followed Craig's Sep 24 reply, so it is said as his answer, with the silence since.
    const { row: silent } = betweenUs(inputsWith({ sent: sentAt('2026-09-28T10:00:00.000Z') }));
    expect(silent.sentences[0].text).toBe('Craig Morrison, VP Operations wrote Sep 24: "Poking holes in the Primo record now."; we answered Sep 28: "Primo and the yards". No answer on record. The email it answered is not in GAP\'s ledgers.');
    expect(silent.sentences[0].basis).toBe('GAP ledger, Sep 24; Gmail Sent, Sep 28');
    // With no reply of theirs, the silence is said from our last send, as before.
    const { row: alone } = betweenUs(inputsWith({ sent: sentAt('2026-09-28T10:00:00.000Z') }), []);
    expect(alone.sentences[0].text).toBe('We wrote Craig Morrison, VP Operations on Sep 28: "Primo and the yards". No answer on record.');
    expect(alone.sentences[0].basis).toBe('Gmail Sent, Sep 28; GAP, clawd and the account history for the silence');
    const { row: answered } = betweenUs(inputsWith({ sent: sentAt('2026-09-20T10:00:00.000Z') }));
    expect(answered.sentences[0].text).toBe('We wrote Craig Morrison, VP Operations on Sep 20: "Primo and the yards".');
    expect(answered.sentences.map((s) => s.text).join(' ')).not.toContain('No answer');
    const { row: ledger } = betweenUs(inputsWith({ firstTouches: [{ recipient: CRAIG, sentAt: '2026-09-28T10:00:00.000Z', state: 'sent', personaId: 1 }] }), []);
    expect(ledger.sentences[0].text).toBe('Last email to Craig Morrison, VP Operations, Sep 28 (a GAP first touch). No answer on record.');
  });

  it('the ledger\'s record and the Sent row of the same send are one row, with the subject; two sends count once each', () => {
    const { touches, row } = betweenUs(inputsWith({ firstTouches: [{ recipient: CRAIG, sentAt: '2026-10-09T10:00:20.000Z', state: 'sent', personaId: 1 }], sent: { read: true, detail: null, messages: [{ id: 's1', to: CRAIG, subject: 'Primo and the yards', at: '2026-10-09T10:00:05.000Z', excerpt: '', threadId: 't1' }, { id: 's0', to: 'dave.kiesling@kencogroup.com', subject: 'Re: yards', at: '2026-09-30T10:00:00.000Z', excerpt: '', threadId: 't0' }] } }));
    expect(touches.filter((t) => t.kind === 'send').map((t) => [t.name, t.what, t.source])).toEqual([['Craig Morrison', 'Primo and the yards', 'Gmail Sent'], ['Dave Kiesling', 'Re: yards', 'Gmail Sent']]);
    expect(row.sentences.map((s) => s.text)).toContain('2 emails to 2 people since Sep 2026.');
    expect(row.sentences.find((s) => /2 emails/.test(s.text))!.basis).toBe('Gmail Sent');
  });
});

describe('B1/B3: the coverage reads what it holds', () => {
  it('gmail_sent is read with its count, partly read with the detail, not read with the reason; no sender says so; no read says not read this time', () => {
    const read = coverageFromPage(inputsWith({ sent: sentAt('2026-10-09T10:00:00.000Z') }), null, { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai' });
    expect(read.find((c) => c.source === 'gmail_sent')).toEqual({ source: 'gmail_sent', status: 'read', detail: '1 message' });
    expect(coverageLineOf(read)).toBe("Not read this time: HubSpot engagements (not read this time), Gmail drafts (Gmail drafts not read), the vault (not configured), Clawd (not configured). Partly read: the Gmail thread (GAP's synced inbox, not a live thread read). Read: Gmail Sent (1 message)");
    const partly = coverageFromPage(inputsWith({ sent: { ...sentAt('2026-10-09T10:00:00.000Z')!, detail: '1 query skipped at the deadline' } }), null, {});
    expect(partly.find((c) => c.source === 'gmail_sent')).toEqual({ source: 'gmail_sent', status: 'partial', detail: '1 message; 1 query skipped at the deadline' });
    const unread = coverageFromPage(inputsWith({ sent: { messages: [], read: false, detail: 'no GAP sender configured' } }), null, {});
    expect(unread.find((c) => c.source === 'gmail_sent')).toEqual({ source: 'gmail_sent', status: 'not_read', detail: 'no GAP sender configured' });
    const none = coverageFromPage(inputsWith({}), null, { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai' });
    expect(none.find((c) => c.source === 'gmail_sent')).toEqual({ source: 'gmail_sent', status: 'not_read', detail: 'not read this time' });
    expect(coverageFromPage(inputsWith({}), null, {}).find((c) => c.source === 'gmail_sent')!.detail).toBe('no GAP sender configured');
    expect(Object.keys(ASK_COVERAGE_WORDS)).toEqual(['hubspot', 'hubspot_engagements', 'gmail_thread', 'gmail_sent', 'gmail_drafts', 'vault', 'clawd', 'signals']);
  });

  it('B3: the line names what was read with what it held; the vault row reads the retrieval\'s coverage (a fixture until the table adapter lands): the adapter\'s summary on the seller\'s clock, else synced time and count, partial with its reason, unreachable as failed, not configured as not read', () => {
    const base = { opportunity: { status: 'ACTIVE', detail: '', deals: [] } as AccountInputs['opportunity'], vaultNote: false, vaultConfigured: true, clawdConfigured: true, clawdFailed: false, senderConfigured: true, draftsOnRecord: 0, sent: { read: true, count: 3, detail: null }, engagements: { read: true, count: 7, detail: null } };
    // 14:39Z is 10:39 on the seller's clock (America/New_York, daylight time).
    const full = askCoverageOf({ ...base, vault: { configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-08', indexedAt: '2026-10-09T14:39:00.000Z', omittedReason: null, count: 92, countWord: 'call' } });
    expect(full.find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'read', detail: 'synced 10:39 New York, 92 calls' });
    // Builder A's adapter writes the row's summary: it is what the line says, its instant on the seller's clock.
    const summarised = askCoverageOf({ ...base, vault: { configured: true, reachable: true, completeness: 'complete', summary: 'synced 2026-10-09T14:39Z, 92 calls, 78 account notes' } });
    expect(summarised.find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'read', detail: 'synced 10:39 New York, 92 calls, 78 account notes' });
    expect(coverageLineOf(summarised)).toContain('Read: HubSpot engagements (7), Gmail Sent (3 messages), the vault (synced 10:39 New York, 92 calls, 78 account notes)');
    expect(askCoverageOf({ ...base, vault: { configured: true, reachable: true, completeness: 'partial', summary: 'synced 2026-10-09T14:39:00.000Z, 4 calls', omittedReason: 'the note links to 2 pages not followed' } }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'partial', detail: 'synced 10:39 New York, 4 calls; the note links to 2 pages not followed' });
    expect(coverageLineOf(full)).toBe("Not read this time: Gmail drafts (Gmail drafts not read). Partly read: the Gmail thread (GAP's synced inbox, not a live thread read). Read: HubSpot engagements (7), Gmail Sent (3 messages), the vault (synced 10:39 New York, 92 calls)");
    const fixture: AskCoverage[] = [
      { source: 'vault', status: 'read', detail: 'synced 10:39 New York, 92 calls, 78 account notes' },
      { source: 'gmail_sent', status: 'read', detail: '3 messages' },
      { source: 'hubspot_engagements', status: 'read', detail: '7' },
      { source: 'gmail_drafts', status: 'not_read', detail: 'Gmail drafts not read' },
      { source: 'hubspot', status: 'read', detail: null },
    ];
    expect(coverageLineOf(fixture)).toBe('Not read this time: Gmail drafts (Gmail drafts not read). Read: the vault (synced 10:39 New York, 92 calls, 78 account notes), Gmail Sent (3 messages), HubSpot engagements (7)');
    expect(coverageLineOf([{ source: 'hubspot', status: 'read', detail: null }]), 'a read source with nothing to say is no line').toBeNull();
    expect(askCoverageOf({ ...base, vault: { configured: true, reachable: true, completeness: 'partial', indexedAt: '2026-10-09T14:39:00.000Z', omittedReason: 'the note links to 2 pages not followed', count: 4, countWord: 'claim' } }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'partial', detail: 'synced 10:39 New York, 4 claims; the note links to 2 pages not followed' });
    expect(askCoverageOf({ ...base, vault: { configured: true, reachable: false, omittedReason: 'vault unreadable: ENOENT' } }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'failed', detail: 'vault unreadable: ENOENT' });
    expect(askCoverageOf({ ...base, vault: { configured: false } }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'not_read', detail: 'not configured' });
    // Without the retrieval's row the vault keeps the configuration check and the story's note row.
    expect(askCoverageOf({ ...base, vaultConfigured: false }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'not_read', detail: 'not configured' });
    expect(askCoverageOf({ ...base, vaultNote: true }).find((c) => c.source === 'vault')).toEqual({ source: 'vault', status: 'read', detail: null });
    expect(coverageFromPage(inputsWith({}), null, {}, { vault: { configured: true, reachable: true, completeness: 'complete', indexedAt: '2026-10-09T14:39:00.000Z', count: 92, countWord: 'call' } }).find((c) => c.source === 'vault')!.detail).toBe('synced 10:39 New York, 92 calls');
  });
});

describe('B1/B2: loadAccountInputs carries both reads', () => {
  function fake() {
    const empty = { findMany: async () => [], findUnique: async () => null, findFirst: async () => null, count: async () => 0 };
    const own = {
      $queryRaw: async () => [{ name: 'Kenco' }],
      account: { findUnique: async () => ({ name: 'Kenco', tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: '55608495412', updated_at: NOW }), findMany: async () => [] },
      persona: { ...empty, findMany: async () => [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, do_not_contact: false, updated_at: NOW, hubspot_contact_id: null }] },
    };
    return new Proxy(own, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'string' && !k.startsWith('$') && k !== 'then' ? empty : undefined) }) as never;
  }

  it('the Sent read gets the account name, the known addresses, the domains and the seller mailboxes from the canonical reader (configured or not); the engagements read gets the linked company id; lean reads neither', async () => {
    const seen: { sent: unknown[]; engagements: unknown[] } = { sent: [], engagements: [] };
    const deps = {
      sent: async (args: { accountName: string; addresses: readonly string[]; domains: readonly string[]; mailboxes: unknown }) => { seen.sent.push(args); return sentAt('2026-10-09T10:00:00.000Z'); },
      engagements: async (companyId: string) => { seen.engagements.push(companyId); return { items: [], read: true, detail: null }; },
    };
    const i = await loadAccountInputs(fake(), 'Kenco', NOW, { deps });
    expect(i?.sent?.messages.map((m) => m.id)).toEqual(['s1']);
    expect(i?.engagements).toEqual({ items: [], read: true, detail: null });
    expect(seen.sent[0]).toMatchObject({ accountName: 'Kenco', addresses: [CRAIG], mailboxes: sellerMailboxSlots() });
    expect(seen.engagements).toEqual(['55608495412']);
    const lean = await loadAccountInputs(fake(), 'Kenco', NOW, { deps, lean: true });
    expect(lean?.sent ?? null).toBeNull();
    expect(lean?.engagements ?? null).toBeNull();
    // Not live and no deps: neither is read (null, never an invented empty).
    const plain = await loadAccountInputs(fake(), 'Kenco', NOW, {});
    expect(plain?.sent ?? null).toBeNull();
    expect(plain?.engagements ?? null).toBeNull();
  });
});
