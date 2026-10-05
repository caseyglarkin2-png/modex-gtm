/**
 * OWNER RESOLUTION (seller dogfood correction, 2026-10-05). ONE reusable read: who should GAP test this account
 * (and this hypothesis) with? It answers three seller moments with the same candidates and the same reasons:
 *
 *   A. NOW, when WHO exists only in HubSpot (ADD TO GAP)
 *   B. an APPROVED hypothesis with no primary person, when Casey asks to use it (ADD + USE / USE THIS PERSON)
 *   C. Research Next, when nobody suitable is on record (FIND OPERATOR)
 *
 * It is a projection over what GAP already holds: GAP contacts, the account's live HubSpot people, staged contact
 * candidates, relationships, the ONE person prior (person-prior.ts), contact currentness (employment.ts), the entity
 * boundary (entity-boundary.ts) and the hypothesis (thesis-relevance.ts). No new authority, no score, no write, no
 * Apollo. Every candidate carries its reasons in words. Where more than one owner is plausible it says CHOOSE and
 * picks nobody; where exactly one canonical GAP person is an overwhelming fit it may preselect them, and Casey still
 * presses the button.
 *
 * Eligible owner = right responsibility (the prior, purpose-aware) AND currently at this account (not LEFT, not a
 * CONFLICT) AND not another region's remit AND not a divested unit AND contactable (not do-not-contact, not opted
 * out). Ranking among the eligible is PURPOSE-SPECIFIC (WHO truth maintenance, 2026-10-05), first difference wins:
 *
 *   COLD_FIRST_TOUCH          buyer truth > relationship > named initiative > lane > named ownership > region > scope
 *                             > US market > seniority > currentness > reachability (operator-first, unchanged)
 *   HYPOTHESIS_ACTIVATION     buyer truth > relationship > named initiative > CURRENT role validity > thesis relevance
 *                             > lane > named ownership > scope > region > US market > seniority > currentness > reach
 *   SITE_PILOT                ... > current role > site fit (a site or regional operator) > lane > ...
 *   TRANSFORMATION_INITIATIVE ... > current role > explicit freight / yard technology ownership > lane > ...
 *
 * When the top two eligible people differ first on a STRONG dimension (buyer truth, relationship, initiative, the
 * current role, thesis relevance, lane, named ownership, site fit, technology ownership) the resolver names one
 * RECOMMENDED FOR THIS PURPOSE with that first difference in words. It is not a selection: nobody is preselected
 * unless they are the only eligible person, and Casey still clicks. A difference only in scope, geography,
 * seniority, currentness or reachability is a choice, said as such. Never a number.
 * Pure. The loader (owner-resolution-load.ts) gathers the inputs.
 */
import type { EntityType } from '../entity/fit';
import { displayName } from './display-name';
import { entityBoundaryFor, type EntityBoundary } from './entity-boundary';
import { EMPLOYMENT_LABEL, employmentBlocksOutreach, type EmploymentRead, type EmploymentState } from './employment';
import { geoPhrase, isColdWho, isSponsor, LANE_LABEL, rankWho, readPerson, type PersonLane, type PersonRead } from './person-prior';
import { thesisRelevance, type ThesisContext, type ThesisRelevance } from './thesis-relevance';

export type OwnerPurpose = 'COLD_FIRST_TOUCH' | 'HYPOTHESIS_ACTIVATION' | 'SITE_PILOT' | 'TRANSFORMATION_INITIATIVE';

export const PURPOSE_LABEL: Record<OwnerPurpose, string> = {
  COLD_FIRST_TOUCH: 'the cold first touch',
  HYPOTHESIS_ACTIVATION: 'this hypothesis',
  SITE_PILOT: 'a site pilot',
  TRANSFORMATION_INITIATIVE: 'the transformation initiative',
};

export type CandidateSource = 'gap' | 'hubspot' | 'staged' | 'relationship';

/** The role read the resolver consumes (structurally the RoleRead of people/role-currentness.ts). */
export interface RoleInput {
  state: 'ROLE_CURRENT_CONFIRMED' | 'ROLE_CURRENT_LIKELY' | 'ROLE_UNVERIFIED' | 'ROLE_CHANGED_CONFIRMED' | 'ROLE_CONFLICT';
  label: string;
  why: string;
  effectiveTitle: string | null;
  priorTitle: string | null;
  usableForRanking: boolean;
}

