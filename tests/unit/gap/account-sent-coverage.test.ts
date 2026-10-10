// @vitest-environment node
/**
 * ACCOUNT SENT COVERAGE (Casey, 2026-10-10, verbatim): "Fix the account page's Sent coverage. Reuse the canonical
 * authorized mailbox/history reader rather than a separate GAP-mailbox-only implementation. Respect sender identity and
 * mailbox boundaries. Show which sources were read and when; missing access means unknown, never 'nothing sent.' Ensure
 * assignment emails and the account page agree about the same conversation."
 *
 * Pinned: the account page's Sent (account-intel/sent.ts) reads every seller mailbox through the canonical reader
 * (execution/seller-sent.ts: casey@yardflow.ai, casey@freightroll.com), each row carrying its mailbox; each mailbox says
 * whether it was read and when; one not configured or failing makes the read unknown with the mailbox named, and the
 * coverage line and the story say so ("Gmail Sent (casey@yardflow.ai read 14:02; casey@freightroll.com not read: not
 * configured)"), never "nothing sent"; one Sent row set fed to the account page's story and to the assignment's
 * relationship gives the same "we wrote <date>" fact (the GAP mailbox alone, the defect, does not).
 */
import { describe, expect, it } from 'vitest';
import { loadAccountSent } from '@/lib/gap/account-intel/sent';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectStory } from '@/lib/gap/story/story';
import { mergeTouches } from '@/lib/gap/story/touches';
import { askCoverageOf } from '@/lib/gap/ask/context';
import { compactContext, coverageLineOf } from '@/lib/gap/ask/grounding';
import { sellerMailboxes, sellerMailboxSlots, unionListSent, type SellerSentRow } from '@/lib/gap/execution/seller-sent';
import { relationshipStateFor } from '@/lib/gap/work/relationship-state';
import { storyWroteOn } from '@/lib/gap/work/assignment-packet';
import type { GmailSender } from '@/lib/email/gmail-sender';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import { ledgerDb } from './fixtures/ledger-db';

// 18:02Z is 14:02 on the seller's clock (America/New_York, daylight time).
const NOW = new Date('2026-10-10T18:02:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const BOTH = { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token', GOOGLE_REFRESH_TOKEN: 'env-token' };
const GAP_ONLY = { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token' };
/** Casey's note of Oct 9 went from casey@freightroll.com; the Sep 20 one from the GAP mailbox. */
const FROM_FREIGHTROLL: SellerSentRow = { id: 'fr-1', threadId: 't-1', internalDate: new Date('2026-10-09T15:30:00Z'), to: `Craig Morrison <${CRAIG}>`, subject: 'Primo and the yards', snippet: 'Craig, two things from the record.' };
const FROM_YARDFLOW: SellerSentRow = { id: 'yf-1', threadId: 't-0', internalDate: new Date('2026-09-20T14:00:00Z'), to: CRAIG, subject: 'The record', snippet: 'Craig, here is the record.' };
/** One Sent row set: each mailbox holds its own rows; a query by domain or by address finds them. */
const reader = async (s: GmailSender, recipient: string): Promise<SellerSentRow[]> => (s.userEmail === 'casey@freightroll.com' ? [FROM_FREIGHTROLL] : [FROM_YARDFLOW]).filter((r) => r.to.toLowerCase().includes(recipient.toLowerCase()));
const failingFreightroll = async (s: GmailSender, recipient: string): Promise<SellerSentRow[]> => { if (s.userEmail === 'casey@freightroll.com') throw new Error('Gmail sent list failed (403)'); return reader(s, recipient); };
const readSent = (env: Record<string, string>, listSent = reader) => loadAccountSent(null, { accountName: 'Kenco', addresses: [CRAIG], domains: ['kencogroup.com'], now: NOW, mailboxes: sellerMailboxSlots(env), listSent });

const state = { accountName: 'Kenco', state: 'in_deal', stateLine: 'In a deal', person: null, blocker: null, unlock: null, coldTouchAllowed: false, chooseAllowed: false, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: null },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;
function storyRow(inputs: AccountInputs) {
  const touches = mergeTouches({ history: [], firstTouches: inputs.firstTouches, clawd: { read: 'ok', sends: [] }, replies: [], people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), sent: inputs.sent ?? null, now: NOW });
  const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief: buildAccountBrief(inputs, NOW), inputs, whyNow: [], know: [], touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
  return story.rows.find((r) => r.key === 'between_us')!;
}
const sentRow = (sent: NonNullable<AccountInputs['sent']>) => askCoverageOf({ opportunity: null, vaultNote: false, vaultConfigured: false, clawdConfigured: false, clawdFailed: false, senderConfigured: true, draftsOnRecord: 0, sent: { read: sent.read, count: sent.messages.length, detail: sent.detail, mailboxes: sent.mailboxes } }).find((c) => c.source === 'gmail_sent')!;

