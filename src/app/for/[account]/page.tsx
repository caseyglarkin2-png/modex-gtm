export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { getVariantRoutes } from '@/lib/microsites/rules';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import { getAccentClasses } from '@/components/microsites/theme';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

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
  const accent = getAccentClasses(data.theme?.accentColor);

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
            href={BOOKING_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`${accent.bg} ${accent.bgHover} text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors`}
          >
            Book a Network Audit
          </a>
        </div>
      </header>

      {/* Person-specific variant navigation */}
      {variants.length > 0 && (
        <nav className="border-b border-slate-800 bg-slate-900/30">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-semibold shrink-0">
              Custom views:
            </span>
            {variants.map((v) => (
              <Link
                key={v.slug}
                href={`/for/${account}/${v.slug}`}
                className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-900/30 rounded-full px-3 py-1 transition-colors"
              >
                {v.personName}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Account label */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <p className="text-xs tracking-[0.25em] text-cyan-300 uppercase font-semibold">
          For {data.accountName}
        </p>
      </div>

      {/* Sections */}
      <main>
        {data.sections.map((section, i) => (
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
