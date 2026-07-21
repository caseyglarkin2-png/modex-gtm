import type { Verdict, QualContact, QualCompany } from './types';

export const ICP_THRESHOLD = 70;
export const SENIOR_SENIORITY = new Set(['executive', 'vp', 'director', 'owner', 'partner']);
export const OPS_TITLE_TOKENS = [
  'operations', 'supply chain', 'transportation', 'transport', 'logistics',
  'warehouse', 'distribution', 'fleet', 'freight', 'dock', 'yard', 'procurement', 'planning',
];

type RoleInput = { hs_seniority: string; hs_role: string; jobtitle: string };

export function hasRoleGate(c: RoleInput): boolean {
  const sen = (c.hs_seniority || '').toLowerCase();
  if (SENIOR_SENIORITY.has(sen)) return true;
  if ((c.hs_role || '').toLowerCase() === 'operations') return true;
  const title = ` ${(c.jobtitle || '').toLowerCase()} `;
  if (OPS_TITLE_TOKENS.some((t) => title.includes(t)) || title.includes(' dc '))
    return true;
  return false;
}

type IntentInput = Pick<QualContact,
  'intent_score' | 'last_intent_at' | 'last_intent_source' |
  'hs_sales_email_last_replied' | 'hs_email_open' | 'hs_email_replied' |
  'engagements_last_meeting_booked'>;

const num = (s: string): number => { const n = parseFloat(s); return Number.isNaN(n) ? 0 : n; };

// ---------------------------------------------------------------------------
// REPLY PROVENANCE (2026-07-21). A reply may only promote the person who
// actually WROTE it. Two sources claim to carry that fact; only one can.
//
// `hs_sales_email_last_replied` — HubSpot-managed, read-only to us. HubSpot
//   labels it "the most recent email from this contact", but that is not what it
//   measures: the connected-inbox auto-logger associates an inbound email with
//   EVERY CONTACT ON THE THREAD and derives the property from that association.
//   Proven 2026-07-08 — three Boston Beer contacts carry the identical stamp
//   18:57:22Z because ONE of them (Brian Kellogg) replied at 18:57:18. One human
//   reply promoted three people. It is equally blind to autoresponders: of 192
//   SQLs demoted on 2026-07-21, 188 were traced to out-of-office replies
//   carrying an RFC 3834 Auto-Submitted header. The property has no field that
//   separates writer from bystander and no field that separates human from
//   machine, so NO threshold, corroboration or recency rule can rescue it. It is
//   read into QualContact for diagnostics and is deliberately NOT a promotion
//   basis. Do not add it back.
//
// `last_intent_source` = VERIFIED_REPLY_INTENT_SOURCE — written by us, in
//   /api/cron/check-inbox, on exactly one contact: the one resolved from the
//   inbound message's From address, and only after classifyInboundReply()
//   (src/lib/email/reply-precision.ts) certifies the message as human. Sender
//   attribution is structural: we read the envelope, not a thread association.
//
// `last_intent_source` = LEGACY_REPLY_INTENT_SOURCE — the same stamp written
//   BEFORE the precision gate shipped, i.e. ungated. Every one of the 8 contacts
//   holding it portal-wide on 2026-07-21 was machine mail or internal
//   (noreply@statuspage.io, editors-noreply@linkedin.com, jake@freightroll.com,
//   fred@fireflies.ai, ...). It is treated as no evidence rather than requiring a
//   HubSpot cleanup write to become safe.
// ---------------------------------------------------------------------------
export const VERIFIED_REPLY_INTENT_SOURCE = 'email_reply_verified';
export const LEGACY_REPLY_INTENT_SOURCE = 'email_reply';

/** Sources that assert "this person replied" without proving who typed it. */
const UNVERIFIED_REPLY_SOURCES = new Set<string>([LEGACY_REPLY_INTENT_SOURCE]);

export function hasIntent(c: IntentInput): boolean {
  // Bases that are independently attributable to this person: a scored browsing
  // session of their own, a meeting they booked, or marketing-email engagement
  // keyed to their own address. Checked first so a stale reply stamp can never
  // mask a real signal.
  if (num(c.intent_score) >= 1) return true;
  if (c.engagements_last_meeting_booked) return true;
  if (num(c.hs_email_open) >= 2 && num(c.hs_email_replied) >= 1) return true;

  const source = (c.last_intent_source || '').trim().toLowerCase();
  if (source === VERIFIED_REPLY_INTENT_SOURCE) return true;
  // An ungated reply stamp is not evidence, and `last_intent_at` was written by
  // the same call, so it cannot be used as a fallback here either.
  if (UNVERIFIED_REPLY_SOURCES.has(source)) return false;
  if (source) return true;          // a web/demo//for surface the contact loaded
  if (c.last_intent_at) return true; // timestamped engagement, surface not recorded

  // hs_sales_email_last_replied is intentionally not consulted. See above.
  return false;
}

