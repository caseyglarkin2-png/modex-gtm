/**
 * SIGNAL INTAKE (GAP Signal Intelligence, 2026-09-28).
 *
 * CAPTURE BROADLY. VERIFY NARROWLY. A signal is "this may matter enough that
 * GAP should remember it and investigate it"; it is NEVER a fact. Nothing in
 * this module writes a ProspectingSignal, an EvidenceRecord, a PounceTrigger,
 * a HubSpot note, a Slack ping, a hypothesis or a BID. It writes one GapSignal
 * row (the source document) and nothing else.
 *
 *   captureSignal     a URL (or, for a conference note, text only) with Casey's
 *                     optional account and note. Dedupes on the normalized URL.
 *   resolveAccount    conservative: Casey's explicit account, else the one
 *                     account named in the source title or owning the URL's
 *                     domain. More than one plausible account is AMBIGUOUS
 *                     (Casey picks); none is NEEDS ACCOUNT. Never a guess.
 *   classify          the Pounce keyword taxonomy (deterministic, no LLM) and a
 *                     small relevance class. A label never changes outbound state.
 *
 * Casey's note is operator context, stored verbatim and attributed; it is
 * never blended into source text and never becomes evidence.
 */
import { createHash } from 'node:crypto';
import { scoreTrigger } from '@/lib/pounce/score';
import { isNetworkPrivateHost, isPrivateHost } from './private-hosts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** report_import (intelligence wiring, 2026-10-09): a producer's exported record (signals/intelligence-import.ts), never a share. */
export const SIGNAL_ORIGINS = ['casey_share', 'conference_note', 'discovery', 'pounce_scan', 'report_import'] as const;
export type SignalOrigin = (typeof SIGNAL_ORIGINS)[number];
export const NOTE_MAX = 1_000;
export const HINT_MAX = 200;

// ---------------------------------------------------------------- URL identity

// Only parameters that never identify content (review A: `s`, `cid`, `src`, `source` can be a CMS content key and are kept).
const TRACKING_PARAM = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src|ref_url|cmpid|trk|trkid|sr_share|smid|mbid|ocid|__twitter_impression|amp|outputtype)$/i;

/** The canonical form of a URL for dedupe: https scheme, lowercase host without www, no fragment, no tracking params, no trailing slash. Null when not a public http(s) URL. */
export function normalizeSignalUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^amp\./, '')
    .replace(/^m\./, '');
  if (!host.includes('.') || isNetworkPrivateHost(host)) return null;
  const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAM.test(k)).sort(([a], [b]) => a.localeCompare(b));
  const q = keep.length ? `?${keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}` : '';
  const path = u.pathname.replace(/\/amp\/?$/i, '/').replace(/\/+$/, '') || '';
  return `https://${host}${path}${q}`;
}

