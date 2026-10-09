/**
 * ACCOUNT KNOWLEDGE RETRIEVAL (C14, C15, C16 of the commercial-context audit, 2026-10-08). Pure over injected adapters.
 *
 * Two private knowledge sources become attributed CLAIMS of the commercial-context packet (commercial-context.ts):
 *
 *   the local vault   the account note (02_Accounts/<Account>.md) read section by section, then the wiki-links its
 *                     dated notes name, followed one level into meeting notes (05_Meetings), raw transcripts
 *                     (00_Inbox/raw, only the spans that mention the account) and people notes (03_People), bounded
 *                     (MAX_LINKED_NOTES, MAX_CLAIMS); every claim keeps its raw text and its path plus heading as the
 *                     source id. A note at another account is not followed; a private personal detail stays internal.
 *   the Clawd cloud   the intel snapshot's reasoning notes, selected by SOURCE IDENTITY and VERSION (the label and the
 *                     date a note carries, "Vault wedge (2026-07-10)"), never "the first matching wedge": the newest
 *                     version of each identity is current, an identical older copy is dropped, an older different
 *                     text is kept with supersededBy and conflictsWith so a contradiction stays visible; the result
 *                     is the same whatever order the array came in.
 *
 * C15: a file's last_refreshed and a snapshot's rebuilt_at go to indexedAt, a label; a claim's observedAt is its own
 * date (the inbox note's leading date, the meeting's date, the wedge's parenthesised date) or null. validateClaims
 * refuses the other thing. Coverage (C20) says for each source whether it was configured, reachable, complete or
 * partial (a bound hit, a linked note unreadable, the snapshot's 10-note cap), its watermark, its index time, the
 * query and what was omitted and why. Nothing here is an instruction: text from a note is data, whatever it says.
 *
 * C48: the index lifecycle, pure over an optional in-memory cache the caller injects (createKnowledgeCache; no file
 * writes, no table). Every vault file is content-hashed; a file whose hash is unchanged reuses its chunks without a
 * re-parse, a changed file refreshes only its own chunks (a chunk's identity is the source id plus its text hash);
 * a chunk that vanished from a re-read file, a file that now reads as absent and a Clawd note missing from a newer
 * snapshot are TOMBSTONED (kept in the cache's history with the reason, never served again); a source that cannot
 * be read is served from the cache's last successful sync, said STALE with that sync time on its coverage row.
 */
import { createHash } from 'node:crypto';
import { validateClaims, type Authority, type ClaimClass, type ContextClaim, type ContextVisibility, type SourceCoverage } from './commercial-context';

export const MAX_LINKED_NOTES = 12;
export const MAX_CLAIMS = 80;
export const MAX_CLAIMS_PER_SECTION = 12;
export const MAX_TRANSCRIPT_SPANS = 8;
export const CLAIM_TEXT_MAX = 500;
/** Clawd's projection keeps at most this many reasoning notes per snapshot (intel_project.py notes[:10]). */
export const CLAWD_NOTE_CAP = 10;

export interface VaultAdapter {
  /** One vault file by its path relative to the vault root ("02_Accounts/Kenco Logistics.md"); null when absent; throws when the vault itself cannot be read. */
  readFile: (relPath: string) => Promise<string | null>;
  /**
   * Stream A (2026-10-09): a table-backed vault (knowledge/vault-table-adapter.ts) says how many notes it holds, when the
   * newest was synced and the counts by kind; an empty table is "not configured", the sync time is the source's
   * indexedAt (a label, never a claim date) and the counts become the coverage's summary. A directory adapter has none.
   */
  status?: () => Promise<{ rows: number; syncedAt: string | null; kinds: Record<string, number> } | null>;
}

export interface ClawdSnapshot {
  found: boolean;
  rebuiltAt: string | null;
  reasoningNotes: string[];
}

export interface ClawdAdapter {
  /** The intel snapshot for one domain; throws on a failed read (the coverage says so). */
  fetchSnapshot: (domain: string) => Promise<ClawdSnapshot>;
}

export interface KnowledgeAdapters {
  vault?: VaultAdapter | null;
  clawd?: ClawdAdapter | null;
}

export interface KnowledgeInput {
  accountName: string;
  aliases?: readonly string[];
  domain?: string | null;
  now: Date;
  /** Other account names GAP knows: a claim naming one of them stays internal (C14: unrelated accounts never reach outbound context). */
  otherAccounts?: readonly string[];
  /** Our own speakers in a transcript; anyone else on a buyer call is the buyer. */
  sellerNames?: readonly string[];
  /** Follow the account note's wiki-links (default true); the story's one-paragraph read passes false. */
  followLinks?: boolean;
  /** C48: the caller's in-memory index (createKnowledgeCache); without it every read is a full read with no history. */
  cache?: KnowledgeCache | null;
}

export interface AccountKnowledge {
  claims: ContextClaim[];
  coverage: SourceCoverage[];
  /** The vault files read beyond the account note. */
  followed: string[];
  notFollowed: Array<{ link: string; reason: 'not_found' | 'other_account' | 'bound' | 'unreadable' }>;
  /** C48: per source, what this read refreshed, reused and tombstoned, its last successful sync and whether it is stale. */
  sync: SyncReport[];
  /** C48: the history retained: every chunk tombstoned so far for this account (never served, never silently gone). */
  tombstones: Tombstone[];
}

/** ---------- C48: the index lifecycle ---------- */

