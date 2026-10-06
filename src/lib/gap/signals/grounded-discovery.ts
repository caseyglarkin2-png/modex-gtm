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
import { captureSignal, parseSignalMeta } from './intake';
import { loadWatchProfiles, type WatchProfile } from './watch';
import { discoveryOrder, loadDiscoveryPriority } from './coverage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GROUNDED_DISCOVERY_AUDIT = 'signal.grounded_discovery' as const;
export const GROUNDED_DISCOVERY_ACTOR = 'gap-grounded-discovery';
/** Accounts per turn (each one grounded question): small on purpose, the cron runs every two hours. */
export const GROUNDED_ACCOUNTS_PER_RUN = 2;
export const GROUNDED_TIME_BUDGET_MS = 120_000;
/** Pages kept per question, at most. */
export const GROUNDED_PAGES_PER_ASK = 8;
/**
 * R25: a MATERIAL grounded page (its class below, its title naming the account, the page's OWN date read, not the
 * search's claim) is queued for the existing bounded background research (research/background.ts consumes
 * `research_status: 'queued'` under its own cap, cooldown and three-attempt dead letter), so an ordinary relevant
 * discovery progresses without Casey pressing Verify. Bounded here too: per run and per day. A page the search
 * dated itself, a MAY BE RELEVANT page, an unread page, leadership / labor / security pages (context, never a
 * physical fact to verify) are never queued.
 */
export const GROUNDED_QUEUE_PER_RUN = 4;
export const GROUNDED_QUEUE_PER_DAY = 40;
/** R21: the signal row's source class (GapSignal.source_class vocabulary) a grounded class implies, when the host alone could not say. */
export const SOURCE_CLASS_OF_GROUNDED: Readonly<Record<string, string>> = {
  'company newsroom': 'company_site',
  'SEC filing': 'sec_filing',
  'job posting or hiring': 'job_posting',
  'procurement or RFP': 'procurement',
  'vendor or customer case study': 'vendor',
};
export const MATERIAL_CLASSES: ReadonlySet<string> = new Set([
  'company newsroom',
  'SEC filing',
  'earnings call or executive remarks',
  'job posting or hiring',
  'government, economic development, permit or facility announcement',
  'procurement or RFP',
  'vendor or customer case study',
  'technology implementation',
  '3PL, carrier or partner relationship',
  'merger, acquisition or divestiture',
  'capital spending or restructuring',
  'fleet or transportation change',
  'trade press news',
]);

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
  /** R25: pages queued for the bounded background research this turn. */
  queued: number;
  dropped: { notCited: number; garbage: number; dead: number };
  error: string | null;
}

/** The page itself, read before capture: the real title and article date, never the search model's. */
export type FetchPage = (url: string) => Promise<{ ok: true; finalUrl: string; title: string | null; publishedAt: Date | null } | { ok: false; status: string }>;

const defaultFetchPage: FetchPage = async (url) => {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YardFlowResearch/1.0)', Accept: 'text/html,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, status: String(res.status) };
    const meta = parseSignalMeta((await res.text()).slice(0, 300_000));
    return { ok: true, finalUrl: res.url || url, title: meta.title ?? null, publishedAt: meta.publishedAt ?? null };
  } catch (e) {
    return { ok: false, status: (e instanceof Error ? e.message : String(e)).slice(0, 40) };
  }
};

/** A provider-wide outage (quota, cooldown, unavailable, timeout) is retried next run; a content failure rotates. */
const TRANSIENT = /quota|cooling|unavailable|timeout|timed out|rate|429|5\d\d/i;

