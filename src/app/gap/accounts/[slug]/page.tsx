/**
 * /gap/accounts/:slug   ONE account surface, three depths (V2, 2026-10-02):
 *   NOW      (default) the decision in 10-30 seconds: state, NEXT, WHO, WHY NOW, the gap, ASK
 *   BRIEF    the meeting brief: 3-5 lines per section, view details one click deeper
 *   SOURCES  the full analyst layer (every statement, source, model, hypothesis, research plan)
 * All three are projections of the SAME brief (account-intel/build.ts) and account context (context/*); nothing is
 * decided twice. Read-only: nothing here writes, drafts or sends.
 * Two accounts can share a slug ("P&G", "P-G"): the page asks which (?name=), never picks.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadAccountView } from '@/lib/gap/account-intel/load';
import { AccountBriefView } from '@/components/gap/account-brief';
import { AccountNowView } from '@/components/gap/account-now';
import { AccountBriefSections } from '@/components/gap/account-brief-sections';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { ResearchPlanView } from '@/components/gap/research-plan';
import { SeparateMotion } from '@/components/gap/separate-motion';
import { loadResearchHistory, planResearch } from '@/lib/gap/account-intel/orchestrate';
import { loadDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';
import { AccountSourcesSection } from '@/components/gap/account-sources';
import { loadAccountContext } from '@/lib/gap/context/load';
import { projectNow } from '@/lib/gap/context/now';
import { projectBrief } from '@/lib/gap/context/brief';
import { accountSlug } from '@/lib/gap/account-intel/href';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP account' };

type View = 'now' | 'brief' | 'sources';
const VIEWS: Array<{ v: View; label: string }> = [
  { v: 'now', label: 'Now' },
  { v: 'brief', label: 'Brief' },
  { v: 'sources', label: 'Sources' },
];

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ name?: string; view?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { slug } = await params;
  const q = (await searchParams) ?? {};
  const view: View = q.view === 'brief' || q.view === 'sources' ? q.view : 'now';
  const now = new Date();
  const loaded = await loadAccountView(prisma, slug, now, { live: true, name: q.name });
  if (!loaded) notFound();
  if ('collision' in loaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <GapSubnav />
        <h1 className="text-2xl font-semibold tracking-tight">Which account?</h1>
        <p className="text-sm text-[var(--muted-foreground)]">These accounts share one link. Pick one; if they are the same company, they are duplicate rows.</p>
        <ul className="space-y-1 text-sm" data-testid="account-collision">
          {loaded.collision.map((n) => (
            <li key={n}>
              <Link className="underline" href={`/gap/accounts/${slug}?name=${encodeURIComponent(n)}`}>
                {n}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const { brief, inputs } = loaded;
  const nameQ = q.name ? `name=${encodeURIComponent(q.name)}` : '';
  const hrefFor = (v: View) => `/gap/accounts/${slug}${v === 'now' ? (nameQ ? `?${nameQ}` : '') : `?view=${v}${nameQ ? `&${nameQ}` : ''}`}`;

  const tabs = (
    <nav className="sticky top-0 z-10 -mx-4 flex gap-1 border-b border-[var(--border)] bg-[var(--background)] px-4 py-2" data-testid="account-view-tabs">
      {VIEWS.map((t) => (
        <Link key={t.v} href={hrefFor(t.v)} aria-current={view === t.v ? 'page' : undefined} className={`rounded px-3 py-1 text-sm ${view === t.v ? 'bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)]'}`} data-testid={`account-view-${t.v}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight" data-testid="account-name">
        {brief.accountName}
      </h1>
    </div>
  );

  if (view === 'now' || view === 'brief') {
    // The account context is display-only and soft (a failed read leaves a slot empty, never the page).
    const ctx = await loadAccountContext(prisma, inputs, now);
    const legacyHref = `/accounts/${accountSlug(brief.accountName)}`;
    const links = [
      { label: 'Account history', href: `${legacyHref}` },
      { label: 'Content Studio', href: `/studio?account=${encodeURIComponent(brief.accountName)}` },
      { label: 'Log what happened', href: '/gap/capture' },
      ...(inputs.account.hubspotCompanyId ? [{ label: 'HubSpot record', href: `https://app.hubspot.com/contacts/3819073/record/0-2/${inputs.account.hubspotCompanyId}`, external: true }] : []),
    ];
    if (view === 'brief') {
      const dealBrief = brief.dealState === 'ACTIVE' ? await loadDealBrief(prisma, brief.accountName, { now }).catch(() => null) : null;
      return (
        <div className="mx-auto max-w-2xl space-y-4">
          <GapSubnav />
          {header}
          {tabs}
          {dealBrief ? <DealBriefView brief={dealBrief} deals={brief.deals.map((x) => ({ name: x.name, stage: x.stage ?? 'stage not given', lastActivityAt: null }))} /> : null}
          <AccountBriefSections
            sections={projectBrief(brief, ctx, inputs, now)}
            sourcesHref={hrefFor('sources')}
            deep={{ commercial: { label: 'Full history', href: legacyHref }, assets: { label: 'Content Studio', href: `/studio?account=${encodeURIComponent(brief.accountName)}` }, people: { label: 'All contacts', href: legacyHref } }}
          />
        </div>
      );
    }
    const v = projectNow(brief, ctx, inputs, now);
    const top = brief.hypotheses.find((h) => h.grounded && h.truth !== 'CONTRADICTED');
    const control: { href: string; label: string } | null =
      v.next.source === 'meeting' ? { href: hrefFor('brief'), label: 'Open the meeting brief' }
      : v.next.source === 'deal' ? { href: hrefFor('brief'), label: 'Open the deal brief' }
      : v.next.source === 'conversation' ? { href: '/gap/replies', label: 'Open replies' }
      : v.next.source === 'restriction' ? { href: '/gap/capture', label: 'Log the intro ask' }
      : brief.motion.type === 'FACT_LED' && top ? { href: `/gap/preview/${top.id}`, label: 'Review the thesis and first touch' }
      : brief.motion.type === 'RELATIONSHIP_LED' || brief.motion.type === 'REFERRAL_LED' ? { href: '/gap/capture', label: 'Log the touch' }
      : brief.hypotheses.some((h) => h.needsReview.length) ? { href: `${hrefFor('sources')}#brief-hypotheses`, label: 'Review the thesis' }
      : { href: `${hrefFor('sources')}#research-plan`, label: 'Open the research plan' };
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <GapSubnav />
        {header}
        {tabs}
        <AccountNowView v={v} nextHref={control?.href ?? null} nextLabel={control?.label ?? null} links={links} />
      </div>
    );
  }

  // SOURCES: the full analyst layer, as before V2.
  const [history, sources, dealBrief] = await Promise.all([
    loadResearchHistory(prisma, brief.accountName, now).catch(() => []),
    loadAccountSources(prisma, brief.accountName, { now }).catch(() => null),
    brief.dealState === 'ACTIVE' ? loadDealBrief(prisma, brief.accountName, { now }).catch(() => null) : Promise.resolve(null),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      {header}
      {tabs}
      <p className="text-xs text-[var(--muted-foreground)]">
        Built live from what GAP holds, {brief.generatedAt.slice(0, 10)}. Every line says whether the buyer confirmed it, a source verified it, GAP modeled it or GAP inferred it.
      </p>
      <AccountBriefView
        brief={brief}
        afterGlance={
          <>
            {brief.family?.hold ? <SeparateMotion accountName={brief.accountName} detail={brief.family.hold.detail} relatedAccounts={brief.family.hold.accounts.filter((a) => !brief.family?.members.some((m) => m.accountName === a && m.relation === 'same_company'))} /> : null}
            {brief.dealState === 'ACTIVE' ? (
              dealBrief ? <DealBriefView brief={dealBrief} deals={brief.deals.map((x) => ({ name: x.name, stage: x.stage ?? 'stage not given', lastActivityAt: null }))} /> : <p className="text-sm text-amber-700">The deal brief could not be read just now.</p>
            ) : null}
            {sources ? (
              <AccountSourcesSection sources={sources} limit={3} viewAllHref={`/gap/accounts/${slug}/sources${q.name ? `?name=${encodeURIComponent(q.name)}` : ''}`} researchHref="#research-plan" />
            ) : (
              <p className="text-sm text-amber-700" data-testid="account-sources-unavailable">
                Sources could not be read just now.
              </p>
            )}
            <ResearchPlanView accountName={brief.accountName} plan={planResearch(brief, history, now)} />
          </>
        }
      />
    </div>
  );
}