export function signalUrlHash(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

// ---------------------------------------------------------------- source class

export function sourceClassOf(host: string): string {
  const h = host.toLowerCase();
  const is = (...d: string[]) => d.some((x) => h === x || h.endsWith(`.${x}`));
  if (is('sec.gov')) return 'sec_filing';
  if (is('prnewswire.com', 'businesswire.com', 'globenewswire.com', 'accesswire.com', 'newswire.ca', 'einpresswire.com')) return 'press_release';
  if (is('linkedin.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'threads.net', 'youtube.com', 'tiktok.com')) return 'social';
  if (is('indeed.com', 'greenhouse.io', 'lever.co', 'myworkdayjobs.com', 'workday.com', 'ziprecruiter.com', 'glassdoor.com', 'icims.com', 'smartrecruiters.com')) return 'job_posting';
  if (is('sam.gov', 'bidnetdirect.com', 'govspend.com', 'demandstar.com', 'periscopeholdings.com') || /\.gov$/.test(h) || /\.us$/.test(h)) return 'procurement';
  return 'news';
}

// ---------------------------------------------------------------- metadata

export interface SignalMeta {
  title: string | null;
  publishedAt: Date | null;
  siteName: string | null;
}

export type FetchHtml = (url: string) => Promise<string>;

/** Bounded fetch of the page head for metadata; never used as evidence. */
export function makeFetchHtml(opts: { lookup?: (host: string) => Promise<string[]> } = {}): FetchHtml {
  return async (start) => {
  // Redirects are followed by hand so every hop is re-checked: a public link must never bounce the server into a private host.
  let url = start;
  for (let hop = 0; hop < 4; hop += 1) {
    let host: string;
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('not http');
      host = u.hostname;
    } catch {
      throw new Error('bad redirect target');
    }
    if (isNetworkPrivateHost(host) || isPrivateHost(host)) throw new Error('private host');
    // Review A P1: a public NAME can resolve to a private address (DNS rebinding, x.127.0.0.1.nip.io).
    if (await resolvesToPrivate(host, opts.lookup)) throw new Error('private host');
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YardFlowSignals/1.0)',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (type && !/html|xml|text\/plain/i.test(type)) throw new Error(`not a page (${type.split(';')[0]})`);
    return readBounded(res, 400_000);
  }
  throw new Error('too many redirects');
  };
}

export const defaultFetchHtml: FetchHtml = makeFetchHtml();

/** Read at most `max` bytes of a body (review A P2: never buffer an unbounded response). */
async function readBounded(res: Response, max: number): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, max);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))).subarray(0, max));
}

/** True when any address the host resolves to is network-private (fail closed on a lookup error). */
export async function resolvesToPrivate(host: string, lookup: (h: string) => Promise<string[]> = defaultLookup): Promise<boolean> {
  if (/^[\d.]+$/.test(host)) return isNetworkPrivateHost(host) || isReservedV4(host);
  let addrs: string[];
  try {
    addrs = await lookup(host);
  } catch {
    return true;
  }
  return addrs.length === 0 || addrs.some((a) => isPrivateAddress(a));
}

async function defaultLookup(host: string): Promise<string[]> {
  const { lookup } = await import('node:dns/promises');
  return (await lookup(host, { all: true })).map((r) => r.address);
}

/**
 * A RESOLVED address (dogfood fix, 2026-09-28): IPv4 private/reserved ranges, and for IPv6 loopback, unspecified,
 * unique-local fc00::/7, link-local fe80::/10, multicast ff00::/8 and IPv4-mapped private. A public IPv6 address is
 * public (Vercel resolves most publishers to IPv6; treating every IPv6 answer as private refused them all).
 */
export function isPrivateAddress(addr: string): boolean {
  const a = addr.trim().toLowerCase();
  if (!a.includes(':')) return isNetworkPrivateHost(a) || isReservedV4(a);
  if (a === '::' || a === '::1') return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
  if (mapped) return isNetworkPrivateHost(mapped[1]) || isReservedV4(mapped[1]);
  const first = parseInt(a.split(':')[0] || '0', 16);
  if (Number.isNaN(first)) return true;
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00;
}