export interface OwnerCandidateInput {
  /** 'gap:<personaId>' | 'hubspot:<contactId>' | 'staged:<id>' | 'member:<id>' */
  key: string;
  source: CandidateSource;
  personaId?: number | null;
  hubspotContactId?: string | null;
  name: string;
  title: string | null;
  location?: string | null;
  /** The CRM company field (HubSpot), for the entity boundary; never used for identity. */
  company?: string | null;
  hasEmail: boolean;
  doNotContact?: boolean;
  optedOut?: boolean;
  unsubscribed?: boolean;
  emailBounced?: boolean;
  /** Contact currentness at THIS account (GAP contacts; a HubSpot-only person reads CURRENT_UNVERIFIED). */
  employment?: EmploymentRead | null;
  /**
   * ROLE currentness at this account (people/role-currentness.ts, projected by the loader): the stored title against
   * current evidence. A role that changed with no established new title, or a role conflict, is not usable for
   * ranking; a verified new title is the title GAP reads. Null: nothing read (the stored title stands, unverified).
   */
  role?: RoleInput | null;
  /** Where a HubSpot person was read: the account's own company, or a verified family company (with the relation). */
  provenance?: { accountName: string; relation: 'primary' | 'parent' | 'subsidiary' | 'sibling' | 'same_company'; companyId: string; /** A separate operating company's note: selectable with a caution. */ separate?: string | null } | null;
  buyerTruth?: string | null;
  relationship?: string | null;
  initiative?: string | null;
}

export interface OwnerResolutionInput {
  account: { name: string; entityType: EntityType | null; aliases?: readonly string[] };
  purpose: OwnerPurpose;
  hypothesis?: ({ id: string; status: string; primaryPersonaId: number | null } & ThesisContext) | null;
  candidates: readonly OwnerCandidateInput[];
  /** What the HubSpot read looked like (so the answer says what it could not see), and the family read when there was one. */
  hubspot: { read: boolean; count: number; truncated: boolean; via: 'linked' | 'identity' | 'none' | 'unreadable'; family?: { companies: number; count: number; capHit: boolean; searched: string[]; excluded: string[] } | null };
  now: Date;
}

export type ExclusionCode = 'left_company' | 'employment_conflict' | 'role_changed' | 'role_conflict' | 'divested_entity' | 'do_not_contact' | 'opted_out' | 'unsubscribed' | 'other_region' | 'no_name';
export type CandidateAction = 'use' | 'add_then_use' | 'review_staged' | 'relationship_only';

export interface OwnerCandidate {
  key: string;
  source: CandidateSource;
  personaId: number | null;
  hubspotContactId: string | null;
  name: string;
  title: string | null;
  location: string | null;
  lane: PersonLane;
  laneLabel: string;
  read: PersonRead;
  relevance: ThesisRelevance | null;
  employment: { state: EmploymentState; label: string; why: string; elsewhere: EmploymentRead['elsewhere'] } | null;
  /** ROLE currentness at this account (the stored title against current evidence); null when nothing was read. */
  role: RoleInput | null;
  /** Where a HubSpot person was read (a family company carries the relation). */
  provenance: OwnerCandidateInput['provenance'];
  entity: EntityBoundary | null;
  hasEmail: boolean;
  /** 'use' a GAP contact; 'add_then_use' a HubSpot-only person; 'review_staged' a staged candidate; 'relationship_only' a work-source member. */
  action: CandidateAction;
  /** Casey's reasons, each one sentence: role, geography and scope, relevance, employment, source, reachability. */
  reasons: string[];
  /** A 'separate' entity flag: selectable, never preselected, said plainly. */
  caution: string | null;
}

export interface OwnerExclusion {
  candidate: OwnerCandidate;
  code: ExclusionCode;
  reason: string;
}

export type OwnerNextStep = 'use' | 'add_and_use' | 'choose' | 'find_operator';

