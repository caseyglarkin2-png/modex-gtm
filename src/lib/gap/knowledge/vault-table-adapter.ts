/**
 * THE VAULT FROM THE TABLE (GAP OS knowledge, stream A, 2026-10-09). Production cannot read the vault folder; it reads
 * gap_knowledge_notes, filled by scripts/gap/vault-push.ts (local) and the cron gap-vault-sync (the GitHub tree).
 *
 *   vaultTableAdapter(prisma)   a context/retrieval.ts VaultAdapter: readFile(relPath) is the stored note rendered back
 *                               to its file text (null when absent; throws when the table cannot be read); status()
 *                               says how many rows, when the newest was synced and the counts by kind, so the coverage
 *                               can say "the vault (synced 10:39, 92 calls, 78 account notes)" instead of "not configured".
 *   vaultTableStatus(prisma)    the same status on its own (health).
 *   knowledgeForAccount(...)    the notes about one account, newest first, bounded: the account note, its meeting and
 *                               deal and people notes, and the raw calls whose participants belong to the account's
 *                               domains or to the people GAP has placed at the account. For builders B and C.
 *
 * Nothing here writes. A note's text is data, whatever it says.
 */
import type { VaultAdapter } from '../context/retrieval';
import { normalizeVaultPath, renderVaultNote, type VaultNoteKind, type VaultNoteSource } from './vault-note';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const KNOWLEDGE_DEFAULT_LIMIT = 40;
export const KNOWLEDGE_MAX_LIMIT = 200;

export interface VaultTableStatus {
  rows: number;
  /** ISO of the newest synced_at; null when the table is empty */
  syncedAt: string | null;
  kinds: Record<VaultNoteKind, number>;
}

export interface TableVaultAdapter extends VaultAdapter {
  status: () => Promise<VaultTableStatus>;
}

const KINDS: readonly VaultNoteKind[] = ['account', 'person', 'deal', 'meeting', 'raw', 'other'];

export async function vaultTableStatus(prisma: PrismaLike): Promise<VaultTableStatus> {
  const t = prisma?.gapKnowledgeNote;
  if (!t || typeof t.count !== 'function') throw new Error('gap_knowledge_notes not readable');
  const [rows, newest, ...perKind] = await Promise.all([
    t.count() as Promise<number>,
    t.findFirst({ orderBy: { synced_at: 'desc' }, select: { synced_at: true } }) as Promise<{ synced_at: Date | string } | null>,
    ...KINDS.map((kind) => t.count({ where: { kind } }) as Promise<number>),
  ]);
  const kinds = Object.fromEntries(KINDS.map((k, i) => [k, perKind[i] ?? 0])) as Record<VaultNoteKind, number>;
  return { rows, syncedAt: newest ? new Date(newest.synced_at).toISOString() : null, kinds };
}

/** The adapter retrieval reads through; the status is read once per adapter instance (one page, one tick). */
export function vaultTableAdapter(prisma: PrismaLike): TableVaultAdapter {
  let status: Promise<VaultTableStatus> | null = null;
  return {
    readFile: async (relPath: string) => {
      const t = prisma?.gapKnowledgeNote;
      if (!t || typeof t.findUnique !== 'function') throw new Error('gap_knowledge_notes not readable');
      const path = normalizeVaultPath(relPath);
      const row = (await t.findUnique({ where: { path }, select: { frontmatter: true, text: true } })) as { frontmatter: unknown; text: string } | null;
      if (row) return renderVaultNote(row);
      // The retrieval asks for the account note by the GAP account name ("02_Accounts/Kenco.md"); the vault names the file by the
      // company as the vault knows it ("Kenco Logistics.md"). The note whose RESOLVED account is that name answers (case-insensitive).
      const m = /^02_Accounts\/(.+)\.md$/.exec(path);
      if (m && typeof t.findFirst === 'function') {
        const byAccount = (await t.findFirst({ where: { kind: 'account', account_name: { equals: m[1], mode: 'insensitive' } }, orderBy: [{ synced_at: 'desc' }], select: { frontmatter: true, text: true } })) as { frontmatter: unknown; text: string } | null;
        if (byAccount) return renderVaultNote(byAccount);
      }
      return null;
    },
    status: () => (status ??= vaultTableStatus(prisma)),
  };
}