/** CGNAT 100.64/10, benchmarking 198.18/15, multicast and reserved (review A P1). */
function isReservedV4(a: string): boolean {
  const m = /^(\d+)\.(\d+)\./.exec(a);
  if (!m) return false;
  const [x, y] = [Number(m[1]), Number(m[2])];
  return (x === 100 && y >= 64 && y <= 127) || (x === 198 && (y === 18 || y === 19)) || x >= 224;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function metaContent(html: string, keys: string[]): string | null {
  for (const k of keys) {
    const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&')}["'][^>]*>`, 'i');
    const tag = re.exec(html)?.[0];
    const c = tag ? /content=["']([^"']*)["']/i.exec(tag)?.[1] : null;
    if (c && c.trim()) return decode(c);
  }
  return null;
}

export function parseSignalMeta(html: string): SignalMeta {
  const title = metaContent(html, ['og:title', 'twitter:title']) ?? (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ? decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)![1]) : null);
  const rawDate =
    // Review B P2: only an ARTICLE publication date. A generic `date` meta or the first <time> on a page is often
    // a sidebar item or the modified date and could make an old story look fresh.
    metaContent(html, ['article:published_time', 'og:article:published_time', 'datePublished', 'pubdate', 'publish-date', 'parsely-pub-date']) ??
    /"datePublished"\s*:\s*"([^"]+)"/i.exec(html)?.[1] ??
    null;
  const d = rawDate ? new Date(rawDate) : null;
  return {
    title: title ? title.slice(0, 300) : null,
    publishedAt: d && !Number.isNaN(d.getTime()) && d.getTime() < Date.now() + 86_400_000 ? d : null,
    siteName: metaContent(html, ['og:site_name', 'application-name']),
  };
}

// ---------------------------------------------------------------- account resolution

export interface AccountCandidate {
  name: string;
  why: string;
}

export interface Resolution {
  resolution: 'resolved' | 'ambiguous' | 'needs_account';
  accountName: string | null;
  basis: string | null;
  candidates: AccountCandidate[];
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Names that are ordinary words; never matched from free text (only by explicit selection). */
const GENERIC = new Set([
  'target',
  'global',
  'united',
  'american',
  'national',
  'general',
  'first',
  'best',
  'city',
  'star',
  'the',
  'amazon',
  'apple',
  'shell',
  'delta',
  'crown',
  'pilot',
  'gap',
  'dollar',
  'family',
  'essential',
  'core',
  // review A P1: short or everyday single words that name people, places and things in headlines
  'mars',
  'ford',
  'ball',
  'coach',
  'dover',
  'kellogg',
  'sunrise',
  'summit',
  'pioneer',
  'apex',
  'eagle',
  'liberty',
  'victory',
  'premier',
  'prime',
  'harmony',
  'legacy',
  'unity',
  'pacific',
  'atlantic',
  'southern',
  'northern',
  'western',
  'eastern',
  'central',
  'standard',
  'universal',
  'advance',
  'express',
  'direct',
  'select',
  'superior',
  'quality',
  'heritage',
  'frontier',
  'mission',
]);

const CORP_SUFFIX = /\b(inc|incorporated|corp|corporation|co|company|llc|ltd|plc|holdings|group|international|the)\b/g;

export function nameKeys(name: string): string[] {
  const n = norm(name);
  const core = n.replace(CORP_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
  // A single word must be 5+ letters to be read out of a headline; a multi-word name 4+.
  return [...new Set([n, core].filter((k) => !GENERIC.has(k) && (k.includes(' ') ? k.length >= 4 : k.length >= 5)))];
}

// Review A P2: the account universe is read once per process (5 minutes), not per capture.
const universeCache = new WeakMap<object, { at: number; accounts: Array<{ name: string }>; aliases: Array<{ alias: string; normalized_alias: string; account_name: string }> }>();
async function accountUniverse(prisma: PrismaLike) {
  const hit = universeCache.get(prisma);
  if (hit && Date.now() - hit.at < 300_000) return hit;
  const [accounts, aliases] = await Promise.all([
    prisma.account.findMany({ select: { name: true } }),
    prisma.gapAccountAlias.findMany({ select: { alias: true, normalized_alias: true, account_name: true } }),
  ]);
  const v = { at: Date.now(), accounts, aliases };
  if (prisma && typeof prisma === 'object') universeCache.set(prisma, v);
  return v;
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${phrase} `);
}

export interface ResolveInput {
  accountHint?: string | null;
  title?: string | null;
  url?: string | null;
}

/**
 * Conservative account resolution against the existing account universe
 * (Account names, registered aliases, canonical company domains). Explicit
 * selection wins when it names exactly one account. Otherwise exactly one
 * account named in the title or owning the URL's domain resolves; two or more
 * (a parent and a subsidiary, two companies in one story) is ambiguous.
 */
