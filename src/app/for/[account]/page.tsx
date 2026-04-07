export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { MicrositeSection } from '@/lib/microsites/schema';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { getVariantRoutes } from '@/lib/microsites/rules';
import { MicrositeShell, getMicrositeSectionNavItems } from '@/components/microsites/microsite-shell';
import { Reveal } from '@/components/microsites/reveal';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';
import { prisma } from '@/lib/prisma';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

function isHeroSection(section: MicrositeSection): section is Extract<MicrositeSection, { type: 'hero' }> {
  return section.type === 'hero';
}

function isProblemSection(section: MicrositeSection): section is Extract<MicrositeSection, { type: 'problem' }> {
  return section.type === 'problem';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ account: string }>;
}): Promise<Metadata> {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) return { title: 'YardFlow' };
  return {
    title: data.pageTitle,
    description: data.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function AccountMicrositePage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;
  const data = getAccountMicrositeData(account);
  if (!data) notFound();

  const variants = getVariantRoutes(data);
  const heroSection = data.sections.find(isHeroSection);
  const problemSection = data.sections.find(isProblemSection);
  const navItems = getMicrositeSectionNavItems(data.sections);
  const focusPoints =
    problemSection?.painPoints.slice(0, 4).map((point) => point.headline) ??
    ['Dock bottlenecks', 'Trailer staging variance', 'Spotter prioritization', 'Network standardization'];

  // Log page view
  try {
    await prisma.activity.create({
      data: {
        account_name: data.accountName,
        activity_type: 'Page View',
        outcome: `Microsite viewed: /for/${account}`,
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
        path={`/for/${account}`}
      />
      <MicrositeShell
        accountName={data.accountName}
        accentColor={data.theme?.accentColor}
        contextLabel={`For ${data.accountName}`}
        contextDetail={[data.parentBrand, data.tier, `Priority ${data.band}${data.priorityScore ? ` ${data.priorityScore}` : ''}`]
          .filter(Boolean)
          .join(' · ')}
        title={`${data.accountName} yard execution brief`}
        summary={data.metaDescription}
        thesis={heroSection?.headline ?? `The yard is the hidden constraint inside ${data.accountName}'s network.`}
        focusPoints={focusPoints}
        navItems={navItems}
        primaryCta={{
          href: heroSection?.cta.calendarLink ?? BOOKING_LINK,
          label: heroSection?.cta.buttonLabel ?? 'Book a Network Audit',
        }}
        statusLabel={`${data.band}-Band · ${data.tier}`}
        variantLinks={variants.map((variant) => ({
          href: `/for/${account}/${variant.slug}`,
          label: variant.personName,
          slug: variant.slug,
        }))}
      >
        {data.sections.map((section, i) => (
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