export async function runGroundedDiscovery(
  prisma: PrismaLike,
  opts: { now: Date; accounts?: number; timeBudgetMs?: number; clock?: () => number },
  deps: { ask?: (prompt: string, budgetMs: number) => Promise<{ pages: GroundedPage[]; citations: string[]; citedHosts: string[] } | { error: string }>; profiles?: () => Promise<WatchProfile[]>; providers?: ScoutProvider[]; fetchPage?: FetchPage; /** R20: the priority accounts (test seam; the database read by default). */ priority?: () => Promise<Map<string, string[]>> } = {},
): Promise<{ accounts: GroundedAccountResult[]; skipped: string[] }> {
  const clock = opts.clock ?? Date.now;
  const started = clock();
  const ask =
    deps.ask ??
    (async (prompt: string, budgetMs: number) => {
      let meta: { citations: string[]; citedHosts: string[] } = { citations: [], citedHosts: [] };
      const r = await askGrounded(prompt, (a: ProviderAnswer) => {
        const pages = parseGroundedPages(a.text);
        meta = { citations: a.citations, citedHosts: a.citedHosts ?? [] };
        return /\[/.test(a.text) ? pages : null;
      }, deps.providers ?? defaultProviders(), { budgetMs });
      return r.ok ? { pages: r.value, ...meta } : { error: r.attempts.map((x) => `${x.provider} ${x.outcome}`).join('; ') || 'no grounded provider' };
    });
  const profiles = await (deps.profiles ?? (() => loadWatchProfiles(prisma)))();
  const out = { accounts: [] as GroundedAccountResult[], skipped: [] as string[] };
  if (!profiles.length) return out;

  // Rotation: least recently asked first; the bundle is the account's turn count, so every class comes round.
  const asked: Array<{ subject_id: string; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: GROUNDED_DISCOVERY_AUDIT, subject_type: 'account', subject_id: { in: profiles.map((p) => p.accountName) } },
    select: { subject_id: true, created_at: true, payload: true },
    orderBy: { created_at: 'desc' },
    take: 5_000,
  });
  const lastAt = new Map<string, number>();
  const lastFailedAt = new Map<string, number>();
  const turns = new Map<string, number>();
  for (const a of asked) {
    if (!lastAt.has(a.subject_id)) {
      lastAt.set(a.subject_id, new Date(a.created_at).getTime());
      // The newest row's error (a content failure took the turn): the account backs off behind the others (R20).
      if (typeof (a as { payload?: Record<string, unknown> }).payload?.error === 'string') lastFailedAt.set(a.subject_id, new Date(a.created_at).getTime());
    }
    turns.set(a.subject_id, (turns.get(a.subject_id) ?? 0) + 1);
  }
  // R20: priority accounts (in motion, chosen, in a deal, a meeting soon) first, each least recently asked; a failing
  // account waits behind every account that has not failed (starvation protection). Pure order (signals/coverage.ts).
  const priority = deps.priority ? await deps.priority() : await loadDiscoveryPriority(prisma, opts.now).catch(() => new Map<string, string[]>());
  const order = discoveryOrder(profiles, { now: opts.now, lastAt, lastFailedAt, priority: new Set(priority.keys()) });
  // R25: today's grounded queue budget, from the signals themselves (metadata.grounded.queuedAt in the last day).
  let queuedToday = 0;
  try {
    const recent: Array<{ metadata: Record<string, unknown> | null }> = typeof prisma.gapSignal?.findMany === 'function'
      ? await prisma.gapSignal.findMany({ where: { origin: 'discovery', updated_at: { gte: new Date(opts.now.getTime() - 86_400_000) } }, select: { metadata: true }, take: 2_000 })
      : [];
    const since = opts.now.getTime() - 86_400_000;
    queuedToday = recent.filter((r) => { const g = (r.metadata as { grounded?: { queuedAt?: string } } | null)?.grounded; return typeof g?.queuedAt === 'string' && new Date(g.queuedAt).getTime() >= since; }).length;
  } catch {
    queuedToday = 0;
  }

  for (const p of order.slice(0, Math.max(1, Math.min(opts.accounts ?? GROUNDED_ACCOUNTS_PER_RUN, 10)))) {
    if (clock() - started > (opts.timeBudgetMs ?? GROUNDED_TIME_BUDGET_MS)) {
      out.skipped.push(p.accountName);
      continue;
    }
    const classes = [...SOURCE_CLASS_BUNDLES[(turns.get(p.accountName) ?? 0) % SOURCE_CLASS_BUNDLES.length]];
    const res: GroundedAccountResult = { accountName: p.accountName, classes, proposed: 0, kept: 0, captured: 0, duplicates: 0, mayBeRelevant: 0, queued: 0, dropped: { notCited: 0, garbage: 0, dead: 0 }, error: null };
    // The whole turn shares the time budget: one slow answer never runs the cron past its limit.
    const left = (opts.timeBudgetMs ?? GROUNDED_TIME_BUDGET_MS) - (clock() - started);
    const answer = await ask(groundedPrompt(p.accountName, classes, p.aliases), Math.max(10_000, left)).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
    if ('error' in answer) {
      res.error = answer.error.slice(0, 200);
      // A provider outage is retried next run; a content failure (no citations, unparsable) still takes the turn,
      // so one hard account never holds every slot.
      if (!TRANSIENT.test(answer.error)) await prisma.gapAuditEvent.create({ data: { kind: GROUNDED_DISCOVERY_AUDIT, actor: GROUNDED_DISCOVERY_ACTOR, subject_type: 'account', subject_id: p.accountName, created_at: opts.now, payload: JSON.parse(JSON.stringify(res)) } }).catch(() => undefined);
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
      // Read the page itself: a link that does not answer (a path the search made up, a dead page) is dropped,
      // and the card carries the page's OWN title and article date, never the search model's.
      const live = await (deps.fetchPage ?? defaultFetchPage)(page.url);
      // Only a page that does not exist (404 / 410) or that lands on a redirect is dropped. A page that BLOCKS the
      // reader (403, 429, bot protection, a refused connection) is a real cited page: kept, labelled unread, with
      // the search's title marked as such (soak, 2026-10-02: maersk.com and businesswire.com block server reads).
      if (live.ok ? SEARCH_REDIRECT.test(live.finalUrl) : /^(404|410)$/.test(live.status)) {
        res.dropped.dead += 1;
        continue;
      }
      if (MARKET_CHATTER.test((live.ok ? live.title : null) ?? page.title)) {
        res.dropped.garbage += 1;
        continue;
      }
      res.kept += 1;
      const unread = !live.ok;
      const realTitle = (live.ok ? live.title : null) || page.title || null;
      const r = await captureSignal(
        prisma,
        { url: live.ok ? live.finalUrl : page.url, title: realTitle, publishedAt: live.ok ? live.publishedAt : null, sourceName: null, origin: 'discovery', actor: GROUNDED_DISCOVERY_ACTOR, now: opts.now, accountName: p.accountName, resolutionBasis: 'grounded_discovery' },
        { fetchHtml: null },
      ).catch(() => null);
      if (!r || !r.ok) continue;
      if (!r.signal.created) {
        res.duplicates += 1;
        continue;
      }
      res.captured += 1;
      // The class it was found for and the search's date CLAIM (never a publication date) ride on the signal.
      const named = textNamesAccount(realTitle ?? '', key) || p.aliases.some((a) => textNamesAccount(realTitle ?? '', normalizeCompany(a)));
      if (!named) res.mayBeRelevant += 1;
      const row: { metadata: Record<string, unknown> | null; source_class?: string | null } | null = await prisma.gapSignal.findUnique({ where: { id: r.signal.id }, select: { metadata: true, source_class: true } }).catch(() => null);
      // R25: material, named, dated by the page itself, within this run's and today's budget: queued for the bounded
      // background research. Everything else stays a signal Casey sees.
      const cls = page.cls || classes[0];
      // R21: the source class the page was found AS (a job board, a procurement notice, a filing, the company's own
      // site, a vendor page) is kept on the row itself when the host alone could only say "news".
      const mappedClass = SOURCE_CLASS_OF_GROUNDED[cls] ?? null;
      const sourceClass = mappedClass && (!row?.source_class || row.source_class === 'news' || row.source_class === 'other') ? mappedClass : null;
      const queue = named && !unread && live.ok && !!live.publishedAt && MATERIAL_CLASSES.has(cls) && res.queued < GROUNDED_QUEUE_PER_RUN && queuedToday < GROUNDED_QUEUE_PER_DAY;
      await prisma.gapSignal
        .update({ where: { id: r.signal.id }, data: { ...(queue ? { research_status: 'queued' } : {}), ...(sourceClass ? { source_class: sourceClass } : {}), metadata: { ...((row?.metadata ?? {}) as Record<string, unknown>), grounded: { cls, claimedDate: live.ok && live.publishedAt ? null : page.date, mayBeRelevant: !named, ...(unread ? { unread: true } : {}), ...(queue ? { queuedAt: opts.now.toISOString() } : {}) } } } })
        .catch(() => undefined);
      if (queue) {
        res.queued += 1;
        queuedToday += 1;
      }
    }
    await prisma.gapAuditEvent.create({ data: { kind: GROUNDED_DISCOVERY_AUDIT, actor: GROUNDED_DISCOVERY_ACTOR, subject_type: 'account', subject_id: p.accountName, created_at: opts.now, payload: JSON.parse(JSON.stringify(res)) } }).catch(() => undefined);
    out.accounts.push(res);
  }
  return out;
}