export async function resolveSignalAccount(prisma: PrismaLike, input: ResolveInput): Promise<Resolution> {
  const hint = (input.accountHint ?? '').trim();
  if (hint) {
    const exact: Array<{ name: string }> = await prisma.account.findMany({
      where: { name: { equals: hint, mode: 'insensitive' } },
      select: { name: true },
      take: 3,
    });
    if (exact.length === 1)
      return {
        resolution: 'resolved',
        accountName: exact[0].name,
        basis: 'explicit_account',
        candidates: [],
      };
    const alias: Array<{ account_name: string }> = await prisma.gapAccountAlias.findMany({
      where: { normalized_alias: norm(hint) },
      select: { account_name: true },
      take: 3,
    });
    const viaAlias = [...new Set(alias.map((a) => a.account_name))];
    if (viaAlias.length === 1)
      return {
        resolution: 'resolved',
        accountName: viaAlias[0],
        basis: 'alias',
        candidates: [],
      };
    const like: Array<{ name: string }> = await prisma.account.findMany({
      where: { name: { contains: hint, mode: 'insensitive' } },
      select: { name: true },
      take: 6,
    });
    // Review A P1: a partial hint resolves only as a 5+ letter PREFIX of exactly one name ("Pepsi" -> PepsiCo);
    // anything else ("Dana" -> Danaher) is shown to Casey to confirm, never attached silently.
    if (like.length === 1 && hint.length >= 5 && like[0].name.toLowerCase().startsWith(hint.toLowerCase()))
      return {
        resolution: 'resolved',
        accountName: like[0].name,
        basis: 'hint_prefix',
        candidates: [],
      };
    if (like.length >= 1)
      return {
        resolution: 'ambiguous',
        accountName: null,
        basis: null,
        candidates: like.map((a) => ({
          name: a.name,
          why: `matches "${hint}"`,
        })),
      };
    // A hint that names no known account is kept (account_hint) and shown to Casey; never a guess.
    return {
      resolution: 'needs_account',
      accountName: null,
      basis: null,
      candidates: [],
    };
  }

  const found = new Map<string, string>();
  const title = norm(input.title ?? '');
  if (title) {
    const { accounts, aliases } = await accountUniverse(prisma);
    for (const a of accounts) {
      if (/^(the )?e2e /i.test(a.name)) continue;
      if (nameKeys(a.name).some((k) => containsPhrase(title, k))) found.set(a.name, 'named in the source title');
    }
    for (const al of aliases) {
      const k = norm(al.normalized_alias || al.alias);
      if (!GENERIC.has(k) && (k.includes(' ') ? k.length >= 4 : k.length >= 5) && containsPhrase(title, k) && !found.has(al.account_name)) found.set(al.account_name, `alias "${al.alias}" in the source title`);
    }
  }
  const host = input.url
    ? (() => {
        try {
          return new URL(input.url!).hostname.toLowerCase().replace(/^www\./, '');
        } catch {
          return '';
        }
      })()
    : '';
  if (host) {
    const parts = host.split('.');
    const domains = parts.map((_, i) => parts.slice(i).join('.')).filter((d) => d.includes('.'));
    const links: Array<{ account_name: string }> = await prisma.canonicalAccountLink.findMany({
      where: {
        canonical_company_id: { in: domains.map((d) => `domain:${d}`) },
      },
      select: { account_name: true },
    });
    // A domain shared by several accounts (a parent's domain linked to its brands) says nothing on its own.
    const owners = [...new Set(links.map((l) => l.account_name))];
    if (owners.length === 1 && !found.has(owners[0])) found.set(owners[0], `the source is on ${host}, the company's own domain`);
    // The company's own newsroom (dogfood fix): the page is published on a host named for exactly one
    // named account (pepsico.com and "PepsiCo"): that account is the publisher, whoever else is named.
    const label = host.split('.').slice(-2, -1)[0] ?? '';
    const publisher = [...found.keys()].filter((name) => label.length >= 4 && norm(name).replace(CORP_SUFFIX, ' ').replace(/\s+/g, '') === label);
    if (found.size > 1 && publisher.length === 1) return { resolution: 'resolved', accountName: publisher[0], basis: 'company_newsroom', candidates: [...found.entries()].map(([name, why]) => ({ name, why })) };
  }
  const candidates = [...found.entries()].map(([name, why]) => ({ name, why }));
  if (candidates.length === 1)
    return {
      resolution: 'resolved',
      accountName: candidates[0].name,
      basis: /domain/.test(candidates[0].why) ? 'domain' : /alias/.test(candidates[0].why) ? 'alias' : 'named_in_source',
      candidates,
    };
  if (candidates.length > 1)
    return {
      resolution: 'ambiguous',
      accountName: null,
      basis: null,
      candidates: candidates.slice(0, 8),
    };
  return {
    resolution: 'needs_account',
    accountName: null,
    basis: null,
    candidates: [],
  };
}

