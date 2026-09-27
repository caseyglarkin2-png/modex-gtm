/**
 * Final red team (buyer lens, P1): a first-touch card is a snapshot, and
 * routing runs on a schedule. A card minted before the person moved must not
 * draft or send a cold first touch that ignores what happened since.
 */
import { describe, expect, it, vi } from 'vitest';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { NOW, db, prismaOf, baseDeps, type Db } from './fixtures/seller-db';

const DAY = 86_400_000;
const CARD_AT = new Date(NOW.getTime() - 40 * DAY);
const after = (days: number) => new Date(CARD_AT.getTime() + days * DAY);
const JOEY = 'joey.maggard@kroger.com';

function staleDb(extra: Partial<Db>): Db {
  const d = db();
  d.decisions.find((x) => x.id === 'dec-joey').created_at = CARD_AT;
  return Object.assign(d, extra);
}
const draft = (d: Db) => createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d));

describe('final regression: a stale first-touch card refuses decision_stale', () => {
  it.each<[string, Partial<Db>, string]>([
    ['a confirmed substantive disposition after the card', { dispositions: [{ contact_email: JOEY, human_confirmed: true, response_class: 'not_now', created_at: after(2) }] }, 'not now'],
    ['their own email after the card (older than the account hold)', { inbound: [{ from_email: 'Joey.Maggard@kroger.com', subject: 'Re: yards', received_at: after(1) }] }, 'wrote in'],
    ['another email we sent them after the card', { emailLogs: [{ to_email: JOEY, sent_at: after(3) }] }, 'emailed'],
    ['a live sequence enrollment', { enrollments: [{ to_email: JOEY, persona_id: 1886, status: 'active', is_test: false }] }, 'enrollment'],
    ['an Outbox draft in flight', { draftQueue: [{ to_email: JOEY, status: 'approved' }] }, 'Outbox draft'],
  ])('%s', async (_label, extra, detail) => {
    const r = await draft(staleDb(extra));
    expect(r).toMatchObject({ ok: false, reason: 'decision_stale' });
    expect(r.ok ? '' : String(r.detail)).toContain(detail);
  });

  it.each<[string, Partial<Db>]>([
    ['no answer / voicemail / out of office are not movement', { dispositions: ['no_answer', 'voicemail', 'gatekeeper', 'out_of_office'].map((c, i) => ({ contact_email: JOEY, human_confirmed: true, response_class: c, created_at: after(i + 1) })) }],
    ['an unconfirmed (suggested) disposition is not movement', { dispositions: [{ contact_email: JOEY, human_confirmed: false, response_class: 'not_now', created_at: after(2) }] }],
    ['everything BEFORE the card is what the card already saw', { dispositions: [{ contact_email: JOEY, human_confirmed: true, response_class: 'not_now', created_at: after(-2) }], emailLogs: [{ to_email: JOEY, sent_at: after(-1) }], inbound: [{ from_email: JOEY, subject: 'Re', received_at: after(-3) }] }],
    ['a test enrollment, a stopped enrollment and a sent Outbox item are not in flight', { enrollments: [{ to_email: JOEY, persona_id: 1886, status: 'active', is_test: true }, { to_email: JOEY, persona_id: 1886, status: 'stopped', is_test: false }], draftQueue: [{ to_email: JOEY, status: 'sent' }, { to_email: JOEY, status: 'skipped' }] }],
    ["someone else's history", { emailLogs: [{ to_email: 'jason.gaiser@kroger.com', sent_at: after(3) }], draftQueue: [{ to_email: 'jason.gaiser@kroger.com', status: 'draft' }] }],
  ])('not stale: %s', async (_label, extra) => {
    expect(await draft(staleDb(extra))).toMatchObject({ ok: true });
  });
});

describe('ops closeout 14: the send gate reads the canonical bounce vocabulary', () => {
  it.each(['bounced', 'hard_bounce', 'hard_bounced', 'Hard_Bounce'])('a persona whose email_status is %s is refused email_bounced (even without do_not_contact)', async (status) => {
    const d = db();
    d.personas.find((p) => p.id === 1886).email_status = status;
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'email_bounced' });
  });
});

describe('ops closeout 15: a Gmail draft reads the live-conversation guard too', () => {
  it('an active opportunity (open deal, booked meeting, recent positive reply) refuses the DRAFT, not only the send', async () => {
    const d = db();
    const activeOpportunity = vi.fn(async () => true);
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), activeOpportunity });
    expect(r).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(activeOpportunity).toHaveBeenCalledWith(expect.anything(), 'Kroger', JOEY, NOW);
  });

  it('no live conversation: the draft proceeds', async () => {
    const d = db();
    expect(await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), activeOpportunity: async () => false })).toMatchObject({ ok: true });
  });
});