describe('the account page reads every seller mailbox through the canonical reader', () => {
  it('both mailboxes: every query asked of each, every row carrying the mailbox it came from, each mailbox read and when; the coverage names both with the time', async () => {
    const asked: string[] = [];
    const sent = await readSent(BOTH, async (s, r) => { asked.push(`${s.userEmail} ${r}`); return reader(s, r); });
    expect(asked.sort()).toEqual(['casey@freightroll.com kencogroup.com', 'casey@yardflow.ai kencogroup.com']);
    expect(sent.read).toBe(true);
    expect(sent.detail).toBeNull();
    expect(sent.messages.map((m) => [m.id, m.mailbox])).toEqual([['fr-1', 'casey@freightroll.com'], ['yf-1', 'casey@yardflow.ai']]);
    expect(sent.mailboxes).toEqual([{ address: 'casey@yardflow.ai', status: 'read', at: NOW.toISOString(), detail: null }, { address: 'casey@freightroll.com', status: 'read', at: NOW.toISOString(), detail: null }]);
    expect(sentRow(sent)).toEqual({ source: 'gmail_sent', status: 'read', detail: '2 messages; casey@yardflow.ai read 14:02; casey@freightroll.com read 14:02' });
  });

  it('casey@freightroll.com not configured: unknown with the mailbox named; what the GAP mailbox read stands; the coverage line keeps our addresses and says partly read, never nothing sent', async () => {
    const sent = await readSent(GAP_ONLY);
    expect(sent.read).toBe(false);
    expect(sent.detail).toBe('casey@freightroll.com: not configured');
    expect(sent.messages.map((m) => [m.id, m.mailbox])).toEqual([['yf-1', 'casey@yardflow.ai']]);
    const row = sentRow(sent);
    expect(row).toEqual({ source: 'gmail_sent', status: 'partial', detail: '1 message; casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured' });
    const ctx = compactContext({ accountName: 'Kenco', state, nextText: 'x', story: null, anchor: null, stack: null, coverage: [row] });
    expect(ctx.coverageLine).toBe('Partly read: Gmail Sent (1 message; casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured)');
    expect(coverageLineOf(ctx.coverage!)).not.toMatch(/their address/);
    // Nothing found in the mailbox that was read: the line says what was read and what was not, never a count of none alone.
    const none = await loadAccountSent(null, { accountName: 'Kenco', addresses: ['nobody@elsewhere.example'], domains: ['elsewhere.example'], now: NOW, mailboxes: sellerMailboxSlots(GAP_ONLY), listSent: reader });
    expect(sentRow(none).detail).toBe('casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured');
  });

  it('casey@freightroll.com failing: that mailbox is not read, with its reason; the read is unknown, never half said as read', async () => {
    const sent = await readSent(BOTH, failingFreightroll);
    expect(sent.read).toBe(false);
    expect(sent.detail).toBe('casey@freightroll.com: Gmail Sent read failed for 1 of 1 query (kencogroup.com: Gmail sent list failed (403))');
    expect(sent.mailboxes?.map((m) => [m.address, m.status])).toEqual([['casey@yardflow.ai', 'read'], ['casey@freightroll.com', 'failed']]);
    expect(sentRow(sent).detail).toBe('1 message; casey@yardflow.ai read 14:02; casey@freightroll.com not read: Gmail Sent read failed for 1 of 1 query (kencogroup.com: Gmail sent list failed (403))');
  });

  it('the story says what was not read: with no touch, whether we wrote is unknown (never "No touch on record"); with touches, the unread mailbox is said after them', async () => {
    const empty = await loadAccountSent(null, { accountName: 'Kenco', addresses: ['nobody@elsewhere.example'], domains: ['elsewhere.example'], now: NOW, mailboxes: sellerMailboxSlots(GAP_ONLY), listSent: reader });
    const quiet = storyRow(inputsWith({ sent: empty }));
    expect(quiet.sentences.map((s) => [s.text, s.tag])).toEqual([["No touch in GAP's own records; whether we wrote is not known: Gmail Sent (casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured).", 'Unknown']]);
    const withTouch = storyRow(inputsWith({ sent: await readSent(GAP_ONLY) }));
    const texts = withTouch.sentences.map((s) => s.text);
    expect(texts[0]).toBe('We wrote Craig Morrison, VP Operations on Sep 20: "The record". No answer on record.');
    expect(texts.at(-1)).toBe('Our Sent was not fully read: Gmail Sent (casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured); an email from a mailbox that was not read is not in this story.');
    expect(withTouch.sentences.at(-1)?.tag).toBe('Unknown');
    // Every mailbox read: no such sentence.
    expect(storyRow(inputsWith({ sent: await readSent(BOTH) })).sentences.map((s) => s.text).join(' ')).not.toMatch(/not fully read|not known/);
  });
});