/** The words the coverage carries beside the sync time ("92 calls, 78 account notes, 85 meeting notes"). */
export function vaultTableSummary(s: VaultTableStatus): string {
  const parts: string[] = [];
  const say = (n: number, one: string, many: string) => n > 0 && parts.push(`${n} ${n === 1 ? one : many}`);
  say(s.kinds.raw, 'call', 'calls');
  say(s.kinds.account, 'account note', 'account notes');
  say(s.kinds.meeting, 'meeting note', 'meeting notes');
  say(s.kinds.deal, 'deal note', 'deal notes');
  say(s.kinds.person, 'people note', 'people notes');
  return parts.length ? parts.join(', ') : `${s.rows} notes`;
}

export type KnowledgeMatch = 'account' | 'domain' | 'person';

export interface AccountKnowledgeNote {
  id: string;
  path: string;
  kind: VaultNoteKind;
  title: string;
  /** the note's own day (ISO at 00:00Z) or null */
  noteDate: string | null;
  source: VaultNoteSource | null;
  people: string[];
  accountName: string | null;
  domain: string | null;
  frontmatter: Record<string, unknown>;
  /** the body (a raw capture carries the summary, the action items and the full verbatim) */
  text: string;
  syncedAt: string;
  vaultPushedAt: string | null;
  /** why the note is about this account */
  matchedBy: KnowledgeMatch;
}

export interface AccountKnowledgeSet {
  accountName: string;
  /** the 02_Accounts note, when one is on record */
  accountNote: AccountKnowledgeNote | null;
  meetings: AccountKnowledgeNote[];
  /** raw captures (Fireflies calls and other captures), newest first */
  calls: AccountKnowledgeNote[];
  deals: AccountKnowledgeNote[];
  people: AccountKnowledgeNote[];
  other: AccountKnowledgeNote[];
  /** everything above, newest first, within the limit */
  all: AccountKnowledgeNote[];
  truncated: boolean;
  /** the domains and placed addresses the raw calls were matched against */
  matchedDomains: string[];
  matchedAddresses: string[];
}

const INTERNAL_DOMAINS = new Set(['freightroll.com', 'yardflow.ai']);

const noteOf = (r: Record<string, unknown>, matchedBy: KnowledgeMatch): AccountKnowledgeNote => ({
  id: String(r.id),
  path: String(r.path),
  kind: (KINDS.includes(r.kind as VaultNoteKind) ? r.kind : 'other') as VaultNoteKind,
  title: String(r.title ?? ''),
  noteDate: r.note_date ? new Date(r.note_date as Date).toISOString() : null,
  source: (r.source as VaultNoteSource | null) ?? null,
  people: Array.isArray(r.people) ? (r.people as string[]) : [],
  accountName: (r.account_name as string | null) ?? null,
  domain: (r.domain as string | null) ?? null,
  frontmatter: r.frontmatter && typeof r.frontmatter === 'object' ? (r.frontmatter as Record<string, unknown>) : {},
  text: String(r.text ?? ''),
  syncedAt: new Date((r.synced_at as Date) ?? 0).toISOString(),
  vaultPushedAt: r.vault_pushed_at ? new Date(r.vault_pushed_at as Date).toISOString() : null,
  matchedBy,
});

const dateKey = (n: AccountKnowledgeNote) => n.noteDate ?? n.syncedAt;

/**
 * The notes about one account, newest first, bounded. Matched three ways: by the stored account_name (the identity-
 * matched or raw frontmatter name, plus the aliases given), by the account's domains against a note's people, and by
 * the addresses GAP has placed at the account (its personas) against a note's people. Internal addresses never match.
 */
