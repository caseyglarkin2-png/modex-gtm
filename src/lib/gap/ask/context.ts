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
  /** A GAP sender exists (GAP_GMAIL_USER_EMAIL); without one Sent cannot be read. */
  senderConfigured: boolean;
  /** GAP drafts the ledger knows (first touches with a Gmail draft id); Gmail's own drafts are not read. */
  draftsOnRecord: number;
  /** C6: the inbound read (thread-keyed and placed): how many placed messages were merged, and whether the identity context was readable. */
  inbound?: { placed: number; identityRead: boolean; detail: string | null } | null;
  /** B1: the Sent read (AccountInputs.sent): read with its count, partly read with its detail, or not read with the reason; absent means not read this time. */
  sent?: { read: boolean; count: number; detail: string | null } | null;
  /** B2: the HubSpot engagements read (AccountInputs.engagements): read with its count, or failed or not configured with the reason; absent means not read this time. */
  engagements?: { read: boolean; count: number; detail: string | null } | null;
  /**
   * B3: the vault's own coverage from the retrieval (context/retrieval.ts SourceCoverage: configured, reachable,
   * completeness, watermark, indexedAt, omittedReason) plus what it held (builder A's table adapter: the count and
   * its word, "92 calls"). When absent the row falls back to the configuration check and the story's note row.
   */
  vault?: { configured: boolean; reachable?: boolean; completeness?: 'complete' | 'partial' | 'unknown'; watermark?: string | null; indexedAt?: string | null; omittedReason?: string | null; count?: number | null; countWord?: string | null } | null;
}

/** "synced 10:39" (the seller's clock, America/New_York) from an ISO instant; null when none. */
const syncedAt = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `synced ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' })}`;
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function vaultRow(i: AskCoverageInputs): AskCoverage {
  const v = i.vault;
  if (!v) return { source: 'vault', status: !i.vaultConfigured ? 'not_read' : i.vaultNote ? 'read' : 'partial', detail: !i.vaultConfigured ? 'not configured' : i.vaultNote ? null : 'no account note found, or the read failed' };
  if (!v.configured) return { source: 'vault', status: 'not_read', detail: 'not configured' };
  if (v.reachable === false) return { source: 'vault', status: 'failed', detail: v.omittedReason || 'could not be read' };
  const held = [syncedAt(v.indexedAt), typeof v.count === 'number' ? plural(v.count, v.countWord || 'claim') : null].filter((x): x is string => !!x).join(', ');
  if (v.completeness === 'partial') return { source: 'vault', status: 'partial', detail: [held, v.omittedReason].filter(Boolean).join('; ') || 'partly read' };
  return { source: 'vault', status: 'read', detail: held || null };
}

export function askCoverageOf(i: AskCoverageInputs): AskCoverage[] {
  const o = i.opportunity;
  const sent = i.sent;
  const eng = i.engagements;
  return [
    { source: 'hubspot', status: !o ? 'not_read' : o.status === 'UNKNOWN' ? 'failed' : 'read', detail: !o ? 'not read this time' : o.status === 'UNKNOWN' ? o.detail || 'the read did not settle' : null },
    // B2: the company's notes, calls, meetings and logged emails (hubspot/engagements.ts), read with their count.
    !eng
      ? { source: 'hubspot_engagements', status: 'not_read', detail: 'not read this time' }
      : eng.read
        ? { source: 'hubspot_engagements', status: eng.detail ? 'partial' : 'read', detail: eng.detail ?? String(eng.count) }
        : { source: 'hubspot_engagements', status: /not configured|no HubSpot company/i.test(eng.detail ?? '') ? 'not_read' : 'failed', detail: eng.detail || 'could not be read' },
    // The replies the page shows come from GAP's synced inbox (the poller's copy), never a live thread read.
    { source: 'gmail_thread', status: 'partial', detail: `GAP's synced inbox, not a live thread read${i.inbound ? (i.inbound.identityRead ? `; ${i.inbound.placed} placed sender message${i.inbound.placed === 1 ? '' : 's'} merged` : `; ${i.inbound.detail ?? 'senders could not be placed'}`) : ''}` },
    // B1: our Sent folder (account-intel/sent.ts), read with its count; a sender must exist for it to be read at all.
    !sent
      ? { source: 'gmail_sent', status: 'not_read', detail: i.senderConfigured ? 'not read this time' : 'no GAP sender configured' }
      : sent.read
        ? { source: 'gmail_sent', status: sent.detail ? 'partial' : 'read', detail: sent.detail ? `${plural(sent.count, 'message')}; ${sent.detail}` : plural(sent.count, 'message') }
        : { source: 'gmail_sent', status: 'not_read', detail: sent.detail || 'could not be read' },
    { source: 'gmail_drafts', status: i.draftsOnRecord > 0 ? 'partial' : 'not_read', detail: i.draftsOnRecord > 0 ? `${i.draftsOnRecord} GAP draft${i.draftsOnRecord === 1 ? '' : 's'} known from the ledger; Gmail drafts not read` : 'Gmail drafts not read' },
    vaultRow(i),
    { source: 'clawd', status: !i.clawdConfigured ? 'not_read' : i.clawdFailed ? 'failed' : 'read', detail: !i.clawdConfigured ? 'not configured' : i.clawdFailed ? 'could not be read' : null },
    { source: 'signals', status: 'read', detail: null },
  ];
}

/**
 * The coverage the page's own reads support, from the inputs and the composed story (no new read; the adapters are a
 * config check). `extra.vault` is the retrieval's own coverage row when the caller holds it (B3); without it the vault
 * row reads the configuration and the story's note row, as before.
 */
export function coverageFromPage(inputs: Pick<AccountInputs, 'opportunity' | 'firstTouches'> & { inbound?: AccountInputs['inbound']; sent?: AccountInputs['sent']; engagements?: AccountInputs['engagements'] }, story: AccountStory | null, env: Record<string, string | undefined> = process.env, extra: { vault?: AskCoverageInputs['vault'] } = {}): AskCoverage[] {
  const { vault, clawd } = knowledgeAdapters({ env });
  return askCoverageOf({
    opportunity: inputs.opportunity,
    inbound: inputs.inbound ? { placed: inputs.inbound.messages.filter((m) => m.via !== 'thread').length, identityRead: inputs.inbound.identityRead, detail: inputs.inbound.detail } : null,
    sent: inputs.sent ? { read: inputs.sent.read, count: inputs.sent.messages.length, detail: inputs.sent.detail } : null,
    engagements: inputs.engagements ? { read: inputs.engagements.read, count: inputs.engagements.items.length, detail: inputs.engagements.detail } : null,
    vaultNote: (story?.rows ?? []).some((r) => r.key === 'note'),
    vaultConfigured: !!vault,
    vault: extra.vault ?? null,
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
