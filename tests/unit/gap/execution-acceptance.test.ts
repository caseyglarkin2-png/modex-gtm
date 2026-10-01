/**
 * GAP execution acceptance (2026-10-01). Casey clicked CREATE GMAIL DRAFT on a General Mills card and production
 * refused: "suppression authority unreachable (The operation was aborted due to timeout)". The same screen offered
 * COPY EMAIL / COPY EMAIL ADDRESS beside the refusal, rendered a legacy Brazil thesis as READY while Account
 * Intelligence said it needed review, and read a hard-coded "the yards have to catch up" call opener.
 */
import { describe, expect, it, vi } from 'vitest';
import { ACTION_TIME_SUPPRESSION_TIMEOUT_MS, suppressionRefusalKind, suppressionTimeoutMs } from '@/lib/email/suppression-gate';
import { HEALTH_SUPPRESSION_TIMEOUT_MS } from '@/lib/gap/health/load';
import { evaluateHealth, SUPPRESSION_SLOW_MS, type HealthInputs } from '@/lib/gap/health/health';
import { createSellerGmailDraft, prepareSellerEmail } from '@/lib/gap/execution/seller-draft';
import { releaseGovernedCopy, COPY_RELEASED } from '@/lib/gap/execution/governed-copy';
import { checkColdOutbound } from '@/lib/gap/execution/cold-outbound';
import { DRAFTED, DRAFT_REFUSED } from '@/lib/gap/execution/draft-ledger';
import { buildAccountBrief, thesisCurrentness, type AccountInputs } from '@/lib/gap/account-intel/build';
import { buildCallPack } from '@/lib/gap/sequence/call-pack';
import { refusalCopy } from '@/lib/gap/ui/refusal-copy';
import { NOW, db, prismaOf, gmailFake, baseDeps } from './fixtures/seller-db';

// ---------------------------------------------------------------- suppression: one SLA, health predicts execution

describe('one action-time suppression timeout', () => {
  it('the wire gate and the health probe use the same timeout', () => {
    expect(suppressionTimeoutMs({})).toBe(ACTION_TIME_SUPPRESSION_TIMEOUT_MS);
    expect(HEALTH_SUPPRESSION_TIMEOUT_MS).toBe(ACTION_TIME_SUPPRESSION_TIMEOUT_MS);
    expect(SUPPRESSION_SLOW_MS).toBeLessThan(ACTION_TIME_SUPPRESSION_TIMEOUT_MS);
  });

  const healthy = (ms: number | null, verdict: 'clear' | null = 'clear', error: string | null = null): HealthInputs => ({
    mailbox: { senderConfigured: true, lastSuccessAt: new Date(NOW.getTime() - 60_000), lastFailureAt: null, consecutiveFailures: 0, lastMessage: 'ok' },
    hubspot: { configured: true, ok: true, ms: 400, error: null },
    suppression: { configured: true, verdict, ms, error },
    sender: { configured: true, mailbox: 'casey@yardflow.ai' },
    routing: { lastRunAt: new Date(NOW.getTime() - 60_000) },
  });
  it('health: comfortably inside the SLA is HEALTHY; near the ceiling is DEGRADED; no answer is BLOCKED', () => {
    const sup = (i: HealthInputs) => evaluateHealth(i, NOW).components.find((c) => c.key === 'suppression')!;
    expect(sup(healthy(1200)).state).toBe('HEALTHY');
    expect(sup(healthy(SUPPRESSION_SLOW_MS + 500))).toMatchObject({ state: 'DEGRADED' });
    expect(sup(healthy(SUPPRESSION_SLOW_MS + 500)).label).toMatch(/drafts and sends may time out/);
    expect(sup(healthy(ACTION_TIME_SUPPRESSION_TIMEOUT_MS, null, 'The operation was aborted due to timeout')).state).toBe('BLOCKED');
  });

  it('a suppression refusal is classified: unreadable (retryable) vs a real do-not-contact', () => {
    expect(suppressionRefusalKind('Cross-plane suppression refused this send: suppression authority unreachable (The operation was aborted due to timeout)')).toBe('unreadable');
    expect(suppressionRefusalKind('Cross-plane suppression refused this send: unknown_hubspot')).toBe('unreadable');
    expect(suppressionRefusalKind('Cross-plane suppression refused this send: hubspot_optout')).toBe('suppressed');
    expect(suppressionRefusalKind('Gmail draft create failed (500)')).toBeNull();
  });
});

