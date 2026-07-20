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

export function hasIntent(c: IntentInput): boolean {
  if (num(c.intent_score) >= 1) return true;
  if (c.last_intent_at) return true;
  if (c.last_intent_source) return true;
  if (c.hs_sales_email_last_replied) return true;
  if (c.engagements_last_meeting_booked) return true;
  if (num(c.hs_email_open) >= 2 && num(c.hs_email_replied) >= 1) return true;
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
