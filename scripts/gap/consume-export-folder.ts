/**
 * THE EXPORT FOLDER CONSUMER (intelligence wiring, 2026-10-09). Local; idempotent; the producers' one simple step.
 *
 *   npx tsx scripts/gap/consume-export-folder.ts [--folder <dir>] [--base <url>] [--once | --watch <seconds>] [--dry-run]
 *
 * Watches one folder (default C:\Users\casey\Documents\New project\gap-exports) for the files producers drop there:
 * the Codex automation's JSON export, a ChatGPT issue saved as Markdown (with or without its fenced JSON block). Each
 * new or changed file (by path and content hash, remembered in <folder>/.gap-consumer-state.json) is read by
 * signals/export-folder.ts and POSTed to GAP's door, POST /api/gap/intelligence-import, with the bearer from
 * GAP_INTEL_IMPORT_TOKEN (read from the environment or from C:\Users\casey\.gap\consumer.env; never printed). The
 * outcome per file (accepted, duplicates, revised, invalid, or the failure) is written to the state file and the
 * log line; a failed POST is retried once and left for the next run. The original file is never moved or changed.
 * A file's text is data: nothing in it is executed. Nothing here sends to a buyer, writes HubSpot or posts to Slack.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileHash, readFolderFile } from '../../src/lib/gap/signals/export-folder';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const FOLDER = arg('--folder') ?? 'C:\\Users\\casey\\Documents\\New project\\gap-exports';
const ENV_FILE = path.join(process.env.USERPROFILE ?? process.env.HOME ?? '.', '.gap', 'consumer.env');
const DRY = process.argv.includes('--dry-run');
const WATCH = arg('--watch') ? Number(arg('--watch')) : null;
const STATE = path.join(FOLDER, '.gap-consumer-state.json');

interface FileState { hash: string; at: string; outcome: string; accepted?: number; duplicates?: number; revised?: number; invalid?: number; error?: string | null }
interface State { files: Record<string, FileState> }

function loadEnvFile(): void {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

function loadState(): State {
  try { return JSON.parse(readFileSync(STATE, 'utf8')) as State; } catch { return { files: {} }; }
}

async function post(base: string, token: string, body: unknown): Promise<{ ok: boolean; status: number; json: Record<string, unknown> | null }> {
  const res = await fetch(`${base.replace(/\/$/, '')}/api/gap/intelligence-import`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok, status: res.status, json };
}

async function runOnce(): Promise<void> {
  loadEnvFile();
  const base = arg('--base') ?? process.env.GAP_IMPORT_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://modex-gtm.vercel.app';
  const token = process.env.GAP_INTEL_IMPORT_TOKEN ?? '';
  if (!existsSync(FOLDER)) { mkdirSync(FOLDER, { recursive: true }); console.log(`created ${FOLDER}`); }
  if (!DRY && !token) { console.log('GAP_INTEL_IMPORT_TOKEN is not set (environment or the consumer.env file); nothing sent'); return; }
  const state = loadState();
  const names = readdirSync(FOLDER).filter((n) => !n.startsWith('.') && /\.(json|md|markdown|txt)$/i.test(n) && statSync(path.join(FOLDER, n)).isFile()).sort();
  let sent = 0;
  for (const name of names) {
    const text = readFileSync(path.join(FOLDER, name), 'utf8');
    const hash = fileHash(text);
    const prev = state.files[name];
    if (prev && prev.hash === hash && prev.outcome !== 'failed') continue;
    const read = readFolderFile(name, text, { capturedOn: new Date().toISOString().slice(0, 10) });
    if (read.shape === 'unsupported') {
      state.files[name] = { hash, at: new Date().toISOString(), outcome: 'unsupported', error: read.detail };
      console.log(`${name}: unsupported (${read.detail})`);
      continue;
    }
    if (DRY) { console.log(`${name}: ${read.shape}, producer ${read.producer ?? 'per record'}, ${read.records.length} records (dry run)`); continue; }
    const body = { producer: read.producer ?? undefined, runId: `file:${name}`, records: read.records.slice(0, 500) };
    let r = await post(base, token, body).catch((e) => ({ ok: false, status: 0, json: { error: e instanceof Error ? e.message : String(e) } }));
    if (!r.ok) r = await post(base, token, body).catch((e) => ({ ok: false, status: 0, json: { error: e instanceof Error ? e.message : String(e) } }));
    if (!r.ok) {
      state.files[name] = { hash, at: new Date().toISOString(), outcome: 'failed', error: `${r.status}: ${String(r.json?.error ?? 'no answer')}`.slice(0, 200) };
      console.log(`${name}: FAILED (${state.files[name].error})`);
      continue;
    }
    const j = r.json ?? {};
    state.files[name] = { hash, at: new Date().toISOString(), outcome: 'imported', accepted: Number(j.accepted ?? 0), duplicates: Number(j.duplicates ?? 0), revised: Number(j.revised ?? 0), invalid: Number(j.invalid ?? 0), error: null };
    sent += 1;
    console.log(`${name}: ${read.shape} -> accepted ${j.accepted}, duplicates ${j.duplicates}, revised ${j.revised}, invalid ${j.invalid}`);
  }
  writeFileSync(STATE, `${JSON.stringify(state, null, 1)}\n`);
  console.log(`${names.length} files seen, ${sent} sent, state in ${STATE}`);
}

async function main() {
  if (WATCH && Number.isFinite(WATCH) && WATCH > 0) {
    for (;;) { await runOnce().catch((e) => console.log(`run failed: ${e instanceof Error ? e.message : String(e)}`)); await new Promise((r) => setTimeout(r, WATCH * 1000)); }
  }
  await runOnce();
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
