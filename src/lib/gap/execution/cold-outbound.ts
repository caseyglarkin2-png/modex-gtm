/**
 * Cold CALL / LINKEDIN from GAP (last mile, 2026-09-27).
 *
 * Email draft, send and enroll re-read HubSpot opportunity truth at the click.
 * A cold call or LinkedIn message from a card is the same outbound decision,
 * so it runs the SAME action-time check (enroll/service.ts
 * checkActiveOpportunityNow, over the canonical resolver in
 * opportunity/active-opportunity.ts) before GAP releases the dial or profile
 * link:
 *
 *   CLEAR    the tel: / LinkedIn link, to act on now
 *   ACTIVE   refused: work the account from the existing deal
 *   UNKNOWN  refused, fail closed: check HubSpot first
 *
 * Anything that is not a well-formed CLEAR (a throw, a malformed verdict) is
 * UNKNOWN. Read only: nothing is written, nothing is sent. Logging a call that
 * already happened (inbound, or completed) does not come through here.
 */
import { checkActiveOpportunityNow, type ActionTimeOpportunityCheck } from '../enroll/service';
import { OPPORTUNITY_UNKNOWN_COPY } from '../opportunity/active-opportunity';
import { telHref } from '../routing/seller-action';
import { checkThesisCurrent, type ThesisCurrentnessCheck } from './thesis-currentness';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ColdChannel = 'call' | 'linkedin';

export type ColdOutboundRefusal =
  | 'decision_not_found'
  | 'no_phone'
  | 'no_linkedin'
  | 'active_opportunity'
  | 'opportunity_unknown'
  | 'persona_do_not_contact'
  | 'decision_blocked'
  | 'decision_superseded'
  | 'thesis_needs_review'
  | 'thesis_currentness_unknown';

export type ColdOutboundResult =
  | { ok: true; channel: ColdChannel; href: string }
  | { ok: false; reason: ColdOutboundRefusal; message: string };

const WORK_THE_DEAL: Record<ColdChannel, string> = {
  call: 'Work this account from the existing deal or opportunity, not a cold call.',
  linkedin: 'Work this account from the existing deal or opportunity, not a cold LinkedIn message.',
};

/** Only an http(s) profile URL is ever opened. */
function linkedinHref(raw: string | null | undefined): string | null {
  const url = String(raw ?? '').trim();
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
}

export async function checkColdOutbound(
  prisma: PrismaLike,
  input: { decisionId: string; channel: ColdChannel; now: Date },
  deps: { opportunity?: ActionTimeOpportunityCheck; thesisCurrent?: ThesisCurrentnessCheck } = {},
): Promise<ColdOutboundResult> {
  const decision: { account_name: string; persona_id: number | null; hypothesis_id: string | null; action: string; lane: string; created_at: Date } | null = await prisma.routingDecision.findUnique({
    where: { id: input.decisionId },
    select: { account_name: true, persona_id: true, hypothesis_id: true, action: true, lane: true, created_at: true },
  });
  if (!decision || decision.persona_id == null) return { ok: false, reason: 'decision_not_found', message: 'This card has no person to contact.' };
  // Execution acceptance: the card itself must still stand (an old deep link never revives a stale or blocked card).
  if (decision.lane === 'blocked' || decision.action === 'do_not_contact') return { ok: false, reason: 'decision_blocked', message: 'This card is blocked. Nobody is contacted from it.' };
  const newer: { id: string; action: string; rule_id: string } | null = await prisma.routingDecision.findFirst({
    where: { persona_id: decision.persona_id, account_name: decision.account_name, created_at: { gt: decision.created_at } },
    orderBy: { created_at: 'desc' },
    select: { id: true, action: true, rule_id: true },
  });
  if (newer) return { ok: false, reason: 'decision_superseded', message: `A newer routing run changed this card to ${newer.action.replace(/_/g, ' ')} (${newer.rule_id.replace(/_/g, ' ')}). Open the current card.` };
  const persona: { email: string | null; phone: string | null; linkedin_url: string | null; do_not_contact?: boolean | null } | null = await prisma.persona.findUnique({
    where: { id: decision.persona_id },
    select: { email: true, phone: true, linkedin_url: true, do_not_contact: true },
  });
  if (!persona) return { ok: false, reason: 'decision_not_found', message: 'This card has no person to contact.' };
  if (persona.do_not_contact) return { ok: false, reason: 'persona_do_not_contact', message: 'This person is marked do not contact.' };
  if (decision.hypothesis_id) {
    const tc = await (deps.thesisCurrent ?? checkThesisCurrent)(prisma, decision.account_name, decision.hypothesis_id, input.now);
    if (tc.current === false) return { ok: false, reason: 'thesis_needs_review', message: `Review the thesis first: ${tc.reason}${tc.bestFact ? ` Current best fact: "${tc.bestFact}"` : ''}` };
    if (tc.current !== true) return { ok: false, reason: 'thesis_currentness_unknown', message: tc.reason };
  }

  const href = input.channel === 'call' ? telHref(persona.phone) : linkedinHref(persona.linkedin_url);
  if (!href) {
    return input.channel === 'call'
      ? { ok: false, reason: 'no_phone', message: 'No usable phone number on file.' }
      : { ok: false, reason: 'no_linkedin', message: 'No LinkedIn profile on file.' };
  }

  let verdict: Awaited<ReturnType<ActionTimeOpportunityCheck>> | undefined;
  try {
    verdict = await (deps.opportunity ?? checkActiveOpportunityNow)(prisma, decision.account_name, persona.email ?? '', input.now);
  } catch (e) {
    return { ok: false, reason: 'opportunity_unknown', message: `${OPPORTUNITY_UNKNOWN_COPY} (${e instanceof Error ? e.message : String(e)})` };
  }
  if (verdict?.status === 'ACTIVE') return { ok: false, reason: 'active_opportunity', message: `${WORK_THE_DEAL[input.channel]} ${verdict.detail}` };
  if (verdict?.status !== 'CLEAR') {
    const detail = verdict?.status === 'UNKNOWN' ? String(verdict.detail ?? '') : '';
    // The family reason ("Could not read the related accounts...", "Related account activity...") is kept too.
    return { ok: false, reason: 'opportunity_unknown', message: detail.startsWith(OPPORTUNITY_UNKNOWN_COPY) || /corporate family|related account|parent and child companies/i.test(detail) ? detail : OPPORTUNITY_UNKNOWN_COPY };
  }
  return { ok: true, channel: input.channel, href };
}