export async function knowledgeForAccount(prisma: PrismaLike, accountName: string, opts: { domains?: readonly string[]; aliases?: readonly string[]; limit?: number } = {}): Promise<AccountKnowledgeSet> {
  const t = prisma?.gapKnowledgeNote;
  if (!t || typeof t.findMany !== 'function') throw new Error('gap_knowledge_notes not readable');
  const limit = Math.max(1, Math.min(opts.limit ?? KNOWLEDGE_DEFAULT_LIMIT, KNOWLEDGE_MAX_LIMIT));
  const names = Array.from(new Set([accountName, ...(opts.aliases ?? [])].map((n) => n.trim()).filter(Boolean)));
  const domains = Array.from(new Set((opts.domains ?? []).map((d) => d.trim().toLowerCase().replace(/^www\./, '')).filter((d) => d && !INTERNAL_DOMAINS.has(d))));
  const placed: string[] = [];
  if (typeof prisma?.persona?.findMany === 'function') {
    const rows = (await prisma.persona.findMany({ where: { account_name: { in: names } }, select: { email: true } }).catch(() => [])) as Array<{ email: string | null }>;
    for (const r of rows) {
      const e = r.email?.trim().toLowerCase();
      if (e && e.includes('@') && !INTERNAL_DOMAINS.has(e.split('@')[1])) placed.push(e);
    }
  }
  const addresses = Array.from(new Set(placed));
  const byName = (await t.findMany({ where: { account_name: { in: names } }, orderBy: [{ note_date: 'desc' }, { synced_at: 'desc' }], take: KNOWLEDGE_MAX_LIMIT })) as Array<Record<string, unknown>>;
  const seen = new Set<string>(byName.map((r) => String(r.path)));
  const matched: AccountKnowledgeNote[] = byName.map((r) => noteOf(r, 'account'));
  if (domains.length || addresses.length) {
    // The people lists of every raw capture and meeting note are small; the match is made here, not in SQL (an array element's domain has no index).
    const heads = (await t.findMany({ where: { kind: { in: ['raw', 'meeting'] } }, select: { path: true, people: true } })) as Array<{ path: string; people: string[] }>;
    const hits: Array<{ path: string; by: KnowledgeMatch }> = [];
    for (const h of heads) {
      if (seen.has(h.path)) continue;
      const people = Array.isArray(h.people) ? h.people : [];
      const byPerson = people.some((p) => addresses.includes(p.toLowerCase()));
      const byDomain = !byPerson && people.some((p) => domains.includes(p.toLowerCase().split('@')[1] ?? ''));
      if (byPerson || byDomain) hits.push({ path: h.path, by: byPerson ? 'person' : 'domain' });
    }
    if (hits.length) {
      const rows = (await t.findMany({ where: { path: { in: hits.map((h) => h.path) } } })) as Array<Record<string, unknown>>;
      const by = new Map(hits.map((h) => [h.path, h.by]));
      for (const r of rows) matched.push(noteOf(r, by.get(String(r.path)) ?? 'domain'));
    }
  }
  matched.sort((a, b) => (dateKey(a) < dateKey(b) ? 1 : dateKey(a) > dateKey(b) ? -1 : a.path.localeCompare(b.path)));
  const accountNote = matched.find((n) => n.kind === 'account') ?? null;
  const rest = matched.filter((n) => n !== accountNote);
  const all = [...(accountNote ? [accountNote] : []), ...rest].slice(0, limit);
  const pick = (kind: VaultNoteKind) => all.filter((n) => n.kind === kind && n !== accountNote);
  return {
    accountName,
    accountNote,
    meetings: pick('meeting'),
    calls: pick('raw'),
    deals: pick('deal'),
    people: pick('person'),
    other: all.filter((n) => n !== accountNote && !['meeting', 'raw', 'deal', 'person'].includes(n.kind)),
    all,
    truncated: matched.length > all.length,
    matchedDomains: domains,
    matchedAddresses: addresses,
  };
}
