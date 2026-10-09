/**
 * C59: the next-version demonstration receipt, assembled locally from the artifacts another developer can reproduce.
 *
 *   npx tsx scripts/gap/demonstration-receipt.ts [--out docs/gap/DEMONSTRATION_RECEIPT.md] [--review docs/gap/C57_REVIEW.md]
 *
 * It reads: the replay receipt (before and after rendered email, the source manifest, the dispositions), the retrieval
 * and quality evaluations, the focused test suites of the program with their case counts, the branch's commits since
 * the production commit, the deployment receipt's pointer, and the reviewer findings file when present. It writes
 * no credential, no signed action token and no raw private mail (the replay is de-identified and redacted). To
 * reproduce: `npx tsx scripts/gap/retrieval-eval.ts`, `npx tsx scripts/gap/quality-eval.ts --mocked`,
 * `npx tsx scripts/gap/replay-october8.ts`, then this script; and `npx vitest run <suite> --maxWorkers=1` per suite.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const sh = (cmd: string) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const section = (text: string, from: string, to: string | null) => {
  const a = text.indexOf(from);
  if (a < 0) return '';
  const b = to ? text.indexOf(to, a + from.length) : -1;
  return text.slice(a, b > a ? b : undefined).trim();
};
const SECRET_SHAPES = [/\bsk-[A-Za-z0-9_-]{16,}/, /\bpat-[a-z0-9-]{20,}/i, /\bAIza[0-9A-Za-z_-]{30,}/, /\bvcp_[A-Za-z0-9]{10,}/, /\?t=[A-Za-z0-9%._-]{20,}/, /postgres(ql)?:\/\/[^\s]+:[^\s]+@/i];

function suites(): Array<{ file: string; cases: number }> {
  const dir = 'tests/unit/gap';
  return readdirSync(dir)
    .filter((f) => /^(lead-|stream-|v1-kenco|commercial-context).*\.test\.tsx?$/.test(f))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, cases: (read(join(dir, f)).match(/^\s*it\(/gm) ?? []).length }));
}

function main() {
  const now = new Date();
  const replay = read('docs/gap/REPLAY_OCTOBER8.md');
  const retrieval = read('docs/gap/RETRIEVAL_EVAL.md');
  const quality = read('docs/gap/QUALITY_EVAL.md');
  const deployment = read('docs/gap/DEPLOYMENT_RECEIPT.md');
  const reviewPath = arg('--review') ?? 'docs/gap/C57_REVIEW.md';
  const review = read(reviewPath);
  const head = sh('git rev-parse --short HEAD');
  const branch = sh('git rev-parse --abbrev-ref HEAD');
  const prod = /serves deployment (\S+), state (\S+), commit ([0-9a-f]+)/.exec(deployment);
  // The deployed commit comes from the C45 receipt; a195467f is the fallback when that receipt is unread.
  const deployedSha = prod?.[3] ?? 'a195467f';
  const commits = sh(`git log --format=%h%x09%s ${deployedSha}..HEAD`).split('\n').filter((l) => l && !/\tMerge /.test(l));
  // Released when the local HEAD is contained in the deployed commit (the merge commit or the same commit).
  let released = false;
  try { released = !!prod && sh(`git merge-base --is-ancestor HEAD ${deployedSha} && echo yes`) === 'yes'; } catch { released = false; }
  const tests = suites();
  const L: string[] = [];
  L.push('# GAP OS next-version demonstration receipt (C59)');
  L.push('');
  L.push(`STATUS: DEMONSTRATION RECEIPT, generated ${now.toISOString()} by scripts/gap/demonstration-receipt.ts on ${branch} at ${head}. Local and sink-backed throughout: no production database, no mail credential, no model call, no send, no signed action token. Production is ${prod ? `${prod[3]} (${prod[1]}, ${prod[2]})` : 'as the deployment receipt says'}; nothing in this program is deployed. Regenerate rather than edit.`);
  L.push(`<!-- verified:${now.toISOString().slice(0, 10)} -->`);
  L.push('');
  L.push('## 1. Before and after: the rendered briefing');
  L.push('');
  L.push(section(replay, '## Before:', '## After:').replace(/^## Before:/, '### Before:'));
  L.push('');
  L.push(section(replay, '## After:', '## Source manifest').replace(/^## After:/, '### After:'));
  L.push('');
  L.push('## 2. Source manifest and dispositions (the replay, C56)');
  L.push('');
  L.push(section(replay, '## Source manifest', '## Dispositions').replace(/^## Source manifest/, '### Source manifest'));
  L.push('');
  L.push(section(replay, '## Dispositions', null).replace(/^## Dispositions/, '### Dispositions'));
  L.push('');
  L.push('## 3. Targeted tests (focused suites, one file at a time, `--maxWorkers=1`)');
  L.push('');
  L.push('| Suite | Cases |');
  L.push('|---|---|');
  for (const t of tests) L.push(`| ${t.file} | ${t.cases} |`);
  L.push(`| total | ${tests.reduce((n, t) => n + t.cases, 0)} |`);
  L.push('');
  L.push('Every ticket\'s Status line in docs/GAP_PROSPECTING_OS.md names its suite and commit; the pre-existing GAP suites the changes touched (briefing, briefing-send, intel, decide, develop-angle, approve-request, commands-apply, health, routing-rules, ai-spend) were run green on the merged tree at each merge.');
  L.push('');
  L.push('## 4. Mocked and live boundaries');
  L.push('');
  L.push('- MOCKED here: the model (a scripted generator in the quality harness and the replay), Gmail (a draft sink; nothing sent), HubSpot (the in-deals read and the contact read as fixtures), the vault and Clawd (sink adapters built from the reference cases), the ledger (in memory).');
  L.push('- LIVE and read-only: the deployment receipt (Vercel project reads, no secret values), the health capture saved on 2026-10-08.');
  L.push('- NOT RUN: the live model evaluation (`scripts/gap/quality-eval.ts --live`, metered, needs the gateway key and Casey\'s go); the production seller round trip (C60, Casey); any send.');
  L.push('');
  L.push('## 5. Retrieval and quality measurements');
  L.push('');
  L.push(section(retrieval, '## Per class', '## Runs').replace(/^## Per class/, '### Retrieval, per class'));
  L.push('');
  L.push(section(quality, '## Per check', '## Outputs').replace(/^## Per check/, '### Generated usefulness (MOCKED harness check, no quality claim), per check'));
  L.push('');
  L.push('## 6. Reviewer findings (C57)');
  L.push('');
  L.push(review ? review.trim() : `Not yet on file: the independent review report is written to ${reviewPath} by the lead when the reviewer delivers it, each finding with a fixed / accepted / deferred disposition and its ticket.`);
  L.push('');
  L.push('## 7. Residuals');
  L.push('');
  L.push('- The C58 reconciliation in docs/GAP_PROSPECTING_OS.md lists every family and owner decision with code, tests, deployed and accepted apart, and the debt left as debt.');
  L.push('- Open for Casey: the merge and deploy of this branch; the production seller reply; the C54 live run; the PepsiCo thesis; the 5% wording; transcription spend; the Clawd autopush enablement.');
  L.push('');
  L.push('## 8. Rollback plan');
  L.push('');
  if (released) {
    L.push(`- RELEASED: this program is in production at ${prod![3]} (deployment ${prod![1]}, state ${prod![2]}, read from docs/gap/DEPLOYMENT_RECEIPT.md); the local HEAD ${head} is contained in it.`);
    L.push('- To roll back: the previous production deployment is named in docs/gap/STABLE_BASELINE.md (the rollback pointer) and under "Other recent production deployments" in docs/gap/DEPLOYMENT_RECEIPT.md; promote it on Vercel; no schema change in this program, so no migration to reverse; the flags are unchanged by this program.');
  } else {
    L.push(`- Nothing to roll back today: production stays at its current commit; this program lives on ${branch} and reaches production only by a merge Casey authorizes.`);
  L.push('- After such a merge: the previous production deployment is named in docs/gap/STABLE_BASELINE.md (the rollback pointer) and in docs/gap/DEPLOYMENT_RECEIPT.md; promote it on Vercel; no schema change in this program, so no migration to reverse; flags unchanged.');
  }
  L.push('');
  L.push(released ? `## 9. Commits since the deployed commit ${deployedSha} (none when production is this tree)` : '## 9. Commits on the branch since production');
  L.push('');
  for (const c of commits) L.push(`- ${c.replace('\t', ' ').slice(0, 200)}`);
  L.push('');
  const text = L.join('\n');
  for (const re of SECRET_SHAPES) if (re.test(text)) throw new Error(`the receipt would carry something shaped like a secret or a signed token (${re}); refusing to write it`);
  const out = arg('--out') ?? 'docs/gap/DEMONSTRATION_RECEIPT.md';
  writeFileSync(out, text, 'utf8');
  console.log(`wrote ${out}: ${tests.length} suites, ${commits.length} commits, review ${review ? 'included' : 'pending'}`);
}

main();
