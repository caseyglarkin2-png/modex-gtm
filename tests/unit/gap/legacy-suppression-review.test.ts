/**
 * Legacy suppression review (WHO truth, 2026-10-05). The seller sees WHY a person is blocked and WHAT WOULD HAVE
 * TO BE TRUE to clear it, from every source listed with its verdict. The ONLY thing this surface can clear is the
 * stale local Modex flag (do_not_contact / the historical 'bounced' status), and only when every hard-safety
 * source is clean, every authority answered, a later delivery to the same address contradicts the bounce, and
 * Casey confirmed the click. A real unsubscribe, a HubSpot opt-out, a hard bounce or a clawd hard suppression can
 * never be cleared here. Nothing is cleared automatically. The case is Isaac Scott, persona 13 at PepsiCo.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  classifySuppressionReview,
  clearLegacyLocalFlag,
  createClawdContractRead,
  createHubSpotSuppressionRead,
  loadSuppressionReview,
  type SuppressionReviewDeps,
  type SuppressionSourceRead,
} from '@/lib/gap/suppression/legacy-review';

const NOW = new Date('2026-10-05T18:00:00Z');
const EMAIL = 'isaac.scott@pepsico.com';

const ISAAC = { id: 13, name: 'Isaac Scott', account_name: 'PepsiCo', email: EMAIL, do_not_contact: true, email_status: 'bounced', hubspot_contact_id: '219885493392' };

const legsRead = { clawd: true, hubspot: true, modex: true, sendgrid: true, verbal: true };
const MODEX_ONLY = { blocked: true, reason: 'modex_do_not_contact', keys: ['modex_do_not_contact'], unknownLegs: [] as string[], legsRead };
const CONTRACT_CLEAR = { blocked: false, reason: null, keys: [] as string[], unknownLegs: [] as string[], legsRead };
const HUBSPOT_CLEAN = { optedOut: null, badAddress: null, hardBounceReason: null, quarantined: null };

type Log = { to_email: string; status: string; bounce_type: string | null; sent_at: Date; delivered_at: Date | null; subject: string | null; provider_message_id: string | null; reply_count: number };
const log = (status: string, at: string, over: Partial<Log> = {}): Log => ({ to_email: EMAIL, status, bounce_type: null, sent_at: new Date(at), delivered_at: status === 'delivered' ? new Date(at) : null, subject: status === 'delivered' ? 'Re: Frito-Lay yards' : 'Frito-Lay yards', provider_message_id: `re_${at}`, reply_count: 0, ...over });

/** The production facts read 2026-10-05: two bounces (type never recorded) then three deliveries to the same address. */
const ISAAC_LOGS: Log[] = [
  log('bounced', '2026-03-27T10:00:00Z'),
  log('bounced', '2026-03-27T10:05:00Z'),
  log('delivered', '2026-03-27T15:00:00Z'),
  log('delivered', '2026-03-28T15:00:00Z'),
  log('delivered', '2026-03-30T15:00:00Z'),
];

/* eslint-disable @typescript-eslint/no-explicit-any */
/** A hand-rolled prisma that records EVERY call, so a test can prove what was and was not touched. */
function db(seed: { persona?: Record<string, unknown> | null; unsubscribed?: Array<{ email: string; unsubscribed_at: Date; reason: string | null }>; logs?: Log[]; audit?: Array<Record<string, unknown>>; updateRows?: number } = {}) {
  const persona = seed.persona === undefined ? ISAAC : seed.persona;
  const calls: string[] = [];
  const raw: Array<{ sql: string; args: unknown[] }> = [];
  const audit: Array<Record<string, unknown>> = [];
  const record = (name: string) => calls.push(name);
  const tx = {
    $executeRawUnsafe: vi.fn(async (sql: string, ...args: unknown[]) => { record('tx.$executeRawUnsafe'); raw.push({ sql, args }); return seed.updateRows ?? 1; }),
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { record('tx.gapAuditEvent.create'); audit.push(data); return { id: `aud_${audit.length}` }; }) },
  };
  const prisma = {
    persona: {
      findUnique: vi.fn(async ({ where }: any) => { record('persona.findUnique'); return persona && where.id === persona.id ? { ...persona } : null; }),
      update: vi.fn(async () => { record('persona.update'); throw new Error('persona.update must never be called by this surface'); }),
    },
    unsubscribedEmail: {
      findFirst: vi.fn(async ({ where }: any) => { record('unsubscribedEmail.findFirst'); const e = String(where.email.equals).toLowerCase(); return (seed.unsubscribed ?? []).find((u) => u.email.toLowerCase() === e) ?? null; }),
      delete: vi.fn(async () => { record('unsubscribedEmail.delete'); throw new Error('never'); }),
      deleteMany: vi.fn(async () => { record('unsubscribedEmail.deleteMany'); throw new Error('never'); }),
    },
    emailLog: { findMany: vi.fn(async ({ where }: any) => { record('emailLog.findMany'); const e = String(where.to_email.equals).toLowerCase(); return (seed.logs ?? []).filter((l) => l.to_email.toLowerCase() === e).map((l) => ({ ...l })); }) },
    gapAuditEvent: {
      findMany: vi.fn(async ({ where }: any) => { record('gapAuditEvent.findMany'); return (seed.audit ?? []).filter((a) => a.subject_id === where.subject_id); }),
      create: vi.fn(async ({ data }: any) => { record('gapAuditEvent.create'); audit.push(data); return { id: `aud_${audit.length}` }; }),
    },
    $executeRawUnsafe: vi.fn(async () => { record('$executeRawUnsafe'); throw new Error('raw writes go through the transaction'); }),
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => { record('$transaction'); return fn(tx); }),
  };
  return { prisma, calls, raw, audit, tx };
}

