/**
 * RESEARCH APERTURE (2026-10-01): every source GAP found about an account, in one place.
 *
 * Research maximizes RECALL; execution maximizes PRECISION. Two separate things:
 *
 *   SOURCE / SIGNAL            something GAP found (a story, a page, a filing, a link Casey shared)
 *   VERIFIED OUTREACH EVIDENCE a fact Casey may state to a buyer (the strict verifyCandidate contract)
 *
 * A source that fails the outreach contract stays visible with its provenance and the FACTUAL reason it is not
 * outreach evidence. Nothing here scores, ranks away, or hides a source on a bot's judgment of worth. Only objective
 * garbage is dropped (search redirects, malformed links, pages proven not to name the account), and counted.
 * Casey's own Ignore / Wrong account moves a source out of the default view (counted, never deleted).
 *
 * Read-only: it never creates a hypothesis, links evidence, approves or activates anything.
 */
import { normalizeSignalUrl } from '../signals/intake';
import { liveFactFailure, speakerOrg, textNamesAccount, type SourceRecord } from '../research/run';
import { normalizeCompany } from '../research/providers';
import { classifyContinuity } from '../research/continuity';
import { DROP_REASONS, SEARCH_REDIRECT, sourceReason, type AccountSource, type SourceStatus, type WhyFound } from './source-copy';

export { ageLabel, sourceReason, STATUS_LABEL } from './source-copy';
export type { AccountSource, SourceStatus, WhyFound } from './source-copy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;


export interface AccountSources {
  accountName: string;
  items: AccountSource[];
  /** Sources shown. */
  sourcesFound: number;
  /** Live verified outreach facts (one per quote, the same re-gate the account brief applies). */
  verifiedFacts: number;
  /** Objective garbage dropped (search redirects, malformed links, pages proven not to name the account). */
  dropped: number;
  /** Casey ignored or reassigned: out of the default view, never deleted. */
  setAside: number;
  setAsideItems: AccountSource[];
  /** The read limits were hit: older research runs, signals or facts were not loaded (said on the page). */
  partial?: boolean;
}

const DAY = 86_400_000;
/** The research inbox window: a source older than this is context, not a fresh trigger. */
export const FRESH_TRIGGER_DAYS = 45;
const SET_ASIDE = new Set(['ignored', 'irrelevant', 'wrong_account']);


