export const dynamic = 'force-dynamic';

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
import MicrositePostHogBeacon from '@/components/microsites/microsite-posthog-beacon';

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
  // Unknown slug: serve the capture page (see the page component). The root
  // loading.tsx streams a 200 before notFound() could set a 404 status, so a
  // deliberate noindex capture surface beats a 200-streamed not-found shell.
  if (!data) {
    return {
      title: 'Yard network briefs — YardFlow by FreightRoll',
      description:
        'Private field briefs are built per account and shared directly. See a live network demo or get one built for your yards.',
      robots: { index: false, follow: false },
    };
  }
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
  // Unknown slug → capture page, not a 404 shell. /for/* is prospect-facing
  // through the yardflow.ai proxy; a mistyped or stale link should land on
  // an honest "this brief isn't live" with a route back to the live surfaces.
  if (!data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          YardFlow by FreightRoll
        </p>
        <h1 className="mt-4 text-2xl font-semibold">This brief isn&apos;t live.</h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted-foreground)]">
          Private field briefs are built per account and shared directly. If someone
          sent you a link, check it with them. If you want one for your network, we
          map your yards from satellite and build it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://yardflow.ai/demo/"
            className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
          >
            See a live network demo
          </a>
          <a
            href="https://meetings.hubspot.com/casey416"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
          >
            Book 30 minutes
          </a>
        </div>
      </div>
    );
  }

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
    audioAfterFirst: true,
  });

  const audioBrief = (
    <MemoAudioBrief
      src={data.audioBrief?.src ?? AUDIO_BRIEF_SRC}
      chapters={data.audioBrief?.chapters ?? AUDIO_BRIEF_CHAPTERS}
      heading={data.audioBrief?.heading}
      intro={data.audioBrief?.intro}
      accentColor={data.theme?.accentColor}
      expectedDuration={data.audioBrief ? undefined : AUDIO_BRIEF_DURATION}
      videoFollowUp={data.audioBrief?.videoFollowUp}
    />
  );

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
      <MicrositePostHogBeacon slug={account} surface="for" />
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
        <MemoSectionList
          sections={memoSections}
          accentColor={data.theme?.accentColor}
          afterFirst={audioBrief}
        />
        <MemoSoftAction
          accountName={data.accountName}
          accountSlug={account}
          href={buildROIDeepLink(data, { personSlug: reader?.personSlug })}
        />
        <MemoFootnotes sections={memoSections} />
      </MemoShell>
    </>
  );
}
