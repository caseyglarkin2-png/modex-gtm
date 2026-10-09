/**
 * ONE ACCOUNT CONTEXT (V2, 2026-10-02): deterministic projections over the stores the rest of the app already keeps.
 * Many sensors, one context; nothing is copied into a new table and no score is computed.
 *
 *   relationship   how Casey can get in: the warm-intro restriction (policy/restriction.ts), the account's intro path
 *                  and per-person routes (display only, never policy), work sources, meetings, the last thread
 *   engagement     PRIVATE: what the account did on our microsites. Interest, never pain; never a reason, never a
 *                  hypothesis, never economics (an ROI read is them reading OUR model), never in buyer-facing copy
 *   history        what happened, newest first, each item with a kind and a visibility; drip "send a touch" tasks and
 *                  email opens are not history
 *   assets         what already exists for this account (generated content, microsite, demo, the legacy meeting brief)
 *
 * Pure: the loader (context/load.ts) reads; these functions only shape. Pinned by tests/unit/gap/account-context.test.ts.
 */
import type { AccountRestriction } from '../policy/restriction';

export type Visibility = 'seller' | 'private';

export interface RelationshipContext {
  restriction: AccountRestriction | null;
  /** Account.best_intro_path when it names a route (display only; "Direct email" and topic labels are not routes). */
  introPath: string | null;
  /** Per-person routes from the persona record ("Mark -> Heiko / CSCO office"): relationship context, never a person row. */
  routes: Array<{ person: string; route: string }>;
  sources: Array<{ source: string; type: string; context: string | null; person: string | null }>;
  meetings: { upcoming: { at: string; what: string } | null; last: { at: string; status: string } | null };
  lastThread: { at: string; to: string; subject: string; replied: boolean } | null;
  /** The account owner on record (who holds the relationship internally). */
  owner: string | null;
  /** ONE line for NOW (null when there is nothing to say). */
  line: string | null;
}

export interface PrivateEngagement {
  /** Human sessions on our microsites and demo pages, all time. */
  sessions: number;
  /** Sessions that went deep (several sections and real time, or most of the page). */
  deepSessions: number;
  ctaSessions: number;
  /** Sessions that read our ROI model (OUR model; never their economics). */
  roiReads: number;
  firstAt: string | null;
  lastAt: string | null;
  pages: string[];
  /** Deep, CTA or ROI activity within the last 180 days. */
  material: boolean;
  /** "Private: ..." line for NOW, only when material. */
  line: string | null;
}

export interface HistoryItem {
  at: string;
  kind: 'email_sent' | 'reply' | 'meeting' | 'capture' | 'outcome' | 'activity' | 'asset_sent';
  visibility: Visibility;
  text: string;
}

export interface AssetItem {
  kind: string;
  label: string;
  at: string | null;
  href: string | null;
  lastSentAt: string | null;
  /** A legacy artifact: shown as dated legacy context, never recommended. */
  legacy: boolean;
}

export interface AccountContext {
  relationship: RelationshipContext;
  engagement: PrivateEngagement;
  history: HistoryItem[];
  assets: AssetItem[];
  /** The legacy account record's next action, as a dated legacy note (never NEXT). */
  legacyNote: { text: string; at: string | null } | null;
}

const iso = (d: unknown): string | null => {
  if (!(d instanceof Date) && typeof d !== 'string') return null;
  const t = new Date(d as string);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};
const monthDay = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthOf = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
const DAY = 86_400_000;

/** Our own mailboxes (a send to ourselves is a test or a copy, never a touch with the account). */
export const isInternalRecipient = (email: string) => /@(freightroll\.com|yardflow\.ai)$/i.test(email.trim()) || /^casey[a-z0-9.]*@gmail\.com$/i.test(email.trim());

/** A route names a person or an introduction ("Mark Shaughnessy -> Danone CSCO intro"), not a channel or a topic. */
export function isRoute(text: string | null | undefined): boolean {
  const t = String(text ?? '').trim();
  if (!t || /^(direct email|email|linkedin|cold|none|n\/a|tbd|unknown)$/i.test(t)) return false;
  return /->|→|\bintro(duction|duced)?\b|\bvia\b|\breferr(al|ed)\b|\bthrough\b/i.test(t);
}