const deps = (over: Partial<SuppressionReviewDeps> = {}): SuppressionReviewDeps => ({ contract: async () => MODEX_ONLY, hubspot: async () => HUBSPOT_CLEAN, now: NOW, ...over });
const isaacDb = (over: Parameters<typeof db>[0] = {}) => db({ logs: ISAAC_LOGS, ...over });
const bySource = (sources: SuppressionSourceRead[]) => Object.fromEntries(sources.map((s) => [s.source, s])) as Record<SuppressionSourceRead['source'], SuppressionSourceRead>;
const src = (source: SuppressionSourceRead['source'], verdict: SuppressionSourceRead['verdict'], hard = false): SuppressionSourceRead => ({ source, verdict, detail: source, hard });

describe('classifySuppressionReview (pure)', () => {
  const localOnly = (): SuppressionSourceRead[] => [src('modex_flag', 'hit'), src('modex_email_status', 'hit'), src('unsubscribed_emails', 'clear'), src('hubspot_optout', 'clear'), src('hubspot_bounce', 'clear'), src('clawd_contract', 'hit'), src('email_log_bounces', 'hit'), src('email_log_deliveries', 'clear'), src('gap_ledger', 'clear'), src('override_history', 'clear'), src('gmail_dsn', 'not_read')];
  it('any HARD hit is CONFIRMED_SUPPRESSION, above an unread authority and above delivery evidence', () => {
    const s = localOnly();
    s[2] = src('unsubscribed_emails', 'hit', true);
    s[5] = src('clawd_contract', 'unknown');
    expect(classifySuppressionReview(s, { localFlag: true, laterDeliveries: 3 })).toBe('CONFIRMED_SUPPRESSION');
  });
  it('any unread authority is UNRESOLVED, never CLEAR and never LEGACY_CONFLICT', () => {
    const s = localOnly();
    s[5] = src('clawd_contract', 'unknown');
    expect(classifySuppressionReview(s, { localFlag: true, laterDeliveries: 3 })).toBe('UNRESOLVED');
    const h = localOnly();
    h[3] = src('hubspot_optout', 'unknown');
    expect(classifySuppressionReview(h, { localFlag: true, laterDeliveries: 3 })).toBe('UNRESOLVED');
  });
  it('the local flag alone, the contract echoing only modex, and a later delivery is LEGACY_CONFLICT; without the delivery it is UNRESOLVED', () => {
    expect(classifySuppressionReview(localOnly(), { localFlag: true, laterDeliveries: 1 })).toBe('LEGACY_CONFLICT');
    expect(classifySuppressionReview(localOnly(), { localFlag: true, laterDeliveries: 0 })).toBe('UNRESOLVED');
  });
  it('a gmail_dsn not_read is neither a hit nor a reason to stay unresolved; nothing anywhere is CLEAR', () => {
    const none = localOnly().map((s) => (s.source === 'gmail_dsn' ? s : { ...s, verdict: 'clear' as const }));
    expect(classifySuppressionReview(none, { localFlag: false, laterDeliveries: 0 })).toBe('CLEAR');
  });
});

