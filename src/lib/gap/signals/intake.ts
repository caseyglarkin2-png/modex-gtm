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

export const SIGNAL_ORIGINS = ['casey_share', 'conference_note', 'discovery', 'pounce_scan'] as const;
export type SignalOrigin = (typeof SIGNAL_ORIGINS)[number];
export const NOTE_MAX = 1_000;
export const HINT_MAX = 200;

// ---------------------------------------------------------------- URL identity

const TRACKING_PARAM = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref|ref_src|ref_url|cmpid|cmp|src|source|trk|trkid|sr_share|smid|mbid|ocid|__twitter_impression|s|share|cid)$/i;

/** The canonical form of a URL for dedupe: https scheme, lowercase host without www, no fragment, no tracking params, no trailing slash. Null when not a public http(s) URL. */
export function normalizeSignalUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^amp\./, '').replace(/^m\./, '');
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
export const defaultFetchHtml: FetchHtml = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YardFlowSignals/1.0)' }, redirect: 'follow', signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const text = await res.text();
  return text.slice(0, 400_000);
};

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
    metaContent(html, ['article:published_time', 'og:article:published_time', 'datePublished', 'pubdate', 'publish-date', 'date', 'dc.date', 'parsely-pub-date']) ??
    /"datePublished"\s*:\s*"([^"]+)"/i.exec(html)?.[1] ??
    /<time[^>]+datetime=["']([^"']+)["']/i.exec(html)?.[1] ??
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

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Names that are ordinary words; never matched from free text (only by explicit selection). */
const GENERIC = new Set(['target', 'global', 'united', 'american', 'national', 'general', 'first', 'best', 'city', 'star', 'the', 'amazon', 'apple', 'shell', 'delta', 'crown', 'pilot', 'gap', 'dollar', 'family', 'essential', 'core']);

const CORP_SUFFIX = /\b(inc|incorporated|corp|corporation|co|company|llc|ltd|plc|holdings|group|international|the)\b/g;

