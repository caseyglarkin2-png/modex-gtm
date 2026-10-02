/**
 * GROUNDED SOURCE DISCOVERY (stabilization D): the automatic source aperture beyond news.
 *
 * News discovery (discovery.ts, Google News RSS) stays as it is. This adds ONE bounded grounded-search question per
 * watched account per turn (the existing grounded provider chain: Gemini, then the configured OpenAI / AI Gateway
 * fallbacks), rotating through bundles of source classes so every class comes round. Each page the search actually
 * CITED is captured as a SIGNAL through the one intake path, labelled with its class. Model memory is never a
 * source: a page the search did not cite is dropped.
 *
 * A captured page is a SOURCE / SIGNAL, never a fact: it is not queued for research on its own (the date is the
 * search's claim, so it cannot be a fresh trigger), never promoted, linked, drafted or sent. Casey decides; Verify
 * claim checks it at its source.
 *
 * Only objective garbage is dropped: malformed links, search redirects, market-wire chatter. A page whose title does
 * not name the account is kept and labelled MAY BE RELEVANT, never thrown away.
 */
import { askGrounded, defaultProviders, groundedOnly, type ProviderAnswer, type ScoutProvider } from '../entity/providers';
import { normalizeCompany, textNamesAccount } from '../research/claim-rules';
import { SEARCH_REDIRECT } from '../sources/source-copy';
import { MARKET_CHATTER } from './discovery';
import { captureSignal } from './intake';
import { loadWatchProfiles, type WatchProfile } from './watch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GROUNDED_DISCOVERY_AUDIT = 'signal.grounded_discovery' as const;
export const GROUNDED_DISCOVERY_ACTOR = 'gap-grounded-discovery';
/** Accounts per turn (each one grounded question): small on purpose, the cron runs every two hours. */
export const GROUNDED_ACCOUNTS_PER_RUN = 2;
export const GROUNDED_TIME_BUDGET_MS = 120_000;
/** Pages kept per question, at most. */
export const GROUNDED_PAGES_PER_ASK = 8;

/** The source classes, bundled so one question stays focused; an account's turns rotate through the bundles. */
export const SOURCE_CLASS_BUNDLES: ReadonlyArray<ReadonlyArray<string>> = [
  ['company newsroom', 'SEC filing', 'earnings call or executive remarks', 'leadership change'],
  ['job posting or hiring', 'labor, WARN notice or strike', 'security or cargo theft', 'government, economic development, permit or facility announcement'],
  ['procurement or RFP', 'vendor or customer case study', 'technology implementation', '3PL, carrier or partner relationship'],
  ['merger, acquisition or divestiture', 'capital spending or restructuring', 'fleet or transportation change', 'trade press news'],
];

/** What the configured providers can and cannot reach automatically (the honest coverage map). */
export const SOURCE_CLASS_COVERAGE: ReadonlyArray<{ cls: string; mode: 'automated' | 'manual_only'; via: string }> = [
  { cls: 'news', mode: 'automated', via: 'Google News RSS (discovery.ts) + grounded search' },
  ...SOURCE_CLASS_BUNDLES.flat().map((cls) => ({ cls, mode: 'automated' as const, via: 'grounded search (Gemini, OpenAI / AI Gateway fallback), rotating bundles' })),
  { cls: 'LinkedIn / social / professional posts', mode: 'manual_only', via: 'Casey-shared links and conference notes only: grounded search cannot read them reliably' },
];

export interface GroundedPage {
  url: string;
  title: string;
  cls: string;
  date: string | null;
}

/** Parse the model's JSON array; malformed rows are dropped. */
export function parseGroundedPages(text: string): GroundedPage[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    return (JSON.parse(body.slice(start, end + 1)) as unknown[])
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({ url: String(x.url ?? ''), title: String(x.title ?? '').slice(0, 300), cls: String(x.class ?? x.cls ?? '').slice(0, 80), date: typeof x.date === 'string' ? x.date : null }))
      .filter((x) => /^https?:\/\/[^/\s]+\.[^/\s]+/.test(x.url));
  } catch {
    return [];
  }
}

export function groundedPrompt(accountName: string, classes: readonly string[], aliases: readonly string[] = []): string {
  return `List up to ${GROUNDED_PAGES_PER_ASK} PUBLIC web pages from the last 120 days about ${accountName}${aliases.length ? ` (also known as ${aliases.slice(0, 4).join(', ')})` : ''} in these source classes: ${classes.join('; ')}.
Include a page when it plausibly matters to ${accountName}'s operations, network, facilities, transportation, technology, people or partners, even if it is not big news. A page by a vendor, partner, government body or job board that names ${accountName} counts.
Never list a search-result page, a redirect, a stock-price or analyst-rating page, or a page you did not read.
Return ONLY a JSON array: [{"url": "...", "title": "...", "class": "one of the classes above", "date": "YYYY-MM-DD or null"}]. If you find none, return [].`;
}

export interface GroundedAccountResult {
  accountName: string;
  classes: string[];
  proposed: number;
  kept: number;
  captured: number;
  duplicates: number;
  mayBeRelevant: number;
  dropped: { notCited: number; garbage: number };
  error: string | null;
}