export interface OwnerResolution {
  purpose: OwnerPurpose;
  account: { name: string; entityType: EntityType | null; kind: 'shipper' | 'carrier_3pl' | 'unknown' };
  hypothesis: { id: string; status: string; primaryPersonaId: number | null; factLabel: string } | null;
  /** The eligible owners, best first. */
  eligible: OwnerCandidate[];
  /** The one GAP (or HubSpot-only) person preselected in the UI when nobody else is plausible; Casey still clicks. */
  preselected: string | null;
  /**
   * RECOMMENDED FOR THIS PURPOSE: the top person when the first difference against the runner-up is a strong
   * dimension, with that difference in words. Not a selection: the choice stays Casey's. Null for a cold touch.
   */
  recommended: { key: string; firstDifference: string; why: string } | null;
  nextStep: OwnerNextStep;
  headline: string;
  /** People considered and set aside, with the exact reason (a departed favorite is shown here, never silently dropped). */
  excluded: OwnerExclusion[];
  /** Every name on record (GAP, HubSpot, staged, relationships), for research dedupe: never re-stage a known person. */
  knownNames: string[];
  /** Everyone else on record who is not an eligible owner for this purpose, by lane (the buyer map, compact). */
  others: Array<{ lane: PersonLane; label: string; count: number; names: string[] }>;
  sponsor: OwnerCandidate | null;
  tech: OwnerCandidate | null;
  site: OwnerCandidate | null;
  research: { needed: boolean; slots: string[]; why: string };
  apollo: { allowed: false; note: string };
  checked: string[];
}

const EMPLOYMENT_RANK: Record<EmploymentState, number> = { CURRENT_CONFIRMED: 3, CURRENT_LIKELY: 2, CURRENT_UNVERIFIED: 1, EMPLOYMENT_CONFLICT: 0, LEFT_COMPANY_CONFIRMED: 0 };
const RELEVANCE_RANK = { direct: 2, related: 1, none: 0 } as const;
const LANE_ORDER: PersonLane[] = ['PRIMARY_OPERATOR', 'ADJACENT_OPERATOR', 'FACILITY_OPERATOR', 'EXECUTIVE_SPONSOR', 'TRANSFORMATION_TECH', 'SECURITY_RISK', 'NEEDS_REVIEW', 'PROCUREMENT_COMMERCIAL', 'NON_OPERATING'];
const SCOPE_RANK = { NETWORK: 2, UNKNOWN: 1, SITE: 0 } as const;
const MARKET_RANK = { US: 3, NA_OTHER: 2, UNKNOWN: 1, OUTSIDE: 0 } as const;

const isCarrierLike = (t: EntityType | null) => t === 'carrier' || t === '3pl' || t === 'port_terminal';

/** Is this candidate the right responsibility for the purpose (the prior's cold-WHO rule, purpose-aware)? */
export function eligibleForPurpose(read: PersonRead, purpose: OwnerPurpose, ctx: { initiative?: string | null; relevance?: ThesisRelevance | null }): boolean {
  if (purpose === 'SITE_PILOT') return isColdWho(read, { initiative: ctx.initiative, siteScoped: true });
  if (purpose === 'TRANSFORMATION_INITIATIVE') return isColdWho(read, { initiative: ctx.initiative ?? 'the initiative' }) || (read.lane === 'TRANSFORMATION_TECH' && read.ownership > 0);
  // The cold first touch and a hypothesis: a direct operator; a transportation tech owner only with a named
  // initiative, which for a hypothesis means the fact itself is an automation or technology change that lands on
  // their technology. A network, site or fleet fact never makes the technology owner the cold owner (they are the tech
  // slot, a co-buyer), and seniority never does.
  const techInitiative = purpose === 'HYPOTHESIS_ACTIVATION' && read.lane === 'TRANSFORMATION_TECH' && ctx.relevance?.tier === 'direct' && ctx.relevance.families.includes('AUTOMATION_TECH') ? 'the hypothesis is a technology change on their remit' : null;
  return isColdWho(read, { initiative: ctx.initiative ?? techInitiative });
}

/** "transportation", "logistics", "network" or "operating": the function the stored title named, for the set-aside sentence. */
function roleWord(title: string | null): string {
  const t = String(title ?? '').toLowerCase();
  if (/transportation|transport|freight|fleet|line ?haul/.test(t)) return 'transportation';
  if (/logistics|distribution|warehous/.test(t)) return 'logistics';
  if (/network|hub|terminal|sortation|planning/.test(t)) return 'network';
  return 'operating';
}

/** One ranking dimension: its name (for the first-difference sentence) and its value (higher first). */
type RankDimension = { name: string; value: number };

/** The dimensions whose first difference makes one person a RECOMMENDED owner; the rest only order a choice. */
const STRONG_DIMENSIONS = new Set(['buyer truth', 'relationship', 'named initiative', 'current role', 'thesis relevance', 'lane', 'named ownership', 'site fit', 'technology ownership']);

/**
 * How the person's CURRENT role reads for ranking: a role CONFIRMED by strong evidence (their own profile, the
 * employer's page, a verification, Casey) or a verified new title ranks above every other; a role that is only
 * LIKELY (one supporting source such as an Apollo intake agreeing with the CRM) ranks with the unverified, so a
 * single provider row can never vault a person over a direct thesis fit (FedEx dogfood 2026-10-05).
 */
