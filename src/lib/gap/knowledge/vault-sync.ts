/**
 * VAULT SYNC (GAP OS knowledge, stream A, 2026-10-09): the one upsert path into gap_knowledge_notes, fed two ways.
 *
 *   scripts/gap/vault-push.ts         candidates from the LOCAL vault folder (Casey's box; dry run by default)
 *   /api/cron/gap-vault-sync          candidates from the GitHub tree of the private vault repo (vault-github.ts)
 *
 * Idempotent by (path, sha): a candidate whose git blob id is already stored is not even read; one that is read and
 * parses to the sha already stored is not written. Reads are capped per run (MAX_FILES_PER_RUN) so a tick stays
 * inside its budget; what is left is said in the result and taken on the next tick. The account name is matched to a
 * GAP account through the identity resolver when it can (the raw frontmatter value stays otherwise); nothing here
 * creates an account, writes HubSpot, or sends. Rows are plain data: a note's text is never an instruction.
 */
import { resolveAccountName } from '../identity/service';
import { loadIdentityContext } from '../identity/service';
import { knowledgeRowOf, parseVaultNote, type ParsedVaultNote, type VaultNoteKind } from './vault-note';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const MAX_FILES_PER_RUN = 200;
export const VAULT_SYNCED_KIND = 'knowledge.vault_synced';

export interface SyncCandidate {
  /** vault-relative path, forward slashes */
  path: string;
  /** git's blob id when the source knows it (the tree); null for a local file */
  gitSha: string | null;
  read: () => Promise<string>;
}

export type AccountResolver = (raw: string | null, domain: string | null) => Promise<string | null>;

export interface SyncOptions {
  now?: Date;
  /** false: read, parse and count, write nothing (the dry run) */
  apply: boolean;
  maxFiles?: number;
  /** the repo commit time the candidates come from, when known */
  vaultPushedAt?: Date | null;
  resolveAccount?: AccountResolver;
}

export interface SyncCounts {
  seen: number;
  /** skipped without a read: the stored git blob id matched */
  unchangedByGitSha: number;
  /** read and parsed, but the stored sha matched */
  unchangedBySha: number;
  read: number;
  written: number;
  /** candidates left unread because the per-run cap was hit */
  remaining: number;
  byKind: Record<VaultNoteKind, number>;
  errors: Array<{ path: string; error: string }>;
}

const emptyKinds = (): Record<VaultNoteKind, number> => ({ account: 0, person: 0, deal: 0, meeting: 0, raw: 0, other: 0 });

/** The default resolver: the identity context loaded once; a failure to load or an unresolved name keeps the raw value. */
export async function identityAccountResolver(prisma: PrismaLike): Promise<AccountResolver> {
  let ctx: Awaited<ReturnType<typeof loadIdentityContext>> | null = null;
  try {
    ctx = await loadIdentityContext(prisma);
  } catch {
    ctx = null;
  }
  const memo = new Map<string, string | null>();
  return async (raw, domain) => {
    if (!raw && !domain) return null;
    const key = `${raw ?? ''}|${domain ?? ''}`;
    if (memo.has(key)) return memo.get(key) ?? null;
    let out: string | null = raw;
    let placed = false;
    if (ctx) {
      try {
        const r = await resolveAccountName(prisma, { rawName: raw, domain }, ctx);
        if (r.ok) { out = r.accountName; placed = true; }
      } catch {
        out = raw;
      }
    }
    // The vault's own account notes map the company as the vault names it ("Kenco Logistics") to the GAP account they
    // resolved to ("Kenco"): a meeting or deal note that names the company the vault's way lands on the same account.
    if (!placed && raw && typeof prisma?.gapKnowledgeNote?.findFirst === 'function') {
      try {
        const note = (await prisma.gapKnowledgeNote.findFirst({
          where: { kind: 'account', account_name: { not: null }, OR: [{ title: { equals: raw, mode: 'insensitive' } }, { frontmatter: { path: ['company'], equals: raw } }] },
          select: { account_name: true },
        })) as { account_name: string | null } | null;
        if (note?.account_name) out = note.account_name;
      } catch {
        // the vault map is a courtesy; the raw value stands
      }
    }
    memo.set(key, out);
    return out;
  };
}

/**
 * Re-resolve the account of every note on record whose account is not a GAP account (the raw vault name kept at its
 * sync) or absent while its frontmatter names one, through the resolver (the identity context, then the vault's own
 * account notes). Dry run counts; apply updates. Bounded by `max` rows per call.
 */
export async function reresolveKnowledgeAccounts(prisma: PrismaLike, opts: { apply: boolean; max?: number; resolveAccount?: AccountResolver }): Promise<{ looked: number; changed: number; samples: Array<{ path: string; from: string | null; to: string }> }> {
  const resolve = opts.resolveAccount ?? (await identityAccountResolver(prisma));
  const accounts = new Set(((await prisma.account.findMany({ select: { name: true } }).catch(() => [])) as Array<{ name: string }>).map((a) => a.name));
  const rows = (await prisma.gapKnowledgeNote.findMany({ where: { kind: { in: ['meeting', 'deal', 'person', 'raw', 'other'] } }, select: { id: true, path: true, account_name: true, domain: true, frontmatter: true }, take: opts.max ?? 20_000 })) as Array<{ id: string; path: string; account_name: string | null; domain: string | null; frontmatter: Record<string, unknown> | null }>;
  const out = { looked: 0, changed: 0, samples: [] as Array<{ path: string; from: string | null; to: string }> };
  for (const r of rows) {
    if (r.account_name && accounts.has(r.account_name)) continue;
    const fm = r.frontmatter ?? {};
    const raw = r.account_name ?? (typeof fm.account === 'string' ? fm.account : typeof fm.company === 'string' ? fm.company : null);
    if (!raw && !r.domain) continue;
    out.looked += 1;
    const to = await resolve(raw, r.domain);
    if (!to || to === r.account_name || !accounts.has(to)) continue;
    out.changed += 1;
    if (out.samples.length < 12) out.samples.push({ path: r.path, from: r.account_name, to });
    if (opts.apply) await prisma.gapKnowledgeNote.update({ where: { id: r.id }, data: { account_name: to } });
  }
  return out;
}