describe('the assignment and the account page agree about the same conversation', () => {
  const relationshipFor = (env: Record<string, string>) => relationshipStateFor(ledgerDb({ accounts: ['Kenco'], personas: [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, email_status: 'verified', account_name: 'Kenco', updated_at: NOW }] }, NOW).client(), { accountName: 'Kenco', email: CRAIG, name: 'Craig Morrison', now: NOW }, {
    thread: { listSent: unionListSent(sellerMailboxes(env), reader), listDrafts: async () => [], ownAddresses: new Set(sellerMailboxes(env).map((m) => m.userEmail)), maxSentRecipients: 1 },
    engagements: async () => ({ items: [], read: true, detail: null }),
    deals: async () => ({ deals: [], read: true, detail: null }),
    commitments: async () => [],
    conversations: async () => [],
    companyFor: async () => null,
    env,
  });

  it('one Sent row set fed to both: the story and the relationship say we wrote Craig Morrison on Oct 9 (from casey@freightroll.com); the GAP mailbox alone (the defect) says Sep 20 on the page', async () => {
    const rel = await relationshipFor(BOTH);
    expect(rel.lastOutbound).toMatchObject({ at: '2026-10-09T15:30:00.000Z', subject: 'Primo and the yards', source: 'Gmail Sent' });
    const page = storyRow(inputsWith({ sent: await readSent(BOTH) }));
    const wrote = storyWroteOn(page.sentences.map((s) => s.text), 'Craig Morrison', NOW);
    expect(wrote?.at).toBe(rel.lastOutbound!.at.slice(0, 10));
    expect(page.sentences[0].text).toContain('We wrote Craig Morrison, VP Operations on Oct 9: "Primo and the yards".');
    // The defect this replaces: the account page read the GAP mailbox alone and named an older note as our last.
    const gapOnlyPage = await loadAccountSent(null, { accountName: 'Kenco', addresses: [CRAIG], domains: ['kencogroup.com'], now: NOW, mailboxes: [{ address: 'casey@yardflow.ai', sender: sellerMailboxes(BOTH)[0] }], listSent: reader });
    expect(storyWroteOn(storyRow(inputsWith({ sent: gapOnlyPage })).sentences.map((s) => s.text), 'Craig Morrison', NOW)?.at).toBe('2026-09-20');
  });
});
