/**
 * ENTITY BOUNDARY (owner resolution, 2026-10-05). A person whose title or CRM company names a unit the account no
 * longer owns, or a separate operating company inside the same group, is not silently the account's owner. A known
 * corporate transaction outranks stale CRM data: FedEx completed the sale of FedEx Supply Chain (the former GENCO) to
 * CMA CGM on 2026-10-01 (it joins CEVA Logistics), so a "FedEx Supply Chain" title no longer belongs to FedEx.
 *
 * A reviewed code constant, like policy/restriction.ts: no table, no inference. Matched on the person's title and the
 * CRM company field, never on an email domain (every unit mails from the parent's domain).
 */

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
}

const BOUNDARIES: ReadonlyArray<{ account: RegExp; boundaries: readonly EntityBoundary[] }> = [
  {
    account: /^(fedex|federal express)\b/i,
    boundaries: [
      {
        unit: 'FedEx Supply Chain',
        status: 'divested',
        since: '2026-10-01',
        note: 'FedEx Supply Chain (the former GENCO) was sold to CMA CGM on 2026-10-01 and joins CEVA Logistics: this role no longer belongs to FedEx.',
        match: /\b(fedex supply chain|genco)\b/i,
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
        note: 'FedEx Freight is the LTL company (a separate network, being separated from FedEx Corporation): confirm the remit before a parcel-network motion.',
        match: /\bfedex freight\b/i,
      },
    ],
  },
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
