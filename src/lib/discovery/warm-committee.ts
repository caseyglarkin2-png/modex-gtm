/**
 * Warm-committee feeder — the spine that turns WARM accounts into a Clawd
 * draft-batch hand-off.
 *
 * The discovery worklist (dispatch-daily) feeds COLD prospects to Clawd. This
 * feeds the other, higher-value end: accounts whose OWN heat clears the
 * qualification threshold (a real /demo or /for engagement), and their
 * role-gated buying-committee contacts. Clawd's spear_factory drafts the legit,
 * individual 1:1 copy; the queue drain sends it, gated by recipient-guard +
 * OUTREACH_PAUSED + the reply-pause. So the motion is as hands-off as possible
 * AND as legitimate as possible.
 *
 * Everything here is PURE (no I/O): the route supplies the HubSpot data and the
 * dispatch. That keeps the selection policy fully unit-testable.
 */
import type { QualCompany, QualContact } from '@/lib/revops/qualification/types';
import {
  hasAccountIntent,
  hasRoleGate,
  SENIOR_SENIORITY,
  ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT,
} from '@/lib/revops/qualification/model';
import { isRoleMailbox, getEmailDomain, getEmailLocalPart } from '@/lib/email/recipient-guard';
import { INTERNAL_DOMAINS } from '@/lib/email/reply-precision';

export interface WarmCommitteeContact {
  contactId: string;
  email: string;
  firstName: string;
  lastName: string;
  jobtitle: string;
  seniority: string;
}

export interface WarmCommitteeTarget {
  companyId: string;
  account: string;
  tier: string;
  /** Why this account is warm — carried so Clawd can ground the 1:1 copy in the
   * account's real engagement (e.g. lastIntentSource '/demo/kroger'). */
  intentScore: number;
  triggerScore: number;
  lastIntentSource: string;
  lastIntentAt: string;
  contacts: WarmCommitteeContact[];
}

export interface SelectWarmInput {
  companies: QualCompany[];
  /** company id -> its associated contacts (HubSpot). */
  contactsByCompanyId: Record<string, QualContact[]>;
  nowMs?: number;
  /** Lowercased emails already emailed/queued recently (or otherwise off-limits),
   * excluded from the committee. The route builds this from EmailLog +
   * DraftQueueItem + UnsubscribedEmail so we never re-touch a live thread. */
  suppressedEmails?: Set<string>;
  /** Max committee contacts per account (top seniors). Defaults to the same cap
   * qualification uses so a single hot signal never floods a 500-person roster. */
  perAccountCap?: number;
}

// Lower rank = contacted first when the per-account cap trims the committee.
// Reuses the exported SENIOR_SENIORITY set so the ordering can never drift from
// the qualification engine's own notion of seniority.
function seniorityRank(c: QualContact): number {
  const sen = (c.hs_seniority || '').toLowerCase();
  if (sen === 'executive' || sen === 'owner' || sen === 'partner') return 0;
  if (sen === 'vp') return 1;
  if (sen === 'director') return 2;
  if (SENIOR_SENIORITY.has(sen)) return 3;
  if ((c.hs_role || '').toLowerCase() === 'operations') return 4;
  return 5; // ops-title-only committee member
}

/** A contact is a sendable committee seat: role-gated, with a real individual
 * mailbox (has a domain, not a role/shared alias, not one of our own domains),
 * and not on the suppression list. */
export function isSendableCommitteeContact(c: QualContact, suppressed: Set<string>): boolean {
  if (!hasRoleGate({ hs_seniority: c.hs_seniority, hs_role: c.hs_role, jobtitle: c.jobtitle })) return false;
  const email = (c.email || '').trim().toLowerCase();
  if (!email) return false;
  const domain = getEmailDomain(email);
  if (!domain) return false;
  if ((INTERNAL_DOMAINS as readonly string[]).includes(domain)) return false;
  if (isRoleMailbox(getEmailLocalPart(email))) return false;
  if (suppressed.has(email)) return false;
  return true;
}

/**
 * Select warm accounts and their sendable committee. Pure. An account qualifies
 * on `hasAccountIntent` (its own heat, threshold + recency); its committee is
 * the role-gated, individually-addressable, non-suppressed contacts, capped to
 * the top `perAccountCap` seniors. Accounts with no sendable committee are
 * dropped (nothing to hand off).
 */
export function selectWarmCommitteeTargets(input: SelectWarmInput): WarmCommitteeTarget[] {
  const nowMs = input.nowMs ?? Date.now();
  const suppressed = input.suppressedEmails ?? new Set<string>();
  const cap = input.perAccountCap ?? ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT;

  const targets: WarmCommitteeTarget[] = [];
  for (const company of input.companies) {
    if (!hasAccountIntent(company, nowMs)) continue;
    const contacts = (input.contactsByCompanyId[company.id] ?? [])
      .filter((c) => isSendableCommitteeContact(c, suppressed))
      .sort((a, b) => seniorityRank(a) - seniorityRank(b))
      .slice(0, Math.max(0, cap))
      .map((c) => ({
        contactId: c.id,
        email: (c.email || '').trim().toLowerCase(),
        firstName: c.firstname || '',
        lastName: c.lastname || '',
        jobtitle: c.jobtitle || '',
        seniority: c.hs_seniority || '',
      }));
    if (contacts.length === 0) continue;
    targets.push({
      companyId: company.id,
      account: company.name,
      tier: company.tier || '',
      intentScore: company.intentScore ?? 0,
      triggerScore: company.triggerScore ?? 0,
      lastIntentSource: company.lastIntentSource ?? '',
      lastIntentAt: company.lastIntentAt ?? '',
      contacts,
    });
  }
  return targets;
}

export interface WarmDraftBatchPayload {
  owner: string;
  requestedBy: string;
  source: 'warm-committee';
  targets: WarmCommitteeTarget[];
}

/** Build the Clawd draft-batch payload for warm committee targets. Pure. The
 * `warm-committee` source tells Clawd to draft account-grounded 1:1 copy per
 * contact (spear_factory) rather than the cold proximity hook. */
export function buildWarmDraftBatchPayload(
  targets: WarmCommitteeTarget[],
  owner: string,
): WarmDraftBatchPayload {
  return { owner, requestedBy: owner, source: 'warm-committee', targets };
}
