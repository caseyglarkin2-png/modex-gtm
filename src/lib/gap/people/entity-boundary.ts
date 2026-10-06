/**
 * ENTITY BOUNDARY (owner resolution, 2026-10-05; first-party provenance 2026-10-06). A person whose title or CRM
 * company names a unit the account no longer owns, or a separate operating company inside the same group, is not
 * silently the account's owner. A known corporate transaction outranks stale CRM data: FedEx completed the sale of
 * FedEx Supply Chain (the former GENCO) to CMA CGM Group on 2026-10-01 (it joins CEVA Logistics), so a "FedEx Supply
 * Chain" title no longer belongs to FedEx; FedEx Freight completed its spin-off on 2026-06-01 (NYSE: FDXF).
 *
 * A reviewed code constant, like policy/restriction.ts: no table, no inference. Each divestiture or separation
 * carries its FIRST-PARTY source (the company's own release, quoted and dated), so the story and the stack say
 * "verified" from the constant, never "an unverified report". Matched on the person's title and the CRM company
 * field, never on an email domain (every unit mails from the parent's domain).
 */

export interface EntitySource {
  /** The company's own release (newsroom or investor relations), never a third party. */
  url: string;
  publisher: string;
  /** A verbatim sentence from the release. */
  quote: string;
  /** ISO date of the release. */
  publishedAt: string;
}

export interface EntityBoundary {
  /** The unit the title names. */
  unit: string;
  /** divested: no longer the account's; separate: another operating company in the same group (confirm before use). */
  status: 'divested' | 'separate';
  /** When the boundary took effect (divested), if known. */
  since?: string;
  /** One sentence for Casey. */
  note: string;
  match: RegExp;
  /** The first-party source behind the boundary, when the company itself announced it. */
  source?: EntitySource;
}

const FEDEX_SUPPLY_CHAIN_SALE: EntitySource = {
  url: 'https://newsroom.fedex.com/fedex-completes-sale-of-fedex-supply-chain-to-cma-cgm-group',
  publisher: 'FedEx newsroom',
  quote: 'FedEx Corp. (NYSE: FDX) today announced the completion of its sale of FedEx Supply Chain, a subsidiary of FedEx Corp., to CMA CGM Group for an enterprise value of $1.4 billion.',
  publishedAt: '2026-10-01',
};

const FEDEX_FREIGHT_SPIN_OFF: EntitySource = {
  url: 'https://newsroom.fedex.com/newsroom/global-english/fedex-completes-spin-off-of-fedex-freight',
  publisher: 'FedEx newsroom',
  quote: 'FedEx Corp. (NYSE: FDX, "FedEx") today announced the completion of its spin-off of FedEx Freight Holding Company, Inc. (NYSE: FDXF, "FedEx Freight"), establishing FedEx Freight as an independent, publicly traded company and focused leader in the North American less-than-truckload (LTL) industry.',
  publishedAt: '2026-06-01',
};

const BOUNDARIES: ReadonlyArray<{ account: RegExp; boundaries: readonly EntityBoundary[] }> = [
  {
    account: /^(fedex|federal express)\b/i,
    boundaries: [
      {
        unit: 'FedEx Supply Chain',
        status: 'divested',
        since: '2026-10-01',
        note: 'FedEx completed the sale of FedEx Supply Chain (the former GENCO) to CMA CGM Group on October 1, 2026 for $1.4 billion; it joins CEVA Logistics, so this role no longer belongs to FedEx (FedEx newsroom, Oct 1, 2026).',
        match: /\b(fedex supply chain|genco)\b/i,
        source: FEDEX_SUPPLY_CHAIN_SALE,
      },
      {
        unit: 'FedEx Logistics',
        status: 'separate',
        note: 'FedEx Logistics is a separate operating company (freight forwarding, customs brokerage), not the FedEx ground or air network: confirm the remit before a network motion.',
        match: /\bfedex logistics\b/i,
      },
      {
        unit: 'FedEx Freight',
        status: 'separate',
        since: '2026-06-01',
        note: 'FedEx Freight completed its spin-off from FedEx Corporation on June 1, 2026 and is an independent public LTL carrier (NYSE: FDXF): a separate network and a separate company; confirm the remit before a parcel-network motion (FedEx newsroom, Jun 1, 2026).',
        match: /\bfedex freight\b/i,
        source: FEDEX_FREIGHT_SPIN_OFF,
      },
    ],
  },
];

/** The first-party facts behind the boundaries, for scripts/gap/store-first-party-entity-facts.ts (one research contract). */
export const FIRST_PARTY_ENTITY_FACTS: ReadonlyArray<{ accountName: string; title: string } & EntitySource> = [
  { accountName: 'FedEx', title: 'FedEx Completes Sale of FedEx Supply Chain to CMA CGM Group', ...FEDEX_SUPPLY_CHAIN_SALE },
  { accountName: 'FedEx', title: 'FedEx Completes Spin-Off of FedEx Freight', ...FEDEX_FREIGHT_SPIN_OFF },
];

/** The boundary a person's title or CRM company crosses for this account, else null. */
export function entityBoundaryFor(accountName: string, person: { title?: string | null; company?: string | null }): EntityBoundary | null {
  const set = BOUNDARIES.find((b) => b.account.test(accountName.trim()));
  if (!set) return null;
  const text = `${person.title ?? ''} | ${person.company ?? ''}`;
  // A boundary never fires on its own account: at an account named "FedEx Freight", its own people are not a
  // separate entity (review S5).
  return set.boundaries.find((b) => !b.match.test(accountName) && b.match.test(text)) ?? null;
}
