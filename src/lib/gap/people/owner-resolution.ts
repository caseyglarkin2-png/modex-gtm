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
 * out). Ranking among the eligible: buyer truth > relationship > named initiative > lane > named ownership > thesis
 * relevance > employment confidence > not outside North America > scope > US market > seniority > reachability.
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
  buyerTruth?: string | null;
  relationship?: string | null;
  initiative?: string | null;
}

export interface OwnerResolutionInput {
  account: { name: string; entityType: EntityType | null; aliases?: readonly string[] };
  purpose: OwnerPurpose;
  hypothesis?: ({ id: string; status: string; primaryPersonaId: number | null } & ThesisContext) | null;
  candidates: readonly OwnerCandidateInput[];
  /** What the HubSpot read looked like (so the answer says what it could not see). */
  hubspot: { read: boolean; count: number; truncated: boolean; via: 'linked' | 'identity' | 'none' | 'unreadable' };
  now: Date;
}

export type ExclusionCode = 'left_company' | 'employment_conflict' | 'divested_entity' | 'do_not_contact' | 'opted_out' | 'unsubscribed' | 'other_region' | 'no_name';
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
  nextStep: OwnerNextStep;
  headline: string;
  /** People considered and set aside, with the exact reason (a departed favorite is shown here, never silently dropped). */
  excluded: OwnerExclusion[];
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

function rankKey(c: OwnerCandidate, input: OwnerCandidateInput): number[] {
  const r = c.read;
  return [
    input.buyerTruth ? 1 : 0,
    input.relationship ? 1 : 0,
    input.initiative ? 1 : 0,
    LANE_ORDER.length - LANE_ORDER.indexOf(r.lane),
    r.ownership,
    c.relevance ? RELEVANCE_RANK[c.relevance.tier] : 0,
    c.employment ? EMPLOYMENT_RANK[c.employment.state] : 1,
    r.region === 'OTHER_REGION' ? 0 : 1,
    SCOPE_RANK[r.scope],
    MARKET_RANK[r.market],
    r.seniority,
    c.source === 'gap' && c.hasEmail ? 2 : c.hasEmail ? 1 : 0,
  ];
}

/**
 * Every eligible person is a PLAUSIBLE owner. A title-word difference (a Managing Director of transportation against
 * a VP of network planning) never makes the first one "overwhelming": with two or more eligible people the seller
 * chooses from the ranked list, and nobody is preselected.
 */

