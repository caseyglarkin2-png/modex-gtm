/**
 * ACCOUNT STORY readers (account-first UX, UX-05, 2026-10-06): the two reads the pure story (story.ts) needs beyond
 * what the page already holds, each soft and bounded so a slow or absent reader never costs the page:
 *
 *   clawd outreach history   GET {CLAWD_CONTROL_PLANE_URL}/api/outreach/history?domain=<d>   the swarm's sends by
 *                            address (the canonical dedup source; prod Postgres, never the local file)
 *   the vault's account note the vault file when GAP_VAULT_DIR names a local vault (Casey's machine), else clawd's
 *                            copy of the vault wedge in /api/yardflow/intel/account reasoning_notes (production).
 *                            Since C14-C16 (2026-10-08) both go through context/retrieval.ts: the whole account's
 *                            knowledge as attributed claims (loadAccountKnowledge); the one-paragraph note the
 *                            story shows is picked from those claims.
 *
 * The same env pair as the suppression gate (CLAWD_CONTROL_PLANE_URL / CLAWD_CONTROL_PLANE_TOKEN, with MC_API_TOKEN
 * accepted): one secret to rotate. Nothing here writes. Pinned by tests/unit/gap/story-readers.test.ts.
 */
import type { ClawdOutreach, ClawdSend } from './touches';
import { clawdClaims, currentClawdClaim, retrieveAccountKnowledge, type AccountKnowledge, type ClawdAdapter, type KnowledgeAdapters, type VaultAdapter } from '../context/retrieval';

export const STORY_READER_TIMEOUT_MS = 4_000;

export interface StoryReaderDeps {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  /** Reads a local file's text, or null when it does not exist (tests pass a stub; the loader uses node:fs). */
  readFile?: (path: string) => Promise<string | null>;
}

export interface VaultNote {
  text: string;
  /** The note's date as a label: the vault file's refresh date, or the date a Clawd wedge carries. */
  at: string | null;
  /** C15: the claim's own observation date (null when the paragraph is undated); never the refresh time. */
  observedAt?: string | null;
  indexedAt?: string | null;
  sourceId?: string | null;
}

export interface StoryReaders {
  clawd: ClawdOutreach;
  vaultNote: VaultNote | null;
}