const ROLE_RANK: Record<string, number> = { ROLE_CURRENT_CONFIRMED: 2, ROLE_CURRENT_LIKELY: 1, ROLE_UNVERIFIED: 1, ROLE_CHANGED_CONFIRMED: 2 };

function rankDimensions(c: OwnerCandidate, input: OwnerCandidateInput, purpose: OwnerPurpose): RankDimension[] {
  const r = c.read;
  const lead: RankDimension[] = [
    { name: 'buyer truth', value: input.buyerTruth ? 1 : 0 },
    { name: 'relationship', value: input.relationship ? 1 : 0 },
    { name: 'named initiative', value: input.initiative ? 1 : 0 },
  ];
  const lane: RankDimension = { name: 'lane', value: LANE_ORDER.length - LANE_ORDER.indexOf(r.lane) };
  const ownership: RankDimension = { name: 'named ownership', value: r.ownership };
  const relevance: RankDimension = { name: 'thesis relevance', value: c.relevance ? RELEVANCE_RANK[c.relevance.tier] : 0 };
  const region: RankDimension = { name: 'region', value: r.region === 'OTHER_REGION' ? 0 : 1 };
  const scope: RankDimension = { name: 'scope', value: SCOPE_RANK[r.scope] };
  const market: RankDimension = { name: 'US market', value: MARKET_RANK[r.market] };
  const seniority: RankDimension = { name: 'seniority', value: r.seniority };
  // Currentness is a tie-break among the eligible: the departed and the conflicted were set aside upstream, and a
  // likely-current manager never outranks an unverified network owner on it (carrier dogfood 2026-10-05).
  const currentness: RankDimension = { name: 'currentness', value: c.employment ? EMPLOYMENT_RANK[c.employment.state] : 1 };
  const reach: RankDimension = { name: 'reachability', value: c.source === 'gap' && c.hasEmail ? 2 : c.hasEmail ? 1 : 0 };
  // The CURRENT role: a verified or likely-current role (or a verified new title) above one nobody has checked.
  // A changed role with no known title and a role conflict never reach the ranking (set aside upstream).
  // A role that is not usable (a changed role with no title, kept eligible by a relationship) never ranks above an
  // unverified one (review S5).
  const role: RankDimension = { name: 'current role', value: c.role ? (c.role.usableForRanking ? ROLE_RANK[c.role.state] ?? 1 : 0) : 1 };
  if (purpose === 'COLD_FIRST_TOUCH') return [...lead, lane, ownership, relevance, region, scope, market, seniority, currentness, reach];
  if (purpose === 'SITE_PILOT') {
    const siteFit: RankDimension = { name: 'site fit', value: r.lane === 'FACILITY_OPERATOR' || r.scope === 'SITE' ? 1 : 0 };
    return [...lead, role, siteFit, lane, ownership, relevance, region, market, seniority, currentness, reach];
  }
  if (purpose === 'TRANSFORMATION_INITIATIVE') {
    const tech: RankDimension = { name: 'technology ownership', value: r.lane === 'TRANSFORMATION_TECH' && r.ownership > 0 ? 1 : 0 };
    return [...lead, role, tech, lane, ownership, relevance, region, scope, market, seniority, currentness, reach];
  }
  // HYPOTHESIS_ACTIVATION: the current role, then what the fact lands on, then the lane and named ownership.
  return [...lead, role, relevance, lane, ownership, scope, region, market, seniority, currentness, reach];
}

function rankKey(c: OwnerCandidate, input: OwnerCandidateInput, purpose: OwnerPurpose): number[] {
  return rankDimensions(c, input, purpose).map((d) => d.value);
}

/**
 * RECOMMENDED FOR THIS PURPOSE: the first dimension on which the top two eligible people differ, when it is a strong
 * one. The sentence names the dimension and the leader's own reason for it. Null for a cold first touch (the
 * operator-first list is the answer), for fewer than two eligible people, and when the first difference is weak.
 */
