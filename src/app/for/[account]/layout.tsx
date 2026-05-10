import type { ReactNode } from 'react';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { computeDetentionPerSecond } from '@/lib/microsites/detention-rate';
import { parseLeadingNumber } from '@/lib/microsites/roi-deep-link';
import { DetentionClock } from '@/components/microsites/detention-clock';

/**
 * Layout that wraps the per-account memo and any future child routes
 * (e.g. /for/[account]/[person]). Mounts the Detention Clock once so
 * the accrued total is continuous across child route navigation rather
 * than resetting whenever the user clicks into a person variant.
 *
 * If the account slug is unknown OR the account record has no
 * facilityCount, the clock is skipped — we never make up numbers.
 */
export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  const facilityCount = parseLeadingNumber(data?.network?.facilityCount) ?? undefined;

  return (
    <>
      {children}
      {facilityCount ? (
        <DetentionClock
          perSecond={computeDetentionPerSecond(facilityCount)}
          accentColor={data?.theme?.accentColor}
        />
      ) : null}
    </>
  );
}
