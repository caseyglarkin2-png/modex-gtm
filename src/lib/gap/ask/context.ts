/**
 * ASK GAP context (UX-13): the same reads the account page runs, composed once into the bounded AskContext. No new
 * state, nothing written, the private line and the vault note never leave this function (they are not passed on).
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { loadPursuit } from '../pursuit/load';
import { nextFromPursuit } from '../pursuit/next';
import { refineNextWithAnchor } from '../pursuit/next-anchor';
import { storyBesideAnchor } from '../story/anchor';
import { composeStoryAndAnchor } from '../story/compose';
import { accountHref } from '../account-intel/href';
import { compactContext, type AskContext } from './grounding';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function buildAskContext(prisma: PrismaLike, accountName: string, now: Date = new Date()): Promise<AskContext | null> {
  const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
  if (!inputs) return null;
  const brief = buildAccountBrief(inputs, now);
  const ctx = await loadAccountContext(prisma, inputs, now);
  const pursuit = await loadPursuit(prisma, { brief, inputs, ctx, now }).catch(() => null);
  if (!pursuit) return null;
  const href = accountHref(brief.accountName);
  // R63-A S8: the page's composition and its anchor-refined NEXT, so Ask, Work and the page say one move.
  const { story, anchor } = await composeStoryAndAnchor({ inputs, brief, ctx, pursuit, now });
  const next = refineNextWithAnchor(nextFromPursuit(pursuit.state, { hypothesisId: pursuit.hypothesisId, accountSlugHref: (view) => (view === 'now' ? href : `${href}?view=${view}`), replyThreadHref: null, captureHref: `/gap/capture?account=${encodeURIComponent(brief.accountName)}`, readyHref: pursuit.ready?.href ?? null }), { state: pursuit.state, anchor });
  return compactContext({
    accountName: brief.accountName,
    state: pursuit.state,
    nextText: next.text,
    story: storyBesideAnchor(story, anchor),
    anchor,
    stack: pursuit.stack,
    buyerSaid: inputs.bids.map((b) => ({ text: b.summary, who: b.who ?? null, at: b.at ?? null })),
    nav: { accountHref: href, next: next.control },
  });
}