function recommend(rows: ReadonlyArray<{ c: OwnerCandidate; input: OwnerCandidateInput }>, purpose: OwnerPurpose): OwnerResolution['recommended'] {
  if (purpose === 'COLD_FIRST_TOUCH' || rows.length < 2) return null;
  const a = rankDimensions(rows[0].c, rows[0].input, purpose);
  const b = rankDimensions(rows[1].c, rows[1].input, purpose);
  const i = a.findIndex((d, k) => d.value !== b[k].value);
  if (i < 0 || !STRONG_DIMENSIONS.has(a[i].name)) return null;
  // "Current role" recommends only when the leader's role is CONFIRMED by strong evidence; leading merely because
  // the runner-up's role is unusable (or unverified against likely) is a plain choice (review Q1).
  if (a[i].name === 'current role' && a[i].value < 2) return null;
  const top = rows[0].c;
  const second = rows[1].c;
  const reason = (() => {
    switch (a[i].name) {
      case 'buyer truth':
        return `they are already talking to you (${rows[0].input.buyerTruth})`;
      case 'relationship':
        return `you have a way in (${rows[0].input.relationship})`;
      case 'named initiative':
        return `a live signal names them on the initiative (${rows[0].input.initiative})`;
      case 'current role':
        return `their current role is confirmed by strong evidence (${top.role ? top.role.label.toLowerCase() : 'verified'}) while ${second.name}'s is ${second.role ? second.role.label.toLowerCase() : 'not verified'}`;
      case 'thesis relevance':
        return top.relevance ? top.relevance.why : 'the fact lands on their responsibility';
      case 'lane':
        return `${top.laneLabel.toLowerCase()} (${top.read.laneWhy}) against ${second.laneLabel.toLowerCase()} for ${second.name}`;
      case 'named ownership':
        return `their title names the freight or network ownership (${top.read.laneWhy}) where ${second.name}'s names ${second.read.ownership > 0 ? 'less of it' : 'logistics or distribution'}`;
      case 'site fit':
        return `they run the site or region (${top.read.laneWhy}) while ${second.name} runs the network`;
      case 'technology ownership':
        return `they own the freight or yard technology (${top.read.laneWhy}) while ${second.name} does not`;
      default:
        return top.read.laneWhy;
    }
  })();
  return { key: top.key, firstDifference: a[i].name, why: `Recommended for ${PURPOSE_LABEL[purpose]} on ${a[i].name}: ${reason}. ${second.name} is next. You choose.` };
}

/**
 * Every eligible person is a PLAUSIBLE owner. A title-word difference (a Managing Director of transportation against
 * a VP of network planning) never makes the first one "overwhelming": with two or more eligible people the seller
 * chooses from the ranked list, and nobody is preselected.
 */

const RELATION_WORD: Record<string, string> = { parent: 'parent', subsidiary: 'subsidiary', sibling: 'sister company', same_company: 'duplicate record' };

function describe(c: OwnerCandidateInput, read: PersonRead, relevance: ThesisRelevance | null, employment: EmploymentRead | null | undefined, entity: EntityBoundary | null, accountName: string): string[] {
  const out: string[] = [];
  out.push(`${LANE_LABEL[read.lane]}: ${read.laneWhy}.`);
  out.push(`${geoPhrase(read)}${read.scope === 'NETWORK' ? '; network scope' : read.scope === 'SITE' ? '; one site' : '; scope not stated'}.`);
  if (relevance) out.push(`Thesis fit: ${relevance.why}.`);
  if (employment) out.push(`Employment: ${EMPLOYMENT_LABEL[employment.state]}. ${employment.why}`);
  if (c.role && c.role.state !== 'ROLE_UNVERIFIED') out.push(`Role: ${c.role.label}. ${c.role.why}${c.role.priorTitle && c.role.effectiveTitle && c.role.priorTitle !== c.role.effectiveTitle ? ` (was ${c.role.priorTitle})` : ''}`);
  if (entity) out.push(`Entity: ${entity.note}`);
  const where = c.provenance && c.provenance.relation !== 'primary' ? ` (${c.provenance.accountName}, a ${accountName} ${RELATION_WORD[c.provenance.relation] ?? c.provenance.relation})` : '';
  out.push(
    c.source === 'gap'
      ? `Source: GAP contact${c.hasEmail ? ', email on record' : ', no email on record'}${c.emailBounced ? ' (the address bounced before)' : ''}.`
      : c.source === 'hubspot'
        ? `Source: HubSpot${where}, not yet a GAP contact${c.hasEmail ? '; HubSpot holds an email (no Apollo needed)' : '; no email in HubSpot'}.`
        : c.source === 'staged'
          ? 'Source: a staged contact candidate (review and promote before any touch).'
          : `Source: a relationship (${c.relationship ?? 'on record'}), not yet a GAP contact.`,
  );
  return out;
}