/** Parse and upsert the candidates that changed. Never throws on one file: its error is counted and the run goes on. */
export async function syncVaultNotes(prisma: PrismaLike, candidates: readonly SyncCandidate[], opts: SyncOptions): Promise<SyncCounts> {
  const now = opts.now ?? new Date();
  const max = opts.maxFiles ?? MAX_FILES_PER_RUN;
  const counts: SyncCounts = { seen: candidates.length, unchangedByGitSha: 0, unchangedBySha: 0, read: 0, written: 0, remaining: 0, byKind: emptyKinds(), errors: [] };
  const existing = new Map<string, { sha: string; git_sha: string | null }>();
  for (const r of (await prisma.gapKnowledgeNote.findMany({ select: { path: true, sha: true, git_sha: true } })) as Array<{ path: string; sha: string; git_sha: string | null }>) existing.set(r.path, { sha: r.sha, git_sha: r.git_sha });
  const resolve = opts.resolveAccount ?? (await identityAccountResolver(prisma));
  let reads = 0;
  for (const c of candidates) {
    const have = existing.get(c.path);
    if (have && c.gitSha && have.git_sha === c.gitSha) {
      counts.unchangedByGitSha += 1;
      continue;
    }
    if (reads >= max) {
      counts.remaining += 1;
      continue;
    }
    // The cap counts what costs something: a remote fetch (a candidate with a blob id) or a write. A local file whose
    // text is unchanged is read for free and never consumes the cap (the local push used to re-read the same first
    // 200 unchanged files every run and never reach the rest).
    const remote = !!c.gitSha;
    if (remote) reads += 1;
    let parsed: ParsedVaultNote;
    try {
      parsed = parseVaultNote(c.path, await c.read());
    } catch (e) {
      counts.errors.push({ path: c.path, error: (e instanceof Error ? e.message : String(e)).slice(0, 200) });
      continue;
    }
    counts.read += 1;
    counts.byKind[parsed.kind] += 1;
    if (have && have.sha === parsed.sha) {
      counts.unchangedBySha += 1;
      // The text is the same but the blob id on record is not (line endings differ between the box and the repo): record it so the next tick skips the read.
      if (opts.apply && c.gitSha && have.git_sha !== c.gitSha) await prisma.gapKnowledgeNote.update({ where: { path: c.path }, data: { git_sha: c.gitSha } });
      continue;
    }
    if (!remote) reads += 1;
    if (!opts.apply) {
      counts.written += 1;
      continue;
    }
    try {
      const accountName = await resolve(parsed.accountName, parsed.domain);
      const row = knowledgeRowOf(parsed, { accountName, vaultPushedAt: opts.vaultPushedAt ?? null, syncedAt: now });
      if (c.gitSha) row.git_sha = c.gitSha;
      const { path: notePath, ...data } = row;
      await prisma.gapKnowledgeNote.upsert({ where: { path: notePath }, create: { path: notePath, ...data }, update: data });
      counts.written += 1;
    } catch (e) {
      counts.errors.push({ path: c.path, error: (e instanceof Error ? e.message : String(e)).slice(0, 200) });
    }
  }
  return counts;
}

export interface VaultSyncLedgerPayload {
  ok: boolean;
  repo: string;
  branch: string;
  commitSha: string | null;
  treeSha: string | null;
  commitAt: string | null;
  etag: string | null;
  counts: SyncCounts | null;
  durationMs: number;
  error: string | null;
  /** 'unchanged': the head had not moved and nothing was left from the last run */
  skipped: 'unchanged' | null;
}

/** One ledger row per cron tick (success, skip or failure), the record health reads. */
export async function recordVaultSync(prisma: PrismaLike, payload: VaultSyncLedgerPayload, actor = 'cron:gap-vault-sync'): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind: VAULT_SYNCED_KIND, actor, subject_type: 'vault', subject_id: payload.repo, payload } });
}

export interface LastVaultSync {
  at: string;
  ok: boolean;
  error: string | null;
  etag: string | null;
  commitSha: string | null;
  remaining: number;
  written: number | null;
  skipped: boolean;
}

/** The newest knowledge.vault_synced ledger row, read as the last sync's fate; null when the cron never ran. */
export async function lastVaultSync(prisma: PrismaLike): Promise<LastVaultSync | null> {
  const row = (await prisma.gapAuditEvent.findFirst({ where: { kind: VAULT_SYNCED_KIND }, orderBy: { created_at: 'desc' }, select: { created_at: true, payload: true } })) as { created_at: Date | string; payload: unknown } | null;
  if (!row) return null;
  const p = (row.payload ?? {}) as Partial<VaultSyncLedgerPayload>;
  return {
    at: new Date(row.created_at).toISOString(),
    ok: p.ok === true,
    error: typeof p.error === 'string' ? p.error : null,
    etag: typeof p.etag === 'string' ? p.etag : null,
    commitSha: typeof p.commitSha === 'string' ? p.commitSha : null,
    remaining: typeof p.counts?.remaining === 'number' ? p.counts.remaining : 0,
    written: typeof p.counts?.written === 'number' ? p.counts.written : null,
    skipped: p.skipped === 'unchanged',
  };
}
