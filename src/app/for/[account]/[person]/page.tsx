export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { MicrositeSection } from '@/lib/microsites/schema';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { resolveMicrositeBySlug, getVariantRoutes } from '@/lib/microsites/rules';
import { MicrositeShell, getMicrositeSectionNavItems } from '@/components/microsites/microsite-shell';
import { Reveal } from '@/components/microsites/reveal';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';
import { prisma } from '@/lib/prisma';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

function isProblemSection(section: MicrositeSection): section is Extract<MicrositeSection, { type: 'problem' }> {
  return section.type === 'problem';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ account: string; person: string }>;
}): Promise<Metadata> {
  const { account, person } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) return { title: 'YardFlow' };
  const resolved = resolveMicrositeBySlug(data, person);
  const personName = resolved?.person?.name;
  return {
    title: personName ? `${data.pageTitle} — ${personName}` : data.pageTitle,
    description: data.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function PersonMicrositePage({
  params,
}: {
  params: Promise<{ account: string; person: string }>;
}) {
  const { account, person } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const resolved = resolveMicrositeBySlug(data, person);
  if (!resolved) notFound();

  const { sections, person: personProfile, variant } = resolved;
  const variants = getVariantRoutes(data);
  const navItems = getMicrositeSectionNavItems(sections);
  const problemSection = sections.find(isProblemSection);
  const focusPoints =
    personProfile.strategicPriorities?.slice(0, 4) ??
    variant.kpiLanguage.slice(0, 4) ??
    problemSection?.painPoints.slice(0, 4).map((point) => point.headline) ??
    ['Dock throughput', 'Trailer visibility', 'Execution variance', 'Network impact'];

  // Log person-specific page view
  try {
    await prisma.activity.create({
      data: {
        account_name: data.accountName,
        activity_type: 'Page View',
        outcome: `Microsite viewed: /for/${account}/${person} (${personProfile.name})`,
        next_step: 'Follow up within 24 hours if first view',
        owner: 'System',
        activity_date: new Date(),
      },
    });
  } catch {
    // non-blocking
  }

  return (
    <>
      <MicrositeTracker
        accountName={data.accountName}
        accountSlug={data.slug}
        personName={personProfile.name}
        personSlug={person}
        path={`/for/${account}/${person}`}
        variantSlug={variant.variantSlug}
      />
      <MicrositeShell
        accountName={data.accountName}
        accentColor={data.theme?.accentColor}
        contextLabel={`For ${personProfile.name} · ${data.accountName}`}
        contextDetail={[personProfile.title, personProfile.currentMandate].filter(Boolean).join(' · ')}
        framingNarrative={variant.framingNarrative}
        title={`${personProfile.firstName} ${personProfile.lastName} operating brief`}
        summary={variant.openingHook}
        thesis={variant.stakeStatement}
        focusPoints={focusPoints}
        navItems={navItems}
        primaryCta={{
          href: resolved.cta.calendarLink ?? BOOKING_LINK,
          label: resolved.cta.buttonLabel,
        }}
        statusLabel={`${data.band}-Band · ${personProfile.function}`}
        variantLinks={[
          { href: `/for/${account}`, label: 'Overview', slug: 'overview' },
          ...variants.map((entry) => ({
            href: `/for/${account}/${entry.slug}`,
            label: entry.personName,
            slug: entry.slug,
            active: entry.slug === person,
          })),
        ]}
      >
        {sections.map((section, i) => (
          <Reveal key={`${section.type}-${i}`} delayMs={Math.min(i * 90, 360)}>
            <MicrositeSectionRenderer
              section={section}
              sectionId={section.sectionId ?? `${section.type}-${i + 1}`}
              accentColor={data.theme?.accentColor}
            />
          </Reveal>
        ))}
      </MicrositeShell>
    </>
  );
}
