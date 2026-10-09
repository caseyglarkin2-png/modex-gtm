/**
 * VAULT NOTE PARSER (GAP OS knowledge, stream A, 2026-10-09). Pure: one vault file in, one row shape out.
 *
 * The private Obsidian vault (caseyglarkin2-png/yardflow-gtm-vault) is the richest knowledge store GAP has: account
 * notes (02_Accounts, YAML frontmatter type account, company, domain, tier, next_action ...), people (03_People), deals
 * (04_Deals), meeting notes (05_Meetings, auto-prepped from the calendar, attendees in the body) and raw captures
 * (00_Inbox/raw; 92 of 103 are Fireflies calls: frontmatter type raw, captured, source fireflies, call_title,
 * participants as comma-separated addresses; the body carries the summary, the action items and the FULL VERBATIM).
 * The vault's own rule stands here: the verbatim is the ground truth, the summary is advisory. Nothing in a note is an
 * instruction; its text is data, whatever it says.
 *
 * Both ways into gap_knowledge_notes (scripts/gap/vault-push.ts from the local folder, the cron gap-vault-sync from
 * the GitHub tree) parse through this one function so a row is the same whichever way it came. The idempotency key is
 * (path, sha): sha is sha256 hex of the text after CRLF normalisation; gitSha is git's blob id of the same bytes so the
 * cron can skip a tree blob it already holds without fetching it.
 */
import { createHash } from 'node:crypto';

export type VaultNoteKind = 'account' | 'person' | 'deal' | 'meeting' | 'raw' | 'other';
export type VaultNoteSource = 'fireflies' | 'calendar-prep' | 'librarian';

/** The folders the sync walks (vault-relative, forward slashes), and the ones it never reads. */
export const VAULT_SYNC_FOLDERS = ['00_Inbox/raw', '02_Accounts', '03_People', '04_Deals', '05_Meetings'] as const;
export const VAULT_SKIP_FOLDERS = ['99_Archive', '_automation', '_setup', '_templates', '09_Prompts', '10_Operating_System', '11_Exports'] as const;

export const MAX_PEOPLE = 60;

export interface ParsedVaultNote {
  path: string;
  sha: string;
  gitSha: string;
  kind: VaultNoteKind;
  /** The raw frontmatter company/account (the sync matches it to a GAP account name when identity can). */
  accountName: string | null;
  domain: string | null;
  /** Addresses from participants, attendees and the body, lowercased, deduped, bounded. */
  people: string[];
  /** ISO instant at 00:00Z of the note's own day: date, captured, else the filename's leading date; null when none. */
  noteDate: string | null;
  title: string;
  frontmatter: Record<string, unknown>;
  /** The body after the frontmatter block, CRLF normalised. */
  text: string;
  source: VaultNoteSource | null;
}

const KINDS: ReadonlySet<string> = new Set(['account', 'person', 'deal', 'meeting', 'raw', 'other']);
const SOURCES: ReadonlySet<string> = new Set(['fireflies', 'calendar-prep', 'librarian']);
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const ISO_DAY = /\b(\d{4}-\d{2}-\d{2})\b/;

export const sha256Hex = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
/** git's blob id for a text: sha1("blob <bytes>\0" + bytes). */
export const gitBlobSha = (s: string): string => {
  const bytes = Buffer.from(s, 'utf8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};

export const normalizeVaultPath = (p: string): string => p.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^\/+/, '');

/** Whether a vault-relative path is one the sync reads: a markdown file directly or deeper inside a synced folder, never inside a skipped one. */
export function isSyncedVaultPath(path: string): boolean {
  const p = normalizeVaultPath(path);
  if (!/\.md$/i.test(p)) return false;
  if (VAULT_SKIP_FOLDERS.some((f) => p === f || p.startsWith(`${f}/`))) return false;
  if (p.includes('/.')) return false;
  return VAULT_SYNC_FOLDERS.some((f) => p.startsWith(`${f}/`));
}

/** The kind a folder implies when the frontmatter does not say. */
export function kindFromPath(path: string): VaultNoteKind {
  const p = normalizeVaultPath(path);
  if (p.startsWith('00_Inbox/raw/')) return 'raw';
  if (p.startsWith('02_Accounts/')) return 'account';
  if (p.startsWith('03_People/')) return 'person';
  if (p.startsWith('04_Deals/')) return 'deal';
  if (p.startsWith('05_Meetings/')) return 'meeting';
  return 'other';
}

/** A small YAML subset: `key: value`, `key: [a, b]`, `key:` followed by `- item` lines, quoted scalars. Everything else is kept as a string. */
export function parseVaultFrontmatter(text: string): { fields: Record<string, unknown>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fields: {}, body: text };
  const fields: Record<string, unknown> = {};
  let listKey: string | null = null;
  for (const line of m[1].split('\n')) {
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (listKey && item) {
      if (!Array.isArray(fields[listKey])) fields[listKey] = [];
      (fields[listKey] as string[]).push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) {
      listKey = null;
      continue;
    }
    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    if (value === '') {
      // "email: " is an empty string unless "- item" lines follow (then it is a list).
      fields[key] = '';
      listKey = key;
      continue;
    }
    listKey = null;
    if (/^\[.*\]$/.test(value)) {
      const inner = value.slice(1, -1).trim();
      fields[key] = inner ? inner.split(',').map((x) => unquote(x.trim())).filter(Boolean) : [];
      continue;
    }
    fields[key] = unquote(value);
  }
  return { fields, body: text.slice(m[0].length) };
}