function nameKeys(name: string): string[] {
  const n = norm(name);
  const core = n.replace(CORP_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
  return [...new Set([n, core].filter((k) => k.length >= 4 && !GENERIC.has(k)))];
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
    const exact: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { equals: hint, mode: 'insensitive' } }, select: { name: true }, take: 3 });
    if (exact.length === 1) return { resolution: 'resolved', accountName: exact[0].name, basis: 'explicit_account', candidates: [] };
    const alias: Array<{ account_name: string }> = await prisma.gapAccountAlias.findMany({ where: { normalized_alias: norm(hint) }, select: { account_name: true }, take: 3 });
    const viaAlias = [...new Set(alias.map((a) => a.account_name))];
    if (viaAlias.length === 1) return { resolution: 'resolved', accountName: viaAlias[0], basis: 'alias', candidates: [] };
    const like: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { contains: hint, mode: 'insensitive' } }, select: { name: true }, take: 6 });
    if (like.length === 1) return { resolution: 'resolved', accountName: like[0].name, basis: 'explicit_account', candidates: [] };
    if (like.length > 1) return { resolution: 'ambiguous', accountName: null, basis: null, candidates: like.map((a) => ({ name: a.name, why: `matches "${hint}"` })) };
    // A hint that names no known account is kept (account_hint) and shown to Casey; never a guess.
    return { resolution: 'needs_account', accountName: null, basis: null, candidates: [] };
  }

  const found = new Map<string, string>();
  const title = norm(input.title ?? '');
  if (title) {
    const accounts: Array<{ name: string; parent_brand: string | null }> = await prisma.account.findMany({ select: { name: true, parent_brand: true } });
    for (const a of accounts) {
      if (/^(the )?e2e /i.test(a.name)) continue;
      if (nameKeys(a.name).some((k) => containsPhrase(title, k))) found.set(a.name, 'named in the source title');
    }
    const aliases: Array<{ alias: string; normalized_alias: string; account_name: string }> = await prisma.gapAccountAlias.findMany({ select: { alias: true, normalized_alias: true, account_name: true } });
    for (const al of aliases) {
      const k = norm(al.normalized_alias || al.alias);
      if (k.length >= 4 && !GENERIC.has(k) && containsPhrase(title, k) && !found.has(al.account_name)) found.set(al.account_name, `alias "${al.alias}" in the source title`);
    }
  }
  const host = input.url ? (() => { try { return new URL(input.url!).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } })() : '';
  if (host) {
    const parts = host.split('.');
    const domains = parts.map((_, i) => parts.slice(i).join('.')).filter((d) => d.includes('.'));
    const links: Array<{ account_name: string }> = await prisma.canonicalAccountLink.findMany({ where: { canonical_company_id: { in: domains.map((d) => `domain:${d}`) } }, select: { account_name: true } });
    for (const l of links) if (!found.has(l.account_name)) found.set(l.account_name, `the source is on ${host}, the company's own domain`);
  }
  const candidates = [...found.entries()].map(([name, why]) => ({ name, why }));
  if (candidates.length === 1) return { resolution: 'resolved', accountName: candidates[0].name, basis: /domain/.test(candidates[0].why) ? 'domain' : /alias/.test(candidates[0].why) ? 'alias' : 'named_in_source', candidates };
  if (candidates.length > 1) return { resolution: 'ambiguous', accountName: null, basis: null, candidates: candidates.slice(0, 8) };
  return { resolution: 'needs_account', accountName: null, basis: null, candidates: [] };
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
    const existing: { id: string; note: string | null; metadata: Record<string, unknown> | null; origin: string; resolution: string; research_status: string } | null = await prisma.gapSignal.findUnique({
      where: { url_hash: hash },
      select: { id: true, note: true, metadata: true, origin: true, resolution: true, research_status: true },
    });
    if (existing) {
      // The same link again: remember who shared it and what they said; the row stays one source.
      if (input.origin === 'casey_share' || note) {
        const meta = (existing.metadata ?? {}) as Record<string, unknown>;
        const shares = Array.isArray(meta.shares) ? (meta.shares as unknown[]) : [];
        await prisma.gapSignal.update({
          where: { id: existing.id },
          data: {
            ...(existing.note ? {} : note ? { note } : {}),
            ...(existing.origin !== 'casey_share' && input.origin === 'casey_share' ? { origin: 'casey_share', submitted_by: input.actor } : {}),
            ...(input.origin === 'casey_share' && existing.resolution === 'resolved' && existing.research_status === 'none' ? { research_status: 'queued' } : {}),
            metadata: { ...meta, shares: [...shares, { by: input.actor, at: input.now.toISOString(), note, accountHint: hint }].slice(-20) },
          },
        });
      }
      return { ok: true, signal: { id: existing.id, created: false } };
    }
  }

  const host = normalized ? new URL(normalized).hostname : null;
  let meta: SignalMeta = { title: input.title ?? null, publishedAt: input.publishedAt ?? null, siteName: input.sourceName ?? null };
  const fetchHtml = deps.fetchHtml === undefined ? defaultFetchHtml : deps.fetchHtml;
  let metaError: string | null = null;
  if (normalized && fetchHtml && (!meta.title || !meta.publishedAt) && host && !isPrivateHost(host)) {
    try {
      const m = parseSignalMeta(await fetchHtml(rawUrl));
      meta = { title: meta.title ?? m.title, publishedAt: meta.publishedAt ?? m.publishedAt, siteName: meta.siteName ?? m.siteName };
    } catch (e) {
      metaError = (e instanceof Error ? e.message : String(e)).slice(0, 120);
    }
  }

  const res: Resolution = input.accountName
    ? { resolution: 'resolved', accountName: input.accountName, basis: input.resolutionBasis ?? 'discovery_query', candidates: [] }
    : await resolveSignalAccount(prisma, { accountHint: hint, title: meta.title, url: normalized });
  const cls = input.origin === 'conference_note' && !normalized ? { relevance: 'account_context' as Relevance, score: null, categories: [] as string[] } : classifySignal(meta.title ?? '', res.accountName);

  const row: { id: string } = await prisma.gapSignal.create({
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
      metadata: { normalizedUrl: normalized, ...(metaError ? { metaError } : {}), ...(input.origin === 'casey_share' ? { shares: [{ by: input.actor, at: input.now.toISOString(), note, accountHint: hint }] } : {}) },
    },
    select: { id: true },
  });
  // A new source is its own event until clustering says otherwise.
  await prisma.gapSignal.update({ where: { id: row.id }, data: { event_id: row.id } });
  return { ok: true, signal: { id: row.id, created: true } };
}

// ---------------------------------------------------------------- seller status

export type SignalStatus = 'Captured' | 'Needs you' | 'Researching' | 'Fact ready' | 'Nothing usable' | 'Ignored' | 'Context kept';

export interface StatusInput {
  url: string | null;
  resolution: string;
  research_status: string;
  feedback: string | null;
}

/** One word for Casey: did GAP do anything with that link? */
export function signalStatus(s: StatusInput): { status: SignalStatus; detail: string } {
  if (s.feedback && s.feedback !== 'use' && s.feedback !== 'good_context') return { status: 'Ignored', detail: `You marked it ${s.feedback.replace(/_/g, ' ')}.` };
  if (s.resolution === 'rejected') return { status: 'Ignored', detail: 'Rejected.' };
  if (s.resolution === 'needs_account') return { status: 'Needs you', detail: 'Which account is this about?' };
  if (s.resolution === 'ambiguous') return { status: 'Needs you', detail: 'More than one account fits. Pick the right one.' };
  if (!s.url) return { status: 'Context kept', detail: 'Kept as your context. Not public evidence.' };
  switch (s.research_status) {
    case 'queued':
    case 'researching':
      return { status: 'Researching', detail: 'Queued for evidence research.' };
    case 'fact_found':
      return { status: 'Fact ready', detail: 'A verified fact is in Research for your judgment.' };
    case 'contradiction':
      return { status: 'Needs you', detail: 'Sources disagree. Decide which side you believe in Research.' };
    case 'no_usable_fact':
      return { status: 'Nothing usable', detail: 'Researched: no fact GAP could verify at the source.' };
    default:
      return { status: 'Captured', detail: 'Account known. Waiting for research.' };
  }
}
