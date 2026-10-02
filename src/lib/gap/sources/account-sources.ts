/**
 * RESEARCH APERTURE + TRUTH VOCABULARY (2026-10-01): every source GAP found about an account, in one place.
 *
 * Research maximizes RECALL; execution maximizes PRECISION. Each source carries its lead CLAIM on two axes:
 *
 *   VERIFICATION  UNCHECKED | VERIFYING | VERIFIED AT SOURCE | COULD NOT VERIFY | CONTRADICTED
 *   OUTREACH      ELIGIBLE | NOT ELIGIBLE | NOT EVALUATED | NEEDS HUMAN JUDGMENT
 *
 * A three-month-old claim can be VERIFIED AT SOURCE and NOT ELIGIBLE (not a fresh trigger) without ceasing to be a
 * fact; a vendor's quote can be VERIFIED AT SOURCE (speaker: the vendor) and NOT ELIGIBLE as the account's own.
 * ELIGIBLE is exactly the account brief's live-fact rule (claim-rules.ts liveFactFailure, not ended, not expired).
 *
 * Nothing here scores, ranks away, or hides a source on a bot's judgment of worth. Only objective garbage is dropped
 * (search redirects, malformed links), and counted. Casey's own Ignore / Wrong account moves a source out of the
 * default view (counted, never deleted). Read-only: no hypothesis, evidence link, approval or activation.
 */
import { normalizeSignalUrl } from '../signals/intake';
import type { SourceRecord } from '../research/run';
import { factUrl, liveFactFailure, normalizeCompany, speakerOrg, textNamesAccount } from '../research/claim-rules';
import { classifyContinuity } from '../research/continuity';
import { normalizeCompanyName } from '../identity/normalize';
import { DROP_REASONS, SEARCH_REDIRECT, axesOf, sourceReason, type AccountSource, type OutreachState, type SourceClaim, type VerificationState, type WhyFound } from './source-copy';

export { ageLabel, claimLine, OUTREACH_LABEL, sourceReason, VERIFICATION_LABEL } from './source-copy';
export type { AccountSource, OutreachState, SourceClaim, VerificationState, WhyFound } from './source-copy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export interface AccountSources {
  accountName: string;
  items: AccountSource[];
  /** SOURCES / SIGNALS shown. */
  sourcesFound: number;
  /** Distinct claims GAP verified at their source (facts; true, not necessarily usable). */
  claimsVerified: number;
  /** Distinct verified claims currently eligible as outreach evidence (the brief's live facts). */
  outreachEligible: number;
  /** Objective garbage dropped (search redirects, malformed links). */
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

/** Which reading of one URL leads its card: the one that says the most about the claim. */
function rank(s: { verification: VerificationState; outreach: OutreachState }): number {
  if (s.outreach === 'ELIGIBLE') return 6;
  if (s.verification === 'CONTRADICTED' || s.outreach === 'NEEDS_HUMAN_JUDGMENT') return 5;
  if (s.verification === 'VERIFIED_AT_SOURCE') return 4;
  if (s.verification === 'COULD_NOT_VERIFY' && s.outreach === 'NOT_ELIGIBLE') return 3;
  if (s.outreach === 'NOT_ELIGIBLE') return 2.5;
  if (s.verification === 'COULD_NOT_VERIFY') return 2;
  if (s.verification === 'VERIFYING') return 1;
  return 0.5;
}
const mergeWhy = (a: WhyFound[], b: WhyFound[]): WhyFound[] => {
  const m = [...new Set([...a, ...b])].filter((w) => w !== 'other').slice(0, 4);
  return m.length ? m : ['other'];
};