describe('draft retry after a suppression timeout', () => {
  const TIMEOUT = new Error('Cross-plane suppression refused this send: suppression authority unreachable (The operation was aborted due to timeout)');
  it('timeout: zero drafts, a retryable refusal in seller words; the retry drafts exactly once', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    gmail.createGmailDraft.mockRejectedValueOnce(TIMEOUT);
    const first = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(first).toMatchObject({ ok: false, reason: 'suppression_unreadable' });
    expect(d.audit.filter((a) => a.kind === DRAFTED)).toHaveLength(0);
    expect(refusalCopy('suppression_unreadable')).toMatchObject({ what: 'Nothing was drafted.', next: expect.stringMatching(/^Retry/) });
    const retry = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: new Date(NOW.getTime() + 5_000) }, baseDeps(d, 'pass', gmail));
    expect(retry.ok).toBe(true);
    expect(d.audit.filter((a) => a.kind === DRAFTED)).toHaveLength(1);
  });
  it('a real suppression is said as such, never as a retry', async () => {
    const d = db();
    const gmail = gmailFake();
    gmail.createGmailDraft.mockRejectedValueOnce(new Error('Cross-plane suppression refused this send: hubspot_optout'));
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'recipient_suppressed' });
    expect(d.audit.filter((a) => a.kind === DRAFT_REFUSED)).toHaveLength(1);
  });
  it('Gmail answered ambiguously after the write started: no blind retry', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    gmail.createGmailDraft.mockRejectedValueOnce(new Error('Gmail draft create failed (503)'));
    const first = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(first).toMatchObject({ ok: false, reason: 'gmail_refused' });
    const retry = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: new Date(NOW.getTime() + 5_000) }, baseDeps(d, 'pass', gmail));
    expect(retry).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------- the current actionable thesis

const fact = (id: string, quote: string, publishedAt = '2026-09-23T00:00:00Z') => ({ id, quote, url: 'https://x.example', title: 't', publishedAt, expiresAt: '2027-01-21T00:00:00Z', continuity: 'event' as const, currentness: null });
const BRAZIL = fact('fb', 'During the fourth quarter of fiscal 2026, we entered into a definitive agreement to sell our business in Brazil to a local buyer.');
const REDESIGN = fact('fr', 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury, as part of a plan to cut $3 billion in costs.', '2026-07-02T00:00:00Z');
const gm = (primary: string, hyps = true): AccountInputs => ({
  account: { name: 'General Mills', tier: null, priorityBand: null, vertical: 'Food & Beverage', parentBrand: null, hubspotCompanyId: null },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: [], facts: [BRAZIL, REDESIGN], signals: [], lastResearch: null,
  hypotheses: hyps ? [{ id: 'h-gm', status: 'active', observation: primary === 'fb' ? BRAZIL.quote : REDESIGN.quote, problem: 'My guess is that the change moves load onto the handoffs that remain.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: null, primarySignalId: primary, reviewedAt: '2026-09-27T00:00:00Z' }] : [],
  bids: [], personas: [{ id: 5, name: 'Jonathan Ness', title: 'Chief Supply Chain Officer', doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
}) as never;

describe('a thesis that needs review is never actionable', () => {
  const T = new Date('2026-10-01T12:00:00Z');
  it('General Mills shape: an active thesis opening on a foreign divestiture, with a better current fact, is not current', () => {
    const r = thesisCurrentness(gm('fb'), 'h-gm', T);
    expect(r.current).toBe(false);
    if (r.current !== false) return;
    expect(r.reason).toMatch(/opens on activity outside the US network/);
    expect(r.bestFact).toMatch(/redesign the plant and warehouse network/);
    expect(r.opener).toMatch(/business in Brazil/);
    // the brief and the gate agree: the account brief routes to review on the same inputs
    expect(buildAccountBrief(gm('fb'), T).glance.nextAction).toMatch(/^Review the thesis before any first touch/);
  });
  it('the same thesis grounded on the best fact is current', () => {
    expect(thesisCurrentness(gm('fr'), 'h-gm', T)).toEqual({ current: true });
  });
  it('a thesis that is no longer one of the account current theses (revised or superseded) is not current', () => {
    expect(thesisCurrentness(gm('fb', false), 'h-gm', T).current).toBe(false);
  });

  it('draft and send refuse at the click, whatever the card says (an old deep link cannot revive it)', async () => {
    const d = db();
    const gmail = gmailFake();
    const notCurrent = async () => ({ current: false as const, reason: 'It opens on activity outside the US network, but a better current fact exists.', bestFact: REDESIGN.quote, opener: BRAZIL.quote });
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d, 'pass', gmail), thesisCurrent: notCurrent });
    expect(r).toMatchObject({ ok: false, reason: 'thesis_needs_review' });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
    const s = await prepareSellerEmail(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW, mode: 'send' }, { ...baseDeps(d), thesisCurrent: notCurrent });
    expect(s).toMatchObject({ ok: false, reason: 'thesis_needs_review' });
  });
  it('a thesis whose currentness cannot be read fails closed', async () => {
    const d = db();
    const r = await prepareSellerEmail(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW, mode: 'send' }, { ...baseDeps(d), thesisCurrent: async () => ({ current: 'unknown' as const, reason: 'db down' }) });
    expect(r).toMatchObject({ ok: false, reason: 'thesis_currentness_unknown' });
  });
});

