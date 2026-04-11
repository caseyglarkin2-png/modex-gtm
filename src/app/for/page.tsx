export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { getVariantRoutes } from '@/lib/microsites/rules';
import { getAccentClasses } from '@/components/microsites/theme';

export const metadata: Metadata = {
  title: 'YardFlow Microsites — Internal Gallery',
  robots: { index: false, follow: false },
};

function PublicLanding() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-cyan-400">Yard</span><span>Flow</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            The First Yard Network System
          </p>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Your personalized field brief is ready.
          </h2>
          <p className="text-slate-400 leading-relaxed">
            If you received a link from Casey Larkin at FreightRoll, click it to view your custom network analysis and ROI preview.
          </p>
          <p className="text-sm text-slate-500">
            Questions? Reach out to{' '}
            <a href="mailto:casey@freightroll.com" className="text-cyan-400 hover:underline">
              casey@freightroll.com
            </a>
          </p>
        </div>
      </main>
      <footer className="border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll</p>
        </div>
      </footer>
    </div>
  );
}

export default async function MicrositeGalleryPage() {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isPublicDomain = host.includes('yardflow.ai');

  if (isPublicDomain) {
    return <PublicLanding />;
  }

  const accounts = getAllAccountMicrositeData();
  const showcaseAccounts = accounts
    .filter((a) => a.showcase)
    .sort((a, b) => (a.showcaseOrder ?? 99) - (b.showcaseOrder ?? 99));
  const otherAccounts = accounts
    .filter((a) => !a.showcase)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-cyan-400">Yard</span><span>Flow</span>
            <span className="text-slate-400 text-sm font-normal ml-2">Microsite Gallery</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Internal view — {accounts.length} account microsites · {showcaseAccounts.length} showcase
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Showcase Section */}
        {showcaseAccounts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-amber-400 font-bold">
                Showcase
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {showcaseAccounts.map((account) => {
                const accent = getAccentClasses(account.theme?.accentColor);
                const variants = getVariantRoutes(account);
                const heroSection = account.sections.find((s) => s.type === 'hero');
                const headline = heroSection && 'headline' in heroSection ? heroSection.headline : '';
                return (
                  <Link
                    key={account.slug}
                    href={`/for/${account.slug}`}
                    className="group rounded-lg border border-slate-700/50 bg-slate-900/50 p-5 hover:border-slate-600 transition-colors block"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${accent.bg}`} />
                      <span className="text-sm font-bold text-white group-hover:text-slate-200">
                        {account.accountName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                      {headline}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          account.band === 'A'
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                            : 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40'
                        }`}
                      >
                        Band {account.band}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {variants.length} variant{variants.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">
                        {account.sections.length} sections
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All Accounts */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] tracking-[0.3em] uppercase text-slate-500 font-bold">
              All Accounts
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="space-y-4">
            {otherAccounts.map((account) => {
              const accent = getAccentClasses(account.theme?.accentColor);
              const variants = getVariantRoutes(account);
            return (
              <div
                key={account.slug}
                className="rounded-lg border border-slate-800 bg-slate-900/30 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${accent.bg}`} />
                      <Link
                        href={`/for/${account.slug}`}
                        className="text-lg font-bold text-white hover:text-cyan-300 transition-colors"
                      >
                        {account.accountName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-slate-500">
                        {account.vertical}
                      </span>
                      <span className="text-[10px] text-slate-600">|</span>
                      <span className="text-[10px] text-slate-500">
                        {account.network.facilityCount} facilities
                      </span>
                      <span className="text-[10px] text-slate-600">|</span>
                      <span className="text-[10px] text-slate-500">
                        {account.people.length} people
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        account.band === 'A'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                          : account.band === 'B'
                          ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Band {account.band}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{account.priorityScore}</span>
                  </div>
                </div>

                {/* Person variants */}
                {variants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <Link
                        key={v.slug}
                        href={`/for/${account.slug}/${v.slug}`}
                        className={`text-xs ${accent.text} hover:opacity-80 ${accent.bgSubtle} border ${accent.border} rounded-full px-3 py-1 transition-colors`}
                      >
                        {v.personName}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Sections count */}
                <p className="text-[10px] text-slate-600 mt-3">
                  {account.sections.length} sections · {account.personVariants.length} person variants · {account.proofBlocks.length} proof blocks
                </p>
              </div>
            );
          })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll &middot; Internal use only</p>
        </div>
      </footer>
    </div>
  );
}
