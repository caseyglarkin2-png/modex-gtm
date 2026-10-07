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
import { DealOpportunities } from '@/components/gap/deal-opportunities';
import { MeetingPrepView } from '@/components/gap/meeting-prep';
import { DealPlan } from '@/components/gap/deal-plan';
import { DealArtifacts } from '@/components/gap/deal-artifacts';
import { CrmSyncPanel } from '@/components/gap/crm-sync';
import { loadAccountDealWorkspace } from '@/lib/gap/deals/workspace';
import { syncDealStates } from '@/lib/gap/deals/closure';
import { commitmentScope, dealRefs, personIndex } from '@/lib/gap/deals/opportunities';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';
import { AccountSourcesSection } from '@/components/gap/account-sources';
import { loadAccountContext } from '@/lib/gap/context/load';
import { projectNow } from '@/lib/gap/context/now';
import { loadReadyTarget } from '@/lib/gap/context/send-target';
import { briefListenText, projectBrief } from '@/lib/gap/context/brief';
import { accountSlug, accountTitle, gmailThreadHref, RECORD_REPLY_ANCHOR, withWorkContext } from '@/lib/gap/account-intel/href';
import { RepliesTriage } from '@/app/gap/replies/replies-triage';
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
import { ReplyPrepPanel } from '@/components/gap/reply-prep';
import { AccountObligations } from '@/components/gap/account-obligations';
import { prepareReply } from '@/lib/gap/replies/prepare';
import { loadCommitments, withPhases } from '@/lib/gap/work/commitments';
import { buyerMoves } from '@/lib/gap/work/commitment-model';
import { AskGap } from '@/components/gap/ask-gap';
import { compactContext, rememberAskContext } from '@/lib/gap/ask/grounding';
import { loadPursuitSummaries, PURSUIT_SUMMARY_SHELL_MAX_MS, rememberPursuitSummary, type PursuitSummary } from '@/lib/gap/pursuit/summary';
import { actionableFromPursuit } from '@/lib/gap/pursuit/actionable';
import { agoText as readAgo } from '@/lib/gap/work/cache';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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

type AccountQuery = { name?: string; view?: string; from?: string; i?: string };

/** R50: Capture's deal parameters: the HubSpot id (binds) and the name (the label); a deal with no id goes by name. */
const dealParams = (d: { id?: string; name: string | null }): Record<string, string> => (d.id ? { deal: d.id, ...(d.name ? { dealName: d.name } : {}) } : d.name ? { deal: d.name } : {});

/** The account's name from its slug with one cheap read (the full read follows in the streamed body). */
async function quickAccountName(slug: string, name?: string): Promise<string | null> {
  // The longest word of the slug (never "the" or an initial) keeps the read small and the hit likely.
  const token = slug.split('-').filter((w) => w.length >= 3).sort((a, b) => b.length - a.length)[0] ?? slug.split('-')[0];
  const rows = (await prisma.account.findMany({ where: { name: { contains: token, mode: 'insensitive' } }, select: { name: true }, take: 50 }).catch(() => [])) as Array<{ name: string }>;
  if (name && rows.some((r) => r.name === name)) return name;
  return rows.find((r) => accountSlug(r.name) === slug)?.name ?? null;
}

/**
 * UX-14 (perceived speed): the shell answers at once with the name and the last known state and NEXT (the pursuit
 * summary remembered by a visit or the Work warmer, at most 15 minutes old) while the full read streams below.
 */
function AccountShell({ name, quick, now }: { name: string | null; quick: PursuitSummary | null; now: Date }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28" aria-busy="true" data-testid="account-shell">
      <GapSubnav />
      <h1 className="text-2xl font-semibold tracking-tight">{name ?? 'Account'}</h1>
      {quick ? (
        <div className="rounded-md border border-[var(--border)] p-3 text-sm" data-testid="account-quick">
          <p className="text-xs text-[var(--muted-foreground)]">As read {readAgo(quick.at, now)}; the full page is loading.</p>
          <p className="mt-1 font-medium">{quick.stateLine}.</p>
          {quick.nextText ? <p className="mt-1">Next: {quick.nextText}</p> : null}
          {quick.person ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{quick.person.name}{quick.person.title ? `, ${quick.person.title}` : ''}</p> : null}
        </div>
      ) : (
        <p role="status" className="text-sm text-[var(--muted-foreground)]">Reading the account (the state, NEXT, the people, the story)...</p>
      )}
      <Skeleton className="h-11 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<AccountQuery> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { slug } = await params;
  const q = (await searchParams) ?? {};
  const now = new Date();
  const name = await quickAccountName(slug, q.name);
  // R15: the last known state from memory or the durable row (up to a day old, labeled with its age).
  const quick = name ? ((await loadPursuitSummaries(prisma, [name], now, PURSUIT_SUMMARY_SHELL_MAX_MS)).get(name) ?? null) : null;
  return (
    <Suspense fallback={<AccountShell name={name} quick={quick} now={now} />}>
      <AccountBody slug={slug} q={q} email={session.user.email} now={now} />
    </Suspense>
  );
}