// ---------------------------------------------------------------- relationship

export function projectRelationship(x: {
  restriction: AccountRestriction | null;
  account: { best_intro_path?: string | null; owner?: string | null } | null;
  personas: Array<{ name: string | null; intro_route?: string | null; intro_path?: string | null }>;
  memberships: Array<{ sourceName: string; sourceType: string; relationshipContext: string | null; personName: string | null }>;
  meetings: Array<{ meeting_status: string; meeting_date: Date | string | null; objective: string | null; created_at: Date | string }>;
  emails: Array<{ to_email: string; subject: string; sent_at: Date | string; reply_count: number }>;
  now: Date;
}): RelationshipContext {
  const introPath = isRoute(x.account?.best_intro_path) ? x.account!.best_intro_path!.trim() : null;
  const routes = x.personas
    .map((p) => ({ person: p.name ?? '(no name)', route: [p.intro_path, p.intro_route].find((r) => isRoute(r)) ?? '' }))
    .filter((r) => r.route);
  const sources = x.memberships.map((m) => ({ source: m.sourceName, type: m.sourceType, context: m.relationshipContext, person: m.personName }));
  const dated = x.meetings.map((m) => ({ at: iso(m.meeting_date) ?? iso(m.created_at), status: m.meeting_status, what: m.objective ?? m.meeting_status })).filter((m): m is { at: string; status: string; what: string } => !!m.at);
  const upcoming = dated.filter((m) => new Date(m.at).getTime() >= x.now.getTime() && !/cancel/i.test(m.status)).sort((a, b) => a.at.localeCompare(b.at))[0] ?? null;
  const last = dated.filter((m) => new Date(m.at).getTime() < x.now.getTime()).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
  const mail = [...x.emails].filter((e) => !isInternalRecipient(e.to_email)).sort((a, b) => String(iso(b.sent_at)).localeCompare(String(iso(a.sent_at))))[0];
  const lastThread = mail && iso(mail.sent_at) ? { at: iso(mail.sent_at)!, to: mail.to_email, subject: mail.subject, replied: x.emails.some((e) => e.reply_count > 0) } : null;
  const owner = x.account?.owner?.trim() || null;

  let line: string | null = null;
  if (x.restriction) line = `Warm intro only, through ${x.restriction.introducer} (to ${x.restriction.route}).`;
  else if (upcoming) line = `Meeting ${monthDay(upcoming.at)}: ${upcoming.what}.`;
  else if (introPath) line = `Intro path: ${introPath}.`;
  else if (sources.find((s) => s.context)) {
    const s = sources.find((y) => y.context)!;
    line = `${s.person ? `${s.person}: ` : ''}${s.context} (${s.source}).`;
  } else if (lastThread) line = `Last email ${monthDay(lastThread.at)} to ${lastThread.to}${lastThread.replied ? '; they have replied before' : '; no reply on record'}.`;
  else if (last) line = `Last meeting ${monthDay(last.at)} (${last.status}).`;
  if (line && routes.length && x.restriction) line = `${line.replace(/\.$/, '')}; ${routes.length === 1 ? `route: ${routes[0].route}` : `${routes.length} named routes`}.`;
  return { restriction: x.restriction, introPath, routes, sources, meetings: { upcoming: upcoming ? { at: upcoming.at, what: upcoming.what } : null, last: last ? { at: last.at, status: last.status } : null }, lastThread, owner, line };
}

// ---------------------------------------------------------------- private engagement

export interface EngagementRow {
  path: string;
  sections_viewed: string[];
  cta_ids: string[];
  scroll_depth_pct: number;
  duration_seconds: number;
  updated_at: Date | string;
  human: boolean;
}

/** Deep without a score: several sections and real time, or most of a long page. */
const deep = (s: EngagementRow) => (s.sections_viewed.length >= 3 && s.duration_seconds >= 90) || (s.sections_viewed.length >= 4 && s.scroll_depth_pct >= 70);