describe('loadSuppressionReview: every source listed with its verdict', () => {
  it('(26) the Isaac pattern: two bounces then three deliveries, contract keys exactly modex, HubSpot clean, no unsubscribe: LEGACY_CONFLICT and the clear is allowed', async () => {
    const { prisma, calls } = isaacDb();
    const r = (await loadSuppressionReview(prisma, 13, deps()))!;
    expect(r.class).toBe('LEGACY_CONFLICT');
    expect(r).toMatchObject({ personaId: 13, name: 'Isaac Scott', accountName: 'PepsiCo', email: EMAIL, readAt: NOW.toISOString() });
    expect(r.sources.map((s) => s.source)).toEqual(['modex_flag', 'modex_email_status', 'unsubscribed_emails', 'hubspot_optout', 'hubspot_bounce', 'clawd_contract', 'email_log_bounces', 'email_log_deliveries', 'gap_ledger', 'override_history', 'gmail_dsn']);
    const s = bySource(r.sources);
    expect(s.modex_flag).toMatchObject({ verdict: 'hit', hard: false });
    expect(s.modex_email_status).toMatchObject({ verdict: 'hit', hard: false });
    expect(s.unsubscribed_emails).toMatchObject({ verdict: 'clear', hard: false });
    expect(s.hubspot_optout).toMatchObject({ verdict: 'clear' });
    expect(s.hubspot_bounce).toMatchObject({ verdict: 'clear' });
    expect(s.clawd_contract).toMatchObject({ verdict: 'hit', hard: false });
    expect(s.clawd_contract.detail).toMatch(/modex_do_not_contact/);
    expect(s.email_log_bounces).toMatchObject({ verdict: 'hit', hard: false, at: '2026-03-27T10:05:00.000Z' });
    expect(s.email_log_deliveries).toMatchObject({ verdict: 'clear' });
    expect(s.gmail_dsn).toMatchObject({ verdict: 'not_read', hard: false });
    expect(r.lastBounceAt).toBe('2026-03-27T10:05:00.000Z');
    expect(r.laterDeliveries).toHaveLength(3);
    expect(r.laterDeliveries[0]).toEqual({ at: '2026-03-27T15:00:00.000Z', subject: 'Re: Frito-Lay yards', status: 'delivered' });
    expect(r.clear).toEqual({ allowed: true, touches: ['the local do-not-contact flag on the GAP record', 'the historical bounced email status on the GAP record'], why: expect.stringMatching(/only block is the stale local flag/i) });
    expect(r.whyBlocked.join(' ')).toMatch(/the record is marked do not contact/);
    expect(r.whyBlocked.join(' ')).toMatch(/3 messages were delivered to the same address after the last bounce/);
    expect(r.whatWouldClear).toEqual([expect.stringMatching(/Casey's confirmed click/)]);
    expect(r.whyBlocked.join(' ') + r.whatWouldClear.join(' ')).not.toMatch(/—/);
    expect(calls).not.toContain('$transaction');
    expect(calls).not.toContain('persona.update');
  });
  it('(23) a real unsubscribe row is CONFIRMED_SUPPRESSION; the clear is not allowed and says why', async () => {
    const { prisma } = isaacDb({ unsubscribed: [{ email: 'Isaac.Scott@PepsiCo.com', unsubscribed_at: new Date('2026-04-01T00:00:00Z'), reason: 'link' }] });
    const r = (await loadSuppressionReview(prisma, 13, deps()))!;
    expect(r.class).toBe('CONFIRMED_SUPPRESSION');
    expect(bySource(r.sources).unsubscribed_emails).toMatchObject({ verdict: 'hit', hard: true, at: '2026-04-01T00:00:00.000Z' });
    expect(r.clear.allowed).toBe(false);
    expect(r.whyBlocked.join(' ')).toMatch(/unsubscribe/i);
    expect(r.whatWouldClear.join(' ')).toMatch(/never (cleared )?here/i);
  });
  it('(24) an email-log hard bounce that no later delivery contradicts is CONFIRMED; a later delivery to the same address contradicts it', async () => {
    const hard = log('bounced', '2026-03-27T10:05:00Z', { bounce_type: 'hard' });
    const a = (await loadSuppressionReview(isaacDb({ logs: [log('bounced', '2026-03-27T10:00:00Z'), hard] }).prisma, 13, deps()))!;
    expect(a.class).toBe('CONFIRMED_SUPPRESSION');
    expect(bySource(a.sources).email_log_bounces).toMatchObject({ verdict: 'hit', hard: true });
    expect(a.clear.allowed).toBe(false);
    const b = (await loadSuppressionReview(isaacDb({ logs: [hard, log('delivered', '2026-03-28T15:00:00Z')] }).prisma, 13, deps()))!;
    expect(bySource(b.sources).email_log_bounces).toMatchObject({ verdict: 'hit', hard: false });
    expect(b.class).toBe('LEGACY_CONFLICT');
  });
  it('(25) a clawd key beside modex (clawd_do_not_send, hubspot, sendgrid, verbal, or anything unrecognized) is CONFIRMED', async () => {
    for (const extra of ['clawd_do_not_send', 'hubspot', 'sendgrid', 'verbal', 'something_new']) {
      const r = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ contract: async () => ({ ...MODEX_ONLY, keys: ['modex_do_not_contact', extra] }) })))!;
      expect(r.class, extra).toBe('CONFIRMED_SUPPRESSION');
      expect(bySource(r.sources).clawd_contract, extra).toMatchObject({ verdict: 'hit', hard: true });
      expect(bySource(r.sources).clawd_contract.detail, extra).toContain(extra);
      expect(r.clear.allowed, extra).toBe(false);
    }
  });
  it('a HubSpot opt-out, bad address, hard-bounce reason or quarantine is CONFIRMED', async () => {
    const cases = [{ ...HUBSPOT_CLEAN, optedOut: true }, { ...HUBSPOT_CLEAN, badAddress: true }, { ...HUBSPOT_CLEAN, hardBounceReason: 'MAILBOX_DOES_NOT_EXIST' }, { ...HUBSPOT_CLEAN, quarantined: true }];
    for (const hs of cases) {
      const r = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ hubspot: async () => hs })))!;
      expect(r.class, JSON.stringify(hs)).toBe('CONFIRMED_SUPPRESSION');
      expect(r.clear.allowed).toBe(false);
    }
    const opt = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ hubspot: async () => ({ ...HUBSPOT_CLEAN, optedOut: true }) })))!;
    expect(bySource(opt.sources).hubspot_optout).toMatchObject({ verdict: 'hit', hard: true });
    const bad = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ hubspot: async () => ({ ...HUBSPOT_CLEAN, hardBounceReason: 'MAILBOX_DOES_NOT_EXIST' }) })))!;
    expect(bySource(bad.sources).hubspot_bounce).toMatchObject({ verdict: 'hit', hard: true });
    expect(bySource(bad.sources).hubspot_bounce.detail).toContain('MAILBOX_DOES_NOT_EXIST');
  });
  it('a persona with a hard local email status is CONFIRMED even with later deliveries', async () => {
    const r = (await loadSuppressionReview(isaacDb({ persona: { ...ISAAC, email_status: 'hard_bounce' } }).prisma, 13, deps()))!;
    expect(r.class).toBe('CONFIRMED_SUPPRESSION');
    expect(bySource(r.sources).modex_email_status).toMatchObject({ verdict: 'hit', hard: true });
  });
  it('(30) contract unreadable, unknown legs, or HubSpot unreadable with a contact id: UNRESOLVED, never clear', async () => {
    const unreadable = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ contract: async () => 'unreadable' })))!;
    expect(unreadable.class).toBe('UNRESOLVED');
    expect(bySource(unreadable.sources).clawd_contract).toMatchObject({ verdict: 'unknown', hard: false });
    expect(unreadable.clear.allowed).toBe(false);
    expect(unreadable.whatWouldClear.join(' ')).toMatch(/readable answer/i);
    const legs = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ contract: async () => ({ ...MODEX_ONLY, unknownLegs: ['hubspot'], legsRead: { ...legsRead, hubspot: false } }) })))!;
    expect(legs.class).toBe('UNRESOLVED');
    expect(bySource(legs.sources).clawd_contract.detail).toMatch(/hubspot/);
    const hs = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ hubspot: async () => 'unreadable' })))!;
    expect(hs.class).toBe('UNRESOLVED');
    expect(bySource(hs.sources).hubspot_optout).toMatchObject({ verdict: 'unknown' });
  });
  it('no HubSpot contact linked: HubSpot reads not_read, which blocks nothing', async () => {
    const r = (await loadSuppressionReview(isaacDb({ persona: { ...ISAAC, hubspot_contact_id: null } }).prisma, 13, deps({ hubspot: async () => null })))!;
    expect(bySource(r.sources).hubspot_optout).toMatchObject({ verdict: 'not_read' });
    expect(r.class).toBe('LEGACY_CONFLICT');
  });
  it('the local flag with no later delivery is UNRESOLVED and says which evidence is missing', async () => {
    const r = (await loadSuppressionReview(isaacDb({ logs: ISAAC_LOGS.slice(0, 2) }).prisma, 13, deps()))!;
    expect(r.class).toBe('UNRESOLVED');
    expect(r.laterDeliveries).toEqual([]);
    expect(r.clear.allowed).toBe(false);
    expect(r.whatWouldClear.join(' ')).toMatch(/delivery, open, click or reply to isaac\.scott@pepsico\.com dated after the last bounce/i);
  });
  it('the local flag with no email on record is UNRESOLVED: the contract cannot be read', async () => {
    const r = (await loadSuppressionReview(isaacDb({ persona: { ...ISAAC, email: null } }).prisma, 13, deps({ contract: async () => { throw new Error('must not be called without an email'); } })))!;
    expect(r.class).toBe('UNRESOLVED');
    expect(bySource(r.sources).clawd_contract).toMatchObject({ verdict: 'unknown' });
    expect(r.whatWouldClear.join(' ')).toMatch(/email address/i);
  });
  it('nothing anywhere is CLEAR with nothing to clear', async () => {
    const r = (await loadSuppressionReview(db({ persona: { ...ISAAC, do_not_contact: false, email_status: 'verified' }, logs: [log('delivered', '2026-09-01T00:00:00Z')] }).prisma, 13, deps({ contract: async () => CONTRACT_CLEAR })))!;
    expect(r.class).toBe('CLEAR');
    expect(r.sources.filter((s) => s.verdict === 'hit')).toEqual([]);
    expect(r.clear.allowed).toBe(false);
    expect(r.whatWouldClear).toEqual([]);
  });
  it('the local flag set while clawd answers clear is a plane disagreement: UNRESOLVED', async () => {
    const r = (await loadSuppressionReview(isaacDb().prisma, 13, deps({ contract: async () => CONTRACT_CLEAR })))!;
    expect(r.class).toBe('UNRESOLVED');
    expect(r.whyBlocked.join(' ')).toMatch(/disagree/i);
  });
  it('only the stale bounced status (do_not_contact already false) with a clear contract is still a LEGACY_CONFLICT', async () => {
    const r = (await loadSuppressionReview(isaacDb({ persona: { ...ISAAC, do_not_contact: false } }).prisma, 13, deps({ contract: async () => CONTRACT_CLEAR })))!;
    expect(r.class).toBe('LEGACY_CONFLICT');
  });
  it('prior human decisions on this persona are listed from the ledger', async () => {
    const audit = [
      { id: 'a1', kind: 'suppression.corrected', actor: 'gap-final-pass:correct-historical-suppression', subject_type: 'persona', subject_id: '13', created_at: new Date('2026-09-25T00:00:00Z'), payload: { reason: 'manifest' } },
      { id: 'a2', kind: 'suppression.correction_reverted', actor: 'casey@yardflow.ai', subject_type: 'persona', subject_id: '13', created_at: new Date('2026-09-26T00:00:00Z'), payload: { note: 'restored' } },
      { id: 'a3', kind: 'person.imported_from_hubspot', actor: 'casey@freightroll.com', subject_type: 'persona', subject_id: '13', created_at: new Date('2026-10-05T17:00:00Z'), payload: {} },
      { id: 'zz', kind: 'suppression.corrected', actor: 'x', subject_type: 'persona', subject_id: '99', created_at: new Date('2026-09-25T00:00:00Z'), payload: {} },
    ];
    const r = (await loadSuppressionReview(isaacDb({ audit }).prisma, 13, deps()))!;
    expect(r.humanDecisions.map((d) => d.kind)).toEqual(['suppression.corrected', 'suppression.correction_reverted', 'person.imported_from_hubspot']);
    expect(r.humanDecisions[1]).toEqual({ kind: 'suppression.correction_reverted', actor: 'casey@yardflow.ai', at: '2026-09-26T00:00:00.000Z', note: 'restored' });
    expect(bySource(r.sources).override_history.detail).toMatch(/reverted/i);
  });
  it('an unknown persona is null', async () => {
    expect(await loadSuppressionReview(db({ persona: null }).prisma, 13, deps())).toBeNull();
  });
});

