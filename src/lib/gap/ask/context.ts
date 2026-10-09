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
import { knowledgeAdapters } from '../story/load';
import type { AccountInputs } from '../account-intel/build';
import type { AccountStory } from '../story/story';
import { compactContext, type AskContext, type AskCoverage } from './grounding';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** What the account page's own reads say about each source (seller acceptance, 2026-10-09). Pure. */
export interface AskCoverageInputs {
  /** AccountInputs.opportunity: null is "HubSpot not read this time"; UNKNOWN is a read that did not settle (its detail says why). */
  opportunity: AccountInputs['opportunity'];
  /** The vault note row is on the story: the vault was read and held a note. */
  vaultNote: boolean;
  vaultConfigured: boolean;
  clawdConfigured: boolean;
  /** The story said Clawd's history could not be read. */
  clawdFailed: boolean;
  /** A GAP sender exists (GAP_GMAIL_USER_EMAIL); Sent is still not read on the account page. */
  senderConfigured: boolean;
  /** GAP drafts the ledger knows (first touches with a Gmail draft id); Gmail's own drafts are not read. */
  draftsOnRecord: number;
}

export function askCoverageOf(i: AskCoverageInputs): AskCoverage[] {
  const o = i.opportunity;
  return [
    { source: 'hubspot', status: !o ? 'not_read' : o.status === 'UNKNOWN' ? 'failed' : 'read', detail: !o ? 'not read this time' : o.status === 'UNKNOWN' ? o.detail || 'the read did not settle' : null },
    // The replies the page shows come from GAP's synced inbox (the poller's copy), never a live thread read.
    { source: 'gmail_thread', status: 'partial', detail: "GAP's synced inbox, not a live thread read" },
    { source: 'gmail_sent', status: 'not_read', detail: i.senderConfigured ? 'not read on the account page' : 'no GAP sender configured' },
    { source: 'gmail_drafts', status: i.draftsOnRecord > 0 ? 'partial' : 'not_read', detail: i.draftsOnRecord > 0 ? `${i.draftsOnRecord} GAP draft${i.draftsOnRecord === 1 ? '' : 's'} known from the ledger; Gmail drafts not read` : 'Gmail drafts not read' },
    { source: 'vault', status: !i.vaultConfigured ? 'not_read' : i.vaultNote ? 'read' : 'partial', detail: !i.vaultConfigured ? 'not configured' : i.vaultNote ? null : 'no account note found, or the read failed' },
    { source: 'clawd', status: !i.clawdConfigured ? 'not_read' : i.clawdFailed ? 'failed' : 'read', detail: !i.clawdConfigured ? 'not configured' : i.clawdFailed ? 'could not be read' : null },
    { source: 'signals', status: 'read', detail: null },
  ];
}

/** The coverage the page's own reads support, from the inputs and the composed story (no new read; the adapters are a config check). */
export function coverageFromPage(inputs: Pick<AccountInputs, 'opportunity' | 'firstTouches'>, story: AccountStory | null, env: Record<string, string | undefined> = process.env): AskCoverage[] {
  const { vault, clawd } = knowledgeAdapters({ env });
  return askCoverageOf({
    opportunity: inputs.opportunity,
    vaultNote: (story?.rows ?? []).some((r) => r.key === 'note'),
    vaultConfigured: !!vault,
    clawdConfigured: !!clawd,
    clawdFailed: (story?.rows ?? []).some((r) => r.sentences.some((s) => /clawd's (send )?history could not be read/i.test(s.text))),
    senderConfigured: !!env.GAP_GMAIL_USER_EMAIL?.trim(),
    draftsOnRecord: inputs.firstTouches.filter((t) => !!t.gmailDraftId).length,
  });
}

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
    // Seller acceptance (2026-10-09): what this context was built from, per source, so "no context" is never said over an unread source.
    coverage: coverageFromPage(inputs, story),
  });
}