// ---------------------------------------------------------------- escape hatches

describe('COPY EMAIL is released only after every gate, suppression included', () => {
  it('suppression unreadable: refused, no text released, nothing recorded as drafted or sent', async () => {
    const d = db();
    const r = await releaseGovernedCopy(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), suppression: async () => { throw Object.assign(new Error('Cross-plane suppression refused this send: suppression authority unreachable (timeout)'), { name: 'SuppressionRefusedError', unreadable: true }); } });
    expect(r).toMatchObject({ ok: false, reason: 'suppression_unreadable' });
    expect('text' in r).toBe(false);
    expect(d.audit.filter((a) => a.kind === DRAFTED || a.kind === COPY_RELEASED)).toHaveLength(0);
  });
  it('every gate clear: the email text and address are released once, recorded as COPY RELEASED (not drafted, not sent)', async () => {
    const d = db();
    const suppression = vi.fn(async () => undefined);
    const r = await releaseGovernedCopy(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), suppression });
    expect(r).toMatchObject({ ok: true, recipient: 'joey.maggard@kroger.com' });
    if (!r.ok) return;
    expect(r.text).toMatch(/^Hi Joey,/);
    expect(suppression).toHaveBeenCalledWith('joey.maggard@kroger.com');
    expect(d.audit.filter((a) => a.kind === COPY_RELEASED)).toHaveLength(1);
    expect(d.audit.filter((a) => a.kind === DRAFTED)).toHaveLength(0);
  });
  it('a thesis needing review releases nothing', async () => {
    const d = db();
    const r = await releaseGovernedCopy(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), suppression: async () => undefined, thesisCurrent: async () => ({ current: false as const, reason: 'x', bestFact: null, opener: null }) });
    expect(r).toMatchObject({ ok: false, reason: 'thesis_needs_review' });
  });
});

describe('cold CALL / LINKEDIN: the governed button is the only way, and it checks more than HubSpot', () => {
  const prisma = (over: { decision?: Record<string, unknown>; persona?: Record<string, unknown>; newer?: Record<string, unknown> | null } = {}) => ({
    routingDecision: {
      findUnique: vi.fn(async () => ({ id: 'd1', account_name: 'General Mills', persona_id: 5, hypothesis_id: 'h-gm', action: 'call_now', lane: 'work_queue', created_at: NOW, ...over.decision })),
      findFirst: vi.fn(async () => over.newer ?? null),
    },
    persona: { findUnique: vi.fn(async () => ({ email: 'a@generalmills.com', phone: '+1 612 555 0100', linkedin_url: 'https://www.linkedin.com/in/x', do_not_contact: false, ...over.persona })) },
  });
  const clear = { opportunity: async () => ({ status: 'CLEAR' as const }), thesisCurrent: async () => ({ current: true as const }) };
  it('clear: releases the dial', async () => {
    expect(await checkColdOutbound(prisma(), { decisionId: 'd1', channel: 'call', now: NOW }, clear)).toMatchObject({ ok: true, href: expect.stringMatching(/^tel:\+?16125550100$/) });
  });
  it('a thesis needing review, a do-not-contact person, a newer card or a blocked card refuses', async () => {
    expect(await checkColdOutbound(prisma(), { decisionId: 'd1', channel: 'call', now: NOW }, { ...clear, thesisCurrent: async () => ({ current: false as const, reason: 'needs review', bestFact: null, opener: null }) })).toMatchObject({ ok: false, reason: 'thesis_needs_review' });
    expect(await checkColdOutbound(prisma({ persona: { do_not_contact: true } }), { decisionId: 'd1', channel: 'linkedin', now: NOW }, clear)).toMatchObject({ ok: false, reason: 'persona_do_not_contact' });
    expect(await checkColdOutbound(prisma({ newer: { id: 'd2', action: 'research_required', rule_id: 'evidence_thin' } }), { decisionId: 'd1', channel: 'call', now: NOW }, clear)).toMatchObject({ ok: false, reason: 'decision_superseded' });
    expect(await checkColdOutbound(prisma({ decision: { lane: 'blocked', action: 'do_not_contact' } }), { decisionId: 'd1', channel: 'call', now: NOW }, clear)).toMatchObject({ ok: false, reason: 'decision_blocked' });
  });
  it('ACTIVE or UNKNOWN opportunity still refuses', async () => {
    expect(await checkColdOutbound(prisma(), { decisionId: 'd1', channel: 'call', now: NOW }, { ...clear, opportunity: async () => ({ status: 'ACTIVE' as const, detail: 'open deal' }) })).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(await checkColdOutbound(prisma(), { decisionId: 'd1', channel: 'call', now: NOW }, { ...clear, opportunity: async () => ({ status: 'UNKNOWN' as const, detail: '' }) })).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
  });
});