// ---------------------------------------------------------------- classification

export const RELEVANCE_CLASSES = ['outreach_evidence_candidate', 'account_context', 'leadership', 'deal_context', 'risk', 'research_lead'] as const;
export type Relevance = (typeof RELEVANCE_CLASSES)[number];

const RISK = /\b(cargo theft|theft|stolen|strike|walkout|lockout|recall|bankrupt\w*|chapter 11|lawsuit|sued|cyber ?attack|ransomware|data breach|fire at|explosion|osha|fine[ds]? for)\b/i;
const OPERATIONAL = new Set(['autonomy', 'yard_direct', 'network_capex', 'digital_ops', 'freight']);

/** Deterministic class from the title (and account name for the scorer). A label NEVER changes outbound state. */
export function classifySignal(title: string, accountName: string | null): { relevance: Relevance; score: number; categories: string[] } {
  const { score, categories } = scoreTrigger(title, accountName ?? '');
  let relevance: Relevance = 'research_lead';
  if (RISK.test(title)) relevance = 'risk';
  else if (categories.includes('leadership') && !categories.some((c) => OPERATIONAL.has(c))) relevance = 'leadership';
  else if (categories.some((c) => OPERATIONAL.has(c)) || categories.includes('cost_restructure')) relevance = 'outreach_evidence_candidate';
  else if (accountName && score >= 0) relevance = 'account_context';
  return { relevance, score, categories };
}

// ---------------------------------------------------------------- capture

export interface CaptureInput {
  url?: string | null;
  note?: string | null;
  accountHint?: string | null;
  origin: SignalOrigin;
  actor: string;
  now: Date;
  /** Discovery producers already know these (a feed item); Casey's share gets them from the page. */
  title?: string | null;
  publishedAt?: Date | null;
  sourceName?: string | null;
  /** A discovery producer resolved the account by construction (its query named the account). */
  accountName?: string | null;
  resolutionBasis?: string | null;
}

export type CaptureRefusal = 'url_or_note_required' | 'bad_url' | 'note_too_long' | 'hint_too_long';

export interface CapturedSignal {
  id: string;
  created: boolean;
}

