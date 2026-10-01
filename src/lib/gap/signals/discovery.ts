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
import { fetchAccountNewsDetailed, type NewsItem } from '@/lib/pounce/news';
import { captureSignal, classifySignal, norm } from './intake';
import { loadWatchProfiles, type WatchProfile } from './watch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DISCOVERY_AUDIT = 'signal.discovery' as const;
export const DISCOVERY_ACTOR = 'gap-signal-discovery';
export const DISCOVERY_ACCOUNTS_PER_RUN = 10;
export const DISCOVERY_QUERIES_PER_ACCOUNT = 2;
/**
 * Stories older than this are not FRESH triggers: still captured (age is metadata, labelled NOT A FRESH TRIGGER on
 * the source card), never queued for research on their own.
 */
export const DISCOVERY_MAX_AGE_MS = 21 * 86_400_000;
/**
 * Research aperture: the ONLY headlines discovery drops as spam are machine-generated market chatter (fund holdings
 * filings, price targets, analyst rating changes). A content type, never a judgment of whether a story matters.
 */
export const MARKET_CHATTER = new RegExp(
  [
    // Fund holdings filings: "Stake Raised by XYZ Capital", "Position Increased by ABC", "Shares Sold by ...".
    String.raw`\b(?:stake|position|holdings?|shares?)\b[^.]{0,40}\b(?:raised|lowered|increased|decreased|trimmed|cut|boosted|sold|bought|purchased|acquired|reduced)\s+by\b`,
    // An exchange ticker in brackets is the market-wire shape: "PepsiCo (NASDAQ:PEP) ...".
    String.raw`\((?:NYSE|NASDAQ|NasdaqGS|NasdaqGM|TSX|LON|AMEX|NYSEARCA)\s*:\s*[A-Z.]+\)`,
    String.raw`\bprice target\b`,
    String.raw`\b(?:upgraded|downgraded|reiterated)\b[^.]{0,30}\b(?:to|at|by)\b`,
    String.raw`\b(?:buy|sell|hold|outperform|underperform|overweight|underweight) rating\b`,
    String.raw`\bshort interest\b`,
    String.raw`\boptions? (?:activity|trading)\b`,
    String.raw`\bdividend (?:of|declared)\b`,
  ].join('|'),
  'i',
);

/**
 * Research aperture: a headline that names the account but does not open with it ("Gatik expands driverless runs
 * for PepsiCo") is third-party account intelligence: captured as a MENTION, shown with that label, never queued.
 */
export function headlineMentions(headline: string, profile: Pick<WatchProfile, 'accountName'>): boolean {
  const h = ` ${norm(headline)} `;
  return discoveryKeys(profile.accountName).some((k) => k.length >= 4 && h.includes(` ${k} `));
}
/** A discovered story this strong goes to research on its own (Casey-shared ones always do). */
// Name in the headline (+2) plus one operational category (4): every discovered outreach candidate is followed up.
export const DISCOVERY_RESEARCH_SCORE = 6;
export const DISCOVERY_TIME_BUDGET_MS = 200_000;


/** "Headline - Publisher" (the Google News title shape) to the headline. */
export function cleanHeadline(title: string, source: string): string {
  const t = title.trim();
  const suffix = ` - ${source.trim()}`;
  return source && t.endsWith(suffix) ? t.slice(0, -suffix.length).trim() : t.replace(/\s+-\s+[^-]{2,60}$/, '').trim();
}

/** Words that make the named account a bystander, not the subject ("Walmart supplier Acme opens..."). */
const RELATIONAL = new Set(['supplier', 'suppliers', 'vendor', 'vendors', 'partner', 'partners', 'customer', 'customers', 'rival', 'rivals', 'competitor', 'competitors', 'former', 'ex', 'spinoff', 'spin', 'owned', 'backed', 'veteran', 'alum', 'alumni', 'exec', 'executive', 'bottler', 'bottlers', 'distributor', 'distributors', 'franchisee', 'franchisees', 'dealer', 'dealers', 'licensee']);

/**
 * Is the headline ABOUT the account (review C P1: a mention is not the subject)? It must OPEN with the account's
 * name or one of its aliases (one definition of a name key: intake.ts nameKeys, which drops generic and short
 * single words), optionally possessive, and the next word must not make it a bystander ("supplier", "rival").
 */
