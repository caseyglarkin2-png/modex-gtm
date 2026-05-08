export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { isAccountHandTuned, resolveMemoSections } from '@/lib/microsites/memo-compat';
import { buildPublicShareMetadata } from '@/lib/microsites/share';
import { MemoShell } from '@/components/microsites/memo-shell';
import { MemoSectionList } from '@/components/microsites/memo-section';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';

const PREPARED_DATE = new Date().toISOString().slice(0, 10);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ account: string }>;
}): Promise<Metadata> {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) return { title: 'YardFlow' };
  return buildPublicShareMetadata({
    title: data.pageTitle,
    description: data.metaDescription,
    pathname: `/for/${account}`,
    imagePath: `/for/${account}/opengraph-image`,
    imageAlt: `${data.accountName} private field brief — YardFlow Yard Network System analysis`,
  });
}

export default async function AccountMicrositePage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const memoSections = resolveMemoSections(data);
  const handTuned = isAccountHandTuned(data);
  const facilityFootprint = data.network?.facilityCount
    ? `${data.network.facilityCount} footprint`
    : undefined;

  return (
    <>
      <MicrositeTracker
        accountName={data.accountName}
        accountSlug={data.slug}
        path={`/for/${account}`}
      />
      <MemoShell
        accountName={data.accountName}
        accentColor={data.theme?.accentColor}
        preparedDate={PREPARED_DATE}
        title={`Yard execution as a network constraint for ${data.accountName}`}
        contextDetail={facilityFootprint}
        authorByline="Casey Larkin · YardFlow by FreightRoll"
        needsHandTuning={!handTuned}
      >
        <MemoSectionList sections={memoSections} accentColor={data.theme?.accentColor} />
      </MemoShell>
    </>
  );
}