describe('clearLegacyLocalFlag: explicit, confirmed, live-checked, audited, and nothing else', () => {
  const input = { personaId: 13, actor: 'casey@yardflow.ai', now: NOW, confirmed: true as const, expectedEmail: 'Isaac.Scott@pepsico.com' };
  it('(28) a successful clear issues exactly the one raw update inside one transaction, and nothing touches unsubscribed_emails, HubSpot or clawd', async () => {
    const hubspotWrites: unknown[] = [];
    const contractCalls: string[] = [];
    const { prisma, calls, raw, audit } = isaacDb();
    const r = await clearLegacyLocalFlag(prisma, input, deps({ contract: async (e) => { contractCalls.push(e); return MODEX_ONLY; }, hubspot: async () => HUBSPOT_CLEAN }));
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('expected ok');
    expect(r.before).toEqual({ do_not_contact: true, email_status: 'bounced' });
    expect(r.after).toEqual({ do_not_contact: false, email_status: 'unverified' });
    expect(r.auditId).toBe('aud_1');
    expect(r.review.class).toBe('LEGACY_CONFLICT');
    expect(raw).toHaveLength(1);
    expect(raw[0].sql.replace(/\s+/g, ' ')).toMatch(/^update personas set do_not_contact = false, email_status = 'unverified' where id = \$1 and lower\(email\) = lower\(\$2\)/);
    expect(raw[0].sql).not.toMatch(/updated_at/);
    expect(raw[0].sql).toMatch(/email_status not in \('hard_bounce', 'hard_bounced', 'invalid'\)/);
    expect(raw[0].args).toEqual([13, EMAIL]);
    expect(calls.filter((c) => c.includes('executeRaw'))).toEqual(['tx.$executeRawUnsafe']);
    expect(calls.filter((c) => c.includes('create'))).toEqual(['tx.gapAuditEvent.create']);
    expect(calls.filter((c) => /unsubscribedEmail\.(delete|update|create)|persona\.update/.test(c))).toEqual([]);
    expect(hubspotWrites).toEqual([]);
    expect(contractCalls).toEqual([EMAIL]);
    expect(audit).toHaveLength(1);
  });
  it('(29) the clear is audited with the full receipt, updatedAtUntouched true, and no remote write claimed', async () => {
    const { prisma, audit } = isaacDb();
    const r = await clearLegacyLocalFlag(prisma, input, deps());
    expect(r.ok).toBe(true);
    expect(audit[0]).toMatchObject({ kind: 'suppression.corrected', actor: 'casey@yardflow.ai', subject_type: 'persona', subject_id: '13' });
    const p = audit[0].payload as Record<string, unknown>;
    expect(p).toMatchObject({
      email: EMAIL,
      account: 'PepsiCo',
      name: 'Isaac Scott',
      before: { do_not_contact: true, email_status: 'bounced' },
      after: { do_not_contact: false, email_status: 'unverified' },
      class: 'legacy_conflict',
      confirmedBy: 'casey@yardflow.ai',
      correctedAt: NOW.toISOString(),
      updatedAtUntouched: true,
      hubspotWritten: false,
      clawdWritten: false,
      unsubscribeTouched: false,
    });
    const receipt = p.review as { sources: unknown[]; laterDeliveries: unknown[]; lastBounceAt: string; class: string };
    expect(receipt.class).toBe('LEGACY_CONFLICT');
    expect(receipt.sources).toHaveLength(11);
    expect(receipt.laterDeliveries).toHaveLength(3);
    expect(receipt.lastBounceAt).toBe('2026-03-27T10:05:00.000Z');
  });
  it('(27) refuses without confirmed true and refuses a mismatched email, with zero raw writes and one refusal audit each', async () => {
    const a = isaacDb();
    const notConfirmed = await clearLegacyLocalFlag(a.prisma, { ...input, confirmed: false as unknown as true }, deps());
    expect(notConfirmed).toMatchObject({ ok: false, reason: 'not_confirmed' });
    expect(a.raw).toEqual([]);
    expect(a.audit.map((x) => x.kind)).toEqual(['suppression.correction_refused']);
    expect((a.audit[0].payload as Record<string, unknown>).reason).toBe('not_confirmed');
    const b = isaacDb();
    const mismatch = await clearLegacyLocalFlag(b.prisma, { ...input, expectedEmail: 'isaac.scott@fritolay.com' }, deps());
    expect(mismatch).toMatchObject({ ok: false, reason: 'email_mismatch' });
    expect(mismatch.ok === false && mismatch.detail).toMatch(/isaac\.scott@fritolay\.com/);
    expect(b.raw).toEqual([]);
    expect(b.calls).not.toContain('$transaction');
    expect(b.audit.map((x) => x.kind)).toEqual(['suppression.correction_refused']);
  });
  it('(23 / 24 / 25) a hard hit refuses hard_suppression with zero writes: unsubscribe, hard bounce, clawd hard key, HubSpot opt-out', async () => {
    const cases: Array<[string, Parameters<typeof db>[0], Partial<SuppressionReviewDeps>]> = [
      ['unsubscribe', { logs: ISAAC_LOGS, unsubscribed: [{ email: EMAIL, unsubscribed_at: new Date('2026-04-01T00:00:00Z'), reason: null }] }, {}],
      ['hard bounce', { logs: [log('bounced', '2026-03-27T10:05:00Z', { bounce_type: 'hard' })] }, {}],
      ['clawd key', { logs: ISAAC_LOGS }, { contract: async () => ({ ...MODEX_ONLY, keys: ['modex_do_not_contact', 'clawd_do_not_send'] }) }],
      ['hubspot opt-out', { logs: ISAAC_LOGS }, { hubspot: async () => ({ ...HUBSPOT_CLEAN, optedOut: true }) }],
    ];
    for (const [label, seed, d] of cases) {
      const { prisma, raw, audit, calls } = db(seed);
      const r = await clearLegacyLocalFlag(prisma, input, deps(d));
      expect(r, label).toMatchObject({ ok: false, reason: 'hard_suppression' });
      expect(r.ok === false && r.review?.class, label).toBe('CONFIRMED_SUPPRESSION');
      expect(raw, label).toEqual([]);
      expect(calls, label).not.toContain('$transaction');
      expect(audit.map((x) => x.kind), label).toEqual(['suppression.correction_refused']);
      expect((audit[0].payload as Record<string, unknown>).reason, label).toBe('hard_suppression');
    }
  });
  it('(30) an unread authority refuses authority_unreadable; a missing delivery refuses not_legacy_conflict; CLEAR refuses not_legacy_conflict', async () => {
    const a = isaacDb();
    expect(await clearLegacyLocalFlag(a.prisma, input, deps({ contract: async () => 'unreadable' }))).toMatchObject({ ok: false, reason: 'authority_unreadable' });
    expect(a.raw).toEqual([]);
    const b = isaacDb();
    expect(await clearLegacyLocalFlag(b.prisma, input, deps({ contract: async () => ({ ...MODEX_ONLY, unknownLegs: ['sendgrid'] }) }))).toMatchObject({ ok: false, reason: 'authority_unreadable' });
    const c = isaacDb({ logs: ISAAC_LOGS.slice(0, 2) });
    expect(await clearLegacyLocalFlag(c.prisma, input, deps())).toMatchObject({ ok: false, reason: 'not_legacy_conflict' });
    expect(c.raw).toEqual([]);
    const d = db({ persona: { ...ISAAC, do_not_contact: false, email_status: 'verified' } });
    expect(await clearLegacyLocalFlag(d.prisma, input, deps({ contract: async () => CONTRACT_CLEAR }))).toMatchObject({ ok: false, reason: 'not_legacy_conflict' });
    expect(d.raw).toEqual([]);
  });
  it('a row that changed under the click (0 rows updated) is row_changed: the transaction rolls back, no corrected audit, one refusal audit', async () => {
    const { prisma, raw, audit } = isaacDb({ updateRows: 0 });
    const r = await clearLegacyLocalFlag(prisma, input, deps());
    expect(r).toMatchObject({ ok: false, reason: 'row_changed' });
    expect(raw).toHaveLength(1);
    // The fake cannot roll back, so the contract is: the count check throws BEFORE the corrected row is created.
    expect(audit.map((x) => x.kind)).toEqual(['suppression.correction_refused']);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
  it('an unknown persona refuses persona_not_found with no audit', async () => {
    const { prisma, audit, raw } = db({ persona: null });
    expect(await clearLegacyLocalFlag(prisma, input, deps())).toMatchObject({ ok: false, reason: 'persona_not_found', review: null });
    expect(audit).toEqual([]);
    expect(raw).toEqual([]);
  });
});

describe('the default authority reads', () => {
  const env = { CLAWD_CONTROL_PLANE_URL: 'https://clawd.example', CLAWD_CONTROL_PLANE_TOKEN: 'tok' };
  const answer = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  it('the clawd contract read posts the same body as the send gate and maps a good answer', async () => {
    const fetchImpl = vi.fn(answer({ ok: true, results: [{ email: EMAIL, blocked: true, reason: 'modex_do_not_contact', keys: ['modex_do_not_contact', EMAIL], unknown_legs: [] }], legs_read: { clawd: true, hubspot: true, modex: true, sendgrid: true, verbal: true } }));
    const read = createClawdContractRead({ fetchImpl: fetchImpl as unknown as typeof fetch, env });
    expect(await read('Isaac.Scott@pepsico.com')).toEqual({ blocked: true, reason: 'modex_do_not_contact', keys: ['modex_do_not_contact'], unknownLegs: [], legsRead: { clawd: true, hubspot: true, modex: true, sendgrid: true, verbal: true } });
    const call = (fetchImpl.mock.calls as unknown as Array<[string, { body: string; headers: Record<string, string> }]>)[0];
    expect(call[0]).toBe('https://clawd.example/api/suppression/contract');
    expect(JSON.parse(call[1].body)).toEqual({ emails: [EMAIL], automated: true });
    expect(call[1].headers.authorization).toBe('Bearer tok');
  });
  it('the clawd contract read is unreadable on missing config, non-2xx, a malformed body, a wrong email, or a throw', async () => {
    expect(await createClawdContractRead({ fetchImpl: vi.fn(answer({ ok: true, results: [] })) as unknown as typeof fetch, env: {} })(EMAIL)).toBe('unreadable');
    expect(await createClawdContractRead({ fetchImpl: vi.fn(answer({ ok: true, results: [] }, 503)) as unknown as typeof fetch, env })(EMAIL)).toBe('unreadable');
    expect(await createClawdContractRead({ fetchImpl: vi.fn(answer({ ok: true, results: [] })) as unknown as typeof fetch, env })(EMAIL)).toBe('unreadable');
    expect(await createClawdContractRead({ fetchImpl: vi.fn(answer({ ok: true, results: [{ email: 'other@x.com', blocked: false }] })) as unknown as typeof fetch, env })(EMAIL)).toBe('unreadable');
    expect(await createClawdContractRead({ fetchImpl: vi.fn(async () => { throw new Error('net'); }) as unknown as typeof fetch, env })(EMAIL)).toBe('unreadable');
  });
  it('the HubSpot read parses the four properties, is null without a contact id, and unreadable without a token or on an error', async () => {
    const getById = vi.fn(async () => ({ id: '219885493392', properties: { hs_email_optout: 'true', hs_email_bad_address: 'false', hs_email_hard_bounce_reason_enum: '', hs_email_quarantined: null } }));
    const read = createHubSpotSuppressionRead({ client: async () => ({ crm: { contacts: { basicApi: { getById } } } }), env: { HUBSPOT_ACCESS_TOKEN: 't' } });
    expect(await read('219885493392')).toEqual({ optedOut: true, badAddress: false, hardBounceReason: null, quarantined: null });
    expect(getById.mock.calls[0]).toEqual(['219885493392', ['hs_email_optout', 'hs_email_bad_address', 'hs_email_hard_bounce_reason_enum', 'hs_email_quarantined']]);
    expect(await read('')).toBeNull();
    expect(await createHubSpotSuppressionRead({ client: async () => ({ crm: { contacts: { basicApi: { getById } } } }), env: {} })('1')).toBe('unreadable');
    expect(await createHubSpotSuppressionRead({ client: async () => ({ crm: { contacts: { basicApi: { getById: async () => { throw new Error('boom'); } } } } }), env: { HUBSPOT_ACCESS_TOKEN: 't' } })('1')).toBe('unreadable');
  });
});

describe('this surface cannot send, enroll, spend Apollo or write HubSpot', () => {
  it('none of the four source files names a send, enroll, Apollo or HubSpot-write entry point', () => {
    const root = path.resolve(__dirname, '../../..');
    const files = ['src/lib/gap/suppression/legacy-review.ts', 'src/lib/gap/suppression/legacy-review-copy.ts', 'src/app/api/gap/personas/[id]/suppression-review/route.ts', 'src/components/gap/legacy-suppression-review.tsx'];
    for (const f of files) {
      const text = readFileSync(path.join(root, f), 'utf8');
      for (const token of ['sendViaGmail', 'enroll', 'apollo', 'manage_crm', 'upsertContact']) expect(text.includes(token), `${f} contains ${token}`).toBe(false);
      expect(text.includes('—'), `${f} contains an em dash`).toBe(false);
    }
  });
});
