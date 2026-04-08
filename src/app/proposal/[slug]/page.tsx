export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import type { OnePagerData } from '@/components/ai/one-pager-preview';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';
import { ProposalBrief } from '@/components/microsites/proposal-brief';
import { buildPublicShareMetadata } from '@/lib/microsites/share';
import { resolveMicrositeProposalBrief } from '@/lib/microsites/proposal';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getOnePagerData(accountName: string): Promise<OnePagerData | null> {
  const record = await prisma.generatedContent.findFirst({
    where: { account_name: accountName, content_type: 'one_pager' },
    orderBy: { created_at: 'desc' },
  });

  if (!record?.content) return null;

  try {
    return JSON.parse(record.content) as OnePagerData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const proposal = resolveMicrositeProposalBrief(slug);

  if (proposal) {
    return buildPublicShareMetadata({
      title: `${proposal.accountName} board-ready yard execution proposal`,
      description: proposal.hero.headline,
      pathname: proposal.proposalPath,
      imagePath: `${proposal.proposalPath}/opengraph-image`,
      imageAlt: `${proposal.accountName} board-ready proposal preview with network and ROI context`,
    });
  }

  const accountName = slugToName(slug);

  return buildPublicShareMetadata({
    title: `${accountName} YardFlow proposal`,
    description: `Board-ready YardFlow proposal for ${accountName}.`,
    pathname: `/proposal/${slug}`,
    imagePath: `/opengraph-image`,
    imageAlt: `${accountName} YardFlow proposal preview`,
  });
}

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = resolveMicrositeProposalBrief(slug);

  if (proposal) {
    try {
      await prisma.activity.create({
        data: {
          account_name: proposal.accountName,
          activity_type: 'Page View',
          outcome: `Proposal page viewed: ${proposal.proposalPath}`,
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
          accountName={proposal.accountName}
          accountSlug={proposal.slug}
          path={proposal.proposalPath}
          variantSlug="proposal-brief"
        />
        <ProposalBrief proposal={proposal} />
      </>
    );
  }

  const accountName = slugToName(slug);

  // Try exact match first, then case-insensitive
  let account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) {
    account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: 'insensitive' } },
    });
  }

  if (!account) notFound();

  const data = await getOnePagerData(account.name);

  // Log the page visit as an Activity
  try {
    await prisma.activity.create({
      data: {
        account_name: account.name,
        activity_type: 'Page View',
        outcome: `Proposal page viewed: /proposal/${slug}`,
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
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
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
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Book a Network Audit
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {data ? (
          <>
            {/* One-Pager */}
            <div className="bg-[#0b1a2e] rounded-xl overflow-hidden text-sm">
              {/* Header */}
              <div className="px-6 pt-6 pb-3">
                <p className="text-xs tracking-[0.25em] text-cyan-300 uppercase font-semibold">For {account.name}</p>
                <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
                  <span className="text-cyan-400">Yard</span><span className="text-white">Flow</span>
                  <span className="text-slate-400 text-lg font-normal ml-2">by FreightRoll</span>
                </h2>
              </div>

              {/* Headline */}
              <div className="px-6 pb-4">
                <h3 className="text-base font-extrabold uppercase tracking-tight text-white leading-snug">
                  {data.headline}
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{data.subheadline}</p>
              </div>

              {/* Three columns */}
              <div className="mx-4 rounded-lg border border-slate-600/60 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr]">
                  {/* Pain */}
                  <div className="border-b md:border-b-0 md:border-r border-slate-600/60">
                    <div className="bg-red-900/50 px-3 py-2 text-center border-b border-slate-600/40">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Typical Reality</span>
                    </div>
                    <div className="px-3 py-3 space-y-2.5">
                      {data.painPoints.map((pain, i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                          <span className="text-red-400 shrink-0 text-sm">&#9888;</span>
                          <span>{pain}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="border-b md:border-b-0 md:border-r border-slate-600/60">
                    <div className="bg-blue-900/50 px-3 py-2 text-center border-b border-slate-600/40">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Standardized Operating Protocol</span>
                    </div>
                    <div className="px-3 py-3">
                      <div className="relative">
                        {data.solutionSteps.map((s, i) => (
                          <div key={s.step} className="relative pl-6 pb-3 last:pb-0">
                            {i < data.solutionSteps.length - 1 && (
                              <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/60 to-cyan-500/20" />
                            )}
                            <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full border-2 border-cyan-500/70 bg-[#0b1a2e] flex items-center justify-center">
                              <span className="text-[9px] font-bold text-cyan-400">{s.step}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-cyan-300 font-bold">{s.title}</span>
                              <p className="text-slate-400 mt-0.5 leading-snug text-[11px]">{s.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Outcomes */}
                  <div>
                    <div className="bg-emerald-900/50 px-3 py-2 text-center border-b border-slate-600/40">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">YardFlow Effect</span>
                    </div>
                    <div className="px-3 py-3 space-y-2.5">
                      {data.outcomes.map((outcome, i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                          <span className="text-emerald-400 shrink-0">&#10003;</span>
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Proof Stats */}
              <div className="mx-4 mt-4">
                <div className="text-center mb-3">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold border-t border-b border-slate-600 px-6 py-1.5 inline-block">
                    Proof from Live Deployment
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {data.proofStats.map((stat, i) => {
                    const icons = ['\u{1F3ED}', '\u{1F310}', '\u{1F464}', '\u23F1', '\u{1F4B0}'];
                    return (
                      <div key={i} className="text-center bg-slate-800/50 rounded-lg py-3 px-1 border border-slate-700/40">
                        <div className="text-sm mb-1">{icons[i] ?? '\u{1F4CA}'}</div>
                        <p className="text-base font-bold text-white leading-none">{stat.value}</p>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quote */}
              <div className="mx-4 mt-4 bg-slate-800/30 rounded-lg px-4 py-3 border-l-2 border-cyan-400/60">
                <p className="text-xs text-slate-300 italic leading-relaxed">&ldquo;{data.customerQuote}&rdquo;</p>
              </div>

              {/* Best Fit */}
              <div className="px-6 py-4 mt-2 border-t border-slate-700/50 space-y-1.5">
                <p className="text-xs text-slate-300"><strong className="text-slate-100">Best fit:</strong> {data.bestFit}</p>
                <p className="text-xs text-slate-400"><strong className="text-slate-300">Public source context:</strong> {data.publicContext}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center space-y-4">
              <h3 className="text-xl font-bold">Ready to see what YardFlow can do for {account.name}?</h3>
              <p className="text-slate-400 text-sm">Book a 30-minute Network Audit. We map your facilities and deliver a board-ready ROI deck.</p>
              <a
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm px-8 py-3 rounded-lg transition-colors"
              >
                Book a Network Audit
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-slate-300">Proposal for {account.name}</h2>
            <p className="text-slate-400 mt-3">This proposal is being prepared. Check back soon.</p>
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm px-8 py-3 rounded-lg transition-colors"
            >
              Book a Network Audit Now
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll &middot; casey@freightroll.com</p>
        </div>
      </footer>
    </div>
  );
}