export async function captureSignal(
  prisma: PrismaLike,
  input: CaptureInput,
  deps: { fetchHtml?: FetchHtml | null } = {},
): Promise<{ ok: true; signal: CapturedSignal } | { ok: false; reason: CaptureRefusal }> {
  const note = (input.note ?? '').trim() || null;
  const hint = (input.accountHint ?? '').trim() || null;
  const rawUrl = (input.url ?? '').trim();
  if (!rawUrl && !note) return { ok: false, reason: 'url_or_note_required' };
  if (note && note.length > NOTE_MAX) return { ok: false, reason: 'note_too_long' };
  if (hint && hint.length > HINT_MAX) return { ok: false, reason: 'hint_too_long' };

  let normalized: string | null = null;
  let hash: string | null = null;
  if (rawUrl) {
    normalized = normalizeSignalUrl(rawUrl);
    if (!normalized) return { ok: false, reason: 'bad_url' };
    hash = signalUrlHash(normalized);
    const existing: {
      id: string;
      note: string | null;
      metadata: Record<string, unknown> | null;
      origin: string;
      resolution: string;
      research_status: string;
    } | null = await prisma.gapSignal.findUnique({
      where: { url_hash: hash },
      select: {
        id: true,
        note: true,
        metadata: true,
        origin: true,
        resolution: true,
        research_status: true,
      },
    });
    if (existing) {
      // The same link again: remember who shared it and what they said; the row stays one source.
      if (input.origin === 'casey_share' || note) {
        const meta = (existing.metadata ?? {}) as Record<string, unknown>;
        const shares = Array.isArray(meta.shares) ? (meta.shares as unknown[]) : [];
        // Review A P2: Casey naming the account on a re-share resolves a row that still needs one.
        const reResolved = hint && existing.resolution !== 'resolved' ? await resolveSignalAccount(prisma, { accountHint: hint }) : null;
        const resolvedNow = reResolved?.resolution === 'resolved' ? reResolved : null;
        await prisma.gapSignal.update({
          where: { id: existing.id },
          data: {
            ...(existing.note ? {} : note ? { note } : {}),
            ...(existing.origin !== 'casey_share' && input.origin === 'casey_share' ? { origin: 'casey_share', submitted_by: input.actor } : {}),
            ...(resolvedNow ? { account_name: resolvedNow.accountName, resolution: 'resolved', resolution_basis: resolvedNow.basis, candidates: undefined } : {}),
            ...(input.origin === 'casey_share' && (existing.resolution === 'resolved' || resolvedNow) && existing.research_status === 'none' ? { research_status: 'queued' } : {}),
            metadata: {
              ...meta,
              shares: [
                ...shares,
                {
                  by: input.actor,
                  at: input.now.toISOString(),
                  note,
                  accountHint: hint,
                },
              ].slice(-20),
            },
          },
        });
      }
      return { ok: true, signal: { id: existing.id, created: false } };
    }
  }

  const host = normalized ? new URL(normalized).hostname : null;
  let meta: SignalMeta = {
    title: input.title ?? null,
    publishedAt: input.publishedAt ?? null,
    siteName: input.sourceName ?? null,
  };
  const fetchHtml = deps.fetchHtml === undefined ? defaultFetchHtml : deps.fetchHtml;
  let metaError: string | null = null;
  if (normalized && fetchHtml && (!meta.title || !meta.publishedAt) && host && !isPrivateHost(host)) {
    try {
      const m = parseSignalMeta(await fetchHtml(rawUrl));
      meta = {
        title: meta.title ?? m.title,
        publishedAt: meta.publishedAt ?? m.publishedAt,
        siteName: meta.siteName ?? m.siteName,
      };
    } catch (e) {
      metaError = (e instanceof Error ? e.message : String(e)).slice(0, 120);
    }
  }

  const res: Resolution = input.accountName
    ? {
        resolution: 'resolved',
        accountName: input.accountName,
        basis: input.resolutionBasis ?? 'discovery_query',
        candidates: [],
      }
    : await resolveSignalAccount(prisma, {
        accountHint: hint,
        title: meta.title,
        url: normalized,
      });
  const cls =
    input.origin === 'conference_note' && !normalized
      ? {
          relevance: 'account_context' as Relevance,
          score: null,
          categories: [] as string[],
        }
      : classifySignal(meta.title ?? '', res.accountName);

  let row: { id: string };
  try {
    row = await prisma.gapSignal.create({
      data: {
        url: normalized ? rawUrl.slice(0, 2_000) : null,
        url_hash: hash,
        title: meta.title,
        source_name: normalized ? (meta.siteName ?? host) : 'conference',
        published_at: meta.publishedAt,
        origin: input.origin,
        source_class: host ? sourceClassOf(host) : 'other',
        note,
        account_hint: hint,
        account_name: res.accountName,
        candidates: res.candidates.length ? res.candidates : undefined,
        resolution: res.resolution,
        resolution_basis: res.basis,
        relevance: cls.relevance,
        // FOLLOW THIS UP: a link Casey shared, once its account is known, goes to research by default.
        research_status: input.origin === 'casey_share' && normalized && res.resolution === 'resolved' ? 'queued' : 'none',
        categories: cls.categories,
        score: cls.score,
        submitted_by: input.actor,
        metadata: {
          normalizedUrl: normalized,
          ...(metaError ? { metaError } : {}),
          ...(input.origin === 'casey_share'
            ? {
                shares: [
                  {
                    by: input.actor,
                    at: input.now.toISOString(),
                    note,
                    accountHint: hint,
                  },
                ],
              }
            : {}),
        },
      },
      select: { id: true },
    });
  } catch (e) {
    // Two captures of the same link at once: the unique url_hash lets one win; the other is that row.
    if (hash && (e as { code?: string })?.code === 'P2002') {
      const winner: { id: string } | null = await prisma.gapSignal.findUnique({
        where: { url_hash: hash },
        select: { id: true },
      });
      if (winner) return { ok: true, signal: { id: winner.id, created: false } };
    }
    throw e;
  }
  // A new source is its own event until clustering says otherwise.
  await prisma.gapSignal.update({
    where: { id: row.id },
    data: { event_id: row.id },
  });
  return { ok: true, signal: { id: row.id, created: true } };
}

