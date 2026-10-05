/**
 * ACCOUNT KIND REVIEW: the pure classifier (enterprise graph, 2026-10-05). Account rows for NFI Industries, J.B.
 * Hunt, UPS, PepsiCo, Tyson Foods and Kroger carry vertical "Unknown", so the product reads them under shipper rules
 * and the carrier doctrine of the person prior never applies. This proposes a vertical from the LIVE vocabulary
 * only, on strong evidence only, and never flips a vertical somebody set:
 *
 *   - a Scout web read (not name rules, not ambiguous) of carrier / 3pl proposes "3PL / Logistics" (the vocabulary
 *     has no separate carrier value: typeFromVertical reads "3PL / Logistics" as 3pl, which the person prior treats
 *     as carrier doctrine), of retailer proposes "Retail", of manufacturer proposes "Manufacturing";
 *   - else a majority of carrier-network titles among at least five GAP persona titles proposes "3PL / Logistics";
 *   - a set vertical stays (shipper stays shipper: a "Logistics Manager" at a food company is a keyword, not a kind);
 *   - thin evidence leaves Unknown alone (fail safe).
 *
 * The script scripts/gap/account-kind-review.ts gathers the evidence and prints; --apply there writes only the
 * rows Casey names. Nothing here reads or writes anything.
 */
import { typeFromVertical } from '../account-intel/build';

/** Account.vertical as production holds it (read 2026-10-05). Never hand-type a value outside this list. */
export const VERTICAL_VOCABULARY = ['Unknown', 'Food & Beverage', 'Industrial', 'Retail', 'Manufacturing', 'Packaging', 'Logistics', 'Automotive', '3PL / Logistics', 'Beverage', 'food_bev', 'Healthcare'] as const;
export type Vertical = (typeof VERTICAL_VOCABULARY)[number];

/** Carriers and 3PLs share this value: the vocabulary has no separate carrier entry. */
export const CARRIER_VERTICAL: Vertical = '3PL / Logistics';

const VOCABULARY_NOTE = 'the vocabulary has no separate carrier value, so a carrier gets "3PL / Logistics" too (typeFromVertical reads it as 3pl, which the person prior treats as carrier doctrine)';

/**
 * Titles the person prior reads as carrier-network roles: the physical network of a carrier or 3PL. A bare
 * "Logistics" or "DC operations" title is NOT one: shippers have both, and a keyword coincidence must never flip a
 * shipper.
 */
/**
 * Titles only a carrier or 3PL has: a shipper's private fleet also has fleet, driver and dedicated-fleet titles, so
 * those never count (review S8); the network words below name the physical network as the product.
 */
export const CARRIER_NETWORK_ROLE = /\b(line ?haul|hub (operations|manager|director|leader)|hubs? (and|&) networks?|terminal(s)? (operations|manager|director|leader)|sortation|sort operations|dedicated contract carriage|network operations|brokerage|pickup (and|&) delivery|p&d|drayage|owner[- ]operators?|cross ?dock operations|less[- ]than[- ]truckload|ltl operations|truckload operations|final mile operations|parcel operations)\b/i;

export interface AccountKindEvidence {
  accountName: string;
  vertical: string | null;
  /** The latest Scout entity read, if one is stored (gap_account_candidates). */
  scout: { entityType: string | null; basis: 'web' | 'name_rules' | null; ambiguous: boolean; what: string | null; at: string | null } | null;
  /** The audited site mix from the demo pack, if one exists. Evidence only, never a reason. */
  sites: { audited: number; self: number; threePl: number; jv: number } | null;
  /** The GAP personas' titles at the account. */
  titles: readonly string[];
}

export interface AccountKindProposal {
  accountName: string;
  current: string;
  /** A vocabulary value, or null for no change. */
  proposed: Vertical | null;
  strength: 'strong' | 'thin' | 'unchanged';
  evidence: string[];
  /** What changes in WHO doctrine if the proposal is applied. */
  doctrine: string;
}