function describe(c: OwnerCandidateInput, read: PersonRead, relevance: ThesisRelevance | null, employment: EmploymentRead | null | undefined, entity: EntityBoundary | null): string[] {
  const out: string[] = [];
  out.push(`${LANE_LABEL[read.lane]}: ${read.laneWhy}.`);
  out.push(`${geoPhrase(read)}${read.scope === 'NETWORK' ? '; network scope' : read.scope === 'SITE' ? '; one site' : '; scope not stated'}.`);
  if (relevance) out.push(`Thesis fit: ${relevance.why}.`);
  if (employment) out.push(`Employment: ${EMPLOYMENT_LABEL[employment.state]}. ${employment.why}`);
  if (entity) out.push(`Entity: ${entity.note}`);
  out.push(
    c.source === 'gap'
      ? `Source: GAP contact${c.hasEmail ? ', email on record' : ', no email on record'}${c.emailBounced ? ' (the address bounced before)' : ''}.`
      : c.source === 'hubspot'
        ? `Source: HubSpot, not yet a GAP contact${c.hasEmail ? '; HubSpot holds an email (no Apollo needed)' : '; no email in HubSpot'}.`
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
    const read = readPerson(ci.title, { entityType: account.entityType, location: ci.location ?? null });
    const relevance = thesis ? thesisRelevance(ci.title, thesis, account.entityType) : null;
    const entity = entityBoundaryFor(account.name, { title: ci.title, company: ci.company ?? null });
    const employment = ci.employment ?? null;
    const c: OwnerCandidate = {
      key: ci.key,
      source: ci.source,
      personaId: ci.personaId ?? null,
      hubspotContactId: ci.hubspotContactId ?? null,
      name: displayName(ci.name),
      title: ci.title,
      location: ci.location ?? null,
      lane: read.lane,
      laneLabel: LANE_LABEL[read.lane],
      read,
      relevance,
      employment: employment ? { state: employment.state, label: EMPLOYMENT_LABEL[employment.state], why: employment.why, elsewhere: employment.elsewhere } : null,
      entity,
      hasEmail: ci.hasEmail,
      action: ci.source === 'gap' ? 'use' : ci.source === 'hubspot' ? 'add_then_use' : ci.source === 'staged' ? 'review_staged' : 'relationship_only',
      reasons: describe(ci, read, relevance, employment, entity),
      caution: entity?.status === 'separate' ? entity.note : null,
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
    const ka = rankKey(a.c, a.input);
    const kb = rankKey(b.c, b.input);
    for (let i = 0; i < ka.length; i += 1) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return a.c.name.localeCompare(b.c.name) || a.c.key.localeCompare(b.c.key);
  });
  const eligible = eligibleRows.map((r) => r.c);

  // Sponsor, tech and site slots from everyone contactable and here, in the ONE prior's order (the brief's buyer
  // map picks its slots the same way, so the two never disagree).
  const order = new Map(rankWho(built.map((r) => ({ key: r.c.key, name: r.c.name, title: r.c.title, reachable: r.c.hasEmail, doNotContact: !!r.input.doNotContact, location: r.c.location, buyerTruth: r.input.buyerTruth, relationship: r.input.relationship, initiative: r.input.initiative })), { entityType: account.entityType }).map((x, i) => [x.candidate.key, i]));
  const contactable = built
    .filter((r) => !excluded.some((e) => e.candidate.key === r.c.key) && r.c.read.region !== 'OTHER_REGION' && r.c.read.remit !== 'OTHER_REGION' && r.c.source !== 'staged')
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
  const hubspotNote = input.hubspot.via === 'none' ? ' HubSpot people were not read (no HubSpot company resolves for this account).' : input.hubspot.via === 'unreadable' ? ' HubSpot people could not be read just now.' : input.hubspot.truncated ? ` HubSpot returned only the first ${input.hubspot.count} associated contacts: the owner may be beyond them.` : '';
  const headline =
    nextStep === 'use'
      ? `Best person on record for ${label}: ${who(top!)}. Use them, or choose someone else.`
      : nextStep === 'add_and_use'
        ? `Best person on record for ${label} is in HubSpot, not yet a GAP contact: ${who(top!)}. Add them to GAP and use them, or choose someone else.`
        : nextStep === 'choose'
          ? `${eligible.length} plausible owners for ${label}: choose one. GAP does not pick.`
          : `No current direct ${carrier ? 'network' : 'transportation'} operator on record for ${label} (${built.length} ${built.length === 1 ? 'person' : 'people'} considered${excluded.length ? `, ${excluded.length} set aside` : ''}).${hubspotNote} Find the operator.`;

  const slots = carrier
    ? ['network / hub / terminal / linehaul operations owner (US / North America)', 'operations planning and engineering owner', 'operations technology owner']
    : ['transportation / logistics / freight / fleet operator (US / North America)', 'transportation technology / transformation owner'];
  const checked = [
    `GAP contacts (${input.candidates.filter((c) => c.source === 'gap').length})`,
    `HubSpot contacts (${input.hubspot.read ? `${input.hubspot.count}${input.hubspot.truncated ? ', truncated' : ''}, via ${input.hubspot.via === 'linked' ? 'the linked company' : 'the account identity'}` : input.hubspot.via === 'none' ? 'no HubSpot company resolves' : 'could not be read'})`,
    `staged contact candidates (${input.candidates.filter((c) => c.source === 'staged').length})`,
    `relationships (${input.candidates.filter((c) => c.source === 'relationship' || c.relationship).length})`,
    `contact currentness (${input.candidates.filter((c) => c.employment && employmentBlocksOutreach(c.employment.state)).length} set aside)`,
  ];
  void now;
  return {
    purpose,
    account: { name: account.name, entityType: account.entityType, kind },
    hypothesis: thesis ? { id: thesis.id, status: thesis.status, primaryPersonaId: thesis.primaryPersonaId, factLabel: thesisRelevance(null, thesis).factLabel } : null,
    eligible,
    preselected,
    nextStep,
    headline,
    excluded,
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