export function projectEngagement(rows: readonly EngagementRow[], now: Date): PrivateEngagement {
  const human = rows.filter((r) => r.human && iso(r.updated_at));
  const at = (r: EngagementRow) => iso(r.updated_at)!;
  const sorted = [...human].sort((a, b) => at(a).localeCompare(at(b)));
  const isRoi = (r: EngagementRow) => r.sections_viewed.some((x) => /roi/i.test(x));
  const deepRows = human.filter(deep);
  const ctaRows = human.filter((r) => r.cta_ids.length > 0);
  const roiRows = human.filter(isRoi);
  const signal = human.filter((r) => deep(r) || r.cta_ids.length > 0 || isRoi(r));
  const lastSignal = signal.map(at).sort().pop() ?? null;
  const material = !!lastSignal && now.getTime() - new Date(lastSignal).getTime() <= 180 * DAY;
  const firstAt = sorted[0] ? at(sorted[0]) : null;
  const lastAt = sorted.length ? at(sorted[sorted.length - 1]) : null;
  const pages = [...new Set(human.map((r) => r.path.split('?')[0]))].slice(0, 4);
  const firstSignal = signal.map(at).sort()[0] ?? null;
  const quietDays = lastAt ? Math.floor((now.getTime() - new Date(lastAt).getTime()) / DAY) : null;
  const span = firstSignal && lastSignal ? (monthOf(firstSignal) === monthOf(lastSignal) ? monthOf(lastSignal) : `${monthOf(firstSignal)} to ${monthOf(lastSignal)}`) : null;
  const parts = [ctaRows.length ? `${ctaRows.length} with a CTA click` : null, roiRows.length ? `${roiRows.length} read our ROI model` : null].filter(Boolean).join(', ');
  const line = material
    ? `Private: interest signal, never mention to the buyer. ${deepRows.length || signal.length} deep session${(deepRows.length || signal.length) === 1 ? '' : 's'} on ${pages.join(', ')} (${span}${parts ? `; ${parts}` : ''})${quietDays !== null && quietDays > 14 ? `; quiet since ${monthDay(lastAt!)}` : ''}.`
    : null;
  return { sessions: human.length, deepSessions: deepRows.length, ctaSessions: ctaRows.length, roiReads: roiRows.length, firstAt, lastAt, pages, material, line };
}

// ---------------------------------------------------------------- history

/**
 * WHAT AN ACTIVITY ROW IS (click-test P0, 2026-10-03). The Activity table mixes four kinds of rows:
 *   system   agent / pipeline logs and asset bookkeeping ("Agent Action", "Agent Workflow", "Pipeline", infographics):
 *            never history; "Agent Action: ... production smoke ..." was shown as Dannon's last touch
 *   private  what the account did on our pages ("Page View", "Microsite CTA Click"): private engagement, never history
 *   reply    a buyer wrote to us ("reply_received")
 *   seller   a real touch (email, call, note, LinkedIn, an intro request, a human outcome)
 * A row whose text says it was a test, a smoke run or a send proof is never history, whatever its type.
 */
export type ActivityKind = 'system' | 'private' | 'reply' | 'seller';
export function activityKind(a: { activity_type: string; outcome?: string | null; notes?: string | null }): ActivityKind {
  const t = a.activity_type.trim().toLowerCase();
  const text = `${a.outcome ?? ''} ${a.notes ?? ''}`;
  if (/\b(smoke|send proof|production final|test send|dry run|e2e)\b/i.test(text)) return 'system';
  if (/^(agent action|agent workflow|pipeline|infographic|infographic journey|infographic bundle)$/.test(t)) return 'system';
  if (/page view|microsite|cta click|session/.test(t)) return 'private';
  if (/reply/.test(t)) return 'reply';
  return 'seller';
}

