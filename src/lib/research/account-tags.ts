import type { Account } from '@prisma/client';
import { getFacilityFact } from './facility-fact-registry';

export interface AccountTag {
  label: string;
  value: string;
  hint?: string;
  /** Origin of this tag's value — surfaced as a tooltip on the badge so the operator knows whether it was hand-curated, derived from account record, or pulled from facility research. */
  source: string;
}

export function buildAccountTags(
  account: Pick<Account, 'name' | 'vertical' | 'signal_type' | 'primo_angle' | 'tier' | 'priority_band'>,
): AccountTag[] {
  const fact = getFacilityFact(account.name);

  const tags: AccountTag[] = [
    { label: 'Vertical', value: account.vertical, source: 'Account record (vertical)' },
    { label: 'Signal', value: account.signal_type ?? 'N/A', source: 'Account record (curated by ops)' },
    { label: 'Primo Angle', value: account.primo_angle ?? 'N/A', source: 'Account record (curated by ops)' },
    { label: 'Tier', value: account.tier, source: 'Account record (priority tiering)' },
    { label: 'Band', value: account.priority_band, source: 'Account record (priority tiering)' },
  ];

  if (fact) {
    tags.unshift({
      label: 'Facility Count',
      value: fact.facilityCount,
      hint: fact.scope,
      source: 'Facility research workbench',
    });
  }

  return tags;
}
