/**
 * THE ACCOUNT'S STORY AND OUTREACH ANCHOR, composed off the page (R63-A S8, 2026-10-07). Server only.
 *
 * The same composition the account page runs (NOW's lines, the touches, the story, the anchor), for the readers that
 * are not the page: Ask GAP and the Work warmer. Their NEXT is then refined by the same anchor (pursuit/next-anchor.ts),
 * so the Work card, Ask and the page say one move. Nothing written; the private line stays inside.
 */
import type { AccountInputs, AccountIntelligenceBrief } from '../account-intel/build';
import type { AccountContext } from '../context/context';
import { projectNow } from '../context/now';
import type { loadPursuit } from '../pursuit/load';
import { projectStory, type AccountStory } from './story';
import { mergeTouches } from './touches';
import { accountDomainFor, loadStoryReaders } from './load';
import { projectAnchor, type OutreachAnchor } from './anchor';

type Pursuit = Awaited<ReturnType<typeof loadPursuit>>;

export async function composeStoryAndAnchor(x: { inputs: AccountInputs; brief: AccountIntelligenceBrief; ctx: AccountContext; pursuit: Pursuit; now: Date }): Promise<{ v: ReturnType<typeof projectNow>; story: AccountStory; anchor: OutreachAnchor }> {
  const { inputs, brief, ctx, pursuit, now } = x;
  const readers = await loadStoryReaders({ accountName: brief.accountName, domain: accountDomainFor({ domains: inputs.domains, addresses: [...ctx.history.map((h) => h.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? ''), ...inputs.firstTouches.map((t) => t.recipient)].filter(Boolean) }) }).catch(() => ({ clawd: { read: 'unavailable' as const, sends: [] }, vaultNote: null }));
  const v = projectNow(brief, ctx, inputs, now, { ready: brief.motion.type === 'FACT_LED' ? pursuit.ready : null });
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
      replies: pursuit.state.lastInbound && pursuit.state.replyClass ? [{ from: pursuit.state.lastInbound.who, at: pursuit.state.lastInbound.at, snippet: pursuit.state.lastInbound.snippet, kind: pursuit.state.replyClass.kind, label: pursuit.state.replyClass.label, address: pursuit.state.lastInbound.from ?? null, placedVia: pursuit.state.lastInbound.placedVia ?? null }] : [],
      people: [...inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), ...(inputs.hubspotPeople?.people ?? []).map((p) => ({ name: p.name, title: p.title }))],
      // B1/B2: our Sent mail and the HubSpot engagements the inputs carry (null when not read this time).
      sent: inputs.sent ?? null,
      engagements: inputs.engagements ?? null,
      knowledge: inputs.knowledge ?? null,
      now,
    }),
    clawdRead: readers.clawd.read,
    vaultNote: readers.vaultNote,
    excluded,
    booked: ctx.relationship.meetings.upcoming,
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
  return { v, story, anchor };
}