/** Activity text and the synced inbox's snippets arrive HTML-escaped ("we&#39;re", "Casey &amp; Jake", "&#x2019;"); the named, decimal and hex entities are decoded (C7: the placed inbound excerpts too). */
export const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _m; } })
    .replace(/&#(\d+);/g, (_m, n: string) => { try { return String.fromCodePoint(Number(n)); } catch { return _m; } })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

/** A campaign-drip "send a touch" task: an instruction someone wrote, not something that happened. */
export const isDripMarker = (a: { notes?: string | null; next_step?: string | null; outcome?: string | null }) =>
  /Campaign drip automation/i.test(a.notes ?? '') || (/^Send (first )?touch\b/i.test(a.next_step ?? '') && !a.outcome?.trim());

/**
 * A reply as a person said it: "Reply from Avinash Rao: ..." (no address), and a body the log cut off mid-word says
 * it is a snippet (round 4, GXO: "...the message I just got from Mik").
 */
function replyText(what: string): string {
  const m = what.match(/^Reply from\s+([^<:]+?)\s*(?:<[^>]*>)?\s*:\s*([\s\S]*)$/i);
  if (!m) return what.replace(/^Reply from\s+/i, 'Reply from ');
  const body = m[2].trim();
  const cut = body.length >= 80 && !/[.!?)"'\u2019\u201d]$/.test(body);
  return `Reply from ${m[1].trim()}: ${cut ? `${body.replace(/\s+\S*$/, '')}\u2026 (snippet: the full reply is in Gmail)` : body}`;
}

const PER_KIND: Record<HistoryItem['kind'], number> = { email_sent: 4, reply: 3, meeting: 3, capture: 3, outcome: 3, activity: 4, asset_sent: 2 };

export function projectHistory(x: {
  activities: Array<{ activity_type: string; outcome: string | null; notes: string | null; next_step: string | null; activity_date: Date | string | null; created_at: Date | string }>;
  emails: Array<{ to_email: string; subject: string; sent_at: Date | string; reply_count: number }>;
  meetings: Array<{ meeting_status: string; meeting_date: Date | string | null; objective: string | null; created_at: Date | string }>;
  captures: Array<{ title: string | null; intent: string | null; next_step: string | null; captured_at: Date | string }>;
  outcomes: Array<{ outcome_label: string; notes: string | null; created_at: Date | string }>;
  sends: Array<{ to_email: string; sent_at: Date | string | null; generated_content_id: number }>;
  now: Date;
  limit?: number;
}): HistoryItem[] {
  const items: HistoryItem[] = [];
  for (const a of x.activities) {
    if (isDripMarker(a)) continue;
    const kind = activityKind(a);
    // System and test rows are not history; private engagement lives in its own labelled summary.
    if (kind === 'system' || kind === 'private') continue;
    const at = iso(a.activity_date) ?? iso(a.created_at);
    // The outcome is what happened; a next step alone is a plan, never history.
    const what = decodeEntities(a.outcome?.trim() || a.notes?.trim().split('\n')[0] || '');
    if (at && what) items.push(kind === 'reply' ? { at, kind: 'reply', visibility: 'seller', text: replyText(what) } : { at, kind: 'activity', visibility: 'seller', text: `${a.activity_type}: ${what}` });
  }
  for (const e of x.emails) {
    const at = iso(e.sent_at);
    if (!at) continue;
    // A smoke test, a send proof or a send to ourselves is not a touch.
    if (/\b(smoke|send proof|test send|production final)\b/i.test(e.subject) || isInternalRecipient(e.to_email)) continue;
    // Opens and clicks are tracking, not history: never shown as something the buyer did.
    items.push({ at, kind: 'email_sent', visibility: 'seller', text: `Email to ${e.to_email}: "${e.subject}"` });
    if (e.reply_count > 0) items.push({ at, kind: 'reply', visibility: 'seller', text: `Reply on "${e.subject}" (${e.to_email})` });
  }
  for (const m of x.meetings) {
    const at = iso(m.meeting_date) ?? iso(m.created_at);
    if (at) items.push({ at, kind: 'meeting', visibility: 'seller', text: `Meeting (${m.meeting_status})${m.objective ? `: ${m.objective}` : ''}` });
  }
  for (const c of x.captures) {
    const at = iso(c.captured_at);
    const what = c.intent?.trim() || c.title?.trim();
    if (at && what) items.push({ at, kind: 'capture', visibility: 'seller', text: `Field note: ${what}` });
  }
  for (const o of x.outcomes) {
    const at = iso(o.created_at);
    if (at) items.push({ at, kind: 'outcome', visibility: 'seller', text: `Outcome: ${o.outcome_label.replace(/[-_]/g, ' ')}${o.notes?.trim() ? ` (${o.notes.trim()})` : ''}` });
  }
  for (const s of x.sends) {
    const at = iso(s.sent_at);
    if (at) items.push({ at, kind: 'asset_sent', visibility: 'seller', text: `Asset ${s.generated_content_id} sent to ${s.to_email}` });
  }
  const sorted = items.filter((i) => new Date(i.at).getTime() <= x.now.getTime() + DAY).sort((a, b) => b.at.localeCompare(a.at));
  const taken: Record<string, number> = {};
  return sorted.filter((i) => (taken[i.kind] = (taken[i.kind] ?? 0) + 1) <= PER_KIND[i.kind]).slice(0, x.limit ?? 12);
}

// ---------------------------------------------------------------- assets

const CONTENT_LABEL: Record<string, string> = { email: 'Email draft', dm: 'LinkedIn message', call_script: 'Call script', meeting_prep: 'Meeting prep', infographic: 'Infographic', one_pager: 'One-pager', sequence: 'Sequence' };

export function projectAssets(x: {
  generated: Array<{ id: number; content_type: string; version: number; created_at: Date | string }>;
  sends: Array<{ generated_content_id: number; sent_at: Date | string | null }>;
  micrositeSlug: string | null;
  demoSlug: string | null;
  /** The legacy March meeting brief's page, when one exists. */
  legacyMeetingBrief: string | null;
  accountName: string;
}): AssetItem[] {
  const lastSent = new Map<number, string>();
  for (const s of x.sends) {
    const at = iso(s.sent_at);
    if (at && at > (lastSent.get(s.generated_content_id) ?? '')) lastSent.set(s.generated_content_id, at);
  }
  // The newest version per content type (older versions are history, not separate assets).
  const newest = new Map<string, (typeof x.generated)[number]>();
  for (const g of x.generated) {
    const cur = newest.get(g.content_type);
    if (!cur || g.version > cur.version || (g.version === cur.version && String(iso(g.created_at)) > String(iso(cur.created_at)))) newest.set(g.content_type, g);
  }
  const studio = `/studio?account=${encodeURIComponent(x.accountName)}`;
  const assets: AssetItem[] = [...newest.values()]
    .sort((a, b) => String(iso(b.created_at)).localeCompare(String(iso(a.created_at))))
    .map((g) => ({ kind: g.content_type, label: `${CONTENT_LABEL[g.content_type] ?? g.content_type.replace(/_/g, ' ')} v${g.version}`, at: iso(g.created_at), href: studio, lastSentAt: x.generated.filter((y) => y.content_type === g.content_type).map((y) => lastSent.get(y.id) ?? '').sort().pop() || null, legacy: false }));
  if (x.micrositeSlug) assets.push({ kind: 'microsite', label: `Account microsite (/for/${x.micrositeSlug})`, at: null, href: `https://yardflow.ai/for/${x.micrositeSlug}/`, lastSentAt: null, legacy: false });
  if (x.demoSlug) assets.push({ kind: 'demo', label: `Demo (/demo/${x.demoSlug})`, at: null, href: `https://yardflow.ai/demo/${x.demoSlug}/`, lastSentAt: null, legacy: false });
  if (x.legacyMeetingBrief) assets.push({ kind: 'legacy_meeting_brief', label: 'Legacy meeting brief (March 2026; a dated note, superseded by this page)', at: null, href: x.legacyMeetingBrief, lastSentAt: null, legacy: true });
  return assets;
}