export async function runGroundedDiscovery(
  prisma: PrismaLike,
  opts: { now: Date; accounts?: number; timeBudgetMs?: number; clock?: () => number },
  deps: { ask?: (prompt: string) => Promise<{ pages: GroundedPage[]; citations: string[]; citedHosts: string[] } | { error: string }>; profiles?: () => Promise<WatchProfile[]>; providers?: ScoutProvider[] } = {},
): Promise<{ accounts: GroundedAccountResult[]; skipped: string[] }> {
  const clock = opts.clock ?? Date.now;
  const started = clock();
  const ask =
    deps.ask ??
    (async (prompt: string) => {
      let meta: { citations: string[]; citedHosts: string[] } = { citations: [], citedHosts: [] };
      const r = await askGrounded(prompt, (a: ProviderAnswer) => {
        const pages = parseGroundedPages(a.text);
        meta = { citations: a.citations, citedHosts: a.citedHosts ?? [] };
        return /\[/.test(a.text) ? pages : null;
      }, deps.providers ?? defaultProviders());
      return r.ok ? { pages: r.value, ...meta } : { error: r.attempts.map((x) => `${x.provider} ${x.outcome}`).join('; ') || 'no grounded provider' };
    });
  const profiles = await (deps.profiles ?? (() => loadWatchProfiles(prisma)))();
  const out = { accounts: [] as GroundedAccountResult[], skipped: [] as string[] };
  if (!profiles.length) return out;

  // Rotation: least recently asked first; the bundle is the account's turn count, so every class comes round.
  const asked: Array<{ subject_id: string; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: GROUNDED_DISCOVERY_AUDIT, subject_type: 'account', subject_id: { in: profiles.map((p) => p.accountName) } },
    select: { subject_id: true, created_at: true },
    orderBy: { created_at: 'desc' },
    take: 5_000,
  });
  const lastAt = new Map<string, number>();
  const turns = new Map<string, number>();
  for (const a of asked) {
    if (!lastAt.has(a.subject_id)) lastAt.set(a.subject_id, new Date(a.created_at).getTime());
    turns.set(a.subject_id, (turns.get(a.subject_id) ?? 0) + 1);
  }
  const order = [...profiles].sort((a, b) => (lastAt.get(a.accountName) ?? 0) - (lastAt.get(b.accountName) ?? 0) || a.accountName.localeCompare(b.accountName));

  for (const p of order.slice(0, Math.max(1, Math.min(opts.accounts ?? GROUNDED_ACCOUNTS_PER_RUN, 10)))) {
    if (clock() - started > (opts.timeBudgetMs ?? GROUNDED_TIME_BUDGET_MS)) {
      out.skipped.push(p.accountName);
      continue;
    }
    const classes = [...SOURCE_CLASS_BUNDLES[(turns.get(p.accountName) ?? 0) % SOURCE_CLASS_BUNDLES.length]];
    const res: GroundedAccountResult = { accountName: p.accountName, classes, proposed: 0, kept: 0, captured: 0, duplicates: 0, mayBeRelevant: 0, dropped: { notCited: 0, garbage: 0 }, error: null };
    const answer = await ask(groundedPrompt(p.accountName, classes, p.aliases)).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
    if ('error' in answer) {
      // A turn in which the search could not run is not a turn: no rotation row, asked again next run.
      res.error = answer.error.slice(0, 200);
      out.accounts.push(res);
      continue;
    }
    res.proposed = answer.pages.length;
    // Grounded only: a page the search did not cite is model memory, never a source.
    const { kept, dropped } = groundedOnly(answer.pages.map((x) => ({ ...x, claim: x.title })), answer.citations, answer.citedHosts);
    res.dropped.notCited = dropped.length;
    const key = normalizeCompany(p.accountName);
    for (const page of kept.slice(0, GROUNDED_PAGES_PER_ASK)) {
      if (SEARCH_REDIRECT.test(page.url) || MARKET_CHATTER.test(page.title)) {
        res.dropped.garbage += 1;
        continue;
      }
      res.kept += 1;
      const r = await captureSignal(
        prisma,
        { url: page.url, title: page.title || null, publishedAt: null, sourceName: null, origin: 'discovery', actor: GROUNDED_DISCOVERY_ACTOR, now: opts.now, accountName: p.accountName, resolutionBasis: 'grounded_discovery' },
        { fetchHtml: null },
      ).catch(() => null);
      if (!r || !r.ok) continue;
      if (!r.signal.created) {
        res.duplicates += 1;
        continue;
      }
      res.captured += 1;
      // The class it was found for and the search's date CLAIM (never a publication date) ride on the signal.
      const named = textNamesAccount(page.title, key) || p.aliases.some((a) => textNamesAccount(page.title, normalizeCompany(a)));
      if (!named) res.mayBeRelevant += 1;
      const row: { metadata: Record<string, unknown> | null } | null = await prisma.gapSignal.findUnique({ where: { id: r.signal.id }, select: { metadata: true } }).catch(() => null);
      await prisma.gapSignal
        .update({ where: { id: r.signal.id }, data: { metadata: { ...((row?.metadata ?? {}) as Record<string, unknown>), grounded: { cls: page.cls || classes[0], claimedDate: page.date, mayBeRelevant: !named } } } })
        .catch(() => undefined);
    }
    await prisma.gapAuditEvent.create({ data: { kind: GROUNDED_DISCOVERY_AUDIT, actor: GROUNDED_DISCOVERY_ACTOR, subject_type: 'account', subject_id: p.accountName, created_at: opts.now, payload: JSON.parse(JSON.stringify(res)) } }).catch(() => undefined);
    out.accounts.push(res);
  }
  return out;
}