export function headlineNames(headline: string, profile: Pick<WatchProfile, 'accountName' | 'aliases'>): boolean {
  return headlineMatch(headline, profile) !== null;
}

const SUFFIX = /\b(inc|incorporated|corp|corporation|co|company|llc|ltd|plc|holdings|group|the)\b/g;
/**
 * Discovery's name keys (review D P1): the query already quoted the name and the headline must OPEN with it, so
 * short and everyday names (Ford, UNFI, Target) are allowed here; the account's leading word also counts when it
 * is distinctive (5+ letters, not an everyday word): "Hormel to close" for Hormel Foods.
 */
function discoveryKeys(name: string): string[] {
  // The FULL name only (final review P1: a leading word alone, "Hyundai", "Toyota", "WestRock", "Georgia",
  // named other companies and places). A short form Casey uses is added as his alias.
  const n = norm(name).replace(SUFFIX, ' ').replace(/\s+/g, ' ').trim();
  return n.length >= 2 ? [n] : [];
}

/** Which key the headline opens with (and whether it was an alias), or null when the account is not the subject. */
export function headlineMatch(headline: string, profile: Pick<WatchProfile, 'accountName' | 'aliases'>): { key: string; viaAlias: boolean } | null {
  const h = norm(headline).replace(/^the /, '');
  const candidates = [...discoveryKeys(profile.accountName).map((key) => ({ key, viaAlias: false })), ...profile.aliases.flatMap((a) => discoveryKeys(a).map((key) => ({ key, viaAlias: true })))];
  for (const c of candidates.sort((a, b) => b.key.length - a.key.length)) {
    if (!(h === c.key || h.startsWith(`${c.key} `))) continue;
    const rest = h.slice(c.key.length).trim().split(' ');
    const next = rest[0] === 's' ? rest[1] : rest[0];
    if (RELATIONAL.has(next ?? '')) return null;
    return c;
  }
  return null;
}

/**
 * Which themes this ask covers: the next `count` of the profile's themes after the ones already asked (review C
 * P2: rotating by ask, not by day, so two asks in a day never repeat a question and every theme comes round).
 */
export function themesForRun(profile: Pick<WatchProfile, 'themes'>, asksSoFar: number, count = DISCOVERY_QUERIES_PER_ACCOUNT): string[] {
  const n = profile.themes.length;
  if (!n) return [];
  return Array.from({ length: Math.min(count, n) }, (_, i) => profile.themes[(asksSoFar * count + i) % n]);
}

export interface DiscoveryAccountResult {
  accountName: string;
  queries: string[];
  items: number;
  kept: number;
  captured: number;
  /** Machine-generated market chatter dropped as spam (MARKET_CHATTER). */
  spam?: number;
  /** Headlines that name the account without opening with it: captured as third-party mentions, never queued. */
  mentions?: number;
  duplicates: number;
  queued: number;
  /** Fetch failures (a 429 or a timeout is reported, never an empty "nothing happened"). */
  errors: string[];
  /** Headlines about another account than the one asked (left for that account's own ask). */
  otherAccount: number;
}

export interface DiscoveryResult {
  universe: number;
  accounts: DiscoveryAccountResult[];
  skipped: string[];
}

const otherAccountCache = new Map<string, boolean>();
async function accountNamed(prisma: PrismaLike, key: string, self: string): Promise<boolean> {
  const k = `${key}|${self}`;
  if (otherAccountCache.has(k)) return otherAccountCache.get(k)!;
  const rows: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { equals: key, mode: 'insensitive' } }, select: { name: true }, take: 3 }).catch(() => []);
  const hit = rows.some((r) => r.name.toLowerCase() !== self.toLowerCase());
  otherAccountCache.set(k, hit);
  return hit;
}