function statusOf(raw: string | null): SourceStatus {
  if (raw && (raw.startsWith('source_unreadable') || raw === 'not_read_budget')) return 'COULD_NOT_VERIFY';
  return 'NOT_VERIFIED_FOR_OUTREACH';
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const CATEGORIES: Array<[WhyFound, RegExp]> = [
  ['facility', /\b(facilit|plant|warehouse|distribution cent|\bdc\b|fulfil+ment cent|cold storage|cross-?dock|terminal|hub|depot|site|campus|groundbreaking|expansion|opens?|clos(e|es|ing|ure))/i],
  ['network', /\b(network|footprint|consolidat|realign|reconfigur|supply chain|logistics)/i],
  ['automation', /\b(automat|robot|autonomous|driverless|self-driving|agv|amr|asrs)/i],
  ['transportation', /\b(truck|fleet|freight|carrier|trailer|shipping|transport|rail|intermodal|drayage|tractor|ev )/i],
  ['3PL/vendor', /\b(3pl|third-party logistics|contract logistics|outsourc|partner(ship)?|vendor|supplier|selects?|awarded)/i],
  ['M&A', /\b(acqui|merger|merges?|divest|buyout|takeover|spin-?off|sells? (its|the) )/i],
  ['CapEx', /\b(invest|capex|capital|\$\s?\d|million|billion)/i],
  ['labor', /\b(union|strike|labor|labour|layoff|workforce|employees|jobs|workers|warn notice)/i],
  ['hiring', /\b(hiring|job posting|careers|recruit|now hiring|position)/i],
  ['leadership', /\b(ceo|cfo|coo|chief|president|appoint|names|named|hires?|executive|vp |vice president|steps down|retire)/i],
  ['security/risk', /\b(cyber|breach|ransomware|theft|recall|fire|explosion|lawsuit|osha|fine|violation|security|outage|disruption)/i],
  ['technology', /\b(software|platform|system|wms|tms|yms|erp|ai\b|digital|technology|deploys?)/i],
  ['customer/vendor story', /\b(case study|customer story|with [A-Z]|for [A-Z])/],
];

export function whyFound(text: string, categories: readonly string[] = []): WhyFound[] {
  const out = new Set<WhyFound>();
  for (const [k, re] of CATEGORIES) if (re.test(text)) out.add(k);
  for (const c of categories) {
    const u = c.toUpperCase();
    if (/AUTONOM|AUTOMAT|ROBOT/.test(u)) out.add('automation');
    if (/FACILIT|EXPANSION|CLOSURE|DC|PLANT/.test(u)) out.add('facility');
    if (/M_?AND_?A|ACQUI|MERGER/.test(u)) out.add('M&A');
    if (/LEADER|EXEC/.test(u)) out.add('leadership');
    if (/LABOR|UNION/.test(u)) out.add('labor');
    if (/FLEET|TRANSPORT|CARRIER/.test(u)) out.add('transportation');
  }
  return out.size ? [...out].slice(0, 4) : ['other'];
}

const RANK: Record<SourceStatus, number> = { VERIFIED_FOR_OUTREACH: 3, NOT_VERIFIED_FOR_OUTREACH: 2, COULD_NOT_VERIFY: 1 };
/** A pending reason ("not checked yet", "being checked") says less than any checked reason. */
const weak = (s: AccountSource) => s.status === 'NOT_VERIFIED_FOR_OUTREACH' && (s.reason === 'not checked yet' || s.reason === 'being checked now');
const rank = (s: AccountSource) => (weak(s) ? 0.5 : RANK[s.status]);
const mergeWhy = (a: WhyFound[], b: WhyFound[]): WhyFound[] => {
  const m = [...new Set([...a, ...b])].filter((w) => w !== 'other').slice(0, 4);
  return m.length ? m : ['other'];
};

export async function loadAccountSources(prisma: PrismaLike, accountName: string, opts: { now: Date; runs?: number } = { now: new Date() }): Promise<AccountSources> {
  const now = opts.now;
  const key = normalizeCompany(accountName);
  // A failed read THROWS (the page says the sources could not be read): an empty read must never print as
  // "0 sources found · 0 outreach facts verified".
  const [runs, signals, factRows]: [Row[], Row[], Row[]] = await Promise.all([
    prisma.researchRun.findMany({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, take: opts.runs ?? 25, select: { id: true, created_at: true, provider_status: true } }),
    // This account's signals, and the ones Casey moved away from it (Wrong account / reassigned): those stay set aside.
    prisma.gapSignal.findMany({
      where: { OR: [{ account_name: accountName }, { metadata: { path: ['reassignedFrom'], equals: accountName } }] },
      orderBy: { created_at: 'desc' },
      take: 300,
      select: { id: true, url: true, title: true, source_name: true, published_at: true, created_at: true, origin: true, source_class: true, research_status: true, categories: true, feedback: true, account_name: true, resolution_basis: true },
    }),
    prisma.prospectingSignal.findMany({ where: { account_name: accountName, source_kind: 'evidence_record' }, orderBy: { observed_at: 'desc' }, take: 200, select: { id: true, title: true, evidence_text: true, evidence_url: true, observed_at: true, freshness_expires_at: true, updated_at: true, metadata: true } }),
  ]);

  let dropped = 0;
  const byKey = new Map<string, AccountSource>();
  const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
  const make = (url: string, over: Partial<AccountSource> & { discoveredAt: string; origin: AccountSource['origin']; status: SourceStatus }): AccountSource | null => {
    const k = normalizeSignalUrl(url);
    // A search redirect is dropped, EXCEPT under a stored fact: a fact the brief counts is never hidden.
    const redirect = SEARCH_REDIRECT.test(url);
    if (!k || (redirect && !over.factId)) {
      dropped += 1;
      return null;
    }
    const publishedAt = over.publishedAt ?? null;
    const ageDays = publishedAt ? Math.max(0, Math.floor((now.getTime() - new Date(publishedAt).getTime()) / DAY)) : null;
    const text = `${over.title ?? ''} ${over.excerpt ?? ''}`;
    return {
      key: k,
      link: url,
      publisher: redirect ? 'search redirect' : host(url),
      ageDays,
      freshTrigger: ageDays !== null && ageDays <= FRESH_TRIGGER_DAYS,
      excerpt: null,
      excerptKind: null,
      attribution: null,
      whyFound: whyFound(text),
      signalId: null,
      factId: null,
      reviewed: false,
      reason: null,
      ...over,
      // A page title that is only the URL says nothing.
      title: over.title && over.title !== url ? over.title : null,
      publishedAt,
    };
  };
  const add = (s: AccountSource | null) => {
    if (!s) return;
    const cur = byKey.get(s.key);
    if (!cur) return void byKey.set(s.key, s);
    const win = rank(s) > rank(cur) ? s : cur;
    const lose = win === s ? cur : s;
    // Two different statements from one page stay two statements, each with its own status and speaker.
    const also = [...(win.alsoOnPage ?? []), ...(lose.alsoOnPage ?? [])];
    // Only the page's own words: a search summary is never listed as a statement on the page.
    if (lose.excerpt && win.excerpt && lose.excerptKind === 'verbatim' && lose.excerpt !== win.excerpt && !also.some((a) => a.excerpt === lose.excerpt)) {
      also.push({ excerpt: lose.excerpt, status: lose.status, reason: lose.reason, attribution: lose.attribution });
    }
    byKey.set(s.key, {
      ...win,
      // The story's own headline (from the signal row) reads better than a fact row's page title.
      title: (lose.signalId && !win.signalId && lose.title) || win.title || lose.title,
      publishedAt: win.publishedAt ?? lose.publishedAt,
      ageDays: win.ageDays ?? lose.ageDays,
      freshTrigger: win.publishedAt ? win.freshTrigger : lose.freshTrigger,
      excerpt: win.excerpt ?? lose.excerpt,
      excerptKind: win.excerpt ? win.excerptKind : lose.excerptKind,
      // The speaker belongs to the excerpt shown, never borrowed from another statement on the page.
      attribution: win.excerpt ? win.attribution : lose.attribution,
      alsoOnPage: also.length ? also.slice(0, 4) : undefined,
      // The earliest time GAP saw it; Casey's share outranks GAP's own discovery.
      discoveredAt: win.discoveredAt < lose.discoveredAt ? win.discoveredAt : lose.discoveredAt,
      origin: [win.origin, lose.origin].includes('casey_shared') ? 'casey_shared' : win.origin,
      signalId: win.signalId ?? lose.signalId,
      factId: win.factId ?? lose.factId,
      reviewed: win.reviewed || lose.reviewed,
      whyFound: mergeWhy(win.whyFound, lose.whyFound),
    });
  };

  // 1. Live verified facts (the same re-gate as the account brief). A stored fact that no longer passes stays visible.
  const liveQuotes = new Set<string>();
  const verifiedKeys = new Set<string>();
  for (const r of factRows) {
    const meta = (r.metadata ?? {}) as Row;
    if (!r.evidence_text || !r.evidence_url) continue;
    // A stored fact whose source failed a later recheck is still a source GAP found, with that reason.
    const recheck = typeof meta.verified === 'string' && /failed_recheck$/.test(meta.verified);
    if (meta.verified !== 'excerpt_found_at_source' && !recheck) continue;
    // The brief's live-fact rule: a change that has since ended or was superseded is not a live fact.
    const kind = meta.continuity?.kind === 'ended' || meta.continuity?.kind === 'ongoing_state' ? meta.continuity.kind : classifyContinuity(r.evidence_text);
    const fail = recheck ? 'failed_recheck' : (liveFactFailure(r.evidence_text, accountName) ?? (kind === 'ended' ? 'fact_ended' : null));
    const speaker = speakerOrg(r.evidence_text)?.replace(/[.,;:]+$/, '') ?? null;
    if (!fail) liveQuotes.add(String(r.evidence_text).trim().toLowerCase());
    const expires = r.freshness_expires_at ? new Date(r.freshness_expires_at) : null;
    const s = make(r.evidence_url, {
      title: r.title ?? null,
      publishedAt: iso(r.observed_at),
      discoveredAt: iso(meta.retrievedAt ?? r.updated_at ?? r.observed_at)!,
      excerpt: r.evidence_text,
      excerptKind: 'verbatim',
      attribution: fail === 'quoted_third_party' ? speaker : null,
      origin: 'gap_research',
      status: fail ? 'NOT_VERIFIED_FOR_OUTREACH' : 'VERIFIED_FOR_OUTREACH',
      reason: fail === 'fact_ended'
        ? sourceReason('fact_ended', accountName)
        : fail === 'failed_recheck'
        ? `${sourceReason('failed_recheck', accountName)}${typeof meta.recheck?.reason === 'string' ? `: ${sourceReason(meta.recheck.reason, accountName, speaker)}` : ''}`
        : fail ? `${sourceReason('fact_no_longer_passes', accountName)}: ${sourceReason(fail, accountName, speaker)}` : null,
      factId: r.id,
    });
    if (s && !fail) {
      // A verified fact's own clock decides freshness.
      if (expires) s.freshTrigger = expires.getTime() > now.getTime();
      verifiedKeys.add(s.key);
    }
    add(s);
  }

  // 2. Every page a research run looked at (rich records from 2026-10-01; older runs keep url + reason).
  for (const run of runs) {
    const result = ((run.provider_status ?? {}) as Row).result as Row | undefined;
    if (!result) continue;
    const at = iso(run.created_at)!;
    const records: SourceRecord[] = Array.isArray(result.sources)
      ? result.sources
      : (Array.isArray(result.rejected) ? result.rejected : []).map((r: Row) => ({ url: r.url, reason: r.reason, title: null, publishedAt: null, excerpt: null, excerptKind: null, provider: 'research', status: String(r.reason).startsWith('source_unreadable') ? 'could_not_verify' : 'not_verified' }));
    for (const r of records) {
      if (!r?.url) continue;
      if (r.reason && DROP_REASONS.has(r.reason)) {
        dropped += 1;
        continue;
      }
      const k = normalizeSignalUrl(r.url);
      // "verified" in a run means a fact was stored; whether it is LIVE is the fact row's call (step 1).
      if (r.status === 'verified') {
        if (k && verifiedKeys.has(k)) continue;
      }
      const quote = r.excerptKind === 'verbatim' && r.excerpt ? r.excerpt : null;
      const speaker = quote ? speakerOrg(quote)?.replace(/[.,;:]+$/, '') ?? null : null;
      const third = speaker && !textNamesAccount(speaker, key) ? speaker : null;
      add(
        make(r.url, {
          title: r.title,
          publishedAt: r.publishedAt,
          discoveredAt: at,
          excerpt: r.excerpt,
          excerptKind: r.excerptKind,
          attribution: third,
          origin: 'gap_research',
          status: r.status === 'verified' ? 'NOT_VERIFIED_FOR_OUTREACH' : statusOf(r.reason),
          reason: r.status === 'verified' ? sourceReason('fact_no_longer_passes', accountName) : sourceReason(r.reason, accountName, third),
        }),
      );
    }
  }

  // 3. Signals: links Casey shared and stories GAP discovered.
  const setAsideItems: AccountSource[] = [];
  for (const g of signals) {
    if (!g.url) continue;
    const verified = verifiedKeys.has(normalizeSignalUrl(g.url) ?? '');
    const rs = String(g.research_status ?? 'none');
    // fact_found on a story whose fact verified at ANOTHER url (its primary source): that fact has its own card.
    const raw = verified
      ? null
      : rs === 'contradiction' ? 'contradiction'
      : rs === 'queued' || rs === 'researching' ? 'being_checked'
      : rs === 'no_usable_fact' ? 'no_fact_sentence'
      : rs === 'fact_found' ? (liveQuotes.size ? 'fact_at_other_source' : 'fact_no_longer_passes')
      : g.resolution_basis === 'discovery_mention' ? 'mention_only'
      : 'not_checked';
    const s = make(g.url, {
      title: g.title ?? null,
      // A news-feed link (news.google.com) names its publisher in the feed, not in its host.
      ...(g.source_name && /(^|\.)news\.google\.com$/.test(host(g.url)) ? { publisher: String(g.source_name) } : {}),
      publishedAt: iso(g.published_at),
      discoveredAt: iso(g.created_at)!,
      excerpt: g.title ? g.title : null,
      excerptKind: g.title ? 'headline' : null,
      origin: g.origin === 'casey_share' || g.origin === 'conference_note' ? 'casey_shared' : 'gap_discovered',
      status: verified ? 'VERIFIED_FOR_OUTREACH' : statusOf(raw),
      // A contradiction on a verified page is said, never swallowed by the verified status.
      reason: verified ? (rs === 'contradiction' ? 'verified; another source contradicts it (resolve it in the Research lane)' : null) : sourceReason(raw, accountName),
      signalId: g.id,
      reviewed: !!g.feedback,
    });
    if (s) s.whyFound = whyFound(`${g.title ?? ''}`, Array.isArray(g.categories) ? g.categories : []);
    const movedAway = g.account_name !== accountName;
    if (s && (movedAway || (g.feedback && SET_ASIDE.has(String(g.feedback))))) {
      if (movedAway) s.reason = `you marked it as another account's${g.account_name ? ` (${g.account_name})` : ' (waiting in Signal intake)'}`;
      s.reviewed = true;
      setAsideItems.push(s);
      continue;
    }
    add(s);
  }
  // A source Casey set aside stays out of the default view even when research also saw it. A live verified fact
  // is never hidden behind a set-aside (it is counted, so it is shown, marked reviewed).
  const asideShown: AccountSource[] = [];
  for (const s of setAsideItems) {
    if (verifiedKeys.has(s.key)) {
      const cur = byKey.get(s.key);
      if (cur) cur.reviewed = true;
      continue;
    }
    byKey.delete(s.key);
    asideShown.push(s);
  }

  // Publication date first. An undated link Casey shared sorts by when she shared it (never buried); an undated
  // page research happened to read sorts after the dated ones, newest found first.
  const dated = (s: AccountSource) => !!s.publishedAt || s.origin === 'casey_shared';
  const when = (s: AccountSource) => s.publishedAt ?? s.discoveredAt;
  const items = [...byKey.values()].sort(
    (a, b) => Number(dated(b)) - Number(dated(a)) || when(b).localeCompare(when(a)) || b.discoveredAt.localeCompare(a.discoveredAt) || a.key.localeCompare(b.key),
  );
  const partial = runs.length >= (opts.runs ?? 25) || signals.length >= 300 || factRows.length >= 200;
  return { accountName, items, sourcesFound: items.length, verifiedFacts: liveQuotes.size, dropped, setAside: asideShown.length, setAsideItems: asideShown, partial };
}