// ---------------------------------------------------------------- call methodology

describe('the call opener asks the approved hypothesis; it never diagnoses with a stock line', () => {
  const base = { firstName: 'Ryan', senderFirstName: 'Casey', accountName: 'General Mills', observationPlain: REDESIGN.quote, diagnosticQuestion: null };
  it('uses the approved hypothesis, as a guess and a question; no "yards have to catch up"', () => {
    const p = buildCallPack({ ...base, problemHypothesis: 'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.', title: 'Director, Logistics' });
    expect(p.opener).not.toMatch(/catch up/);
    expect(p.opener).toMatch(/My guess is that the network change moves load onto the physical handoffs that remain/);
    expect(p.opener).toMatch(/or am I off\?$/);
    expect(p.voicemail).not.toMatch(/yards/);
    expect(p.voicemail).toContain(REDESIGN.quote);
  });
  it('no hypothesis text: asks whether the fact changes anything, never invents one', () => {
    const p = buildCallPack({ ...base, problemHypothesis: '', title: null });
    expect(p.opener).toMatch(/Is that changing anything for your team, or am I off\?$/);
  });
  it('an executive is asked about relevance; a front-line operator about what they see', () => {
    const h = 'My guess is that trailer staging gets harder during the transition.';
    expect(buildCallPack({ ...base, problemHypothesis: h, title: 'Chief Supply Chain Officer' }).opener).toMatch(/Is that on your radar at all, or am I off\?$/);
    expect(buildCallPack({ ...base, problemHypothesis: h, title: 'Shipping Supervisor' }).opener).toMatch(/Is that something you see day to day, or am I off\?$/);
  });
});

describe('the action pack renders from the same rule (an old deep link to a stale thesis shows the review)', () => {
  it('email, draft and call sections are gated on thesisCurrentness, and the review panel names the current best fact', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/components/gap/action-pack-view.tsx', 'utf8');
    expect(src).toContain('thesisCurrentness(accountInputs, hypothesis.id, new Date())');
    expect(src).toContain("const thesisHold = thesisState.current !== true;");
    expect(src).toContain('const callSection = callPack && !thesisHold ? (');
    expect(src).toContain('{renderedEmail && thesisHold ? null : renderedEmail ? (');
    expect(src).toContain('!blockedReason && !rejected && !thesisHold ? (');
    expect(src).toContain('data-testid="thesis-needs-review"');
    // no raw phone number rendered on the page
    expect(src).not.toMatch(/\{persona\?\.phone \?\? ''\}|Call \{persona\?\.phone\}/);
  });
});

describe('the same fact stored once per person is ONE live fact (E2E found it: a thesis on the other row read "no longer live")', () => {
  const T = new Date('2026-10-01T12:00:00Z');
  it('a thesis whose primary signal is another stored row of the kept quote is current', () => {
    const i = gm('fr') as unknown as AccountInputs;
    (i.facts as unknown as Array<Record<string, unknown>>)[1] = { ...REDESIGN, sameQuoteIds: ['fr-row-2'] };
    (i.hypotheses as unknown as Array<Record<string, unknown>>)[0].primarySignalId = 'fr-row-2';
    expect(thesisCurrentness(i, 'h-gm', T)).toEqual({ current: true });
  });
  it('the loader keeps one fact per quote and remembers the other rows', async () => {
    const { loadAccountInputs } = await import('@/lib/gap/account-intel/load');
    const row = (id: string) => ({ id, title: 't', evidence_text: REDESIGN.quote, evidence_url: 'https://x.example', observed_at: new Date('2026-07-02'), freshness_expires_at: new Date('2027-01-21'), metadata: { verified: 'excerpt_found_at_source' } });
    const empty = { findMany: async () => [], findUnique: async () => null, findFirst: async () => null, count: async () => 0 };
    const own = {
      $queryRaw: async () => [{ name: 'General Mills' }],
      account: { findUnique: async () => ({ name: 'General Mills', tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: null }), findMany: async () => [] },
      prospectingSignal: { ...empty, findMany: async ({ where }: { where: { source_kind?: string } }) => (where.source_kind === 'evidence_record' ? [row('a'), row('b')] : []) },
    };
    const prisma = new Proxy(own, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'string' && !k.startsWith('$') && k !== 'then' ? empty : undefined) });
    const inputs = await loadAccountInputs(prisma as never, 'General Mills', T);
    expect(inputs?.facts).toHaveLength(1);
    expect([inputs!.facts[0].id, ...((inputs!.facts[0] as { sameQuoteIds?: string[] }).sameQuoteIds ?? [])].sort()).toEqual(['a', 'b']);
  });
});