/** A read served from the cache, or a sync older than this, is STALE and says so. */
export const STALE_AFTER_MS = 24 * 3_600_000;

export interface Tombstone {
  claim: ContextClaim;
  at: string;
  /** deleted: the file or note is gone; superseded: the same source id now carries different text. */
  reason: 'deleted' | 'superseded';
}

export interface VaultIndex {
  /** Per vault path: the content hash, the chunk ids it produced, the links and index time an account note carried. */
  files: Map<string, { hash: string; claimIds: string[]; readAt: string; links?: string[]; indexedAt?: string | null }>;
  claims: Map<string, ContextClaim>;
  tombstones: Map<string, Tombstone>;
  lastSyncAt: string | null;
}

export interface ClawdIndex {
  rebuiltAt: string | null;
  claims: Map<string, ContextClaim>;
  tombstones: Map<string, Tombstone>;
  lastSyncAt: string | null;
}

export interface KnowledgeCache {
  vault: Map<string, VaultIndex>;
  clawd: Map<string, ClawdIndex>;
}

export function createKnowledgeCache(): KnowledgeCache {
  return { vault: new Map(), clawd: new Map() };
}

export interface SyncReport {
  source: 'vault' | 'clawd';
  lastSyncAt: string | null;
  stale: boolean;
  /** True when the source could not be read and the cache's last successful sync was served instead. */
  servedFromCache: boolean;
  /** Vault paths re-parsed this read (their hash changed or they were new); Clawd: ['snapshot'] when the notes changed. */
  refreshed: string[];
  /** Vault paths whose hash was unchanged: chunks reused without a re-parse. */
  reused: string[];
  /** Chunk ids tombstoned by this read. */
  tombstoned: string[];
}

/** The seller words for a source's sync (C48): when it last synced, what moved, and STALE when it is. */
export function syncLine(s: SyncReport): string {
  const when = s.lastSyncAt ? `last successful sync ${s.lastSyncAt.slice(0, 16).replace('T', ' ')}` : 'never synced';
  const head = s.stale ? `${s.source}: STALE (${s.servedFromCache ? 'served from the cache; ' : ''}${when})` : `${s.source}: synced (${when})`;
  const moved = [s.refreshed.length ? `${s.refreshed.length} refreshed` : '', s.reused.length ? `${s.reused.length} reused` : '', s.tombstoned.length ? `${s.tombstoned.length} tombstoned` : ''].filter(Boolean).join(', ');
  return moved ? `${head}; ${moved}` : head;
}

const stalenessOf = (lastSyncAt: string | null, now: Date, servedFromCache: boolean): boolean => servedFromCache || !lastSyncAt || now.getTime() - new Date(lastSyncAt).getTime() > STALE_AFTER_MS;
const staleWord = (lastSyncAt: string | null, servedFromCache: boolean): string => `stale: ${servedFromCache ? 'served from the cache, ' : ''}last successful sync ${lastSyncAt ?? 'never'}`;
const vaultIndexKey = (input: KnowledgeInput): string => input.accountName.trim().toLowerCase();

const DEFAULT_SELLERS = ['Casey Larkin', 'Jake Koppinger', 'Casey', 'Jake'];
const PRIVATE_RE = /\b(wife|husband|spouse|medical|pre-op|surgery|procedure|hospital|illness|sick|PTO|vacation|holiday|lives in|family|kids|child|children|pregnan|divorce|funeral|health)\b/i;
const ENGAGEMENT_RE = /\b(deck (views?|opens?|engagement|visitors?)|opened (the|our) .*deck|network deck|viewer|scanner|posthog|web engagement|sessions?|page views?|\/for views|demo views|already emailed|double-touch|outreach state|pulse:|intent score|heat)\b/i;
const MODELED_RE = /\(modeled\)|\bmodeled\b|\bmodel, not a quote\b|\$[\d.,]+\s?[MKB]?\/yr|\bpayback\b|estimate-margin|\bTAM\b/i;

export const hash8 = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 8);
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const normText = (s: string) => squash(s).toLowerCase().replace(/[^a-z0-9 ]+/g, '');
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const ISO_DAY = /\b(\d{4}-\d{2}-\d{2})\b/;
const isoDay = (s: string | null | undefined): string | null => (s ? ISO_DAY.exec(s)?.[1] ?? null : null);
const dayIso = (d: string | null): string | null => (d ? `${d}T00:00:00.000Z` : null);
const safeName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

/** ---------- markdown helpers (exported for the assembler's tests) ---------- */

export function parseFrontmatter(text: string): { fields: Record<string, string>; body: string } {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fields: {}, body: text };
  const fields: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { fields, body: text.slice(m[0].length) };
}

export interface NoteSection {
  heading: string;
  level: number;
  text: string;
}

export function sections(body: string): NoteSection[] {
  const out: NoteSection[] = [];
  let cur: NoteSection | null = null;
  for (const line of body.split(/\r?\n/)) {
    const h = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (h) {
      if (cur) out.push(cur);
      cur = { heading: h[2], level: h[1].length, text: '' };
    } else if (cur) cur.text += `${line}\n`;
    else if (line.trim()) cur = { heading: '', level: 0, text: `${line}\n` };
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ ...s, text: s.text.replace(/<!--[\s\S]*?-->/g, '').trim() }));
}