export async function loadAccountSources(prisma: PrismaLike, accountName: string, opts: { now: Date; runs?: number } = { now: new Date() }): Promise<AccountSources> {
  const now = opts.now;
  const key = normalizeCompany(accountName);
  // A failed read THROWS (the page says the sources could not be read): an empty read must never print as
  // "0 sources found".
  const [runs, signals, factRows, scoutRow]: [Row[], Row[], Row[], Row | null] = await Promise.all([
    prisma.researchRun.findMany({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, take: opts.runs ?? 25, select: { id: true, created_at: true, provider_status: true } }),
    // This account's signals, and the ones Casey moved away from it (Wrong account / reassigned): those stay set aside.
    prisma.gapSignal.findMany({
      where: { OR: [{ account_name: accountName }, { metadata: { path: ['reassignedFrom'], equals: accountName } }] },
      orderBy: { created_at: 'desc' },
      take: 300,
      select: { id: true, url: true, title: true, source_name: true, published_at: true, created_at: true, origin: true, source_class: true, research_status: true, categories: true, feedback: true, account_name: true, resolution_basis: true, event_id: true },
    }),
    prisma.prospectingSignal.findMany({ where: { account_name: accountName, source_kind: 'evidence_record' }, orderBy: { observed_at: 'desc' }, take: 200, select: { id: true, title: true, evidence_text: true, evidence_url: true, observed_at: true, freshness_expires_at: true, updated_at: true, metadata: true } }),
    // Scout's cited pages for this company (its verdict is separate; its citations are sources).
    prisma.gapAccountCandidate?.findFirst
      ? prisma.gapAccountCandidate.findFirst({ where: { scouted_at: { not: null }, OR: [{ account_name: accountName, decision: { in: ['added', 'mapped'] } }, { company_key: normalizeCompanyName(accountName) }] }, orderBy: { scouted_at: 'desc' }, select: { scout: true, scouted_at: true } })
      : Promise.resolve(null),
  ]);

  let dropped = 0;
  const byKey = new Map<string, AccountSource>();
  const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
  type Over = Partial<AccountSource> & { discoveredAt: string; origin: AccountSource['origin']; verification: VerificationState; outreach: OutreachState };
  const make = (url: string, over: Over): AccountSource | null => {
    const k = normalizeSignalUrl(url);
    // A search redirect is dropped, EXCEPT under a stored fact: a fact GAP holds is never hidden.
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
      eventId: null,
      ...over,
      // A page title that is only the URL says nothing.
      title: over.title && over.title !== url ? over.title : null,
      publishedAt,
    };
  };
  const claimOf = (s: AccountSource): SourceClaim => ({ excerpt: s.excerpt ?? '', verification: s.verification, outreach: s.outreach, reason: s.reason, attribution: s.attribution });
  const add = (s: AccountSource | null) => {
    if (!s) return;
    const cur = byKey.get(s.key);
    if (!cur) return void byKey.set(s.key, s);
    const win = rank(s) > rank(cur) ? s : cur;
    const lose = win === s ? cur : s;
    // Two different claims from one page stay two claims, each with its own states and speaker. Only the page's
    // own words: a search summary or a headline is never listed as a claim on the page.
    const also = [...(win.alsoOnPage ?? []), ...(lose.alsoOnPage ?? [])];
    if (lose.excerpt && win.excerpt && lose.excerptKind === 'verbatim' && lose.excerpt !== win.excerpt && !also.some((a) => a.excerpt === lose.excerpt)) also.push(claimOf(lose));
    byKey.set(s.key, {
      ...win,
      // The story's own headline (from the signal row) reads better than a fact row's page title.
      title: (lose.signalId && !win.signalId && lose.title) || win.title || lose.title,
      publisher: win.publisher === host(win.link) && lose.publisher && lose.publisher !== host(lose.link) ? lose.publisher : win.publisher,
      publishedAt: win.publishedAt ?? lose.publishedAt,
      ageDays: win.ageDays ?? lose.ageDays,
      freshTrigger: win.publishedAt ? win.freshTrigger : lose.freshTrigger,
      excerpt: win.excerpt ?? lose.excerpt,
      excerptKind: win.excerpt ? win.excerptKind : lose.excerptKind,
      // The speaker belongs to the claim shown, never borrowed from another claim on the page.
      attribution: win.excerpt ? win.attribution : lose.attribution,
      alsoOnPage: also.length ? also.slice(0, 4) : undefined,
      // The earliest time GAP saw it; Casey's share outranks GAP's own discovery.
      discoveredAt: win.discoveredAt < lose.discoveredAt ? win.discoveredAt : lose.discoveredAt,
      origin: [win.origin, lose.origin].includes('casey_shared') ? 'casey_shared' : win.origin,
      signalId: win.signalId ?? lose.signalId,
      factId: win.factId ?? lose.factId,
      eventId: win.eventId ?? lose.eventId,
      reviewed: win.reviewed || lose.reviewed,
      whyFound: mergeWhy(win.whyFound, lose.whyFound),
    });
  };

  // 1. Stored verified claims (facts). ELIGIBLE is the brief's live-fact rule; every other verified claim stays a
  // fact, NOT ELIGIBLE, with the reason. A claim whose source failed a later recheck is no longer a verified fact.
  const verifiedQuotes = new Set<string>();
  const eligibleQuotes = new Set<string>();
  const eligibleKeys = new Set<string>();
  for (const r of factRows) {
    const meta = (r.metadata ?? {}) as Row;
    // The publisher page (a claim resolved off a search redirect carries it in metadata.canonicalUrl).
    const url = factUrl(r);
    if (!r.evidence_text || !url) continue;
    const recheck = typeof meta.verified === 'string' && /failed_recheck$/.test(meta.verified);
    if (meta.verified !== 'excerpt_found_at_source' && !recheck) continue;
    const quote = String(r.evidence_text).trim().toLowerCase();
    const speaker = speakerOrg(r.evidence_text);
    const third = speaker && !textNamesAccount(speaker, key) ? speaker : null;
    const recheckReason = typeof meta.recheck?.reason === 'string' ? (meta.recheck.reason as string) : null;
    let verification: VerificationState = 'VERIFIED_AT_SOURCE';
    let outreach: OutreachState = 'ELIGIBLE';
    let reason: string | null = null;
    if (recheck) {
      // A recheck that could not find the claim again leaves it unverified; one that tightened a rule leaves it true.
      const ax = axesOf(recheckReason);
      verification = ax.verification === 'COULD_NOT_VERIFY' ? 'COULD_NOT_VERIFY' : 'VERIFIED_AT_SOURCE';
      outreach = 'NOT_ELIGIBLE';
      reason = `${sourceReason('failed_recheck', accountName)}${recheckReason ? `: ${sourceReason(recheckReason, accountName, third)}` : ''}`;
    } else {
      const live = liveFactFailure(r.evidence_text, accountName, url);
      const kind = meta.continuity?.kind === 'ended' || meta.continuity?.kind === 'ongoing_state' ? meta.continuity.kind : classifyContinuity(r.evidence_text);
      const expired = r.freshness_expires_at ? new Date(r.freshness_expires_at).getTime() <= now.getTime() : false;
      const why = live ?? (kind === 'ended' ? 'fact_ended' : expired ? 'fact_expired' : null);
      if (live === 'redirect_unresolved') verification = 'COULD_NOT_VERIFY';
      if (why) {
        outreach = 'NOT_ELIGIBLE';
        reason = sourceReason(why, accountName, third);
      }
    }
    if (verification === 'VERIFIED_AT_SOURCE') verifiedQuotes.add(quote);
    if (outreach === 'ELIGIBLE') eligibleQuotes.add(quote);
    const expires = r.freshness_expires_at ? new Date(r.freshness_expires_at) : null;
    const s = make(url, {
      title: r.title ?? null,
      publishedAt: iso(r.observed_at),
      discoveredAt: iso(meta.retrievedAt ?? r.updated_at ?? r.observed_at)!,
      excerpt: r.evidence_text,
      excerptKind: 'verbatim',
      attribution: third,
      origin: 'gap_research',
      verification,
      outreach,
      reason,
      factId: r.id,
    });
    if (s) {
      // A verified fact's own clock decides freshness.
      if (expires) s.freshTrigger = expires.getTime() > now.getTime();
      if (outreach === 'ELIGIBLE') eligibleKeys.add(s.key);
    }
    add(s);
  }

  // 2. Every page a research run looked at (rich records from 2026-10-01; older runs keep url + reason, enriched
  // with provenance by the metadata backfill when it could be recovered).
  for (const run of runs) {
    const result = ((run.provider_status ?? {}) as Row).result as Row | undefined;
    if (!result) continue;
    const at = iso(run.created_at)!;
    const backfill = (result.provenance ?? {}) as Record<string, { title?: string | null; publishedAt?: string | null; publisher?: string | null }>;
    const records: SourceRecord[] = Array.isArray(result.sources)
      ? result.sources
      : (Array.isArray(result.rejected) ? result.rejected : []).map((r: Row) => ({ url: r.url, reason: r.reason, title: null, publishedAt: null, excerpt: null, excerptKind: null, provider: 'research', status: String(r.reason).startsWith('source_unreadable') ? 'could_not_verify' : 'not_verified' }));
    for (const r of records) {
      if (!r?.url) continue;
      if (r.reason && DROP_REASONS.has(r.reason)) {
        dropped += 1;
        continue;
      }
      // "verified" in a run means a fact was stored; its states are the fact row's call (step 1).
      if (r.status === 'verified') continue;
      const quote = r.excerptKind === 'verbatim' && r.excerpt ? r.excerpt : null;
      const speaker = quote ? speakerOrg(quote) : null;
      const third = speaker && !textNamesAccount(speaker, key) ? speaker : null;
      const prov = backfill[r.url] ?? {};
      const ax = axesOf(r.reason);
      add(
        make(r.url, {
          title: r.title ?? prov.title ?? null,
          publishedAt: r.publishedAt ?? prov.publishedAt ?? null,
          ...(prov.publisher ? { publisher: prov.publisher } : {}),
          discoveredAt: at,
          excerpt: r.excerpt,
          excerptKind: r.excerptKind,
          attribution: third,
          origin: 'gap_research',
          verification: ax.verification,
          outreach: ax.outreach,
          reason: sourceReason(r.reason, accountName, third),
        }),
      );
    }
  }

  // 3. Scout's cited pages: a source for each claim Scout made about the company. Never a checked claim, never
  // outreach evidence; Scout's verdict lives on the account brief, separately.
  const scout = (scoutRow?.scout ?? null) as Row | null;
  if (scout) {
    for (const c of [...(Array.isArray(scout.network) ? scout.network : []), ...(Array.isArray(scout.freight) ? scout.freight : [])] as Row[]) {
      if (!c?.url || !c?.claim) continue;
      add(
        make(String(c.url), {
          discoveredAt: iso(scoutRow!.scouted_at) ?? now.toISOString(),
          excerpt: String(c.claim),
          excerptKind: 'search_summary',
          origin: 'scout',
          verification: 'UNCHECKED',
          outreach: 'NOT_EVALUATED',
          reason: sourceReason('scout_citation', accountName),
        }),
      );
    }
  }

  // 4. Signals: links Casey shared and stories GAP discovered.
  const setAsideItems: AccountSource[] = [];
  for (const g of signals) {
    if (!g.url) continue;
    const k = normalizeSignalUrl(g.url) ?? '';
    const eligible = eligibleKeys.has(k);
    const rs = String(g.research_status ?? 'none');
    const raw = rs === 'contradiction' ? 'contradiction'
      : rs === 'queued' || rs === 'researching' ? 'being_checked'
      : rs === 'no_usable_fact' ? 'no_fact_sentence'
      : rs === 'fact_found' ? (verifiedQuotes.size ? 'fact_at_other_source' : 'fact_no_longer_passes')
      : g.resolution_basis === 'discovery_mention' ? 'mention_only'
      : 'not_checked';
    const ax = axesOf(raw);
    const s = make(g.url, {
      title: g.title ?? null,
      // A news-feed link (news.google.com) names its publisher in the feed, not in its host.
      ...(g.source_name && /(^|\.)news\.google\.com$/.test(host(g.url)) ? { publisher: String(g.source_name) } : {}),
      publishedAt: iso(g.published_at),
      discoveredAt: iso(g.created_at)!,
      excerpt: g.title ? g.title : null,
      excerptKind: g.title ? 'headline' : null,
      origin: g.origin === 'casey_share' || g.origin === 'conference_note' ? 'casey_shared' : 'gap_discovered',
      // A contradiction on a page that holds an eligible claim is said, never swallowed: Casey judges it.
      verification: eligible && rs === 'contradiction' ? 'VERIFIED_AT_SOURCE' : ax.verification,
      outreach: eligible && rs === 'contradiction' ? 'NEEDS_HUMAN_JUDGMENT' : ax.outreach,
      reason: eligible && rs === 'contradiction' ? 'another source contradicts it (resolve it in the Research lane)' : sourceReason(raw, accountName),
      signalId: g.id,
      eventId: g.event_id ?? null,
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
  // A source Casey set aside stays out of the default view even when research also saw it. An eligible claim is
  // never hidden behind a set-aside (it is counted, so it is shown, marked reviewed).
  const asideShown: AccountSource[] = [];
  for (const s of setAsideItems) {
    if (eligibleKeys.has(s.key)) {
      const cur = byKey.get(s.key);
      if (cur) cur.reviewed = true;
      continue;
    }
    byKey.delete(s.key);
    asideShown.push(s);
  }

  // Publication date first. An undated link Casey shared sorts by when it was shared (never buried); an undated
  // page research happened to read sorts after the dated ones, newest found first.
  const dated = (s: AccountSource) => !!s.publishedAt || s.origin === 'casey_shared';
  const when = (s: AccountSource) => s.publishedAt ?? s.discoveredAt;
  const items = [...byKey.values()].sort(
    (a, b) => Number(dated(b)) - Number(dated(a)) || when(b).localeCompare(when(a)) || b.discoveredAt.localeCompare(a.discoveredAt) || a.key.localeCompare(b.key),
  );
  const partial = runs.length >= (opts.runs ?? 25) || signals.length >= 300 || factRows.length >= 200;
  return { accountName, items, sourcesFound: items.length, claimsVerified: verifiedQuotes.size, outreachEligible: eligibleQuotes.size, dropped, setAside: asideShown.length, setAsideItems: asideShown, partial };
}

/**
 * EVENTS (default view, no hidden score): sources telling one story group under one event, its best source first
 * (eligible, then verified, then newest), "+ N more" expandable. Nothing is removed; ordering is by the lead's date.
 */
export interface SourceEvent {
  id: string;
  lead: AccountSource;
  more: AccountSource[];
  /** Casey has not acted on any source of this event yet. */
  unreviewed: boolean;
}

export function groupEvents(items: readonly AccountSource[]): SourceEvent[] {
  const groups = new Map<string, AccountSource[]>();
  for (const s of items) {
    const id = s.eventId ?? s.key;
    groups.set(id, [...(groups.get(id) ?? []), s]);
  }
  const events = [...groups.entries()].map(([id, g]) => {
    const sorted = [...g].sort((a, b) => rank(b) - rank(a) || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    return { id, lead: sorted[0], more: sorted.slice(1), unreviewed: g.every((s) => !s.reviewed) };
  });
  const order = new Map(items.map((s, i) => [s.key, i]));
  // New / unreviewed first, then the original date order of each event's earliest-listed source.
  return events.sort((a, b) => Number(b.unreviewed) - Number(a.unreviewed) || Math.min(...[a.lead, ...a.more].map((s) => order.get(s.key)!)) - Math.min(...[b.lead, ...b.more].map((s) => order.get(s.key)!)));
}
