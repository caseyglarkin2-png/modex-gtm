/**
 * SCHEDULED SIGNAL DISCOVERY (GAP Signal Intelligence C).
 *
 * Not "crawl the internet": regularly ask a few high-value questions about the
 * accounts that matter. Each run takes the watched accounts least recently
 * asked (rotation), asks each a bounded number of its themes (rotated by day,
 * thesis families first), and captures what comes back as SIGNALS through the
 * one intake path (captureSignal). The source is Google News RSS (zero cost,
 * zero auth, the Pounce news source), with a politeness gap between queries.
 *
 * Capture broadly, but only what names the account in its headline and hits
 * the physical-network taxonomy (finance noise is dropped). The account is
 * known by construction (the query named it) and the headline confirms it.
 * Strong operational stories (autonomy, yard, network change named in the
 * headline) are queued for evidence research; the rest wait in the Signal
 * Inbox. A discovered signal is never a fact, never promoted without
 * verification, and never touches Pounce, HubSpot or Slack here.
 */
import { fetchAccountNews, type NewsItem } from '@/lib/pounce/news';
import { captureSignal, classifySignal } from './intake';
import { loadWatchProfiles, type WatchProfile } from './watch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DISCOVERY_AUDIT = 'signal.discovery' as const;
export const DISCOVERY_ACTOR = 'gap-signal-discovery';
export const DISCOVERY_ACCOUNTS_PER_RUN = 10;
export const DISCOVERY_QUERIES_PER_ACCOUNT = 2;
/** Stories older than this are not signals of anything happening now. */
export const DISCOVERY_MAX_AGE_MS = 21 * 86_400_000;
/** A discovered story this strong goes to research on its own (Casey-shared ones always do). */
export const DISCOVERY_RESEARCH_SCORE = 8;
export const DISCOVERY_TIME_BUDGET_MS = 200_000;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** "Headline - Publisher" (the Google News title shape) to the headline. */
export function cleanHeadline(title: string, source: string): string {
  const t = title.trim();
  const suffix = ` - ${source.trim()}`;
  return source && t.endsWith(suffix) ? t.slice(0, -suffix.length).trim() : t.replace(/\s+-\s+[^-]{2,60}$/, '').trim();
}

/** Does the headline name the account (its name or one of its watch aliases)? */
export function headlineNames(headline: string, profile: Pick<WatchProfile, 'accountName' | 'aliases'>): boolean {
  const h = ` ${norm(headline)} `;
  const keys = [profile.accountName, ...profile.aliases]
    .map((n) => norm(n).replace(/\b(inc|corp|corporation|company|co|llc|ltd|plc|the)\b/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((k) => k.length >= 4);
  return keys.some((k) => h.includes(` ${k} `));
}

/** Which themes this run asks: `count` of the profile's themes, rotated by day so every theme comes round. */
export function themesForRun(profile: Pick<WatchProfile, 'themes'>, now: Date, count = DISCOVERY_QUERIES_PER_ACCOUNT): string[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const n = profile.themes.length;
  if (!n) return [];
  return Array.from({ length: Math.min(count, n) }, (_, i) => profile.themes[(day * count + i) % n]);
}

export interface DiscoveryAccountResult {
  accountName: string;
  queries: string[];
  items: number;
  kept: number;
  captured: number;
  duplicates: number;
  queued: number;
}

export interface DiscoveryResult {
  universe: number;
  accounts: DiscoveryAccountResult[];
  skipped: string[];
}

export async function runDiscovery(
  prisma: PrismaLike,
  opts: { now: Date; accounts?: number; queriesPerAccount?: number; timeBudgetMs?: number; clock?: () => number },
  deps: { news?: (query: string) => Promise<NewsItem[]>; profiles?: () => Promise<WatchProfile[]>; sleep?: (ms: number) => Promise<void> } = {},
): Promise<DiscoveryResult> {
  const clock = opts.clock ?? Date.now;
  const started = clock();
  const news = deps.news ?? fetchAccountNews;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const profiles = await (deps.profiles ?? (() => loadWatchProfiles(prisma)))();
  const result: DiscoveryResult = { universe: profiles.length, accounts: [], skipped: [] };
  if (!profiles.length) return result;

  // Rotation: least recently asked first (never asked first of all), then name.
  const last: Array<{ subject_id: string; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: DISCOVERY_AUDIT, subject_type: 'account', subject_id: { in: profiles.map((p) => p.accountName) } },
    select: { subject_id: true, created_at: true },
    orderBy: { created_at: 'desc' },
    take: 5_000,
  });
  const lastAt = new Map<string, number>();
  for (const r of last) if (!lastAt.has(r.subject_id)) lastAt.set(r.subject_id, new Date(r.created_at).getTime());
  const order = [...profiles].sort((a, b) => (lastAt.get(a.accountName) ?? 0) - (lastAt.get(b.accountName) ?? 0) || a.accountName.localeCompare(b.accountName));
  const take = order.slice(0, Math.max(1, Math.min(opts.accounts ?? DISCOVERY_ACCOUNTS_PER_RUN, 40)));

  for (const p of take) {
    if (clock() - started > (opts.timeBudgetMs ?? DISCOVERY_TIME_BUDGET_MS)) {
      result.skipped.push(p.accountName);
      continue;
    }
    const themes = themesForRun(p, opts.now, opts.queriesPerAccount ?? DISCOVERY_QUERIES_PER_ACCOUNT);
    const queries = themes.map((t) => `"${p.accountName}" (${t}) when:14d`);
    const out: DiscoveryAccountResult = { accountName: p.accountName, queries, items: 0, kept: 0, captured: 0, duplicates: 0, queued: 0 };
    const seen = new Set<string>();
    for (const q of queries) {
      const items = await news(q).catch(() => [] as NewsItem[]);
      out.items += items.length;
      for (const it of items) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        if (opts.now.getTime() - it.publishedAt.getTime() > DISCOVERY_MAX_AGE_MS) continue;
        const headline = cleanHeadline(it.title, it.source);
        if (!headlineNames(headline, p)) continue;
        const cls = classifySignal(headline, p.accountName);
        // The physical-network taxonomy or a risk/leadership story; finance noise and unclassified chatter are dropped.
        if (cls.relevance === 'research_lead' || cls.relevance === 'account_context' || cls.score < 2) continue;
        out.kept += 1;
        const r = await captureSignal(
          prisma,
          { url: it.url, title: headline, publishedAt: it.publishedAt, sourceName: it.source, origin: 'discovery', actor: DISCOVERY_ACTOR, now: opts.now, accountName: p.accountName, resolutionBasis: 'discovery_query' },
          { fetchHtml: null },
        );
        if (!r.ok) continue;
        if (!r.signal.created) {
          out.duplicates += 1;
          continue;
        }
        out.captured += 1;
        if (cls.relevance === 'outreach_evidence_candidate' && cls.score >= DISCOVERY_RESEARCH_SCORE) {
          await prisma.gapSignal.update({ where: { id: r.signal.id }, data: { research_status: 'queued' } });
          out.queued += 1;
        }
      }
      await sleep(400);
    }
    await prisma.gapAuditEvent.create({ data: { kind: DISCOVERY_AUDIT, actor: DISCOVERY_ACTOR, subject_type: 'account', subject_id: p.accountName, payload: JSON.parse(JSON.stringify(out)) } }).catch(() => undefined);
    result.accounts.push(out);
  }
  return result;
}
