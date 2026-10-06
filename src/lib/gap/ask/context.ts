/**
 * ASK GAP context (UX-13): the same reads the account page runs, composed once into the bounded AskContext. No new
 * state, nothing written, the private line and the vault note never leave this function (they are not passed on).
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { projectNow } from '../context/now';
import { loadPursuit } from '../pursuit/load';
import { nextFromPursuit } from '../pursuit/next';
import { projectStory } from '../story/story';
import { mergeTouches } from '../story/touches';
import { accountDomainFor, loadStoryReaders } from '../story/load';
import { projectAnchor, storyBesideAnchor } from '../story/anchor';
import { accountHref } from '../account-intel/href';
import { compactContext, type AskContext } from './grounding';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function buildAskContext(prisma: PrismaLike, accountName: string, now: Date = new Date()): Promise<AskContext | null> {
  const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
  if (!inputs) return null;
  const brief = buildAccountBrief(inputs, now);
  const ctx = await loadAccountContext(prisma, inputs, now);
  const [pursuit, readers] = await Promise.all([
    loadPursuit(prisma, { brief, inputs, ctx, now }).catch(() => null),
    loadStoryReaders({ accountName: brief.accountName, domain: accountDomainFor({ domains: inputs.domains, addresses: ctx.history.map((h) => h.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? '').filter(Boolean) }) }),
  ]);
  if (!pursuit) return null;
  const v = projectNow(brief, ctx, inputs, now, { ready: brief.motion.type === 'FACT_LED' ? pursuit.ready : null });
  const href = accountHref(brief.accountName);
  const next = nextFromPursuit(pursuit.state, { hypothesisId: pursuit.hypothesisId, accountSlugHref: (view) => `${href}?view=${view}`, replyThreadHref: null, captureHref: `/gap/capture?account=${encodeURIComponent(brief.accountName)}` });
  const excluded = (pursuit.resolution?.excluded ?? []).map((e) => ({ key: e.candidate.key, name: e.candidate.name, title: e.candidate.title, code: e.code, reason: e.reason, source: e.source ?? null }));
  const story = projectStory({
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
  });
  const anchor = projectAnchor({
    accountName: brief.accountName,
    person: pursuit.state.person ? { personaId: pursuit.state.person.personaId, name: pursuit.state.person.name, title: pursuit.state.person.title } : null,
    people: [...(pursuit.stack?.rows ?? []), ...(pursuit.stack?.more ?? [])].map((r) => ({ personaId: r.personaId, name: r.name, title: r.title })),
    brief,
    inputs,
    story,
    anchorChoice: pursuit.anchorChoice,
    privateLine: v.private,
    sendable: pursuit.sendableTheses,
    now,
  });
  return compactContext({
    accountName: brief.accountName,
    state: pursuit.state,
    nextText: next.text,
    story: storyBesideAnchor(story, anchor),
    anchor,
    stack: pursuit.stack,
    buyerSaid: inputs.bids.map((b) => ({ text: b.summary, who: b.who ?? null, at: b.at ?? null })),
  });
}
