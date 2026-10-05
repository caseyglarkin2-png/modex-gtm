/**
 * OPERATOR CONTACT AUDIT (seller dogfood correction, 2026-10-04). A READ-ONLY view of who GAP would lead with at an
 * account, slot by slot, built ONLY from what the account page already computes: the brief's buyer map (GAP contacts
 * and every associated HubSpot person, ranked by the one person prior) and the Apollo projection. It is a diagnostic,
 * never a second recommendation authority: no new ranking, no score, no write.
 *
 *   DIRECT OPERATOR       the cold WHO (person-prior isColdWho)
 *   TECH / TRANSFORMATION transportation-scoped technology or transformation (a co-buyer)
 *   SPONSOR               the supply chain / operations executive (buyer map, never the cold default)
 *   SITE                  a plant, DC or yard leader (pilots, local validation)
 *   MISSING / APOLLO      the role still needed, and whether a credit could change the decision (Casey decides)
 *
 * stageableResearch: which web-research finds may become a STAGED AccountContactCandidate (Casey reviews and
 * promotes; nothing becomes a contact, a HubSpot record or a send).
 */
import type { AccountInputs, AccountIntelligenceBrief, MappedPerson } from '../account-intel/build';
import { apolloCandidates } from './apollo-candidates';
import { readPerson } from './person-prior';
import type { ResearchedContact } from '@/lib/discovery/research';

export interface AuditPerson {
  name: string;
  title: string | null;
  geo: string;
  division: string | null;
  source: 'GAP' | 'HubSpot';
  why: string;
}

export interface OperatorAudit {
  account: string;
  counts: { gap: number; hubspot: number | 'not read' | 'no HubSpot company'; hubspotTruncated: boolean; staged: number };
  direct: AuditPerson | null;
  alternate: AuditPerson | null;
  tech: AuditPerson | null;
  sponsor: AuditPerson | null;
  site: AuditPerson | null;
  /** Every direct-operator candidate considered, in comparator order. */
  operators: AuditPerson[];
  /** The ten most relevant people (operating, tech, sponsor and site lanes): lane order, then comparator order. */
  top: Array<AuditPerson & { lane: string }>;
  missing: string[];
  apollo: Array<{ kind: string; target: string; why: string }>;
  apolloNote: string | null;
  /** A staged candidate already found as a direct operator (review it before any credit). */
  stagedOperator: string | null;
}

const RELEVANT = new Set(['PRIMARY_OPERATOR', 'TRANSFORMATION_TECH', 'ADJACENT_OPERATOR', 'EXECUTIVE_SPONSOR', 'FACILITY_OPERATOR']);
const GEO: Record<string, string> = { NA_REMIT: 'NA remit', US_CONFIRMED: 'US', CANADA_CONFIRMED: 'Canada', MEXICO_CONFIRMED: 'Mexico', OTHER_REGION: 'other region', UNKNOWN: 'unknown' };

const view = (p: MappedPerson): AuditPerson => ({ name: p.name, title: p.title, geo: GEO[p.geo ?? 'UNKNOWN'] ?? 'unknown', division: p.division ?? null, source: p.source === 'hubspot' ? 'HubSpot' : 'GAP', why: p.why });

export function operatorAudit(brief: AccountIntelligenceBrief, i: AccountInputs): OperatorAudit {
  const p = brief.people;
  // The buyer map's lanes come in the prior's order, and each lane keeps the comparator's order inside it.
  const all = p ? p.lanes.flatMap((l) => l.people) : [];
  const operators = (p?.lanes.find((l) => l.lane === 'PRIMARY_OPERATOR')?.people ?? []).filter((x) => !x.doNotContact).map(view);
  const top = all.filter((x) => RELEVANT.has(x.lane) && !x.doNotContact).slice(0, 10).map((x) => ({ ...view(x), lane: x.laneLabel }));
  const missing: string[] = [];
  if (!p?.primary) missing.push('Direct transportation / logistics / fleet operator (cold WHO): research required');
  if (!p?.tech) missing.push('Transportation technology / transformation owner');
  if (!p?.sponsor) missing.push('Supply chain sponsor');
  const a = apolloCandidates(brief, i);
  const staged = i.candidates.find((c) => !!c.title && readPerson(c.title).lane === 'PRIMARY_OPERATOR');
  return {
    account: brief.accountName,
    counts: { gap: i.personas.length, hubspot: i.hubspotPeople ? i.hubspotPeople.people.length : i.account.hubspotCompanyId ? 'not read' : 'no HubSpot company', hubspotTruncated: !!i.hubspotPeople?.truncated, staged: i.candidates.length },
    direct: p?.primary ? view(p.primary) : null,
    alternate: p?.alternate ? view(p.alternate) : null,
    tech: p?.tech ? view(p.tech) : null,
    sponsor: p?.sponsor ? view(p.sponsor) : null,
    site: p?.site ? view(p.site) : null,
    operators,
    top,
    missing,
    apollo: a.candidates.map((c) => ({ kind: c.kind, target: c.target, why: c.whyItMatters })),
    apolloNote: a.notNeeded,
    stagedOperator: staged ? `${staged.name}${staged.title ? `, ${staged.title}` : ''}` : null,
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ' ').trim();

/**
 * Web-research finds that may be STAGED for Casey: a direct operator (the slot the person prior gives the title),
 * with a source URL, not already a GAP contact, HubSpot person or staged candidate at the account (by name). Never
 * an email unless the source published it (the research parser already drops guessed emails).
 */
export function stageableResearch(found: readonly ResearchedContact[], known: readonly string[]): ResearchedContact[] {
  const have = new Set(known.map(norm));
  return found.filter((f) => f.slot === 'DIRECT_OPERATOR' && !!f.sourceUrl && !have.has(norm(f.name)));
}
