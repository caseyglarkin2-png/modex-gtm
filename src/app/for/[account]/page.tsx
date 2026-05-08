export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { isAccountHandTuned, resolveMemoSections } from '@/lib/microsites/memo-compat';
import { resolveReader } from '@/lib/microsites/reader-context';
import { buildPublicShareMetadata } from '@/lib/microsites/share';
import { buildROIDeepLink } from '@/lib/microsites/roi-deep-link';
import { MemoShell } from '@/components/microsites/memo-shell';
import { MemoSectionList } from '@/components/microsites/memo-section';
import { MemoSoftAction } from '@/components/microsites/memo-soft-action';
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
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { account } = await params;
  const sp = await searchParams;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const memoSections = resolveMemoSections(data);
  const handTuned = isAccountHandTuned(data);
  const reader = resolveReader(data, sp.p);
  const facilityFootprint = data.network?.facilityCount
    ? `${data.network.facilityCount} footprint`
    : undefined;

  return (
    <>
      <MicrositeTracker
        accountName={data.accountName}
        accountSlug={data.slug}
        path={`/for/${account}`}
        personName={reader?.variant.person.name}
        personSlug={reader?.personSlug}
        variantSlug={reader?.variant.variantSlug}
      />
      <MemoShell
        accountName={data.accountName}
        accentColor={data.theme?.accentColor}
        preparedDate={PREPARED_DATE}
        title={`Yard execution as a network constraint for ${data.accountName}`}
        readerEyebrow={reader?.eyebrow}
        contextDetail={facilityFootprint}
        authorByline="Casey Larkin · YardFlow by FreightRoll"
        needsHandTuning={!handTuned}
      >
        <MemoSectionList sections={memoSections} accentColor={data.theme?.accentColor} />
        <MemoSoftAction
          accountName={data.accountName}
          href={buildROIDeepLink(data, { personSlug: reader?.personSlug })}
        />
      </MemoShell>
    </>
  );
}
