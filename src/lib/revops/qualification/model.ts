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

export function classifyContact(company: QualCompany | null, contact: QualContact): Verdict {
  if (!company || company.tam !== 'in') return 'none';
  if (!hasRoleGate(contact)) return 'none';
  if (hasIntent(contact)) return 'sql';
  return 'mql';
}
