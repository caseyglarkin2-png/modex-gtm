/**
 * ACCOUNT STORY readers (account-first UX, UX-05, 2026-10-06): the two reads the pure story (story.ts) needs beyond
 * what the page already holds, each soft and bounded so a slow or absent reader never costs the page:
 *
 *   clawd outreach history   GET {CLAWD_CONTROL_PLANE_URL}/api/outreach/history?domain=<d>   the swarm's sends by
 *                            address (the canonical dedup source; prod Postgres, never the local file)
 *   the vault's account note the vault file when GAP_VAULT_DIR names a local vault (Casey's machine), else clawd's
 *                            copy of the vault wedge in /api/yardflow/intel/account reasoning_notes (production)
 *
 * The same env pair as the suppression gate (CLAWD_CONTROL_PLANE_URL / CLAWD_CONTROL_PLANE_TOKEN, with MC_API_TOKEN
 * accepted): one secret to rotate. Nothing here writes. Pinned by tests/unit/gap/story-readers.test.ts.
 */
import type { ClawdOutreach, ClawdSend } from './touches';

export const STORY_READER_TIMEOUT_MS = 4_000;

export interface StoryReaderDeps {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  /** Reads a local file's text, or null when it does not exist (tests pass a stub; the loader uses node:fs). */
  readFile?: (path: string) => Promise<string | null>;
}

export interface VaultNote {
  text: string;
  at: string | null;
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

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

/** clawd's copy of the vault wedge ("<strong>Vault wedge (2026-07-10):</strong> ...") from the intel snapshot, else null. */
export async function fetchClawdVaultNote(domain: string | null, deps: StoryReaderDeps = {}): Promise<VaultNote | null> {
  const env = deps.env ?? process.env;
  const cfg = clawdBase(env);
  if (!cfg || !domain) return null;
  try {
    const body = (await getJson(`${cfg.base}/api/yardflow/intel/account?domain=${encodeURIComponent(domain)}`, cfg.token, deps.fetchImpl ?? fetch, STORY_READER_TIMEOUT_MS)) as { found?: boolean; snapshot?: { reasoning_notes?: unknown } };
    const notes = Array.isArray(body.snapshot?.reasoning_notes) ? body.snapshot!.reasoning_notes.filter((n): n is string => typeof n === 'string') : [];
    const wedge = notes.map(strip).find((n) => /^vault/i.test(n));
    if (!wedge) return null;
    const m = wedge.match(/^vault[^(:]*\((\d{4}-\d{2}-\d{2})\):\s*(.+)$/i);
    return m ? { text: m[2].trim(), at: m[1] } : { text: wedge.replace(/^vault[^:]*:\s*/i, '').trim(), at: null };
  } catch {
    return null;
  }
}

/**
 * The vault's own account note (02_Accounts/<Account>.md): the "YardFlow wedge" section's first paragraph (what clawd
 * copies as the vault wedge), else the frontmatter's next_action, else the first body paragraph. Local only
 * (GAP_VAULT_DIR); production has no vault on disk and reads clawd's copy instead.
 */
export async function readLocalVaultNote(accountName: string, deps: StoryReaderDeps = {}): Promise<VaultNote | null> {
  const env = deps.env ?? process.env;
  const dir = env.GAP_VAULT_DIR?.trim();
  if (!dir) return null;
  const read = deps.readFile ?? defaultReadFile;
  const safe = accountName.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const text = await read(`${dir.replace(/[\\/]+$/, '')}/02_Accounts/${safe}.md`);
  if (!text) return null;
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const front = fm?.[1] ?? '';
  const field = (k: string) => front.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
  const at = field('last_refreshed') ?? field('last_touched') ?? null;
  const body = text.slice(fm ? fm[0].length : 0);
  const wedge = body.match(/^##\s+YardFlow wedge\s*\r?\n([\s\S]*?)(?=\r?\n##\s|\s*$)/m)?.[1];
  const para = (t: string | undefined) => t?.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).find((p) => p && !/^#/.test(p) && !/^[-*|>]/.test(p) && !/^<!--/.test(p)) ?? null;
  const pick = para(wedge) ?? field('next_action') ?? para(body);
  return pick ? { text: pick.replace(/\s+/g, ' ').slice(0, 400), at } : null;
}

async function defaultReadFile(path: string): Promise<string | null> {
  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** Both readers at once, each soft: the page never waits past the reader timeout and never fails on a reader. */
export async function loadStoryReaders(args: { accountName: string; domain: string | null }, deps: StoryReaderDeps = {}): Promise<StoryReaders> {
  const [clawd, local] = await Promise.all([fetchClawdOutreach(args.domain, deps), readLocalVaultNote(args.accountName, deps)]);
  const vaultNote = local ?? (await fetchClawdVaultNote(args.domain, deps));
  return { clawd, vaultNote };
}