/** The one resolution. Deterministic over its inputs; never writes. */
export function resolveOwner(input: OwnerResolutionInput): OwnerResolution {
  const { account, purpose, now } = input;
  const thesis = input.hypothesis ?? null;
  const carrier = isCarrierLike(account.entityType);
  const kind: OwnerResolution['account']['kind'] = carrier ? 'carrier_3pl' : account.entityType ? 'shipper' : 'unknown';
  const label = PURPOSE_LABEL[purpose];

  const built: Array<{ c: OwnerCandidate; input: OwnerCandidateInput }> = [];
  const excluded: OwnerExclusion[] = [];
  for (const ci of input.candidates) {
    // The title GAP reads is the CURRENT one: a verified new title replaces a contradicted stored title; a stored
    // title that current evidence contradicts with nothing established in its place is never read as if current.
    const role = ci.role ?? null;
    const title = role?.usableForRanking && role.effectiveTitle ? role.effectiveTitle : ci.title;
    const read = readPerson(title, { entityType: account.entityType, location: ci.location ?? null });
    const relevance = thesis ? thesisRelevance(title, thesis) : null;
    const entity = entityBoundaryFor(account.name, { title, company: ci.company ?? null });
    const employment = ci.employment ?? null;
    const roleCaution = role && !role.usableForRanking ? `Still at ${account.name}, but the stored ${roleWord(ci.title)} role${role.priorTitle ?? ci.title ? ` (${role.priorTitle ?? ci.title})` : ''} ${role.state === 'ROLE_CONFLICT' ? 'is in question' : 'changed'}: ${role.why} Verify current ${role.state === 'ROLE_CONFLICT' ? 'role' : 'remit'} before using.` : null;
    const c: OwnerCandidate = {
      key: ci.key,
      source: ci.source,
      personaId: ci.personaId ?? null,
      hubspotContactId: ci.hubspotContactId ?? null,
      name: displayName(ci.name),
      title,
      location: ci.location ?? null,
      lane: read.lane,
      laneLabel: LANE_LABEL[read.lane],
      read,
      relevance,
      employment: employment ? { state: employment.state, label: EMPLOYMENT_LABEL[employment.state], why: employment.why, elsewhere: employment.elsewhere } : null,
      role,
      provenance: ci.provenance ?? null,
      entity,
      hasEmail: ci.hasEmail,
      action: ci.source === 'gap' ? 'use' : ci.source === 'hubspot' ? 'add_then_use' : ci.source === 'staged' ? 'review_staged' : 'relationship_only',
      reasons: describe({ ...ci, title }, read, relevance, employment, entity, account.name),
      caution: entity?.status === 'separate' ? entity.note : ci.provenance?.separate ? ci.provenance.separate : roleCaution,
    };
    built.push({ c, input: ci });
  }

  // Exclusions, in the order a seller would ask: is this a real, contactable person who is still here and ours?
  const eligibleRows: Array<{ c: OwnerCandidate; input: OwnerCandidateInput }> = [];
  const othersByLane = new Map<PersonLane, string[]>();
  const shownAs = (c: OwnerCandidate) => (c.action === 'review_staged' ? `${c.name} (staged candidate)` : c.action === 'relationship_only' ? `${c.name} (relationship, not a contact)` : c.name);
  for (const row of built) {
    const { c, input: ci } = row;
    if (!ci.name.trim() || /^\(no name/.test(ci.name)) {
      excluded.push({ candidate: c, code: 'no_name', reason: 'No name on the record: nobody to address.' });
      continue;
    }
    if (c.employment && employmentBlocksOutreach(c.employment.state)) {
      excluded.push({
        candidate: c,
        code: c.employment.state === 'LEFT_COMPANY_CONFIRMED' ? 'left_company' : 'employment_conflict',
        reason:
          c.employment.state === 'LEFT_COMPANY_CONFIRMED'
            ? `Historical ${account.name} contact. Current-employer evidence now points to ${c.employment.elsewhere?.company ?? 'another employer'}${c.employment.elsewhere?.title ? ` (${c.employment.elsewhere.title})` : ''}. Not eligible for ${account.name} outreach.`
            : `Employment conflict: ${c.employment.why} Not eligible until the current role is verified.`,
      });
      continue;
    }
    if (c.entity?.status === 'divested') {
      excluded.push({ candidate: c, code: 'divested_entity', reason: c.entity.note });
      continue;
    }
    // Contactability before the role: a do-not-contact person is shown under that reason (with the legacy review
    // control), whatever their role reads (review B1: the Pepsi Isaac workflow must stay reachable).
    if (ci.doNotContact) {
      excluded.push({ candidate: c, code: 'do_not_contact', reason: 'Marked do not contact in GAP.' });
      continue;
    }
    if (ci.unsubscribed) {
      excluded.push({ candidate: c, code: 'unsubscribed', reason: 'Unsubscribed: GAP will not contact them.' });
      continue;
    }
    if (ci.optedOut) {
      excluded.push({ candidate: c, code: 'opted_out', reason: 'Opted out of email in HubSpot.' });
      continue;
    }
    // The ROLE changed or is in question while the employer did not: set aside from role-dependent WHO with the
    // verify sentence (never do-not-contact, never "left"); buyer truth or a relationship is not role-dependent, so
    // that person stays eligible with the caution.
    if (c.role && !c.role.usableForRanking && !ci.buyerTruth && !ci.relationship) {
      excluded.push({ candidate: c, code: c.role.state === 'ROLE_CONFLICT' ? 'role_conflict' : 'role_changed', reason: c.caution ?? `Still at ${account.name}, but the stored role changed. Verify current remit before using.` });
      continue;
    }
    if (c.read.remit === 'OTHER_REGION' || c.read.region === 'OTHER_REGION') {
      // Shown only when the function would otherwise have qualified (an unrelated foreign role is just "others").
      if (eligibleForPurpose({ ...c.read, remit: null, region: 'UNKNOWN' }, purpose, { initiative: ci.initiative, relevance: c.relevance })) excluded.push({ candidate: c, code: 'other_region', reason: `${c.read.regionWhy}: not the North America owner.` });
      else othersByLane.set(c.lane, [...(othersByLane.get(c.lane) ?? []), shownAs(c)]);
      continue;
    }
    if (!eligibleForPurpose(c.read, purpose, { initiative: ci.initiative, relevance: c.relevance })) {
      othersByLane.set(c.lane, [...(othersByLane.get(c.lane) ?? []), shownAs(c)]);
      continue;
    }
    // A staged candidate or a bare relationship is not yet a person GAP can act on: shown, never selectable as owner.
    if (c.action === 'review_staged' || c.action === 'relationship_only') {
      othersByLane.set(c.lane, [...(othersByLane.get(c.lane) ?? []), shownAs(c)]);
      continue;
    }
    eligibleRows.push(row);
  }

  eligibleRows.sort((a, b) => {
    const ka = rankKey(a.c, a.input, purpose);
    const kb = rankKey(b.c, b.input, purpose);
    for (let i = 0; i < ka.length; i += 1) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return a.c.name.localeCompare(b.c.name) || a.c.key.localeCompare(b.c.key);
  });
  const eligible = eligibleRows.map((r) => r.c);

  // Sponsor, tech and site slots from everyone contactable and here, in the ONE prior's order (the brief's buyer
  // map picks its slots the same way, so the two never disagree).
  const order = new Map(rankWho(built.map((r) => ({ key: r.c.key, name: r.c.name, title: r.c.title, reachable: r.c.hasEmail, doNotContact: !!r.input.doNotContact, location: r.c.location, buyerTruth: r.input.buyerTruth, relationship: r.input.relationship, initiative: r.input.initiative })), { entityType: account.entityType }).map((x, i) => [x.candidate.key, i]));
  // A person whose role is not usable fills no slot either (their stored title is the contradicted one; review N16).
  const contactable = built
    .filter((r) => !excluded.some((e) => e.candidate.key === r.c.key) && r.c.read.region !== 'OTHER_REGION' && r.c.read.remit !== 'OTHER_REGION' && r.c.source !== 'staged' && !(r.c.role && !r.c.role.usableForRanking))
    .sort((a, b) => (order.get(a.c.key) ?? 0) - (order.get(b.c.key) ?? 0));
  const sponsor = contactable.find((r) => isSponsor(r.c.read, r.c.title))?.c ?? null;
  const tech = contactable.find((r) => r.c.read.lane === 'TRANSFORMATION_TECH' && r.c.read.ownership > 0)?.c ?? null;
  const site = contactable.find((r) => r.c.read.lane === 'FACILITY_OPERATOR')?.c ?? null;

  // The decision: one clear owner, a choice, or nobody. Only a person who is the ONLY eligible owner is preselected
  // (and never behind a separate-entity caution); Casey still presses the button.
  let nextStep: OwnerNextStep;
  let preselected: string | null = null;
  if (eligible.length === 0) nextStep = 'find_operator';
  else if (eligible.length === 1 && !eligible[0].caution) {
    preselected = eligible[0].key;
    nextStep = eligible[0].action === 'use' ? 'use' : 'add_and_use';
  } else nextStep = 'choose';
  const top = eligible[0] ?? null;
  const who = (c: OwnerCandidate) => `${c.name}${c.title ? `, ${c.title}` : ''}`;
  const fam = input.hubspot.family ?? null;
  const hubspotNote = input.hubspot.via === 'none' ? ' HubSpot people were not read (no HubSpot company resolves for this account).' : input.hubspot.via === 'unreadable' ? ' HubSpot people could not be read just now.' : input.hubspot.truncated || fam?.capHit ? ` HubSpot returned only the first ${input.hubspot.count} associated contacts: the owner may be beyond them.` : '';
  const headline =
    nextStep === 'use'
      ? `Best person on record for ${label}: ${who(top!)}. Use them, or choose someone else.${hubspotNote}`
      : nextStep === 'add_and_use'
        ? `Best person on record for ${label} is in HubSpot, not yet a GAP contact: ${who(top!)}. Add them to GAP and use them, or choose someone else.${hubspotNote}`
        : nextStep === 'choose'
          ? `${eligible.length} plausible owners for ${label}: choose one. GAP does not pick.${hubspotNote}`
          : `No current direct ${carrier ? 'network' : 'transportation'} operator on record for ${label} (${built.length} ${built.length === 1 ? 'person' : 'people'} considered${excluded.length ? `, ${excluded.length} set aside` : ''}).${hubspotNote} Find the operator.`;

  const slots = carrier
    ? ['network / hub / terminal / linehaul operations owner (US / North America)', 'operations planning and engineering owner', 'operations technology owner']
    : ['transportation / logistics / freight / fleet operator (US / North America)', 'transportation technology / transformation owner'];
  const checked = [
    `GAP contacts (${input.candidates.filter((c) => c.source === 'gap').length})`,
    `HubSpot contacts (${input.hubspot.read ? `${input.hubspot.count}${input.hubspot.truncated ? ', truncated' : ''}, via ${input.hubspot.via === 'linked' ? 'the linked company' : 'the account identity'}${fam ? `; ${fam.count} from ${fam.companies} family ${fam.companies === 1 ? 'company' : 'companies'}${fam.capHit ? ', cap hit' : ''}${fam.searched.length ? `; family companies searched: ${fam.searched.join(', ')}` : ''}${fam.excluded.length ? `; not read: ${fam.excluded.join('; ')}` : ''}` : ''}` : input.hubspot.via === 'none' ? 'no HubSpot company resolves' : 'could not be read'})`,
    `staged contact candidates (${input.candidates.filter((c) => c.source === 'staged').length})`,
    `relationships (${input.candidates.filter((c) => c.source === 'relationship' || c.relationship).length})`,
    `contact currentness (${input.candidates.filter((c) => c.employment && employmentBlocksOutreach(c.employment.state)).length} set aside)`,
    `role currentness (${excluded.filter((e) => e.code === 'role_changed' || e.code === 'role_conflict').length} set aside)`,
  ];
  void now;
  return {
    purpose,
    account: { name: account.name, entityType: account.entityType, kind },
    hypothesis: thesis ? { id: thesis.id, status: thesis.status, primaryPersonaId: thesis.primaryPersonaId, factLabel: thesisRelevance(null, thesis).factLabel } : null,
    eligible,
    preselected,
    recommended: recommend(eligibleRows, purpose),
    nextStep,
    headline,
    excluded,
    knownNames: [...new Set(built.map((r) => r.c.name).filter((n) => n && !/^\(no name/.test(n)))],
    others: [...othersByLane.entries()].sort((a, b) => LANE_ORDER.indexOf(a[0]) - LANE_ORDER.indexOf(b[0])).map(([lane, names]) => ({ lane, label: LANE_LABEL[lane], count: names.length, names: names.slice(0, 6) })),
    sponsor,
    tech,
    site,
    research: {
      needed: nextStep === 'find_operator',
      slots,
      why: nextStep === 'find_operator' ? `Nobody on record is a current ${carrier ? 'network' : 'direct transportation'} operator for ${account.name}. Source-backed research fills these slots; results become staged candidates for Casey to review, never a contact, never an email guess.` : 'Not needed: an owner is on record.',
    },
    apollo: { allowed: false, note: 'Owner resolution never spends an Apollo credit. A HubSpot email is used as it is; a lookup is only ever proposed for Casey to decide.' },
    checked,
  };
}
