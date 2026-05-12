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
  extractMarginaliaItems,
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
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { account } = await params;
  const sp = await searchParams;
  const data = getAccountMicrositeData(account);
  if (!data) return { title: 'YardFlow' };
  const reader = resolveReader(data, sp.p);
  const personSlug = reader?.personSlug;
  const imagePath = personSlug
    ? `/for/${account}/p/${personSlug}/opengraph-image`
    : `/for/${account}/opengraph-image`;
  const pathname = personSlug ? `/for/${account}?p=${personSlug}` : `/for/${account}`;
  const title = personSlug ? `${data.pageTitle} — for ${reader.variant.person.firstName ?? reader.variant.person.name}` : data.pageTitle;
  return buildPublicShareMetadata({
    title,
    description: data.metaDescription,
    pathname,
    imagePath,
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
  const marginaliaItems = data.marginaliaItems ?? extractMarginaliaItems(memoSections);
  const handTuned = isAccountHandTuned(data);
  const reader = resolveReader(data, sp.p);
  const facilityFootprint =
    data.coverFootprint ??
    (data.network?.facilityCount ? `${data.network.facilityCount} footprint` : undefined);
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
        title={data.coverHeadline ?? `Yard execution as a network constraint for ${data.accountName}`}
        titleEmphasis={data.titleEmphasis}
        readerEyebrow={reader?.eyebrow}
        contextDetail={facilityFootprint}
        authorByline="Casey Larkin · YardFlow by FreightRoll"
        needsHandTuning={!handTuned}
        tocEntries={tocEntries}
        marginaliaItems={marginaliaItems}
      >
        {reader ? <MemoPreamble variant={reader.variant} /> : null}
        <MemoAudioBrief
          src={data.audioBrief?.src ?? AUDIO_BRIEF_SRC}
          chapters={data.audioBrief?.chapters ?? AUDIO_BRIEF_CHAPTERS}
          heading={data.audioBrief?.heading}
          intro={data.audioBrief?.intro}
          accentColor={data.theme?.accentColor}
          expectedDuration={data.audioBrief ? undefined : AUDIO_BRIEF_DURATION}
        />
        <MemoSectionList sections={memoSections} accentColor={data.theme?.accentColor} />
        <MemoSoftAction
          accountName={data.accountName}
          href={buildROIDeepLink(data, { personSlug: reader?.personSlug })}
        />
        <MemoFootnotes sections={memoSections} />
      </MemoShell>
    </>
  );
}
