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
import { ApolloCandidatesView } from '@/components/gap/apollo-candidates';
import { apolloCandidates } from '@/lib/gap/people/apollo-candidates';
import { SeparateMotion } from '@/components/gap/separate-motion';
import { loadResearchHistory, planResearch } from '@/lib/gap/account-intel/orchestrate';
import { loadDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';
import { AccountSourcesSection } from '@/components/gap/account-sources';
import { loadAccountContext } from '@/lib/gap/context/load';
import { projectNow } from '@/lib/gap/context/now';
import { loadReadyTarget } from '@/lib/gap/context/send-target';
import { briefListenText, projectBrief } from '@/lib/gap/context/brief';
import { accountSlug, accountTitle, gmailThreadHref } from '@/lib/gap/account-intel/href';
import { OpenHashDetails } from '@/components/gap/open-hash-details';
import { PendingLink } from '@/components/gap/pending-link';
import { loadPursuit } from '@/lib/gap/pursuit/load';
import { nextFromPursuit } from '@/lib/gap/pursuit/next';
import { accountDomainFor, loadStoryReaders } from '@/lib/gap/story/load';
import { mergeTouches } from '@/lib/gap/story/touches';
import { projectStory } from '@/lib/gap/story/story';
import { projectAnchor, storyBesideAnchor } from '@/lib/gap/story/anchor';
import { remitCaution } from '@/lib/gap/story/anchor-text';
import { DoneNext } from '@/components/gap/done-next';
import { rememberPursuitSummary } from '@/lib/gap/pursuit/summary';
import { accountListenText } from '@/lib/gap/voice/account';

export const dynamic = 'force-dynamic';
/** The browser title names the account (click test round 3: every tab read "GAP account"). From the slug: no read. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<{ title: string }> {
  const { slug } = await params;
  return { title: accountTitle(slug) };
}

type View = 'now' | 'brief' | 'sources';
const VIEWS: Array<{ v: View; label: string }> = [
  { v: 'now', label: 'Now' },
  { v: 'brief', label: 'Brief' },
  { v: 'sources', label: 'Sources' },
];

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ name?: string; view?: string; from?: string; i?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { slug } = await params;
  const q = (await searchParams) ?? {};
  const view: View = q.view === 'brief' || q.view === 'sources' ? q.view : 'now';
  const now = new Date();
  // NOW and BRIEF read the account context too: its reads run alongside the inputs (V2 speed).
  const loaded = await loadAccountView(prisma, slug, now, { live: true, name: q.name, context: view !== 'sources' });
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
    // UX-04: never sticky on a phone (a sticky bar hid focused controls, WCAG 2.4.11); sticky from md up with scroll padding set.
    <nav aria-label="Account views" className="-mx-4 flex gap-1 border-b border-[var(--border)] bg-[var(--background)] px-4 py-1.5 md:sticky md:top-0 md:z-30" data-testid="account-view-tabs">
      {VIEWS.map((t) => (
        <PendingLink key={t.v} href={hrefFor(t.v)} aria-current={view === t.v ? 'page' : undefined} className={`inline-flex min-h-11 min-w-16 items-center justify-center rounded px-4 text-sm ${view === t.v ? 'bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)]'}`} data-testid={`account-view-${t.v}`}>
          {t.label}
        </PendingLink>
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
    const ctx = loaded.context ?? (await loadAccountContext(prisma, inputs, now));
    const legacyHref = `/accounts/${accountSlug(brief.accountName)}`;
    const links = [
      { label: 'Account history', href: `${legacyHref}` },
      { label: 'Content Studio', href: `/studio?account=${encodeURIComponent(brief.accountName)}` },
      { label: 'Log what happened', href: `/gap/capture?account=${encodeURIComponent(brief.accountName)}` },
      ...(inputs.account.hubspotCompanyId ? [{ label: 'HubSpot record', href: `https://app.hubspot.com/contacts/3819073/record/0-2/${inputs.account.hubspotCompanyId}`, external: true }] : []),
    ];
    if (view === 'brief') {
      const dealBrief = brief.dealState === 'ACTIVE' ? await loadDealBrief(prisma, brief.accountName, { now }).catch(() => null) : null;
      return (
        <div className="mx-auto max-w-2xl space-y-4 pb-28">
          <GapSubnav />
          {header}
          {tabs}
          {dealBrief ? <DealBriefView brief={dealBrief} deals={brief.deals.map((x) => ({ name: x.name, stage: x.stage ?? 'stage not given', lastActivityAt: null }))} /> : null}
          <AccountBriefSections
            listen={briefListenText(brief.accountName, projectBrief(brief, ctx, inputs, now))}
            sections={projectBrief(brief, ctx, inputs, now)}
            sourcesHref={hrefFor('sources')}
            deep={{ commercial: { label: 'Full history', href: legacyHref }, assets: { label: 'Content Studio', href: `/studio?account=${encodeURIComponent(brief.accountName)}` }, people: { label: 'All contacts', href: legacyHref } }}
          />
        </div>
      );
    }
    // The cockpit's ready first-touch card for this account (fails soft): the one person NOW and the cockpit share.
    // UX-03 (account-first): ONE pursuit state per account and the People Stack over the one owner-resolution read;
    // the ready card comes from the same queue read (loadReadyTarget stays the fallback when the pursuit read fails).
    // UX-05: the story's two extra readers (clawd's outreach history, the vault note) run beside the pursuit read; both
    // are soft and bounded, so a slow clawd never costs the page.
    const [pursuit, readers] = await Promise.all([
      loadPursuit(prisma, { brief, inputs, ctx, now }).catch(() => null),
      loadStoryReaders({ accountName: brief.accountName, domain: accountDomainFor({ domains: inputs.domains, addresses: [...ctx.history.map((h) => h.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? ''), ...inputs.firstTouches.map((t) => t.recipient)] }) }).catch(() => ({ clawd: { read: 'unavailable' as const, sends: [] }, vaultNote: null })),
    ]);
    const ready = pursuit ? (brief.motion.type === 'FACT_LED' ? pursuit.ready : null) : brief.motion.type === 'FACT_LED' ? await loadReadyTarget(prisma, brief.accountName, now) : null;
    const v = projectNow(brief, ctx, inputs, now, { ready });
    const top = brief.hypotheses.find((h) => h.grounded && h.truth !== 'CONTRADICTED');
    // NEXT from the pursuit state (the chosen person and the action agree by construction); a meeting within 14 days
    // still leads (projectNow's own rule).
    const pursuitNext = pursuit && v.next.source !== 'meeting'
      ? nextFromPursuit(pursuit.state, { hypothesisId: pursuit.hypothesisId, accountSlugHref: (view) => hrefFor(view), replyThreadHref: v.replyThread ? gmailThreadHref(v.replyThread, session.user.email) : null, captureHref: `/gap/capture?account=${encodeURIComponent(brief.accountName)}` })
      : null;
    const control: { href: string; label: string } | null =
      pursuitNext ? pursuitNext.control
      : v.next.source === 'meeting' ? { href: hrefFor('brief'), label: 'Open the meeting brief' }
      : v.next.source === 'deal' ? { href: hrefFor('brief'), label: 'Open the deal brief' }
      // An unanswered reply opens its thread in Gmail (round 6: "Open replies" was an empty lane for GXO).
      : v.replyThread ? { href: gmailThreadHref(v.replyThread, session.user.email), label: `Open ${v.replyThread}'s thread in Gmail` }
      : v.next.source === 'conversation' ? { href: '/gap/replies', label: 'Open replies' }
      : v.next.source === 'restriction' ? { href: `/gap/capture?account=${encodeURIComponent(brief.accountName)}`, label: 'Log the intro ask' }
      : brief.motion.type === 'FACT_LED' && ready && v.ownerFirst ? { href: ready.href, label: `Or open the ready card for ${v.ownerFirst.ready} now` }
      : brief.motion.type === 'FACT_LED' && ready ? { href: ready.href, label: `Open the first-touch card for ${v.who?.name ?? ready.name}` }
      : brief.motion.type === 'FACT_LED' && top ? { href: `/gap/preview/${top.id}`, label: 'Review the thesis' }
      : brief.motion.type === 'RELATIONSHIP_LED' || brief.motion.type === 'REFERRAL_LED' ? { href: `/gap/capture?account=${encodeURIComponent(brief.accountName)}`, label: 'Log the touch' }
      : brief.hypotheses.some((h) => h.needsReview.length) ? { href: `${hrefFor('sources')}#brief-hypotheses`, label: 'Review the thesis' }
      : { href: `${hrefFor('sources')}#research-plan`, label: 'Open the research plan' };
    // UX-05: the derived Account Story over the brief, the context history, the reply class, clawd's sends, the vault
    // note and the pursuit state (pure; never stored). Listen reads it with its tags, after the state and NEXT.
    const excluded = (pursuit?.resolution?.excluded ?? []).map((e) => ({ key: e.candidate.key, name: e.candidate.name, title: e.candidate.title, code: e.code, reason: e.reason, source: e.source ?? null }));
    const story = pursuit
      ? projectStory({
          accountName: brief.accountName,
          now,
          state: pursuit.state,
          brief,
          inputs,
          whyNow: v.whyNow,
          know: v.know,
          touches: mergeTouches({
            history: ctx.history,
            firstTouches: inputs.firstTouches,
            clawd: readers.clawd,
            replies: pursuit.state.lastInbound && pursuit.state.replyClass ? [{ from: pursuit.state.lastInbound.who, at: pursuit.state.lastInbound.at, snippet: pursuit.state.lastInbound.snippet, kind: pursuit.state.replyClass.kind, label: pursuit.state.replyClass.label }] : [],
            people: [...inputs.personas.map((p) => ({ name: p.name, title: p.title })), ...(inputs.hubspotPeople?.people ?? []).map((p) => ({ name: p.name, title: p.title }))],
            now,
          }),
          clawdRead: readers.clawd.read,
          vaultNote: readers.vaultNote,
          excluded,
        })
      : null;
    // UX-06 (Option A): the outreach anchor for the chosen person over the story and the account's open theses.
    const rawStory = story;
    const anchor = pursuit && rawStory
      ? projectAnchor({ accountName: brief.accountName, person: pursuit.state.person ? { personaId: pursuit.state.person.personaId, name: pursuit.state.person.name, title: pursuit.state.person.title } : null, people: [...(pursuit.stack?.rows ?? []), ...(pursuit.stack?.more ?? [])].map((r) => ({ personaId: r.personaId, name: r.name, title: r.title })), brief, inputs, story: rawStory, anchorChoice: pursuit.anchorChoice, privateLine: v.private, sendable: pursuit.sendableTheses, now })
      : null;
    // The story is told once: the anchor's own fact is a pointer in the story, never a repeat.
    const storyShown = rawStory && anchor ? storyBesideAnchor(rawStory, anchor) : rawStory;
    // The remit caution travels to NEXT: a cold first touch never asks the buyer who owns it.
    if (pursuitNext && anchor?.primary && anchor.primary.relevance.tier === 'none' && pursuit?.state.person) {
      const first = pursuit.state.person.name.split(' ')[0];
      pursuitNext.text = `${pursuitNext.text} ${remitCaution(first, anchor.primary.factLabel, anchor.fitsBetter)}`;
    }
    // UX-11: Listen to account is written for the ear (60 to 90 s) over the same projections the page renders; it
    // never carries the private line, the do-not-use list, an address, a URL or a machine word. The older screen-read
    // text stays only when the pursuit read failed.
    // UX-08 parity: the Work card says what this page says, NEXT included (process memory, nothing written).
    if (pursuit) rememberPursuitSummary(pursuit.state, now, pursuitNext?.text ?? null);
    const listen = pursuit && pursuitNext
      ? accountListenText({ accountName: brief.accountName, state: pursuit.state, story: storyShown, anchor, stack: pursuit.stack, nextText: pursuitNext.text, doNotContactCount: excluded.filter((e) => e.code === 'do_not_contact' || e.code === 'unsubscribed' || e.code === 'opted_out').length })
      : v.listen;
    return (
      // UX-04: one column is the primary design (about 820 CSS px on Casey's display); from 1100 px the context sits
      // beside the decision, so the container widens only there. Bottom padding clears the phone action bar.
      <div className="mx-auto max-w-2xl space-y-4 pb-32 min-[1100px]:max-w-6xl md:pb-28">
        <GapSubnav />
        {header}
        {tabs}
        <AccountNowView
          v={{ ...v, listen }}
          nextHref={control?.href ?? null}
          nextLabel={control?.label ?? null}
          nextText={pursuitNext?.text ?? null}
          links={links}
          mailbox={process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null}
          pursuit={pursuit ? { state: pursuit.state, stack: pursuit.stack, hypothesisId: pursuit.hypothesisId, excluded, story: storyShown, anchor } : null}
          doneNext={q.from === 'work' ? <DoneNext slug={slug} index={/^\d+$/.test(q.i ?? '') ? Number(q.i) : null} /> : null}
        />
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
    <div className="mx-auto max-w-2xl space-y-5 pb-28">
      <GapSubnav />
      {header}
      {tabs}
      <OpenHashDetails />
      <p className="text-xs text-[var(--muted-foreground)]">
        Built live from what GAP holds, {brief.generatedAt.slice(0, 10)}. Every line says whether the buyer confirmed it, a source verified it, GAP modeled it or GAP inferred it.
      </p>
      <AccountBriefView
        brief={brief}
        afterGlance={
          <>
            {brief.family?.hold ? <SeparateMotion accountName={brief.accountName} detail={brief.family.hold.detail} relatedAccounts={brief.family.hold.accounts.filter((a) => !brief.family?.members.some((m) => m.accountName === a && m.relation === 'same_company'))} /> : null}
            {brief.dealState === 'ACTIVE' ? (
              dealBrief ? <DealBriefView brief={dealBrief} deals={brief.deals.map((x) => ({ name: x.name, stage: x.stage ?? 'stage not given', lastActivityAt: null }))} /> : <p className="text-sm text-amber-700 dark:text-amber-400">The deal brief could not be read just now.</p>
            ) : null}
            {sources ? (
              <AccountSourcesSection sources={sources} limit={3} viewAllHref={`/gap/accounts/${slug}/sources${q.name ? `?name=${encodeURIComponent(q.name)}` : ''}`} researchHref="#research-plan" />
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-400" data-testid="account-sources-unavailable">
                Sources could not be read just now.
              </p>
            )}
            <ResearchPlanView accountName={brief.accountName} plan={planResearch(brief, history, now)} />
            <ApolloCandidatesView view={apolloCandidates(brief, inputs)} />
            <Link href={`/gap/apollo?a=${slug}`} className="inline-flex min-h-11 items-center text-sm underline" data-testid="apollo-review-link">Review Apollo lookups across accounts</Link>
          </>
        }
      />
    </div>
  );
}
