export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { isAccountHandTuned, resolveMemoSections } from '@/lib/microsites/memo-compat';
import { resolveReader } from '@/lib/microsites/reader-context';
import { buildPublicShareMetadata } from '@/lib/microsites/share';
import { buildROIDeepLink } from '@/lib/microsites/roi-deep-link';
import { MemoShell } from '@/components/microsites/memo-shell';
import {
  MemoSectionList,
  MemoFootnotes,
  MemoPreamble,
  buildTocEntries,
} from '@/components/microsites/memo-section';
import { MemoSoftAction } from '@/components/microsites/memo-soft-action';
import { MemoAudioBrief } from '@/components/microsites/memo-audio-brief';
import {
  AUDIO_BRIEF_SRC,
  AUDIO_BRIEF_CHAPTERS,
  AUDIO_BRIEF_DURATION,
} from '@/lib/microsites/audio-brief';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';

const PREPARED_DATE = new Date().toISOString().slice(0, 10); // ISO; MemoShell formats display

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
  const readerFirstName =
    reader?.variant.person.firstName ?? reader?.variant.person.name?.split(' ')[0];
  const tocEntries = buildTocEntries(memoSections, {
    withPreambleFor: reader ? readerFirstName : undefined,
    withAudio: true,
  });

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
        tocEntries={tocEntries}
      >
        {reader ? <MemoPreamble variant={reader.variant} /> : null}
        <MemoSectionList sections={memoSections} accentColor={data.theme?.accentColor} />
        <MemoAudioBrief
          src={data.audioBrief?.src ?? AUDIO_BRIEF_SRC}
          chapters={data.audioBrief?.chapters ?? AUDIO_BRIEF_CHAPTERS}
          heading={data.audioBrief?.heading}
          intro={data.audioBrief?.intro}
          accentColor={data.theme?.accentColor}
          expectedDuration={data.audioBrief ? undefined : AUDIO_BRIEF_DURATION}
        />
        <MemoSoftAction
          accountName={data.accountName}
          href={buildROIDeepLink(data, { personSlug: reader?.personSlug })}
        />
        <MemoFootnotes sections={memoSections} />
      </MemoShell>
    </>
  );
}
