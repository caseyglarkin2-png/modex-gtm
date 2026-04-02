export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { resolveMicrositeBySlug, getVariantRoutes } from '@/lib/microsites/rules';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import { getAccentClasses } from '@/components/microsites/theme';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

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
  const accent = getAccentClasses(data.theme?.accentColor);

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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-cyan-400">Yard</span><span>Flow</span>
              <span className="text-slate-400 text-sm font-normal ml-2">by FreightRoll</span>
            </h1>
          </div>
          <a
            href={resolved.cta.calendarLink ?? BOOKING_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`${accent.bg} ${accent.bgHover} text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors`}
          >
            {resolved.cta.buttonLabel}
          </a>
        </div>
      </header>

      {/* Person-specific variant navigation */}
      {variants.length > 1 && (
        <nav className="border-b border-slate-800 bg-slate-900/30">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
            <Link
              href={`/for/${account}`}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-300 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-full px-3 py-1 transition-colors"
            >
              Overview
            </Link>
            {variants.map((v) => (
              <Link
                key={v.slug}
                href={`/for/${account}/${v.slug}`}
                className={`shrink-0 text-xs rounded-full px-3 py-1 transition-colors border ${
                  v.slug === person
                    ? 'text-cyan-300 bg-cyan-950/50 border-cyan-800/50'
                    : 'text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 border-cyan-900/30'
                }`}
              >
                {v.personName}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Person identifier */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <p className="text-xs tracking-[0.25em] text-cyan-300 uppercase font-semibold">
          For {personProfile.name} &middot; {data.accountName}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {personProfile.title}
        </p>
      </div>

      {/* Framing narrative */}
      {variant.framingNarrative && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="bg-slate-900/50 rounded-lg px-5 py-4 border border-slate-800 border-l-2 border-l-cyan-400/60">
            <p className="text-sm text-slate-300 leading-relaxed">{variant.framingNarrative}</p>
          </div>
        </div>
      )}

      {/* Sections */}
      <main>
        {sections.map((section, i) => (
          <MicrositeSectionRenderer key={`${section.type}-${i}`} section={section} accentColor={data.theme?.accentColor} />
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll &middot; casey@freightroll.com</p>
        </div>
      </footer>
    </div>
  );
}