export async function runDiscovery(
  prisma: PrismaLike,
  opts: { now: Date; accounts?: number; queriesPerAccount?: number; timeBudgetMs?: number; clock?: () => number },
  deps: { news?: (query: string) => Promise<{ items: NewsItem[]; error: string | null }>; profiles?: () => Promise<WatchProfile[]>; sleep?: (ms: number) => Promise<void> } = {},
): Promise<DiscoveryResult> {
  const clock = opts.clock ?? Date.now;
  const started = clock();
  const news = deps.news ?? fetchAccountNewsDetailed;
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
  const asks = new Map<string, number>();
  for (const r of last) {
    if (!lastAt.has(r.subject_id)) lastAt.set(r.subject_id, new Date(r.created_at).getTime());
    asks.set(r.subject_id, (asks.get(r.subject_id) ?? 0) + 1);
  }
  const order = [...profiles].sort((a, b) => (lastAt.get(a.accountName) ?? 0) - (lastAt.get(b.accountName) ?? 0) || a.accountName.localeCompare(b.accountName));
  const take = order.slice(0, Math.max(1, Math.min(opts.accounts ?? DISCOVERY_ACCOUNTS_PER_RUN, 40)));

  for (const p of take) {
    if (clock() - started > (opts.timeBudgetMs ?? DISCOVERY_TIME_BUDGET_MS)) {
      result.skipped.push(p.accountName);
      continue;
    }
    const themes = themesForRun(p, asks.get(p.accountName) ?? 0, opts.queriesPerAccount ?? DISCOVERY_QUERIES_PER_ACCOUNT);
    const queries = themes.map((t) => `"${p.accountName}" (${t}) when:14d`);
    const out: DiscoveryAccountResult = { accountName: p.accountName, queries, items: 0, kept: 0, captured: 0, spam: 0, duplicates: 0, queued: 0, errors: [], otherAccount: 0 };
    const seen = new Set<string>();
    for (const q of queries) {
      const got = await news(q).catch((e: unknown) => ({ items: [] as NewsItem[], error: e instanceof Error ? e.message : String(e) }));
      if (got.error) out.errors.push(got.error);
      const items = got.items;
      out.items += items.length;
      for (const it of items) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        const fresh = opts.now.getTime() - it.publishedAt.getTime() <= DISCOVERY_MAX_AGE_MS;
        const headline = cleanHeadline(it.title, it.source);
        const match = headlineMatch(headline, p);
        const mention = !match && headlineMentions(headline, p);
        if (!match && !mention) continue;
        // An alias that is itself ANOTHER account's name (a parent, a sister brand) is that account's story,
        // left for its own ask (review C P1). Casey's own aliases for the account are trusted.
        if (match?.viaAlias && (await accountNamed(prisma, match.key, p.accountName))) {
          out.otherAccount += 1;
          continue;
        }
        if (MARKET_CHATTER.test(headline)) {
          out.spam = (out.spam ?? 0) + 1;
          continue;
        }
        // Research aperture: a headline that names the account is a source Casey sees, whatever the classifier
        // makes of it. The classification only decides whether research is queued on its own.
        const cls = classifySignal(headline, p.accountName);
        out.kept += 1;
        if (mention) out.mentions = (out.mentions ?? 0) + 1;
        const r = await captureSignal(
          prisma,
          { url: it.url, title: headline, publishedAt: it.publishedAt, sourceName: it.source, origin: 'discovery', actor: DISCOVERY_ACTOR, now: opts.now, accountName: p.accountName, resolutionBasis: mention ? 'discovery_mention' : 'discovery_query' },
          { fetchHtml: null },
        );
        if (!r.ok) continue;
        if (!r.signal.created) {
          out.duplicates += 1;
          continue;
        }
        out.captured += 1;
        if (!mention && fresh && cls.relevance === 'outreach_evidence_candidate' && cls.score >= DISCOVERY_RESEARCH_SCORE) {
          await prisma.gapSignal.update({ where: { id: r.signal.id }, data: { research_status: 'queued' } });
          out.queued += 1;
        }
      }
      await sleep(400);
    }
    // A turn in which every question failed is not a turn: no rotation row, so the account is asked again next run.
    if (out.errors.length < queries.length) {
      await prisma.gapAuditEvent.create({ data: { kind: DISCOVERY_AUDIT, actor: DISCOVERY_ACTOR, subject_type: 'account', subject_id: p.accountName, payload: JSON.parse(JSON.stringify(out)) } }).catch(() => undefined);
    }
    result.accounts.push(out);
  }
  return result;
}