async function AccountBody({ slug, q, email, now }: { slug: string; q: AccountQuery; email: string; now: Date }) {
  const view: View = q.view === 'brief' || q.view === 'sources' ? q.view : 'now';
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
  // R55: reconcile GAP's obligations with HubSpot's deal states (a closed deal's open work is skipped with its reason;
  // a reopened deal gets one current next step). Never on an UNKNOWN read; soft (the page renders regardless).
  // R61: it runs beside the page's other reads; only the reads of the obligations wait for it.
  const dealsSynced: Promise<unknown> = inputs.opportunity && inputs.opportunity.status !== 'UNKNOWN'
    ? syncDealStates(prisma, { accountName: brief.accountName, open: (inputs.opportunity.deals ?? []).filter((d): d is typeof d & { id: string } => !!d.id).map((d) => ({ id: d.id, name: d.name })), closed: inputs.opportunity.closed ?? [], now }).catch(() => null)
    : Promise.resolve(null);
  // R60: opened from Work, every view and anchor of this account keeps the seller's place (Back to Work, Next account).
  const workIndex = q.from === 'work' && /^\d+$/.test(q.i ?? '') ? Number(q.i) : null;
  const hrefFor = (v: View) => {
    const p = new URLSearchParams();
    if (v !== 'now') p.set('view', v);
    if (q.name) p.set('name', q.name);
    if (workIndex !== null) {
      p.set('from', 'work');
      p.set('i', String(workIndex));
    }
    const qs = p.toString();
    return `/gap/accounts/${slug}${qs ? `?${qs}` : ''}`;
  };

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
      // R44: Capture opens with the account, the deal (when there is exactly one open) and where it came from.
      // R50: by the deal's HubSpot id (the note's words and obligations bind to it) with its name for the label.
      { label: 'Log what happened', href: `/gap/capture?${new URLSearchParams({ account: brief.accountName, from: `account:${accountSlug(brief.accountName)}`, ...((inputs.opportunity?.deals ?? []).length === 1 ? dealParams(inputs.opportunity!.deals[0]) : {}) }).toString()}` },
      ...(inputs.account.hubspotCompanyId ? [{ label: 'HubSpot record', href: `https://app.hubspot.com/contacts/3819073/record/0-2/${inputs.account.hubspotCompanyId}`, external: true }] : []),
    ];
    if (view === 'brief') {
      await dealsSynced;
      // R50: each open deal is worked on its own: its obligations, its confirmed words, its contacts and HubSpot's next
      // step, with the account-level rows labeled; one deal brief per deal (never another deal's words).
      const openDeals = brief.dealState === 'ACTIVE' ? (inputs.opportunity?.deals ?? []).filter((d): d is typeof d & { id: string } => !!d.id) : [];
      // R51: the meetings on record are prepared here (every account; a deal's meeting inside its deal), from what the
      // page already holds: the working thesis as a guess to test, the verified public facts after the buyer's words,
      // and the account's own materials.
      const workspace = await loadAccountDealWorkspace(prisma, {
        accountName: brief.accountName,
        deals: openDeals.map((d) => ({ id: d.id, name: d.name, stage: d.stage, nextStep: d.nextStep ?? null, closeDate: d.closeDate ?? null, amount: d.amount ?? null, contactIds: d.contactIds ?? [] })),
        now,
        guesses: inputs.hypotheses.filter((h) => (h.status === 'active' || h.status === 'approved') && !h.buyerRejected && h.problem.trim()).map((h) => h.problem.trim()),
        publicFacts: inputs.facts.map((f) => ({ quote: f.quote, title: f.title, url: f.url, publishedAt: f.publishedAt })),
        materials: ctx.assets.filter((a) => !a.legacy && a.href).map((a) => ({ label: a.label, href: a.href })),
        roi: inputs.roi,
        // Sprint 5 review: a closed deal's kept rows and meetings are named with its outcome, never its id.
        closedDeals: inputs.opportunity?.closed ?? [],
      }).catch(() => null);
      const dealBriefs = workspace && openDeals.length
        ? await Promise.all(openDeals.map((d) => loadDealBrief(prisma, brief.accountName, { now, deal: { id: d.id, name: d.name }, scopeOf: workspace.scopeOfBid, dealContacts: (d.contactIds ?? []).length }).catch(() => null)))
        : brief.dealState === 'ACTIVE' ? [await loadDealBrief(prisma, brief.accountName, { now }).catch(() => null)] : [];
      const meetingSlots: Record<string, React.ReactNode> = {};
      for (const d of workspace?.opportunities.deals ?? []) {
        const own = (workspace?.meetings ?? []).filter((m) => m.dealId === d.dealId);
        // R51 / R52: the deal's meetings, then its mutual action plan (agreed milestones and the proposals to review).
        meetingSlots[d.dealId] = (
          <div className="space-y-2">
            {workspace?.stalled[d.dealId]?.length ? (
              <ul className="space-y-1 rounded-md border border-amber-600/40 p-2 text-xs" data-testid="deal-stalled" aria-label="Stalled">
                {workspace.stalled[d.dealId].map((s) => <li key={s}>Stalled: {s}</li>)}
              </ul>
            ) : null}
            {own.map((m) => <MeetingPrepView key={m.meetingId} prep={m} />)}
            {workspace?.plans[d.dealId] ? <DealPlan accountName={brief.accountName} dealId={d.dealId} plan={workspace.plans[d.dealId]} /> : null}
            {workspace?.artifacts[d.dealId] ? <DealArtifacts next={workspace.artifacts[d.dealId].next} all={workspace.artifacts[d.dealId].all} accountName={brief.accountName} dealId={d.dealId} /> : null}
            {workspace?.crm[d.dealId] ? <CrmSyncPanel accountName={brief.accountName} dealId={d.dealId} dealName={d.name} candidates={workspace.crm[d.dealId].candidates} items={workspace.crm[d.dealId].items} /> : null}
          </div>
        );
      }
      const accountMeetings = (workspace?.meetings ?? []).filter((m) => !m.dealId);
      return (
        <div className="mx-auto max-w-2xl space-y-4 pb-28">
          <GapSubnav />
          {header}
          {tabs}
          {/* R60: deal work opened from Work ends where every account ends: Back to Work, Next account, or record it. */}
          {q.from === 'work' ? <DoneNext slug={slug} index={workIndex} accountName={brief.accountName} /> : null}
          {workspace && openDeals.length ? <DealOpportunities view={workspace.opportunities} slots={meetingSlots} /> : null}
          {accountMeetings.length ? (
            <section className="space-y-2" data-testid="account-meetings" aria-label="Meetings at the account">
              <h2 className="text-base font-semibold">{openDeals.length ? 'Meetings not tied to one deal' : 'Meetings'}</h2>
              {accountMeetings.map((m) => <MeetingPrepView key={m.meetingId} prep={m} />)}
            </section>
          ) : null}
          {dealBriefs.map((dealBrief, n) => (dealBrief ? <DealBriefView key={dealBrief.deal?.id ?? n} brief={dealBrief} deals={(dealBrief.deal ? brief.deals.filter((x) => x.id === dealBrief.deal!.id) : brief.deals).map((x) => ({ name: x.name, stage: x.stage ?? 'stage not given', lastActivityAt: null }))} /> : null))}
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
    const [pursuit, readers, commitments] = await Promise.all([
      loadPursuit(prisma, { brief, inputs, ctx, now }).catch(() => null),
      loadStoryReaders({ accountName: brief.accountName, domain: accountDomainFor({ domains: inputs.domains, addresses: [...ctx.history.map((h) => h.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? ''), ...inputs.firstTouches.map((t) => t.recipient)] }) }).catch(() => ({ clawd: { read: 'unavailable' as const, sends: [] }, vaultNote: null })),
      // R40 / R42: every obligation at this account, each on its own row (after the deal states are reconciled).
      dealsSynced.then(() => loadCommitments(prisma, { accountNames: [brief.accountName] })).catch(() => []),
    ]);
    // R42: the newest reply nobody has recorded, with its prepared notes (never copy, never a send).
    const mailboxId = process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null;
    const replyItem = pursuit?.replyItems.find((r) => !r.dispositionId) ?? null;
    // R60: the account's waiting reply (or opt-out) is recorded on this page.
    const recordReply = !!replyItem || pursuit?.state.state === 'replied' || pursuit?.state.state === 'opted_out';
    const replyPrep = replyItem ? prepareReply({ id: replyItem.id, from: replyItem.contactEmail, fromName: replyItem.fromName ?? null, subject: replyItem.subject, snippet: replyItem.snippet, receivedAt: replyItem.receivedAt, threadId: replyItem.threadId ?? null, accountName: brief.accountName }, { mailbox: mailboxId, now }) : null;
    // R50: each obligation says which opportunity it belongs to (a deal, through its person's deal, or account-level).
    const nowDeals = (inputs.opportunity?.deals ?? []).filter((d): d is typeof d & { id: string } => !!d.id).map((d) => ({ id: d.id, name: d.name, contactIds: d.contactIds ?? [] }));
    const scopePeople = personIndex(inputs.personas.map((p) => ({ personaId: p.id, name: p.name, title: p.title, email: null, hubspotContactId: p.hubspotContactId ? String(p.hubspotContactId) : null })));
    const obligations = withPhases(commitments, now, buyerMoves((pursuit?.replyItems ?? []).filter((r) => !r.dispositionId))).map((c) => ({ ...c, scopeLabel: nowDeals.length || c.dealId ? commitmentScope(c, dealRefs(nowDeals.map((d) => ({ ...d, stage: null }))), scopePeople, inputs.opportunity?.closed ?? []).label : null }));
    const ready = pursuit ? (brief.motion.type === 'FACT_LED' ? pursuit.ready : null) : brief.motion.type === 'FACT_LED' ? await loadReadyTarget(prisma, brief.accountName, now) : null;
    // Sprint 5 review: the earliest dated obligation due today or overdue (it outranks a meeting more than a day away).
    const dueFirst = obligations.filter((c) => c.phase === 'due' && !!c.dueAt).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0] ?? null;
    const v = projectNow(brief, ctx, inputs, now, { ready, dueNow: dueFirst ? { title: dueFirst.title, scope: dueFirst.scopeLabel } : null });
    const top = brief.hypotheses.find((h) => h.grounded && h.truth !== 'CONTRADICTED');
    // NEXT from the pursuit state (the chosen person and the action agree by construction); a meeting within 14 days
    // still leads (projectNow's own rule).
    const pursuitNext = pursuit && v.next.source !== 'meeting' && v.next.source !== 'obligation'
      ? nextFromPursuit(pursuit.state, { hypothesisId: pursuit.hypothesisId, accountSlugHref: (view) => hrefFor(view), replyThreadHref: v.replyThread ? gmailThreadHref(v.replyThread, email) : null, captureHref: `/gap/capture?account=${encodeURIComponent(brief.accountName)}`, readyHref: pursuit.ready?.href ?? null })
      : null;
    const control: { href: string; label: string } | null =
      pursuitNext ? pursuitNext.control
      : v.next.source === 'obligation' ? { href: `${hrefFor('now')}#account-obligations-heading`, label: 'Open what is due' }
      : v.next.source === 'meeting' ? { href: hrefFor('brief'), label: 'Open the meeting brief' }
      : v.next.source === 'deal' ? { href: hrefFor('brief'), label: 'Open the deal brief' }
      // An unanswered reply opens its thread in Gmail (round 6: "Open replies" was an empty lane for GXO).
      : v.replyThread ? { href: gmailThreadHref(v.replyThread, email), label: `Open ${v.replyThread}'s thread in Gmail` }
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
      pursuitNext.text = `${pursuitNext.text} ${remitCaution(first, anchor.primary.factLabel, anchor.fitsBetter)}${anchor.fitsBetter ? ` Use a different story below, or make ${anchor.fitsBetter.name.split(' ')[0]} first.` : ' Use a different story below.'}`;
    }
    // A research account with a checked fact and no thesis: the unblocking move is the draft on this page, not the
    // analyst's research plan (the review: NEXT left the workspace while the draft sat collapsed on it).
    // R12: a READY account whose story is approved but not yet in use: the move is on this page (put it in use), never
    // a preview that points at a lane.
    if (pursuitNext && pursuit?.state.state === 'ready' && pursuit.state.person?.personaId != null && anchor?.primary && anchor.primary.status === 'approved') {
      const first = pursuit.state.person.name.split(' ')[0];
      pursuitNext.text = `The story for ${first} is approved but not yet in use: put it in use below and the email is prepared on it.`;
      pursuitNext.control = { href: '#outreach-anchor', label: 'Put the story in use' };
    }
    if (pursuitNext && pursuit?.state.state === 'research' && anchor && anchor.pending.length > 0) {
      // R12: a proposal in progress is reviewed where the action lives, never in a lane.
      const incomplete = anchor.pending.filter((x) => !x.familyKnown).length;
      pursuitNext.text = incomplete
        ? `${incomplete === 1 ? 'One proposal' : `${incomplete} proposals`} below ${incomplete === 1 ? 'needs' : 'need'} one answer: which problem the fact points at. Set it and the thesis goes to review; approve it and the first touch is prepared.`
        : `${anchor.pending.length === 1 ? 'One proposal' : `${anchor.pending.length} proposals`} below ${anchor.pending.length === 1 ? 'is' : 'are'} waiting for your review: approve it and the first touch is prepared, or set it aside.`;
      pursuitNext.control = { href: '#outreach-anchor', label: incomplete ? 'Complete the proposal' : 'Review the proposal' };
    } else if (pursuitNext && pursuit?.state.state === 'research' && anchor && anchor.draftable.length > 0) {
      pursuitNext.text = `${anchor.draftable.length === 1 ? 'One checked fact' : `${anchor.draftable.length} checked facts`} can become a thesis: draft it from the opening story below; review grounds it, then the first touch is prepared.`;
      pursuitNext.control = { href: '#outreach-anchor', label: 'Draft a thesis from the checked fact' };
    }
    // UX-11: Listen to account is written for the ear (60 to 90 s) over the same projections the page renders; it
    // never carries the private line, the do-not-use list, an address, a URL or a machine word. The older screen-read
    // text stays only when the pursuit read failed.
    // UX-08 parity: the Work card says what this page says, NEXT included (process memory, nothing written).
    // R10: ONE actionable result (intent, the allowed action, preparation, completion) derived here and remembered
    // durably (R15), so Work's card and this page say the same move.
    const actionable = pursuit && pursuitNext ? actionableFromPursuit(pursuit.state, pursuitNext, { hypothesisId: pursuit.hypothesisId, usableTheses: pursuit.usableTheses, pendingProposals: anchor?.pending.length ?? 0, incompleteProposals: anchor?.pending.filter((x) => !x.familyKnown).length ?? 0 }) : null;
    if (pursuit) rememberPursuitSummary(pursuit.state, now, pursuitNext?.text ?? null, { prisma, actionable });
    // UX-13: Ask GAP answers over exactly these projections; remembered here so a question costs the model, not the read.
    // R35: with the page's controls (NEXT's control), so a request to prepare gets a proposal for that control.
    if (pursuit && pursuitNext) rememberAskContext(compactContext({ accountName: brief.accountName, state: pursuit.state, nextText: pursuitNext.text, story: storyShown, anchor, stack: pursuit.stack, buyerSaid: inputs.bids.map((b) => ({ text: b.summary, who: b.who ?? null, at: b.at ?? null })), nav: { next: pursuitNext.control } }), now);
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
          nextHref={(() => {
            const h = (pursuitNext?.control ?? control)?.href ?? null;
            // R60: a pack opened from here keeps the seller's place in Work (an account link already does via hrefFor).
            return h ? withWorkContext(h, brief.accountName, workIndex) : null;
          })()}
          nextLabel={(pursuitNext?.control ?? control)?.label ?? null}
          nextText={pursuitNext?.text ?? null}
          links={pursuit?.state.person?.personaId != null ? links.map((l) => (l.label === 'Log what happened' ? { ...l, href: `${l.href}&person=${pursuit.state.person!.personaId}` } : l)) : links}
          mailbox={process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null}
          pursuit={pursuit ? { state: pursuit.state, stack: pursuit.stack, hypothesisId: pursuit.hypothesisId, excluded, story: storyShown, anchor } : null}
          doneNext={q.from === 'work' ? <DoneNext slug={slug} index={workIndex} accountName={brief.accountName} /> : null}
          askGap={pursuit ? <AskGap accountName={brief.accountName} /> : null}
          workItems={replyPrep || recordReply || obligations.length ? (
            <>
              {/* On this page the record control is the section below (an anchor keeps the Work position). */}
              {replyPrep ? <ReplyPrepPanel prep={replyPrep.record ? { ...replyPrep, record: { ...replyPrep.record, href: `#${RECORD_REPLY_ANCHOR}` } } : replyPrep} /> : null}
              {recordReply ? (
                // R60: the reply is recorded here, on its own account (never the list of every account's replies).
                <section id={RECORD_REPLY_ANCHOR} className="scroll-mt-16 space-y-2 rounded-md border border-[var(--border)] p-3" aria-labelledby="record-reply-heading" data-testid="record-reply">
                  <h2 id="record-reply-heading" className="text-sm font-semibold">Record what they said</h2>
                  <RepliesTriage account={brief.accountName} />
                </section>
              ) : null}
              <AccountObligations items={obligations} />
            </>
          ) : null}
        />
      </div>
    );
  }

  // SOURCES: the full analyst layer, as before V2.
  await dealsSynced;
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