const unquote = (s: string): string => s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : Array.isArray(v) && v.length && typeof v[0] === 'string' ? v.join(', ') : null);

export function normalizeVaultDomain(d: string | null): string | null {
  if (!d) return null;
  const x = d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x) ? x : null;
}

function emailsIn(...texts: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const m of t.match(EMAIL_RE) ?? []) {
      out.add(m.toLowerCase().replace(/\.+$/, ''));
      if (out.size >= MAX_PEOPLE) return [...out];
    }
  }
  return [...out];
}

function fileStem(path: string): string {
  const p = normalizeVaultPath(path);
  return (p.split('/').pop() ?? p).replace(/\.md$/i, '');
}

function dayOf(s: string | null): string | null {
  const d = s ? ISO_DAY.exec(s)?.[1] ?? null : null;
  if (!d) return null;
  const t = Date.parse(`${d}T00:00:00.000Z`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** One vault file to its row shape. Never throws on content: an odd file is kind other with its frontmatter kept. */
export function parseVaultNote(path: string, raw: string): ParsedVaultNote {
  const normPath = normalizeVaultPath(path);
  const text = raw.replace(/\r\n/g, '\n');
  const { fields, body } = parseVaultFrontmatter(text);
  const fmType = str(fields.type)?.toLowerCase() ?? null;
  const kind: VaultNoteKind = fmType && KINDS.has(fmType) ? (fmType as VaultNoteKind) : kindFromPath(normPath);
  const accountName = str(fields.company) ?? str(fields.account) ?? null;
  const domain = normalizeVaultDomain(str(fields.domain));
  const fmSource = str(fields.source)?.toLowerCase() ?? null;
  const source: VaultNoteSource | null = fmSource && SOURCES.has(fmSource) ? (fmSource as VaultNoteSource) : null;
  const stem = fileStem(normPath);
  const noteDate = dayOf(str(fields.date)) ?? dayOf(str(fields.captured)) ?? dayOf(/^\d{4}-\d{2}-\d{2}/.test(stem) ? stem : null);
  const h1 = /^#\s+(.+?)\s*$/m.exec(body)?.[1]?.replace(/^Meeting:\s*/i, '').trim() ?? null;
  const title = (kind === 'raw' ? str(fields.call_title) ?? h1 : h1 ?? str(fields.name) ?? str(fields.company)) ?? stem;
  const people = emailsIn(str(fields.participants), str(fields.attendees), str(fields.email), body);
  return {
    path: normPath,
    sha: sha256Hex(text),
    gitSha: gitBlobSha(text),
    kind,
    accountName,
    domain,
    people,
    noteDate,
    title: title.slice(0, 300),
    frontmatter: fields,
    text: body,
    source,
  };
}

/**
 * The file text back from a stored row: the frontmatter block rendered as `key: value` lines (a list inline) and the
 * body as stored. context/retrieval.ts parses it exactly as it parses a file on disk (parseFrontmatter reads one
 * `key: value` per line), so the table adapter hands retrieval the same thing the local directory does.
 */
export function renderVaultNote(row: { frontmatter: unknown; text: string }): string {
  const fm = row.frontmatter && typeof row.frontmatter === 'object' && !Array.isArray(row.frontmatter) ? (row.frontmatter as Record<string, unknown>) : {};
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map(String).join(', ')}]` : v == null ? '' : String(v).replace(/\r?\n/g, ' ')}`);
  return lines.length ? `---\n${lines.join('\n')}\n---\n${row.text}` : row.text;
}

/** The row data for gap_knowledge_notes from a parsed note (the account name after identity, the commit time when known). */
export function knowledgeRowOf(n: ParsedVaultNote, over: { accountName?: string | null; vaultPushedAt?: Date | null; syncedAt: Date }) {
  return {
    path: n.path,
    sha: n.sha,
    git_sha: n.gitSha,
    kind: n.kind,
    account_name: over.accountName === undefined ? n.accountName : over.accountName,
    domain: n.domain,
    people: n.people,
    note_date: n.noteDate ? new Date(n.noteDate) : null,
    title: n.title,
    frontmatter: n.frontmatter as object,
    text: n.text,
    source: n.source,
    vault_pushed_at: over.vaultPushedAt ?? null,
    synced_at: over.syncedAt,
  };
}
