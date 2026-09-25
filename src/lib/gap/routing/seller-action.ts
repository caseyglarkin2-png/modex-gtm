/**
 * Seller Action Center (dogfood fix, 2026-09-25): translate an internal
 * RoutingAction into the instruction a seller actually reads, and build the
 * direct contact links a card can offer. Pure, no Prisma, no fetch -- the
 * raw RoutingAction stays visible everywhere for audit; this only adds a
 * human-facing label alongside it, never replaces the stored value.
 */

import type { RoutingAction } from '../taxonomy';

/**
 * `{name}` is filled with the persona's first name (or "them" when no name
 * is known); `{account}` with the account name. Every routing action has an
 * entry -- a seller must never be shown the raw enum string as an instruction.
 */
const SELLER_ACTION_TEMPLATE: Record<RoutingAction, string> = {
  enroll_gap_sequence: 'Email {name}',
  one_off_email: 'Email {name}',
  call_now: 'Call {name}',
  linkedin_manual_task: 'Message {name} on LinkedIn',
  research_required: 'Research {name} / {account}',
  approve_hypothesis: 'Review hypothesis',
  nurture: 'Hold for later',
  do_not_contact: 'Do not contact',
};

export function sellerActionLabel(action: RoutingAction | string, firstName: string | null, accountName: string): string {
  const template = action in SELLER_ACTION_TEMPLATE ? SELLER_ACTION_TEMPLATE[action as RoutingAction] : action.replace(/_/g, ' ');
  return template.replace('{name}', firstName?.trim() || 'them').replace('{account}', accountName);
}

/** Actions where the primary instruction is to send outreach (eligible for an email/call action pack). */
export const OUTREACH_ROUTING_ACTIONS: ReadonlySet<RoutingAction> = new Set(['enroll_gap_sequence', 'one_off_email']);

/**
 * YardFlow's HubSpot portal. A public identifier (it is in every HubSpot URL),
 * not a secret. The default exists because production never set
 * NEXT_PUBLIC_HUBSPOT_PORTAL_ID, so every HubSpot button on the Seller Action
 * Center silently rendered nothing (final pass, 2026-09-25). An env value
 * still wins.
 */
export const DEFAULT_HUBSPOT_PORTAL_ID = '3819073';

/** Read lazily (not captured at module load) so tests can stub the env var. */
function hubspotPortalId(): string {
  return process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || process.env.HUBSPOT_PORTAL_ID || DEFAULT_HUBSPOT_PORTAL_ID;
}

/** Same URL convention as src/app/contacts/contacts-table.tsx and src/app/accounts/[slug]/page.tsx. */
export function hubspotContactUrl(hubspotContactId: string): string | null {
  const portal = hubspotPortalId();
  if (!portal || !hubspotContactId) return null;
  return `https://app.hubspot.com/contacts/${portal}/contact/${hubspotContactId}`;
}

export function hubspotCompanyUrl(hubspotCompanyId: string): string | null {
  const portal = hubspotPortalId();
  if (!portal || !hubspotCompanyId) return null;
  return `https://app.hubspot.com/contacts/${portal}/company/${hubspotCompanyId}`;
}

/** Digits only, for a `tel:` link; null when there is nothing usable. */
export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length >= 7 ? `tel:${digits}` : null;
}

export function mailtoHref(email: string | null): string | null {
  return email ? `mailto:${email}` : null;
}