// ---------------------------------------------------------------- seller status

export type SignalStatus = 'Captured' | 'Needs you' | 'Researching' | 'Fact ready' | 'Nothing usable' | 'Research failed' | 'Ignored' | 'Context kept';

export interface StatusInput {
  url: string | null;
  resolution: string;
  research_status: string;
  feedback: string | null;
  origin?: string;
  relevance?: string;
}

/** One word for Casey: did GAP do anything with that link? */
export function signalStatus(s: StatusInput): {
  status: SignalStatus;
  detail: string;
} {
  if (s.feedback && s.feedback !== 'use' && s.feedback !== 'good_context')
    return {
      status: 'Ignored',
      detail: `You marked it ${s.feedback.replace(/_/g, ' ')}.`,
    };
  if (s.resolution === 'rejected') return { status: 'Ignored', detail: 'Rejected.' };
  if (s.resolution === 'needs_account') return { status: 'Needs you', detail: 'Which account is this about?' };
  if (s.resolution === 'ambiguous')
    return {
      status: 'Needs you',
      detail: 'More than one account fits. Pick the right one.',
    };
  if (!s.url)
    return {
      status: 'Context kept',
      detail: 'Kept as your context. Not public evidence.',
    };
  switch (s.research_status) {
    case 'queued':
    case 'researching':
      return { status: 'Researching', detail: 'Queued for evidence research.' };
    case 'fact_found':
      return {
        status: 'Fact ready',
        detail: 'A verified fact is in Research for your judgment.',
      };
    case 'contradiction':
      return {
        status: 'Needs you',
        detail: 'Sources disagree. Decide which side you believe in Research.',
      };
    case 'research_failed':
      // Batch item 10 (R25): the dead letter: research could not run, which says nothing about the story.
      return {
        status: 'Research failed',
        detail: 'Research failed three times (the provider did not answer, or the run did not finish). This is not "nothing usable": press Research to try again.',
      };
    case 'no_usable_fact':
      return {
        status: 'Nothing usable',
        detail: 'Researched: no fact GAP could verify at the source.',
      };
    default:
      // Final review P1: say what GAP will actually do. A discovered story that is not a candidate for a sayable
      // fact (risk, leadership, context) is kept as context and is not researched unless Casey asks.
      if (s.origin === 'discovery' && s.relevance && s.relevance !== 'outreach_evidence_candidate') return { status: 'Context kept', detail: 'Kept as account context. Press Research if you want GAP to verify it.' };
      return { status: 'Captured', detail: 'Account known. Waiting for research.' };
  }
}
