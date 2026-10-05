/**
 * APOLLO CANDIDATES (Casey, 2026-10-03): zero autonomous Apollo spend. Where an Apollo lookup could change WHO or
 * NEXT, GAP PROPOSES it and Casey decides; nothing here calls Apollo.
 *
 *   FIND_OWNER     nobody on record (GAP contacts, HubSpot contacts, staged candidates) runs transportation operations
 *   FIND_EMAIL     the owner WHO names has no email on record
 *   CONFIRM_TITLE  someone Casey met leads WHO with no title on record
 *
 * Checked first, every time: the buyer map (GAP and HubSpot people), staged contact candidates, relationships, a live
 * deal or thread (then Apollo would not change NEXT), prior Apollo results (never spend on the same person twice).
 * Geography alone is never a reason (it cannot outrank operating ownership). Derived from the account, so the same
 * unresolved gap is the same key on every evaluation: one request, never five. The credit cost is UNKNOWN until run.
 */
import type { AccountInputs, AccountIntelligenceBrief } from '../account-intel/build';
import { displayName } from './display-name';
import { readPerson } from './person-prior';

export type ApolloCandidateKind = 'FIND_OWNER' | 'FIND_EMAIL' | 'CONFIRM_TITLE';

export interface ApolloCandidate {
  /** Stable: account, kind, target. The same gap is the same key on every evaluation. */
  key: string;
  account: string;
  kind: ApolloCandidateKind;
  target: string;
  missing: string;
  whyItMatters: string;
  decision: string;
  possibleMatch: string | null;
  /** Apollo does not quote a cost before the call: never invented. */
  creditCost: 'UNKNOWN';
  checkedFirst: string[];
}

export interface ApolloCandidateView {
  candidates: ApolloCandidate[];
  /** Why no request is needed when GAP already has the answer (a staged candidate, a prior Apollo result). */
  notNeeded: string | null;
  /** WHO may stay unknown: that is a valid state, said plainly. */
  unknownIsFine: string | null;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function apolloCandidates(brief: AccountIntelligenceBrief, i: AccountInputs): ApolloCandidateView {
  const account = i.account.name;
  const hs = i.hubspotPeople ?? null;
  const checkedFirst = [
    `GAP contacts (${i.personas.length})`,
    `HubSpot contacts (${hs ? hs.people.length : i.account.hubspotCompanyId ? 'not read' : 'no HubSpot company'})`,
    `staged contact candidates (${i.candidates.length})`,
    `relationships (${i.memberships.length})`,
  ];
  const out = new Map<string, ApolloCandidate>();
  const add = (c: Omit<ApolloCandidate, 'key' | 'account' | 'creditCost' | 'checkedFirst'>, target: string) => {
    const key = `${account}|${c.kind}|${slug(target)}`;
    if (!out.has(key)) out.set(key, { key, account, ...c, creditCost: 'UNKNOWN', checkedFirst });
  };
  let notNeeded: string | null = null;
  const m = brief.motion;
  const p = brief.people;
  // A live deal, a buyer thread or an intro-only account: the next step is set; an Apollo lookup would not change it.
  if (m.type === 'IN_DEAL' || m.type === 'FOLLOW_UP' || m.type === 'INTRO_ONLY' || i.conversation) return { candidates: [], notNeeded: null, unknownIsFine: null };

  // The owner is a North America (or unstated) transportation operator: another region's owner is not ours (review B1).
  const owner = p?.primary && p.primary.lane === 'PRIMARY_OPERATOR' && p.primary.geo !== 'OTHER_REGION' && !p.primary.doNotContact ? p.primary : null;
  if (!owner) {
    const staged = i.candidates.find((c) => readPerson(c.title).lane === 'PRIMARY_OPERATOR');
    if (staged) notNeeded = `Review the staged contact candidate ${staged.name}${staged.title ? ` (${staged.title})` : ''} first: already found, no credit needed.`;
    // The owner may already be in HubSpot: an unread HubSpot is checked before any credit is proposed (review SF4).
    else if (!hs && i.account.hubspotCompanyId) notNeeded = 'HubSpot contacts could not be read just now: check HubSpot for the transportation owner first (no Apollo lookup proposed until it is read).';
    else {
      // Nobody is a direct operator: the nearest person on record is the sponsor (operator-first WHO, 2026-10-04).
      const near = p?.primary && !p.primary.doNotContact ? p.primary : p?.sponsor && !p.sponsor.doNotContact ? p.sponsor : null;
      add({
        kind: 'FIND_OWNER',
        target: `The North America transportation operating owner at ${account} (a search, not a known person)`,
        missing: 'Who runs transportation operations across the network: nobody on record has a transportation operating title.',
        whyItMatters: 'WHO is the person accountable for freight execution across the network; without them the first touch goes to an adjacent role or nowhere.',
        decision: 'WHO and the first touch',
        possibleMatch: near ? `${near.name}${near.title ? `, ${near.title}` : ''} (${near.laneLabel.toLowerCase()}, on record)` : null,
      }, 'north-america-transportation-operating-owner');
    }
  } else if (!owner.reachable) {
    const prior = i.personas.find((x) => sameName(x.name, owner.name) && x.apolloEnrichedAt);
    // A HubSpot-only owner whose HubSpot record already has an email is added, never re-found (operator-first, 2026-10-04).
    const inHubSpot = owner.source === 'hubspot' && (hs?.people ?? []).some((x) => sameName(x.name, owner.name) && x.hasEmail && !x.optedOut);
    if (inHubSpot) notNeeded = `${displayName(owner.name)} already has an email in HubSpot: add them as a GAP contact (no credit needed).`;
    else if (prior) notNeeded = `${owner.name} already has an Apollo result (${day(prior.apolloEnrichedAt!)}): no credit spent twice.`;
    else add({
      kind: 'FIND_EMAIL',
      target: `${displayName(owner.name)}${owner.title ? `, ${owner.title}` : ''}`,
      missing: `No email on record for ${displayName(owner.name)}.`,
      whyItMatters: `${displayName(owner.name)} is the transportation operating owner on record; the first touch cannot reach them.`,
      decision: 'Whether the first touch can go to the owner by email',
      possibleMatch: null,
    }, owner.name);
  }

  // Someone Casey met leads WHO: their title decides whether they should.
  if (m.type === 'RELATIONSHIP_LED' && m.met && !m.met.title) {
    // Said the way NOW says it (a lowercase CRM name is title-cased).
    const met = { ...m.met, name: displayName(m.met.name) };
    const known = [...i.personas.map((x) => ({ name: x.name, title: x.title })), ...(hs?.people ?? [])].find((x) => sameName(x.name, met.name) && x.title);
    if (!known) add({
      kind: 'CONFIRM_TITLE',
      target: `${met.name}${met.company ? ` (${met.company}; met at ${met.source})` : ` (met at ${met.source})`}`,
      missing: `No title on record for ${met.name}.`,
      whyItMatters: 'Casey met them, so they lead WHO; without a title GAP cannot tell whether they run the freight network.',
      decision: `Whether ${met.name} leads WHO${owner ? `, or ${displayName(owner.name)} does` : ''}`,
      possibleMatch: null,
    }, met.name);
  }

  const candidates = [...out.values()];
  return { candidates, notNeeded, unknownIsFine: candidates.some((c) => c.kind === 'FIND_OWNER') ? 'Until Casey decides, WHO stays unknown: GAP does not guess and does not spend.' : null };
}