export function carrierNetworkTitleShare(titles: readonly string[]): { total: number; carrier: number; matched: string[] } {
  const clean = titles.map((t) => String(t ?? '').trim()).filter(Boolean);
  const matched = clean.filter((t) => CARRIER_NETWORK_ROLE.test(t));
  return { total: clean.length, carrier: matched.length, matched };
}

const SCOUT_TO_VERTICAL: Record<string, Vertical> = { '3pl': CARRIER_VERTICAL, carrier: CARRIER_VERTICAL, retailer: 'Retail', manufacturer: 'Manufacturing' };

function doctrineFor(proposed: Vertical): string {
  if (proposed === CARRIER_VERTICAL) {
    return `shipper rules -> carrier doctrine: network, hub, terminal, station, linehaul, sortation, operations planning and engineering and facility operations roles become PRIMARY operators; a hub, station, ramp, sort or service center leader is a site-scope owner; operations technology with a freight scope is transformation tech; the air side and brokerage are not the ground network. Note: ${VOCABULARY_NOTE}.`;
  }
  return `shipper rules unchanged: the row reads as ${typeFromVertical(proposed) ?? 'a shipper'} instead of unknown (the account kind shows in the owner panel and the brief).`;
}

/** Deterministic: the same evidence always proposes the same thing. */
export function proposeAccountKind(e: AccountKindEvidence): AccountKindProposal {
  const current = String(e.vertical ?? '').trim() || 'Unknown';
  const evidence: string[] = [];
  const share = carrierNetworkTitleShare(e.titles);
  const scoutUsable = !!e.scout && e.scout.basis === 'web' && !e.scout.ambiguous && !!e.scout.entityType;
  if (e.scout) {
    const when = e.scout.at ? `, ${e.scout.at.slice(0, 10)}` : '';
    evidence.push(`Scout (${e.scout.basis ?? 'unknown basis'}${when}${e.scout.ambiguous ? ', ambiguous' : ''}): ${e.scout.entityType ?? 'no entity type'}${e.scout.what ? `, "${e.scout.what}"` : ''}${scoutUsable ? '' : ' (not usable: a web read of the right company is required)'}`);
  }
  evidence.push(share.total ? `GAP persona titles: ${share.carrier} of ${share.total} are carrier-network roles${share.matched.length ? ` (${share.matched.join(', ')})` : ''}` : 'GAP persona titles: none on record');
  if (e.sites) evidence.push(`audited sites: ${e.sites.audited} (self-operated ${e.sites.self}, 3PL-operated ${e.sites.threePl}, JV ${e.sites.jv}): who runs the sites says nothing about what the company is`);

  if (current !== 'Unknown') {
    return {
      accountName: e.accountName,
      current,
      proposed: null,
      strength: 'unchanged',
      evidence,
      doctrine: `unchanged: "${current}" reads as ${typeFromVertical(current) ?? 'a shipper (no entity type)'} today; this review never flips a set vertical (a keyword coincidence is not evidence; a wrong vertical is Casey's correction by hand).`,
    };
  }

  if (scoutUsable && e.scout) {
    const kind = String(e.scout.entityType).toLowerCase();
    const proposed = SCOUT_TO_VERTICAL[kind];
    if (proposed) return { accountName: e.accountName, current, proposed, strength: 'strong', evidence, doctrine: doctrineFor(proposed) };
    evidence.push(`no vocabulary value for ${kind}: Unknown stays until the vocabulary has one`);
  }

  if (share.total >= 5 && share.carrier * 2 > share.total) {
    return { accountName: e.accountName, current, proposed: CARRIER_VERTICAL, strength: 'strong', evidence, doctrine: doctrineFor(CARRIER_VERTICAL) };
  }

  return {
    accountName: e.accountName,
    current,
    proposed: null,
    strength: 'thin',
    evidence,
    doctrine: 'unchanged: Unknown reads under shipper rules; the evidence is too thin to propose a kind (a Scout web read of the right company, or a majority of carrier-network titles among at least five, would).',
  };
}
