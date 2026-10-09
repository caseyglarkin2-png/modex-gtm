/**
 * C45: the READ-ONLY deployment and configuration receipt.
 *
 *   npx tsx scripts/gap/deployment-receipt.ts [--health <file.json>] [--out docs/gap/DEPLOYMENT_RECEIPT.md]
 *
 * Reads: the local git state; the Vercel project's production deployments, env variable NAMES (and the values of
 * non-secret GAP flags only; encrypted and sensitive values are never requested); the local vercel.json crons; the
 * baseline's Production SHA line; optionally a saved health JSON. Writes one Markdown receipt. It prints no secret:
 * the token is read from the main checkout's .env.local into memory only, every non-flag value seen is forbidden
 * from the output (assertNoLeak), and nothing is changed in Vercel or the repo.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNoLeak, composeReceipt, redactValues, showableFlag, type ReceiptDeployment, type ReceiptEnvName, type ReceiptFlag, type ReceiptInputs } from '../../src/lib/gap/health/deployment-receipt';

const TEAM = 'team_TkAjtDWif68PlLtgaIYZ5PLr';
const PROJECT = 'prj_rSVCgdXqOqsXEmlrS1v8v2eoPV9V';
const ALIAS = 'modex-gtm.vercel.app';
const TOKEN_FILES = ['C:/Users/casey/modex-gtm/.env.local', resolve(process.cwd(), '.env.local')];

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const sh = (cmd: string) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

function token(): string | null {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  for (const f of TOKEN_FILES) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^VERCEL_TOKEN=(.+)$/m);
    if (m) return m[1].trim().replace(/^"|"$/g, '');
  }
  return null;
}

async function main() {
  const unread: ReceiptInputs['unread'] = [];
  const seen: Array<{ key: string | null; value: string }> = [];
  const generatedAt = new Date().toISOString();
  const local = { commit: sh('git rev-parse HEAD') || 'unknown', branch: sh('git rev-parse --abbrev-ref HEAD') || 'unknown', originMain: sh('git rev-parse origin/main') || null, dirty: sh('git status --porcelain --untracked-files=no').length > 0 };

  const t = token();
  const headers = t ? { authorization: `Bearer ${t}` } : null;
  if (t) seen.push({ key: null, value: t });
  const api = async <T,>(path: string): Promise<T | null> => {
    if (!headers) return null;
    try {
      const r = await fetch(`https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM}`, { headers });
      if (!r.ok) { unread.push({ source: `vercel ${path.split('?')[0]}`, reason: `HTTP ${r.status}` }); return null; }
      return (await r.json()) as T;
    } catch (e) {
      unread.push({ source: `vercel ${path.split('?')[0]}`, reason: e instanceof Error ? e.message.slice(0, 120) : String(e) });
      return null;
    }
  };
  if (!headers) unread.push({ source: 'vercel', reason: 'no VERCEL_TOKEN in the environment or the main checkout .env.local; deployments, env names and flags not read' });

  type Dep = { uid: string; state?: string; readyState?: string; meta?: { githubCommitSha?: string }; ready?: number; created?: number; url?: string; alias?: string[]; aliasAssigned?: number | boolean; target?: string | null };
  const deps = await api<{ deployments?: Dep[] }>(`/v6/deployments?projectId=${PROJECT}&target=production&limit=6`);
  const deployments: ReceiptDeployment[] = (deps?.deployments ?? []).map((d) => ({ id: d.uid, state: d.state ?? d.readyState ?? 'unknown', commit: d.meta?.githubCommitSha ?? null, readyAt: d.ready ? new Date(d.ready).toISOString() : null, url: d.url ?? null, aliases: Array.isArray(d.alias) ? d.alias : [], target: d.target ?? null }));
  // The alias binding, from the alias API when it answers (which deployment the production alias points at).
  const aliasRead = await api<{ deploymentId?: string; deployment?: { id?: string } }>(`/v4/aliases/${ALIAS}`);
  const boundId = aliasRead?.deploymentId ?? aliasRead?.deployment?.id ?? null;
  if (boundId) for (const d of deployments) if (d.id === boundId && !d.aliases.includes(ALIAS)) d.aliases.push(ALIAS);

  type Env = { id: string; key: string; type: string; target?: string[]; value?: string; updatedAt?: number };
  const envs = await api<{ envs?: Env[] }>(`/v9/projects/${PROJECT}/env`);
  const envNames: ReceiptEnvName[] = (envs?.envs ?? []).map((e) => ({ key: e.key, type: e.type, targets: e.target ?? [], updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : null }));
  const flags: ReceiptFlag[] = [];
  for (const e of envs?.envs ?? []) {
    if (!(e.target ?? []).includes('production')) continue;
    if (typeof e.value === 'string' && e.type === 'plain') {
      const shown = showableFlag(e.key, e.value);
      if (shown === null) seen.push({ key: e.key, value: e.value });
      if (/^GAP_/.test(e.key)) flags.push({ key: e.key, value: shown, type: e.type });
      continue;
    }
    // Encrypted flag values (GAP_* flags set through the API) are decrypted ONLY when the key is a showable flag name; any other key is never requested.
    if (e.type === 'encrypted' && showableFlag(e.key, 'true') !== null) {
      const one = await api<{ value?: string; decrypted?: boolean }>(`/v1/projects/${PROJECT}/env/${e.id}?decrypt=true`);
      const shown = one?.decrypted && typeof one.value === 'string' ? showableFlag(e.key, one.value) : null;
      if (one?.value && shown === null) seen.push({ key: e.key, value: one.value });
      flags.push({ key: e.key, value: shown, type: e.type });
    } else if (/^GAP_/.test(e.key)) flags.push({ key: e.key, value: null, type: e.type });
  }

  const vercelJson = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as { crons?: Array<{ path: string; schedule: string }> };
  const localCrons = vercelJson.crons ?? [];

  const baselineFile = 'docs/gap/STABLE_BASELINE.md';
  const baselineText = existsSync(baselineFile) ? readFileSync(baselineFile, 'utf8') : '';
  const baselineLine = baselineText.split('\n').find((l) => /^Production SHA:/.test(l)) ?? null;
  const baselineCommit = baselineLine?.match(/^Production SHA:\s*([0-9a-f]{7,40})/)?.[1] ?? null;

  let health: ReceiptInputs['health'] = null;
  const healthFile = arg('--health');
  if (healthFile) {
    try {
      const raw = JSON.parse(readFileSync(healthFile, 'utf8')) as Record<string, unknown>;
      const body = (typeof raw.text === 'string' ? JSON.parse(raw.text) : raw) as { checkedAt?: string; overall?: string; components?: Array<{ key: string; state: string; label: string; detail: string }> };
      health = { checkedAt: body.checkedAt ?? 'unknown', overall: body.overall ?? 'unknown', components: (body.components ?? []).map((c) => ({ key: c.key, state: c.state, label: c.label, detail: c.detail })), source: `saved file ${healthFile}` };
    } catch (e) {
      unread.push({ source: 'health', reason: `could not read ${healthFile}: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}` });
    }
  }

  const composed = composeReceipt({ generatedAt, local, project: { name: 'modex-gtm', id: PROJECT, teamId: TEAM }, deployments, productionAlias: ALIAS, envNames, flags, localCrons, deployedCrons: null, baseline: { file: baselineFile, line: baselineLine, commit: baselineCommit }, health, unread });
  const receipt = redactValues(composed, seen);
  assertNoLeak(receipt, seen.map((s) => s.value));
  const out = arg('--out') ?? 'docs/gap/DEPLOYMENT_RECEIPT.md';
  writeFileSync(out, receipt, 'utf8');
  console.log(`wrote ${out} (${receipt.length} chars; ${deployments.length} deployments, ${envNames.length} env names, ${flags.length} flags, ${unread.length} unread)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
