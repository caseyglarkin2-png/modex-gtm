import type { Account } from '@prisma/client';
import { getFacilityFact } from './facility-fact-registry';

export interface AccountTag {
  label: string;
  value: string;
  hint?: string;
}

export function buildAccountTags(
  account: Pick<Account, 'name' | 'vertical' | 'signal_type' | 'primo_angle' | 'tier' | 'priority_band'>,
): AccountTag[] {
  const fact = getFacilityFact(account.name);

  const tags: AccountTag[] = [
    { label: 'Vertical', value: account.vertical },
    { label: 'Signal', value: account.signal_type ?? 'N/A' },
    { label: 'Primo Angle', value: account.primo_angle ?? 'N/A' },
    { label: 'Tier', value: account.tier },
    { label: 'Band', value: account.priority_band },
  ];

  if (fact) {
    tags.unshift({
      label: 'Facility Count',
      value: fact.facilityCount,
      hint: fact.scope,
    });
  }

  return tags;
}
