// @vitest-environment node
/**
 * C6 (seller acceptance, 2026-10-09): a placed inbound message reaches the account story. Production showed the Kenco
 * deal assignment saying "Nothing from the buyer yet on how they run the yards today" and "Last email to Trace Spier,
 * Jul 20. No answer on record" while the people ranker listed Craig Morrison (kencogroup.com) as someone who wrote in,
 * unplaced (the C5 ambiguity): the account story read inbound mail only through email_threads.account_name. Casey's
 * rule 3: retrieve the Gmail conversation before declaring there is no context. Pinned: loadAccountInbound reads the
 * account's threads AND the senders the identity machinery places here (the C5 family and deal tie-break included),
 * merged by message id with `via`; a freemail sender is never placed; a persona elsewhere places elsewhere; an
 * unreadable identity context runs the thread read only and says so; the pursuit state, the touches, the story's
 * between-us row and the Ask coverage carry the placement.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { INBOUND_MAX, loadAccountInbound } from '@/lib/gap/account-intel/load';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import { mergeTouches } from '@/lib/gap/story/touches';
import { coverageFromPage } from '@/lib/gap/ask/context';
import { coverageLineOf } from '@/lib/gap/ask/grounding';
import { dealCoverageFrom } from '@/lib/gap/work/deal-coverage';
import type { IdentityContext } from '@/lib/gap/identity/resolve';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';

const NOW = new Date('2026-10-09T13:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const twoClaim: IdentityContext = { accountsByHubspotCompanyId: new Map([['55608495412', 'Kenco']]), verifiedDomainToAccounts: new Map(), aliasToAccounts: new Map(), accountNames: ['Kenco', 'Kenco Logistics Services', 'PepsiCo'], conflictedDomainToAccounts: new Map([['kencogroup.com', ['Kenco', 'Kenco Logistics Services']]]) };
const summary: InDealsSummary = { status: 'complete', count: 1, openDeals: 1, unresolved: [], checkedAt: '2026-10-09T12:55:00.000Z', accounts: [{ accountName: 'Kenco', alsoRecordedAs: [], dealContacts: 2, people: [], known: 2, deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'presentationscheduled', lastActivityAt: null, closeDate: null, nextStep: 'Reconnect at the end of October', contactIds: ['234991610011'] }] }] };
const coverage = dealCoverageFrom(summary);
const SEP12 = new Date('2026-09-12T14:05:00Z');

function world() {
  return ledgerDb({
    accounts: [{ name: 'Kenco', parent_brand: null, hubspot_company_id: '55608495412' }, { name: 'Kenco Logistics Services', parent_brand: 'Kenco', hubspot_company_id: null }, 'PepsiCo'],
    conflicts: [
      { id: 1, code: 'duplicate_company', status: 'open', account_name: 'Kenco', canonical_company_id: 'cc-kenco', reason: 'Company collides with: Kenco Logistics Services', created_at: new Date('2026-05-05T14:00:00Z') },
      { id: 2, code: 'duplicate_company', status: 'open', account_name: 'Kenco Logistics Services', canonical_company_id: 'cc-kenco', reason: 'Company collides with: Kenco', created_at: new Date('2026-05-05T14:00:00Z') },
    ],
    personas: [{ id: 9, email: 'shanon.weber@kencogroup.com', name: 'Shanon Weber', title: 'Director', account_name: 'Kenco Logistics Services', do_not_contact: false }],
    threads: [{ id: 't1', account_name: null }, { id: 't2', account_name: null }, { id: 't3', account_name: 'Kenco' }, { id: 't4', account_name: 'PepsiCo' }],
    inbound: [
      // The Kenco shape: Craig writes from the family domain; his thread names no account.
      { id: 'm-craig', thread_id: 't1', from_email: CRAIG, from_name: 'Craig Morrison', subject: 'Re: the record', snippet: 'Poking holes in the Primo record now.', body_text: 'Poking holes in the Primo record now.', received_at: SEP12, source: 'gmail', thread: { account_name: null } },
      // A freemail sender: never placed.
      { id: 'm-joe', thread_id: 't2', from_email: 'joe@gmail.com', from_name: 'Joe', subject: 'hello', snippet: 'Hi there', received_at: days(10), source: 'gmail', thread: { account_name: null } },
      // A thread keyed to the account: the read the story already had (also at the family domain: merged once, as thread).
      { id: 'm-dave', thread_id: 't3', from_email: 'dave.kiesling@kencogroup.com', from_name: 'Dave Kiesling', subject: 'Re: yards', snippet: 'Can we talk Thursday?', received_at: days(40), source: 'gmail', thread: { account_name: 'Kenco' } },
      // A persona at the OTHER family account: the persona path places her there, never here.
      { id: 'm-shanon', thread_id: 't2', from_email: 'shanon.weber@kencogroup.com', from_name: 'Shanon Weber', subject: 'Re: dock', snippet: 'Our dock schedule', received_at: days(12), source: 'gmail', thread: { account_name: null } },
      // A thread keyed to ANOTHER account at the family domain: never taken.
      { id: 'm-other', thread_id: 't4', from_email: 'x@kencogroup.com', from_name: 'X', subject: 'Re: pepsi', snippet: 'wrong thread', received_at: days(5), source: 'gmail', thread: { account_name: 'PepsiCo' } },
      // Automated mail at the family domain: left out.
      { id: 'm-auto', thread_id: 't1', from_email: 'noreply@kencogroup.com', from_name: null, subject: 'Automatic reply: out of office', snippet: 'I am away', received_at: days(3), source: 'gmail', thread: { account_name: null } },
      // Older than the window: left out.
      { id: 'm-old', thread_id: 't1', from_email: CRAIG, from_name: 'Craig Morrison', subject: 'old', snippet: 'old words', received_at: days(200), source: 'gmail', thread: { account_name: null } },
    ],
  }, NOW);
}

describe('C6: loadAccountInbound', () => {
  it('the Kenco shape: the thread-keyed read and the placed read merge by message id; Craig is placed through the family deal, Dave stays a thread message, a freemail sender, a persona elsewhere, another account\'s thread, automated mail and old mail are out', async () => {
    const c = world().client();
    const r = await loadAccountInbound(c, { accountName: 'Kenco', now: NOW, identity: twoClaim, coverage });
    expect(r.identityRead).toBe(true);
    expect(r.detail).toBeNull();
    expect(r.messages.map((m) => [m.id, m.via])).toEqual([['m-craig', 'family_deal'], ['m-dave', 'thread']]);
    expect(r.messages[0]).toMatchObject({ from: CRAIG, name: 'Craig Morrison', at: SEP12.toISOString(), subject: 'Re: the record', snippet: 'Poking holes in the Primo record now.', threadId: 't1', domain: 'kencogroup.com' });
    expect(INBOUND_MAX).toBe(50);
  });

  it('no deal distinguishes the family: Craig stays ambiguous and is not placed (the thread read alone); an unreadable identity context runs the thread read only and says so; a client without the inbox gives nothing', async () => {
    const c = world().client();
    const noDeal = await loadAccountInbound(c, { accountName: 'Kenco', now: NOW, identity: twoClaim, coverage: dealCoverageFrom({ ...summary, accounts: [] }) });
    expect(noDeal.messages.map((m) => m.id)).toEqual(['m-dave']);
    const noIdentity = await loadAccountInbound(c, { accountName: 'Kenco', now: NOW, identity: null, coverage });
    expect(noIdentity.messages.map((m) => m.id)).toEqual(['m-dave']);
    expect(noIdentity.identityRead).toBe(false);
    expect(noIdentity.detail).toBe('identity context unreadable: senders could not be placed, only the threads keyed to the account were read');
    expect(await loadAccountInbound({}, { accountName: 'Kenco', now: NOW, identity: twoClaim, coverage })).toEqual({ messages: [], identityRead: true, detail: null });
  });

  it('C7: the synced inbox snippet arrives HTML-escaped; the excerpt and the subject are decoded (named, decimal and hex entities) on the placed read and the thread read alike, so the story quotes the buyer\'s words', async () => {
    const db = world();
    db.store.inboundMessage.push(
      { id: 'm-craig-2', thread_id: 't1', from_email: CRAIG, from_name: 'Craig Morrison', subject: 'Re: Primo &amp; the record', snippet: 'Honestly, I&#39;ve only met him once on video &quot;briefly&quot; &lt;last fall&gt;&nbsp;&#x2019;til now &amp; since', body_text: null, received_at: new Date('2026-09-24T15:00:00Z'), source: 'gmail', thread: { account_name: null } },
      { id: 'm-dave-2', thread_id: 't3', from_email: 'dave.kiesling@kencogroup.com', from_name: 'Dave Kiesling', subject: 'Re: yards', snippet: 'We&#39;re at 40 trailers &amp; counting', body_text: null, received_at: days(30), source: 'gmail', thread: { account_name: 'Kenco' } },
    );
    const r = await loadAccountInbound(db.client(), { accountName: 'Kenco', now: NOW, identity: twoClaim, coverage });
    const craig = r.messages.find((m) => m.id === 'm-craig-2')!;
    expect(craig).toMatchObject({ via: 'family_deal', subject: 'Re: Primo & the record', snippet: "Honestly, I've only met him once on video \"briefly\" <last fall> ’til now & since" });
    expect(r.messages.find((m) => m.id === 'm-dave-2')).toMatchObject({ via: 'thread', snippet: "We're at 40 trailers & counting" });
    // The newest placed message is what the story will quote: no entity reaches it.
    expect(r.messages[0].id).toBe('m-craig-2');
    expect(r.messages.every((m) => !/&(#\d+|#x[0-9a-f]+|quot|amp|lt|gt|nbsp|apos);/i.test(m.snippet)), 'no entity left in any excerpt').toBe(true);
  });

  it('a verified domain places without the family facts (the ordinary case), and a persona at this account places by the record', async () => {
    const c = world().client();
    const verified: IdentityContext = { ...twoClaim, verifiedDomainToAccounts: new Map([['kencogroup.com', ['Kenco']]]), conflictedDomainToAccounts: new Map() };
    const r = await loadAccountInbound(c, { accountName: 'Kenco', now: NOW, identity: verified, coverage: dealCoverageFrom(null) });
    expect(r.messages.map((m) => [m.id, m.via])).toEqual([['m-craig', 'domain'], ['m-dave', 'thread']]);
    const byRecord = await loadAccountInbound(c, { accountName: 'Kenco Logistics Services', now: NOW, personaEmails: ['shanon.weber@kencogroup.com'], identity: { ...twoClaim, conflictedDomainToAccounts: new Map() }, coverage: dealCoverageFrom(null) });
    expect(byRecord.messages.map((m) => [m.id, m.via])).toEqual([['m-shanon', 'persona']]);
  });
});

const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: '55608495412' },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;
const ctx: AccountContext = {
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW),
  history: [{ kind: 'email_sent', at: '2026-07-20T15:00:00.000Z', text: 'Email to trace.spier@kencogroup.com: Yard dwell at Kenco', visibility: 'seller' } as unknown as AccountContext['history'][number]],
  assets: [],
  legacyNote: null,
};

describe('C6: the placed message reaches the pursuit state, the touches, the story and the coverage', () => {
  it('the between-us row says "Craig Morrison (kencogroup.com, placed by the family\'s deal-holding account) wrote Sep 12: ..." as Buyer said, the silence line is gone, the state is REPLIED, and the coverage counts the placed message', () => {
    const inputs = inputsWith({ inbound: { messages: [{ id: 'm-craig', from: CRAIG, name: 'Craig Morrison', at: SEP12.toISOString(), subject: 'Re: the record', snippet: 'Poking holes in the Primo record now.', threadId: 't1', via: 'family_deal', domain: 'kencogroup.com' }], identityRead: true, detail: null } });
    const replies = inputs.inbound!.messages.map((m) => ({ from: m.from, name: m.name, at: m.at, subject: m.subject, snippet: m.snippet, triaged: false, placedVia: m.via }));
    const state = projectPursuitState({ accountName: 'Kenco', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies, lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
    expect(state.state).toBe('replied');
    expect(state.lastInbound).toMatchObject({ who: 'Craig Morrison', from: CRAIG, placedVia: 'family_deal', kind: 'human' });
    const touches = mergeTouches({ history: ctx.history, firstTouches: [], clawd: { read: 'ok', sends: [] }, replies: [{ from: state.lastInbound!.who, at: state.lastInbound!.at, snippet: state.lastInbound!.snippet, kind: state.replyClass!.kind, label: state.replyClass!.label, address: state.lastInbound!.from ?? null, placedVia: state.lastInbound!.placedVia ?? null }], people: [], now: NOW });
    expect(touches.map((t) => [t.kind, t.placedVia ?? null])).toEqual([['reply', 'family_deal'], ['send', null]]);
    const brief = buildAccountBrief(inputs, NOW);
    const v = projectNow(brief, ctx, inputs, NOW);
    const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
    const between = story.rows.find((r) => r.key === 'between_us')!;
    const reply = between.sentences.find((s) => /Craig Morrison/.test(s.text))!;
    expect(reply.text).toBe("Craig Morrison (kencogroup.com, placed by the family's deal-holding account) wrote Sep 12: \"Poking holes in the Primo record now.\". The email it answered is not in GAP's ledgers.");
    expect(reply.tag).toBe('Buyer said');
    expect(between.sentences.map((s) => s.text).join(' ')).not.toMatch(/No answer on record/);
    expect(coverageFromPage(inputs, story, {}).find((c) => c.source === 'gmail_thread')).toEqual({ source: 'gmail_thread', status: 'partial', detail: "GAP's synced inbox, not a live thread read; 1 placed sender message merged" });
    const unread = coverageFromPage(inputsWith({ inbound: { messages: [], identityRead: false, detail: 'identity context unreadable: senders could not be placed, only the threads keyed to the account were read' } }), null, {});
    expect(unread.find((c) => c.source === 'gmail_thread')!.detail).toBe("GAP's synced inbox, not a live thread read; identity context unreadable: senders could not be placed, only the threads keyed to the account were read");
    expect(coverageLineOf(unread)).toContain('identity context unreadable');
  });

  it('a thread-keyed message keeps the old wording ("replied on"), with no placement words', () => {
    const inputs = inputsWith({});
    const state = projectPursuitState({ accountName: 'Kenco', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [{ from: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling', at: days(40).toISOString(), subject: 'Re: yards', snippet: 'Can we talk Thursday?', triaged: false, placedVia: 'thread' }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
    const touches = mergeTouches({ history: [], firstTouches: [], clawd: { read: 'ok', sends: [] }, replies: [{ from: state.lastInbound!.who, at: state.lastInbound!.at, snippet: state.lastInbound!.snippet, kind: state.replyClass!.kind, label: state.replyClass!.label, address: state.lastInbound!.from ?? null, placedVia: 'thread' }], people: [], now: NOW });
    const brief = buildAccountBrief(inputs, NOW);
    const v = projectNow(brief, ctx, inputs, NOW);
    const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
    const text = story.rows.find((r) => r.key === 'between_us')!.sentences.map((s) => s.text).join(' ');
    expect(text).toMatch(/Dave Kiesling replied on /);
    expect(text).not.toMatch(/placed by/);
  });
});
