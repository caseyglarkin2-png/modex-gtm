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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ColdChannel = 'call' | 'linkedin';

export type ColdOutboundRefusal = 'decision_not_found' | 'no_phone' | 'no_linkedin' | 'active_opportunity' | 'opportunity_unknown';

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
  deps: { opportunity?: ActionTimeOpportunityCheck } = {},
): Promise<ColdOutboundResult> {
  const decision: { account_name: string; persona_id: number | null } | null = await prisma.routingDecision.findUnique({
    where: { id: input.decisionId },
    select: { account_name: true, persona_id: true },
  });
  if (!decision || decision.persona_id == null) return { ok: false, reason: 'decision_not_found', message: 'This card has no person to contact.' };
  const persona: { email: string | null; phone: string | null; linkedin_url: string | null } | null = await prisma.persona.findUnique({
    where: { id: decision.persona_id },
    select: { email: true, phone: true, linkedin_url: true },
  });
  if (!persona) return { ok: false, reason: 'decision_not_found', message: 'This card has no person to contact.' };

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
    return { ok: false, reason: 'opportunity_unknown', message: detail.startsWith(OPPORTUNITY_UNKNOWN_COPY) ? detail : OPPORTUNITY_UNKNOWN_COPY };
  }
  return { ok: true, channel: input.channel, href };
}