/** Bullets ("- x", "* x", "- [ ] x"), continuation lines joined; empty task boxes dropped. */
export function bullets(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const b = /^\s*[-*]\s+(?:\[[ xX]\]\s*)?(.*)$/.exec(raw);
    if (b) {
      if (b[1].trim()) out.push(b[1].trim());
    } else if (out.length && raw.trim() && /^\s{2,}/.test(raw)) out[out.length - 1] += ` ${raw.trim()}`;
  }
  return out;
}

export function paragraphs(text: string): string[] {
  return text.split(/\r?\n\s*\r?\n/).map((p) => squash(p)).filter((p) => p && !/^[-*|>]/.test(p) && !/^#/.test(p) && !/^\[\[/.test(p) && !/^TODO$/i.test(p));
}

/** The wiki-link names in a text ([[Name]], [[Name|alias]], [[Name#heading]]), in order, unique. */
export function wikiLinks(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
    const name = m[1].trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      out.push(name);
    }
  }
  return out;
}

/** ---------- classification (C18 vocabulary at the retrieval edge) ---------- */

export interface Classified {
  claimClass: ClaimClass;
  authority: Authority;
  visibility: ContextVisibility;
  personal: boolean;
}

function mentionsOther(text: string, others: readonly string[]): boolean {
  const t = text.toLowerCase();
  return others.some((o) => o.trim().length >= 3 && new RegExp(`\\b${o.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t));
}

/** A seller's vault text: modeled stays modeled; engagement and private detail stay internal-only; the rest is the seller's own read. */
export function classifyVaultText(text: string, opts: { section?: string; buyer?: boolean; others?: readonly string[] } = {}): Classified {
  const personal = PRIVATE_RE.test(text);
  const section = opts.section ?? '';
  if (opts.buyer) {
    const external = !personal && !mentionsOther(text, opts.others ?? []);
    return { claimClass: 'buyer_said', authority: 'buyer_words', visibility: external ? 'external_ok' : 'internal', personal };
  }
  if (/prize|modeled|model/i.test(section) || MODELED_RE.test(text)) return { claimClass: 'modeled', authority: 'modeled', visibility: 'internal', personal };
  if (personal || ENGAGEMENT_RE.test(text) || /live signals|ecosystem engagement|deck engagement/i.test(section)) return { claimClass: 'internal_only', authority: 'seller_interpretation', visibility: 'internal', personal };
  return { claimClass: 'seller_noted', authority: 'seller_interpretation', visibility: 'internal', personal };
}

/** ---------- the vault ---------- */

interface VaultCtx {
  input: KnowledgeInput;
  names: string[];
  nameRe: RegExp;
  others: string[];
  sellers: string[];
  claims: ContextClaim[];
  truncated: string[];
}

function claimOf(ctx: VaultCtx, x: { path: string; heading: string; text: string; eventAt: string | null; observedAt: string | null; indexedAt: string | null; version?: string | null; about?: ContextClaim['about']; subjectId?: string; classified: Classified }): ContextClaim | null {
  const text = squash(x.text).slice(0, CLAIM_TEXT_MAX);
  if (!text) return null;
  const sourceId = `vault:${x.path}#${x.heading || 'body'}`;
  return {
    claimId: `${sourceId}:${hash8(text)}`,
    sourceId,
    sourceKind: 'vault',
    authority: x.classified.authority,
    eventAt: x.eventAt,
    observedAt: x.observedAt,
    indexedAt: x.indexedAt,
    url: null,
    version: x.version ?? x.observedAt?.slice(0, 10) ?? null,
    completeness: 'complete',
    visibility: x.classified.visibility,
    text,
    claimClass: x.classified.claimClass,
    about: x.about ?? 'account',
    subjectId: x.subjectId ?? ctx.input.accountName,
  };
}

function push(ctx: VaultCtx, c: ContextClaim | null): void {
  if (!c) return;
  if (ctx.claims.length >= MAX_CLAIMS) {
    if (!ctx.truncated.includes('claim bound')) ctx.truncated.push('claim bound');
    return;
  }
  if (ctx.claims.some((k) => k.claimId === c.claimId)) return;
  ctx.claims.push(c);
}

/** The account note: frontmatter next_action, then every section (bullets when it has them, else its first two paragraphs). */
function accountNoteClaims(ctx: VaultCtx, path: string, text: string): { links: string[]; indexedAt: string | null } {
  const { fields, body } = parseFrontmatter(text);
  const indexedAt = dayIso(isoDay(fields.last_refreshed)) ?? dayIso(isoDay(fields.last_touched)) ?? null;
  const links: string[] = [];
  if (fields.next_action) push(ctx, claimOf(ctx, { path, heading: 'next_action', text: fields.next_action, eventAt: dayIso(isoDay(fields.next_action_due)), observedAt: null, indexedAt, classified: classifyVaultText(fields.next_action, { others: ctx.others }) }));
  for (const s of sections(body)) {
    if (!s.heading) continue;
    const items = bullets(s.text);
    const dated = /inbox notes|next action|history|timeline|touches|notes/i.test(s.heading);
    const pick = items.length ? items : paragraphs(s.text).slice(0, 2);
    if (items.length > MAX_CLAIMS_PER_SECTION) ctx.truncated.push(`${s.heading}: ${items.length - MAX_CLAIMS_PER_SECTION} more bullets not read`);
    // C57 F4 (C15 at the vault path): a section that is a SYNC block ("Live signals (clawd, 2026-10-08)", "Ecosystem engagement
    // (PostHog, 45d to 2026-08-31)") carries a stamp in its heading: that date is when the block was written, the index time, never
    // what its bullets observed (a July wedge under an October stamp stays July or undated). Only a bullet's own leading date is its observation.
    const syncSection = /live signals|ecosystem engagement|clawd|posthog|sync|refreshed|rebuilt/i.test(s.heading);
    const headDate = isoDay(s.heading);
    const sectionIndexedAt = syncSection && headDate ? dayIso(headDate) : indexedAt;
    for (const item of pick.slice(0, MAX_CLAIMS_PER_SECTION)) {
      const own = dated || syncSection ? isoDay(item.slice(0, 24)) : null;
      const observedAt = dayIso(own) ?? (syncSection ? null : dayIso(headDate));
      const clean = item.replace(/\s*Source:\s*(\[\[[^\]]+\]\],?\s*)+\.?$/i, '').replace(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g, '$1');
      push(ctx, claimOf(ctx, { path, heading: s.heading, text: clean, eventAt: observedAt, observedAt, indexedAt: sectionIndexedAt, classified: classifyVaultText(clean, { section: s.heading, others: ctx.others }) }));
      if (dated || /committee|sources|provenance/i.test(s.heading)) for (const l of wikiLinks(item)) if (!links.includes(l)) links.push(l);
    }
  }
  return { links, indexedAt };
}

const matchesAccount = (ctx: VaultCtx, value: string | undefined): boolean => !!value && ctx.names.some((n) => n.toLowerCase() === value.trim().toLowerCase());

function meetingNoteClaims(ctx: VaultCtx, path: string, text: string): 'ok' | 'other_account' {
  const { fields, body } = parseFrontmatter(text);
  if (fields.account && !matchesAccount(ctx, fields.account)) return 'other_account';
  const date = dayIso(isoDay(fields.date) ?? isoDay(path));
  const about = matchesAccount(ctx, fields.account);
  if (fields.outcome && about) push(ctx, claimOf(ctx, { path, heading: 'outcome', text: fields.outcome, eventAt: date, observedAt: date, indexedAt: null, classified: classifyVaultText(fields.outcome, { others: ctx.others }) }));
  for (const s of sections(body)) {
    if (!s.heading) continue;
    const buyer = /buyer words|verbatim|they said/i.test(s.heading);
    const narrative = /what actually happened|debrief|outcome|commitments|next|decisions|asks/i.test(s.heading);
    if (!buyer && !narrative) continue;
    const items = bullets(s.text);
    const pick = items.length ? items : paragraphs(s.text).slice(0, 3);
    for (const item of pick.slice(0, MAX_CLAIMS_PER_SECTION)) {
      // A standup or internal note with no account field: only the spans that mention the account.
      if (!about && !ctx.nameRe.test(item)) continue;
      const clean = item.replace(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g, '$1');
      push(ctx, claimOf(ctx, { path, heading: s.heading, text: clean, eventAt: date, observedAt: date, indexedAt: null, classified: classifyVaultText(clean, { section: s.heading, buyer, others: ctx.others }) }));
    }
  }
  return 'ok';
}

function transcriptClaims(ctx: VaultCtx, path: string, text: string): void {
  const { fields, body } = parseFrontmatter(text);
  const date = dayIso(isoDay(fields.captured) ?? isoDay(fields.date) ?? isoDay(path));
  const participants = (fields.participants ?? '').toLowerCase();
  const buyerCall = !!ctx.input.domain && participants.includes(`@${ctx.input.domain.toLowerCase()}`);
  let spans = 0;
  for (const s of sections(body)) {
    const transcript = /transcript/i.test(s.heading);
    const actions = /action items|summary/i.test(s.heading);
    if (!transcript && !actions) continue;
    const units = transcript ? s.text.split(/\r?\n\s*\r?\n/).map(squash).filter(Boolean) : bullets(s.text).concat(s.text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[-*#]/.test(l)));
    for (const u of units) {
      if (!ctx.nameRe.test(u)) continue;
      if (spans >= MAX_TRANSCRIPT_SPANS) {
        ctx.truncated.push(`${path}: more spans mention the account than the bound of ${MAX_TRANSCRIPT_SPANS}`);
        return;
      }
      const sp = /^\*\*([^*:]+):\*\*\s*(.*)$/.exec(u) ?? /^([A-Z][A-Za-z.' -]{1,40}):\s+(.*)$/.exec(u);
      const speaker = sp?.[1]?.trim() ?? null;
      const said = sp?.[2] ?? u;
      const buyer = buyerCall && !!speaker && !ctx.sellers.some((n) => n.toLowerCase() === speaker.toLowerCase());
      push(ctx, claimOf(ctx, { path, heading: s.heading || 'Transcript', text: speaker ? `${speaker}: ${said}` : said, eventAt: date, observedAt: date, indexedAt: null, classified: classifyVaultText(said, { section: s.heading, buyer, others: ctx.others }) }));
      spans += 1;
    }
  }
}

function personNoteClaims(ctx: VaultCtx, path: string, text: string): 'ok' | 'other_account' {
  const { fields, body } = parseFrontmatter(text);
  if (fields.company && !matchesAccount(ctx, fields.company)) return 'other_account';
  const subject = (fields.email || fields.name || path).trim();
  const observedAt = dayIso(isoDay(fields.last_touched));
  const role = [fields.name, fields.title, fields.role ? `role ${fields.role}` : null, fields.seniority].filter(Boolean).join(', ');
  if (role) push(ctx, claimOf(ctx, { path, heading: 'frontmatter', text: role, eventAt: null, observedAt, indexedAt: null, about: 'person', subjectId: subject, classified: classifyVaultText(role, { others: ctx.others }) }));
  for (const s of sections(body)) {
    if (!/why they matter|hot button|likely objection|how to win|provenance/i.test(s.heading)) continue;
    for (const p of paragraphs(s.text).slice(0, 2)) push(ctx, claimOf(ctx, { path, heading: s.heading, text: p.replace(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g, '$1'), eventAt: null, observedAt, indexedAt: null, about: 'person', subjectId: subject, classified: classifyVaultText(p, { section: s.heading, others: ctx.others }) }));
  }
  return 'ok';
}

type Located = { path: string; kind: 'meeting' | 'raw' | 'person' | 'deal' };

/** Where a wiki-link name may live; a dated name is a meeting note or a raw transcript first. */
async function locate(vault: VaultAdapter, name: string): Promise<{ loc: Located; text: string } | null> {
  const file = `${safeName(name)}.md`;
  const order: Located[] = /^\d{4}-\d{2}-\d{2}-/.test(name)
    ? [{ path: `00_Inbox/raw/${file}`, kind: 'raw' }, { path: `05_Meetings/${file}`, kind: 'meeting' }]
    : /^\d{4}-\d{2}-\d{2}\s/.test(name)
      ? [{ path: `05_Meetings/${file}`, kind: 'meeting' }, { path: `00_Inbox/raw/${file}`, kind: 'raw' }]
      : [{ path: `03_People/${file}`, kind: 'person' }, { path: `05_Meetings/${file}`, kind: 'meeting' }, { path: `04_Deals/${file}`, kind: 'deal' }];
  for (const loc of order) {
    const text = await vault.readFile(loc.path);
    if (text) return { loc, text };
  }
  return null;
}

const linkDate = (name: string) => isoDay(name) ?? '';

/** "92 calls, 78 account notes, 85 meeting notes": the counts a table-backed vault reports (stream A). */
function vaultSummaryWords(s: { rows: number; kinds: Record<string, number> }): string {
  const parts: string[] = [];
  const say = (n: number | undefined, one: string, many: string) => (n ?? 0) > 0 && parts.push(`${n} ${n === 1 ? one : many}`);
  say(s.kinds.raw, 'call', 'calls');
  say(s.kinds.account, 'account note', 'account notes');
  say(s.kinds.meeting, 'meeting note', 'meeting notes');
  say(s.kinds.deal, 'deal note', 'deal notes');
  say(s.kinds.person, 'people note', 'people notes');
  return parts.length ? parts.join(', ') : `${s.rows} notes`;
}

type VaultRead = { claims: ContextClaim[]; coverage: SourceCoverage; followed: string[]; notFollowed: AccountKnowledge['notFollowed']; sync: SyncReport; tombstones: Tombstone[] };

const liveClaims = (index: VaultIndex | ClawdIndex): ContextClaim[] => [...index.claims.values()].filter((c) => !index.tombstones.has(c.claimId));

async function retrieveVault(vault: VaultAdapter | null | undefined, input: KnowledgeInput): Promise<VaultRead> {
  const names = [input.accountName, ...(input.aliases ?? [])].map((n) => n.trim()).filter(Boolean);
  const others = (input.otherAccounts ?? []).filter((o) => !names.some((n) => n.toLowerCase() === o.toLowerCase()));
  const ctx: VaultCtx = { input, names, nameRe: new RegExp(`\\b(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i'), others, sellers: [...(input.sellerNames ?? DEFAULT_SELLERS)], claims: [], truncated: [] };
  const followed: string[] = [];
  const notFollowed: AccountKnowledge['notFollowed'] = [];
  const nowIso = input.now.toISOString();
  const cache = input.cache ?? null;
  let index: VaultIndex | null = cache ? cache.vault.get(vaultIndexKey(input)) ?? null : null;
  if (cache && !index) {
    index = { files: new Map(), claims: new Map(), tombstones: new Map(), lastSyncAt: null };
    cache.vault.set(vaultIndexKey(input), index);
  }
  const sync: SyncReport = { source: 'vault', lastSyncAt: index?.lastSyncAt ?? null, stale: false, servedFromCache: false, refreshed: [], reused: [], tombstoned: [] };
  const history = () => (index ? [...index.tombstones.values()] : []);
  const cov = (over: Partial<SourceCoverage>): SourceCoverage => ({ source: 'vault', configured: !!vault, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, query: null, omittedReason: null, ...over });
  if (!vault) return { claims: [], coverage: cov({ omittedReason: 'no vault configured' }), followed, notFollowed, sync: { ...sync, stale: true }, tombstones: history() };
  // Stream A: a table-backed vault reports its status first; an empty table is not a configured vault, an unreadable one is said so.
  let tableStatus: { rows: number; syncedAt: string | null; kinds: Record<string, number> } | null = null;
  if (vault.status) {
    try {
      tableStatus = await vault.status();
    } catch (err) {
      const cached = index ? liveClaims(index) : [];
      return { claims: cached, coverage: cov({ omittedReason: `vault unreadable: ${err instanceof Error ? err.message : String(err)}` }), followed, notFollowed, sync: { ...sync, stale: true, servedFromCache: cached.length > 0 }, tombstones: history() };
    }
    if (tableStatus && tableStatus.rows === 0) return { claims: [], coverage: cov({ configured: false, omittedReason: 'no vault configured (the knowledge table is empty; run the vault sync)' }), followed, notFollowed, sync: { ...sync, stale: true }, tombstones: history() };
  }
  const tableWords: { indexedAt?: string | null; summary?: string } = tableStatus ? { indexedAt: tableStatus.syncedAt, summary: vaultSummaryWords(tableStatus) } : {};

  // C48: a chunk is tombstoned with the reason and kept in the history; it is never served again from the cache.
  const tombstone = (id: string, reason: Tombstone['reason']) => {
    if (!index) return;
    const claim = index.claims.get(id);
    if (!claim || index.tombstones.has(id)) return;
    index.tombstones.set(id, { claim, at: nowIso, reason });
    sync.tombstoned.push(id);
  };
  const tombstoneFile = (path: string) => {
    const entry = index?.files.get(path);
    if (!entry) return;
    for (const id of entry.claimIds) tombstone(id, 'deleted');
    index!.files.delete(path);
  };
  /** Ingest one file: an unchanged hash reuses its chunks; a changed one is parsed, its vanished chunks tombstoned. */
  const ingest = (path: string, text: string, parse: () => { links?: string[]; indexedAt?: string | null } | void): { links: string[]; indexedAt: string | null } => {
    const hash = hash8(text);
    const entry = index?.files.get(path);
    if (index && entry && entry.hash === hash) {
      for (const id of entry.claimIds) {
        const c = index.claims.get(id);
        if (c && !index.tombstones.has(id)) push(ctx, c);
      }
      sync.reused.push(path);
      return { links: entry.links ?? [], indexedAt: entry.indexedAt ?? null };
    }
    const before = ctx.claims.length;
    const parsed = parse() ?? {};
    const mine = ctx.claims.slice(before).filter((c) => c.claimId.startsWith(`vault:${path}#`));
    const ids = mine.map((c) => c.claimId);
    if (index) {
      for (const oldId of entry?.claimIds ?? []) {
        if (ids.includes(oldId)) continue;
        const old = index.claims.get(oldId);
        tombstone(oldId, old && mine.some((c) => c.sourceId === old.sourceId) ? 'superseded' : 'deleted');
      }
      for (const c of mine) index.claims.set(c.claimId, c);
      index.files.set(path, { hash, claimIds: ids, readAt: nowIso, links: parsed.links, indexedAt: parsed.indexedAt ?? null });
    }
    sync.refreshed.push(path);
    return { links: parsed.links ?? [], indexedAt: parsed.indexedAt ?? null };
  };

  let accountPath: string | null = null;
  let text: string | null = null;
  try {
    for (const n of names) {
      const p = `02_Accounts/${safeName(n)}.md`;
      text = await vault.readFile(p);
      if (text) {
        accountPath = p;
        break;
      }
      if (index?.files.has(p)) tombstoneFile(p);
    }
  } catch (err) {
    // Unreadable: the cache's last successful sync is served, said stale with its time; never a fabricated empty.
    const cached = index ? liveClaims(index) : [];
    const stale = { ...sync, stale: true, servedFromCache: cached.length > 0 };
    return { claims: cached, coverage: cov({ query: `02_Accounts/${safeName(input.accountName)}.md`, indexedAt: index?.lastSyncAt ?? null, omittedReason: [`vault unreadable: ${err instanceof Error ? err.message : String(err)}`, index?.lastSyncAt || cached.length ? staleWord(index?.lastSyncAt ?? null, cached.length > 0) : ''].filter(Boolean).join('; ') }), followed, notFollowed, sync: stale, tombstones: history() };
  }
  if (!accountPath || !text) {
    if (index) index.lastSyncAt = nowIso;
    return { claims: [], coverage: cov({ reachable: true, completeness: 'complete', query: `02_Accounts/${safeName(input.accountName)}.md`, omittedReason: 'no account note', ...tableWords }), followed, notFollowed, sync: { ...sync, lastSyncAt: nowIso }, tombstones: history() };
  }
  const { links, indexedAt } = ingest(accountPath, text, () => accountNoteClaims(ctx, accountPath!, text!));
  if (input.followLinks !== false) {
    // Dated notes newest first, then people; the bound is a count of files, said in the coverage when hit.
    const ordered = [...links].sort((a, b) => linkDate(b).localeCompare(linkDate(a)));
    for (const name of ordered) {
      if (followed.length >= MAX_LINKED_NOTES) {
        notFollowed.push({ link: name, reason: 'bound' });
        continue;
      }
      let hit: Awaited<ReturnType<typeof locate>>;
      try {
        hit = await locate(vault, name);
      } catch {
        notFollowed.push({ link: name, reason: 'unreadable' });
        continue;
      }
      if (!hit) {
        notFollowed.push({ link: name, reason: 'not_found' });
        // A note that was indexed and now reads as absent: its chunks are tombstoned, never served from the cache again.
        if (index) for (const path of [...index.files.keys()]) if (path.endsWith(`/${safeName(name)}.md`)) tombstoneFile(path);
        continue;
      }
      const { loc, text: body } = hit;
      const res = { r: 'ok' as 'ok' | 'other_account' };
      ingest(loc.path, body, () => {
        res.r = loc.kind === 'meeting' ? meetingNoteClaims(ctx, loc.path, body) : loc.kind === 'person' ? personNoteClaims(ctx, loc.path, body) : loc.kind === 'raw' ? (transcriptClaims(ctx, loc.path, body), 'ok') : 'ok';
      });
      if (res.r === 'other_account') notFollowed.push({ link: name, reason: 'other_account' });
      else followed.push(loc.path);
    }
  }
  if (index) index.lastSyncAt = nowIso;
  sync.lastSyncAt = nowIso;
  const partial = ctx.truncated.length > 0 || notFollowed.some((n) => n.reason === 'bound' || n.reason === 'unreadable');
  // The newest OBSERVED date of a claim that is knowledge (a due date in next_action's eventAt is not a watermark; C57 F4: an
  // internal-only or modeled line, such as a sync block's bullets, never makes the source look fresh).
  const watermark = ctx.claims.filter((c) => c.claimClass !== 'internal_only' && c.claimClass !== 'modeled').map((c) => c.observedAt ?? '').filter(Boolean).sort().at(-1) ?? null;
  const omitted = [...ctx.truncated, ...notFollowed.filter((n) => n.reason !== 'other_account' && n.reason !== 'not_found').map((n) => `${n.link}: ${n.reason}`)];
  return { claims: ctx.claims, coverage: cov({ reachable: true, completeness: partial ? 'partial' : 'complete', watermark, query: accountPath, omittedReason: omitted.length ? omitted.join('; ') : null, ...tableWords, indexedAt: tableWords.indexedAt ?? indexedAt }), followed, notFollowed, sync, tombstones: history() };
}

/** ---------- Clawd ---------- */

export interface ParsedClawdNote {
  identity: string;
  version: string | null;
  text: string;
}

/** "<strong>Vault wedge (2026-07-10):</strong> text" -> identity "vault wedge", version "2026-07-10"; "HubSpot: text" -> identity "hubspot", no version. */
export function parseClawdNote(raw: string): ParsedClawdNote | null {
  const s = squash(stripHtml(raw));
  if (!s) return null;
  const dated = /^([^(:]{2,60}?)\s*\((\d{4}-\d{2}-\d{2})\)\s*:\s*(.+)$/.exec(s);
  if (dated) return { identity: dated[1].trim().toLowerCase(), version: dated[2], text: dated[3].trim() };
  const labelled = /^([^:]{2,40}):\s+(.+)$/.exec(s);
  if (labelled && !/^https?$/i.test(labelled[1])) return { identity: labelled[1].trim().toLowerCase(), version: isoDay(labelled[1]), text: labelled[2].trim() };
  return { identity: 'note', version: null, text: s };
}

/**
 * C16: the snapshot's notes as claims, by identity and version. The newest version of each identity is current; an
 * older identical text is dropped; an older different text is kept, superseded by and in conflict with the current one.
 * Order independent: the result is sorted by identity, version (newest first) and text before ids are assigned.
 */
export function clawdClaims(snapshot: ClawdSnapshot, input: Pick<KnowledgeInput, 'accountName' | 'otherAccounts'>): ContextClaim[] {
  const indexedAt = snapshot.rebuiltAt;
  const parsed = snapshot.reasoningNotes.map(parseClawdNote).filter((n): n is ParsedClawdNote => !!n);
  const byIdentity = new Map<string, ParsedClawdNote[]>();
  for (const n of parsed) byIdentity.set(n.identity, [...(byIdentity.get(n.identity) ?? []), n]);
  const out: ContextClaim[] = [];
  for (const identity of [...byIdentity.keys()].sort()) {
    const versions = byIdentity.get(identity)!.sort((a, b) => (b.version ?? '').localeCompare(a.version ?? '') || a.text.localeCompare(b.text));
    const seen = new Set<string>();
    let current: ContextClaim | null = null;
    for (const n of versions) {
      const key = normText(n.text);
      if (seen.has(key)) continue; // an identical copy, whatever its date: one claim
      seen.add(key);
      const sourceId = `clawd:${identity}:${n.version ?? 'undated'}`;
      const cls = classifyVaultText(n.text, { section: identity, others: input.otherAccounts });
      const claim: ContextClaim = {
        claimId: `${sourceId}:${hash8(n.text)}`,
        sourceId,
        sourceKind: 'clawd',
        authority: cls.authority,
        eventAt: null,
        observedAt: dayIso(n.version),
        indexedAt,
        url: null,
        version: n.version,
        completeness: 'complete',
        visibility: 'internal',
        text: n.text.slice(0, CLAIM_TEXT_MAX),
        claimClass: cls.claimClass,
        about: 'account',
        subjectId: input.accountName,
      };
      if (current) {
        claim.supersededBy = current.claimId;
        claim.conflictsWith = [current.claimId];
        current.conflictsWith = [...(current.conflictsWith ?? []), claim.claimId];
      } else current = claim;
      out.push(claim);
    }
  }
  return out;
}

type ClawdRead = { claims: ContextClaim[]; coverage: SourceCoverage; sync: SyncReport; tombstones: Tombstone[] };

async function retrieveClawd(clawd: ClawdAdapter | null | undefined, input: KnowledgeInput): Promise<ClawdRead> {
  const cov = (over: Partial<SourceCoverage>): SourceCoverage => ({ source: 'clawd', configured: !!clawd, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, query: input.domain ?? null, omittedReason: null, ...over });
  const nowIso = input.now.toISOString();
  const cache = input.cache ?? null;
  const key = (input.domain ?? '').toLowerCase();
  let index: ClawdIndex | null = cache && key ? cache.clawd.get(key) ?? null : null;
  if (cache && key && !index) {
    index = { rebuiltAt: null, claims: new Map(), tombstones: new Map(), lastSyncAt: null };
    cache.clawd.set(key, index);
  }
  const sync: SyncReport = { source: 'clawd', lastSyncAt: index?.lastSyncAt ?? null, stale: false, servedFromCache: false, refreshed: [], reused: [], tombstoned: [] };
  const history = () => (index ? [...index.tombstones.values()] : []);
  if (!clawd) return { claims: [], coverage: cov({ omittedReason: 'no clawd pair configured' }), sync: { ...sync, stale: true }, tombstones: history() };
  if (!input.domain) return { claims: [], coverage: cov({ reachable: true, completeness: 'complete', omittedReason: 'no domain to ask' }), sync, tombstones: history() };
  let snap: ClawdSnapshot;
  try {
    snap = await clawd.fetchSnapshot(input.domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cached = index ? liveClaims(index) : [];
    const reason = /abort|timeout/i.test(msg) ? 'timeout' : msg;
    return { claims: cached, coverage: cov({ indexedAt: index?.rebuiltAt ?? null, omittedReason: [reason, index?.lastSyncAt || cached.length ? staleWord(index?.lastSyncAt ?? null, cached.length > 0) : ''].filter(Boolean).join('; ') }), sync: { ...sync, stale: true, servedFromCache: cached.length > 0 }, tombstones: history() };
  }
  if (!snap.found) {
    if (index) {
      for (const id of [...index.claims.keys()]) if (!index.tombstones.has(id)) { index.tombstones.set(id, { claim: index.claims.get(id)!, at: nowIso, reason: 'deleted' }); sync.tombstoned.push(id); }
      index.lastSyncAt = nowIso;
    }
    return { claims: [], coverage: cov({ reachable: true, completeness: 'complete', indexedAt: snap.rebuiltAt, omittedReason: 'no snapshot for the domain' }), sync: { ...sync, lastSyncAt: nowIso }, tombstones: history() };
  }
  const claims = clawdClaims(snap, input);
  if (index) {
    const ids = new Set(claims.map((c) => c.claimId));
    const changed = index.rebuiltAt !== snap.rebuiltAt || [...ids].some((id) => !index!.claims.has(id)) || [...index.claims.keys()].some((id) => !ids.has(id) && !index!.tombstones.has(id));
    for (const [id, old] of index.claims) {
      if (ids.has(id) || index.tombstones.has(id)) continue;
      const identity = old.sourceId.split(':').slice(0, 2).join(':');
      index.tombstones.set(id, { claim: old, at: nowIso, reason: claims.some((c) => c.sourceId.startsWith(`${identity}:`)) ? 'superseded' : 'deleted' });
      sync.tombstoned.push(id);
    }
    for (const c of claims) index.claims.set(c.claimId, c);
    index.rebuiltAt = snap.rebuiltAt;
    index.lastSyncAt = nowIso;
    if (changed) sync.refreshed.push('snapshot');
    else sync.reused.push('snapshot');
  }
  sync.lastSyncAt = nowIso;
  const capped = snap.reasoningNotes.length >= CLAWD_NOTE_CAP;
  const watermark = claims.map((c) => c.observedAt ?? '').filter(Boolean).sort().at(-1) ?? null;
  return { claims, coverage: cov({ reachable: true, completeness: capped ? 'partial' : 'complete', watermark, indexedAt: snap.rebuiltAt, omittedReason: capped ? `the snapshot holds at most ${CLAWD_NOTE_CAP} notes` : null }), sync, tombstones: history() };
}

/** ---------- the one entry point ---------- */

export async function retrieveAccountKnowledge(adapters: KnowledgeAdapters, input: KnowledgeInput): Promise<AccountKnowledge> {
  const [v, c] = await Promise.all([retrieveVault(adapters.vault, input), retrieveClawd(adapters.clawd, input)]);
  const checked = validateClaims([...v.claims, ...c.claims]);
  // Built here, so every claim validates; a fault would be a bug, kept out and said in the coverage rather than passed on.
  const claims = checked.ok ? checked.claims : [...v.claims, ...c.claims].filter((k) => !checked.faults.some((f) => f.claimId === k.claimId));
  const coverage = [v.coverage, c.coverage].map((cv) => (checked.ok ? cv : { ...cv, omittedReason: [cv.omittedReason, `${checked.faults.length} claim(s) failed validation`].filter(Boolean).join('; ') }));
  // C48: a sync older than the window is stale even when the read succeeded from a cache with no fresh write.
  const syncedNow = input.now.toISOString();
  const sync = [v.sync, c.sync].map((x) => {
    const configured = x.source === 'vault' ? v.coverage.configured : c.coverage.configured;
    return { ...x, stale: x.stale || (configured && x.lastSyncAt !== syncedNow && stalenessOf(x.lastSyncAt, input.now, x.servedFromCache)) };
  });
  return { claims, coverage, followed: v.followed, notFollowed: v.notFollowed, sync, tombstones: [...v.tombstones, ...c.tombstones] };
}

/** The current (not superseded) claim of one Clawd identity, newest version; null when the snapshot holds none. */
export function currentClawdClaim(claims: readonly ContextClaim[], identity: string): ContextClaim | null {
  return claims.find((c) => c.sourceKind === 'clawd' && c.sourceId.startsWith(`clawd:${identity}:`) && !c.supersededBy) ?? null;
}