function clawdBase(env: Record<string, string | undefined>): { base: string; token: string } | null {
  const base = (env.CLAWD_CONTROL_PLANE_URL ?? env.CLAWD_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const token = (env.CLAWD_CONTROL_PLANE_TOKEN ?? env.MC_API_TOKEN ?? '').trim();
  return base && token ? { base, token } : null;
}

async function getJson(url: string, token: string, fetchImpl: typeof fetch, timeoutMs: number): Promise<unknown> {
  const res = await fetchImpl(url, { headers: { accept: 'application/json', authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}

/** clawd's outreach history for one domain: never throws; 'unavailable' when the read failed, 'not_configured' when no pair is set. */
export async function fetchClawdOutreach(domain: string | null, deps: StoryReaderDeps = {}): Promise<ClawdOutreach> {
  const env = deps.env ?? process.env;
  const cfg = clawdBase(env);
  if (!cfg) return { read: 'not_configured', sends: [] };
  if (!domain) return { read: 'ok', sends: [] };
  try {
    const body = (await getJson(`${cfg.base}/api/outreach/history?domain=${encodeURIComponent(domain)}`, cfg.token, deps.fetchImpl ?? fetch, STORY_READER_TIMEOUT_MS)) as { items?: unknown; error?: unknown };
    if (!Array.isArray(body.items)) return { read: 'unavailable', sends: [] };
    const sends: ClawdSend[] = body.items
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({ type: String(x.type ?? 'send'), date: String(x.date ?? ''), subject: String(x.subject ?? ''), status: String(x.status ?? ''), to: String(x.to ?? '') }))
      .filter((x) => x.type === 'send' && x.to && x.date);
    return { read: 'ok', sends };
  } catch {
    return { read: 'unavailable', sends: [] };
  }
}

/**
 * C14/C16: the adapters the retrieval (context/retrieval.ts) reads through, built from the same env pair and the
 * same local-file reader; null when a source is not configured (the coverage says so, never a quiet empty).
 */
export function knowledgeAdapters(deps: StoryReaderDeps = {}): KnowledgeAdapters {
  const env = deps.env ?? process.env;
  const dir = env.GAP_VAULT_DIR?.trim();
  const read = deps.readFile ?? defaultReadFile;
  const vault: VaultAdapter | null = dir ? { readFile: (rel) => read(`${dir.replace(/[\\/]+$/, '')}/${rel}`) } : null;
  const cfg = clawdBase(env);
  const clawd: ClawdAdapter | null = cfg
    ? {
        fetchSnapshot: async (domain) => {
          const body = (await getJson(`${cfg.base}/api/yardflow/intel/account?domain=${encodeURIComponent(domain)}`, cfg.token, deps.fetchImpl ?? fetch, STORY_READER_TIMEOUT_MS)) as { found?: boolean; rebuilt_at?: unknown; snapshot?: { reasoning_notes?: unknown } };
          const notes = Array.isArray(body.snapshot?.reasoning_notes) ? body.snapshot!.reasoning_notes.filter((n): n is string => typeof n === 'string') : [];
          const rebuilt = typeof body.rebuilt_at === 'string' && body.rebuilt_at && body.rebuilt_at !== 'None' ? new Date(body.rebuilt_at) : null;
          return { found: body.found === true, rebuiltAt: rebuilt && !Number.isNaN(rebuilt.getTime()) ? rebuilt.toISOString() : null, reasoningNotes: notes };
        },
      }
    : null;
  return { vault, clawd };
}

/** Everything the two private sources hold about one account, as attributed claims with coverage (C14-C16, C20). Never throws. */
export async function loadAccountKnowledge(args: { accountName: string; aliases?: readonly string[]; domain: string | null; now: Date; otherAccounts?: readonly string[] }, deps: StoryReaderDeps = {}): Promise<AccountKnowledge> {
  return retrieveAccountKnowledge(knowledgeAdapters(deps), args);
}

/**
 * clawd's copy of the vault wedge from the intel snapshot: the CURRENT version of the "vault wedge" identity (C16: by
 * identity and date, never the first matching note), with the date the wedge itself carries; null when none or unread.
 */
export async function fetchClawdVaultNote(domain: string | null, deps: StoryReaderDeps = {}): Promise<VaultNote | null> {
  const { clawd } = knowledgeAdapters(deps);
  if (!clawd || !domain) return null;
  try {
    const snap = await clawd.fetchSnapshot(domain);
    if (!snap.found) return null;
    const wedge = currentClawdClaim(clawdClaims(snap, { accountName: domain }), 'vault wedge');
    return wedge ? { text: wedge.text, at: wedge.version, observedAt: wedge.observedAt, indexedAt: wedge.indexedAt, sourceId: wedge.sourceId } : null;
  } catch {
    return null;
  }
}

/**
 * The vault's own account note (02_Accounts/<Account>.md): the "YardFlow wedge" section's first paragraph (what clawd
 * copies as the vault wedge), else the frontmatter's next_action, else the first body paragraph. Local only
 * (GAP_VAULT_DIR); production has no vault on disk and reads clawd's copy instead. Read through the retrieval, links
 * not followed. `at` is the FILE's refresh date (a label for "your vault note, Oct 5"); the claim's own observation
 * date is `observedAt`, null when the paragraph is undated (C15: a refresh time is never a claim date).
 */
export async function readLocalVaultNote(accountName: string, deps: StoryReaderDeps = {}): Promise<VaultNote | null> {
  const { vault } = knowledgeAdapters(deps);
  if (!vault) return null;
  const k = await retrieveAccountKnowledge({ vault }, { accountName, now: new Date(), followLinks: false }).catch(() => null);
  const own = k?.claims.filter((c) => c.sourceKind === 'vault') ?? [];
  const pick = own.find((c) => /#yardflow wedge$/i.test(c.sourceId)) ?? own.find((c) => /#next_action$/.test(c.sourceId)) ?? own.find((c) => !/#next_action$/.test(c.sourceId)) ?? null;
  if (!pick) return null;
  return { text: pick.text.slice(0, 400), at: k?.coverage.find((c) => c.source === 'vault')?.indexedAt?.slice(0, 10) ?? null, observedAt: pick.observedAt, indexedAt: pick.indexedAt, sourceId: pick.sourceId };
}

async function defaultReadFile(path: string): Promise<string | null> {
  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/**
 * The domain clawd is asked about: the account record's domain when it has one, else the domain most of the account's
 * own addresses share (the history's sends, the replies). An account with no domain on record and no addresses is not
 * asked (FedEx's company row carried no domain on 2026-10-06, and clawd's ledger matches by address domain only).
 */
export function accountDomainFor(x: { domains: readonly string[]; addresses: readonly string[] }): string | null {
  const own = x.domains.map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).find(Boolean);
  if (own) return own;
  const counts = new Map<string, number>();
  for (const a of x.addresses) {
    const d = a.toLowerCase().match(/@([a-z0-9.-]+\.[a-z]{2,})/)?.[1];
    if (!d || /^(gmail|yahoo|outlook|hotmail|freightroll|yardflow)\./.test(d)) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** Both readers at once, each soft: the page never waits past the reader timeout and never fails on a reader. */
export async function loadStoryReaders(args: { accountName: string; domain: string | null }, deps: StoryReaderDeps = {}): Promise<StoryReaders> {
  const [clawd, local] = await Promise.all([fetchClawdOutreach(args.domain, deps), readLocalVaultNote(args.accountName, deps)]);
  const vaultNote = local ?? (await fetchClawdVaultNote(args.domain, deps));
  return { clawd, vaultNote };
}
