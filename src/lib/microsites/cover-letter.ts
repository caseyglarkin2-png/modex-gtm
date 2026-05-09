/**
 * Sprint M6 — email cover letter helper.
 *
 * Generates a plaintext { subject, body } pair that pairs with the M3
 * memo template. The cover letter's job is to put the memo URL in front
 * of one specific named reader with enough context that they open it.
 * It's the only "outreach" element in the funnel — the memo itself is
 * anti-selling, so the email has to do the framing work.
 *
 * Design tells we're avoiding (typical AI cover-letter slop):
 *   - "I hope this email finds you well"
 *   - "I came across {Account}'s recent..."
 *   - Bullet-point feature lists
 *   - "I'd love to hop on a call"
 *   - Multiple links / multiple CTAs
 *   - Anything that reads like a templated SDR sequence
 *
 * Design tells we're choosing:
 *   - One specific observation lifted from the account's research data
 *     in the first 2 sentences (no generic openers)
 *   - Plain prose, no bullets
 *   - One single link, reader-aware via ?p= when a variant is provided
 *   - Sign-off matches the memo's About section (Casey at FreightRoll)
 *   - 110-150 words total
 *
 * The helper is pure (no IO, no client state) — Studio composes the
 * subject/body and copies them into Gmail/Outlook directly.
 */

import type { AccountMicrositeData, PersonVariant, ProofBlock } from './schema';

export interface CoverLetterOptions {
  /** Person variant — when provided, the letter is reader-aware (named, ?p= URL). */
  variant?: PersonVariant;
  /** Base URL (default: https://yardflow.ai). Override for staging / preview. */
  baseUrl?: string;
  /** Author email shown in the sign-off (default: casey@freightroll.com). */
  authorEmail?: string;
  /** Author name in the sign-off (default: 'Casey'). */
  authorName?: string;
}

export interface CoverLetter {
  subject: string;
  body: string;
}

const DEFAULT_BASE_URL = 'https://yardflow.ai';
const DEFAULT_AUTHOR_EMAIL = 'casey@freightroll.com';
const DEFAULT_AUTHOR_NAME = 'Casey';

export function buildMemoCoverLetter(
  account: AccountMicrositeData,
  options: CoverLetterOptions = {},
): CoverLetter {
  const baseUrl = stripTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);
  const authorEmail = options.authorEmail ?? DEFAULT_AUTHOR_EMAIL;
  const authorName = options.authorName ?? DEFAULT_AUTHOR_NAME;

  const firstName = options.variant?.person.firstName?.trim();
  const url = buildMemoUrl(baseUrl, account.slug, options.variant?.variantSlug);
  const observation = buildObservation(account);
  const comparableName = pickComparable(account.proofBlocks);

  const subject = buildSubject(account.accountName);
  const body = composeBody({
    firstName,
    accountName: account.accountName,
    observation,
    comparableName,
    url,
    authorName,
    authorEmail,
  });

  return { subject, body };
}

// ── Subject ──────────────────────────────────────────────────────────

function buildSubject(accountName: string): string {
  return `${accountName} yard layer — private analysis`;
}

// ── Body composition ────────────────────────────────────────────────

interface BodyParts {
  firstName: string | undefined;
  accountName: string;
  observation: string;
  comparableName: string;
  url: string;
  authorName: string;
  authorEmail: string;
}

function composeBody(p: BodyParts): string {
  const opener = p.firstName ? `${p.firstName} —` : `Hi —`;
  const lines: string[] = [];

  lines.push(opener);
  lines.push('');
  lines.push(
    `Quick note from over here at YardFlow. I put together a private analysis on ${p.accountName}'s yard layer. ${p.observation}`,
  );
  lines.push('');
  lines.push(
    `The brief is structured as a memo, not a pitch deck — what we observed about your network from public data, what ${p.comparableName} did when they closed the same gap, our methodology and confidence levels, and a calculator pre-loaded with your numbers.`,
  );
  lines.push('');
  lines.push(p.url);
  lines.push('');
  lines.push(
    `It's a 5-minute read. If parts of it read wrong against what you see internally, push back — that's actually the most useful thing. The next step that makes sense is whatever the analysis prompts; not necessarily a meeting.`,
  );
  lines.push('');
  lines.push(p.authorName);
  lines.push(p.authorEmail);

  return lines.join('\n');
}

// ── Observation: pull a specific 1-sentence framing from the account ─

function buildObservation(account: AccountMicrositeData): string {
  // Prefer the explicit urgency driver — that's the operator-curated take.
  if (account.signals?.urgencyDriver) {
    return ensureTerminalPunctuation(account.signals.urgencyDriver);
  }

  // Fallback: compose from network + freight specifics. No generic verbiage.
  const facilityCount = account.network?.facilityCount;
  const primaryMode = account.freight?.primaryModes?.[0];
  if (facilityCount && primaryMode) {
    return `Specifically: the ${facilityCount} footprint plus a primarily-${primaryMode} freight profile creates a yard variance window that the TMS can't see — and that's where most multi-site CPG networks bleed hours.`;
  }
  if (facilityCount) {
    return `Specifically: with ${facilityCount}, the gap between routing decisions and dock-door reality is where most multi-site CPG networks bleed hours.`;
  }

  // Last-resort universal — still concrete, still anti-selling.
  return `Specifically: the gap between routing decisions and dock-door reality is where most multi-site CPG networks bleed hours that no TMS or WMS can see.`;
}

function ensureTerminalPunctuation(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return trimmed;
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

// ── Comparable: same logic memo-compat uses, kept independent ───────

function pickComparable(blocks: ProofBlock[] | undefined): string {
  if (!blocks || blocks.length === 0) return 'Primo Brands';
  const primo = blocks.find(
    (b) => /primo/i.test(b.headline ?? '') || /primo/i.test(b.quote?.company ?? ''),
  );
  if (primo) return primo.quote?.company ?? 'Primo Brands';
  const caseResult = blocks.find((b) => b.type === 'case-result' || b.type === 'metric');
  if (caseResult?.quote?.company) return caseResult.quote.company;
  return blocks[0]?.quote?.company ?? 'Primo Brands';
}

// ── URL ──────────────────────────────────────────────────────────────

function buildMemoUrl(baseUrl: string, slug: string, personSlug?: string): string {
  const path = `${baseUrl}/for/${slug}`;
  if (!personSlug) return path;
  return `${path}?p=${encodeURIComponent(personSlug)}`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