// ---------------------------------------------------------------------------
// The keystone join (2026-07-20): account-grade heat promotes the committee.
//
// Before this, classifyContact only ever read PERSON-level engagement, so a hot
// ACCOUNT whose individual contacts had no email reply stayed MQL forever and
// all /demo + /for traffic produced zero SQLs. Now a role-gated contact at an
// account whose own intent/trigger heat clears the threshold can promote to SQL.
//
// GUARDRAILS (added after the adversarial critic caught over-promotion):
//  - THRESHOLD 60: computeIntentScore floors at 10 and a casual ~2-minute view
//    already scores ~40-70, so 40 fired on a single anonymous page view. 60
//    requires a genuinely engaged session, not a glance.
//  - RECENCY: intent_score is last-write-wins with no decay, so a stale score
//    would hold an account "hot" forever. We require lastIntentAt within
//    ACCOUNT_INTENT_MAX_AGE_DAYS. (trigger_score decays in its own heat plane.)
//  - PER-ACCOUNT CAP: applied in buildDiff, not here — a single signal must not
//    flip an entire 500-person committee to SQL. Only the top-N seniors promote
//    on account heat alone; the rest stay MQL. See accountIntentSqlCap().
// Person-level SQLs (hasIntent) are individually earned and are never capped.
// ---------------------------------------------------------------------------
const envNum = (name: string, fallback: number): number => {
  const v = parseFloat(process.env[name] ?? '');
  return Number.isFinite(v) ? v : fallback;
};
export const ACCOUNT_INTENT_SQL_THRESHOLD = envNum('QUAL_ACCOUNT_INTENT_SQL_THRESHOLD', 60);
export const ACCOUNT_TRIGGER_SQL_THRESHOLD = envNum('QUAL_ACCOUNT_TRIGGER_SQL_THRESHOLD', 60);
export const ACCOUNT_INTENT_MAX_AGE_DAYS = envNum('QUAL_ACCOUNT_INTENT_MAX_AGE_DAYS', 30);
export const ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT = envNum('QUAL_ACCOUNT_INTENT_SQL_CAP', 10);

/** True when the account's OWN heat is high enough AND recent enough to promote
 * its committee. `nowMs` is injectable for tests. Reading-intent requires a
 * fresh lastIntentAt (no decay on the field); trigger heat carries its own
 * decay upstream so it is gated on magnitude alone. */
export function hasAccountIntent(company: QualCompany | null, nowMs: number = Date.now()): boolean {
  if (!company) return false;
  const intent = company.intentScore ?? 0;
  if (intent >= ACCOUNT_INTENT_SQL_THRESHOLD) {
    const at = Date.parse(company.lastIntentAt ?? '');
    const fresh = Number.isFinite(at) && nowMs - at <= ACCOUNT_INTENT_MAX_AGE_DAYS * 86_400_000;
    if (fresh) return true;
  }
  if ((company.triggerScore ?? 0) >= ACCOUNT_TRIGGER_SQL_THRESHOLD) return true;
  return false;
}

export function classifyContact(
  company: QualCompany | null,
  contact: QualContact,
  nowMs: number = Date.now(),
): Verdict {
  if (!company || company.tam !== 'in') return 'none';
  if (!hasRoleGate(contact)) return 'none'; // account heat never bypasses the role gate
  if (hasIntent(contact) || hasAccountIntent(company, nowMs)) return 'sql';
  return 'mql';
}

/** Seniority rank for the per-account cap: higher = worked first. Executive
 * leaders outrank structured ops roles outrank title-only matches. */
export function seniorityRank(c: RoleInput): number {
  const sen = (c.hs_seniority || '').toLowerCase();
  if (sen === 'executive') return 5;
  if (sen === 'vp' || sen === 'owner' || sen === 'partner') return 4;
  if (sen === 'director') return 3;
  if ((c.hs_role || '').toLowerCase() === 'operations') return 2;
  return 1;
}
