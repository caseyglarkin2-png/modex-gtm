/**
 * C45 (the commercial-context audit, 2026-10-08): ONE deployment and configuration receipt, composed from reads
 * only. It keeps three things apart that the ledgers have blurred: the LOCAL CODE (the checkout's commit), the
 * DEPLOYED ENVIRONMENT (the production deployment Vercel reports READY on the alias, with its commit, and the
 * environment that deployment snapshotted) and the PROJECT SETTINGS (what the Vercel project holds now, which the
 * next deploy will snapshot: env names, non-secret flag values, crons). A baseline pointer that names another commit
 * than the deployed one is marked historical, never corrected silently.
 *
 * Secrets: the composer takes env NAMES and the values of non-secret flags only (the script allowlists them before
 * they reach it) and refuses any value that does not look like a flag value, so a key can never be written by
 * mistake. It prints no token, no connection string, no credential.
 */

export interface ReceiptDeployment {
  id: string;
  state: string;
  commit: string | null;
  readyAt: string | null;
  url: string | null;
  /** The production alias(es) this deployment is bound to, when the API says. */
  aliases: string[];
  target: string | null;
}

export interface ReceiptEnvName {
  key: string;
  /** Vercel's type: plain (readable), encrypted (decryptable, not read here), sensitive (never readable). */
  type: string;
  targets: string[];
  updatedAt: string | null;
}

export interface ReceiptFlag {
  key: string;
  /** The value, only when the key is a GAP flag and the value is a flag word; otherwise the receipt says "(not shown)". */
  value: string | null;
  type: string;
}

export interface ReceiptCron {
  path: string;
  schedule: string;
}

export interface ReceiptHealthComponent {
  key: string;
  state: string;
  label: string;
  detail: string;
}

export interface ReceiptInputs {
  generatedAt: string;
  local: { commit: string; branch: string; originMain: string | null; dirty: boolean };
  project: { name: string; id: string; teamId: string };
  deployments: ReceiptDeployment[];
  /** The production alias the receipt asks about (modex-gtm.vercel.app). */
  productionAlias: string;
  envNames: ReceiptEnvName[];
  flags: ReceiptFlag[];
  /** vercel.json crons in the local code. */
  localCrons: ReceiptCron[];
  /** The crons the deployed build carries, when the API says; null when not read. */
  deployedCrons: ReceiptCron[] | null;
  baseline: { file: string; line: string | null; commit: string | null };
  health: { checkedAt: string; overall: string; components: ReceiptHealthComponent[]; source: string } | null;
  /** Reads that failed, by source, with the reason (never the credential). */
  unread: Array<{ source: string; reason: string }>;
}

/** C45: a flag value is a word, a number or true/false; anything else is refused so a secret can never be printed. */
export const FLAG_VALUE_RE = /^(true|false|\d{1,6}(\.\d{1,4})?|[a-z][a-z_]{0,31})$/i;
/** The flag names whose values the receipt may show: the GAP feature flags, the AI budget caps and the CRM log method. */
export const SHOWABLE_FLAG_RE = /^GAP_(.*_(ENABLED|SHADOW|MODE|METHOD|TRANSPORT)|AI_MONTHLY_CEILING_USD|AI_TASK_BUDGET_USD|AI_MAX_PROMPT_CHARS|AI_MAX_OUTPUT_TOKENS)$/;

export function showableFlag(key: string, value: unknown): string | null {
  if (!SHOWABLE_FLAG_RE.test(key)) return null;
  const v = typeof value === 'string' ? value.trim() : '';
  return FLAG_VALUE_RE.test(v) ? v : null;
}

const short = (sha: string | null) => (sha ? sha.slice(0, 8) : 'unknown');

/** The deployment bound to the production alias: the newest READY production deployment, else null. */
export function liveDeployment(deployments: readonly ReceiptDeployment[], alias: string): ReceiptDeployment | null {
  const bound = deployments.find((d) => d.aliases.some((a) => a.replace(/^https?:\/\//, '') === alias));
  if (bound) return bound;
  return deployments.filter((d) => d.state === 'READY' && (d.target === 'production' || d.target === null)).sort((a, b) => (b.readyAt ?? '').localeCompare(a.readyAt ?? ''))[0] ?? null;
}

export function composeReceipt(i: ReceiptInputs): string {
  const live = liveDeployment(i.deployments, i.productionAlias);
  const liveCommit = live?.commit ?? null;
  const lines: string[] = [];
  lines.push('# GAP OS deployment and configuration receipt');
  lines.push('');
  lines.push(`STATUS: RECEIPT, generated ${i.generatedAt} by scripts/gap/deployment-receipt.ts (reads only; no secret values; regenerate rather than edit).`);
  lines.push(`<!-- verified:${i.generatedAt.slice(0, 10)} -->`);
  lines.push('');
  lines.push('Three things kept apart: the LOCAL CODE this receipt was generated from, the DEPLOYED ENVIRONMENT (the deployment Vercel serves on the production alias and the environment it snapshotted at build time), and the PROJECT SETTINGS (what the Vercel project holds now; a change here reaches production only with the next deploy).');
  lines.push('');
  lines.push('## 1. Local code');
  lines.push('');
  lines.push(`- Commit ${short(i.local.commit)} on ${i.local.branch}${i.local.dirty ? ' (uncommitted changes present)' : ' (clean)'}; origin/main ${short(i.local.originMain)}.`);
  lines.push(`- Local code ${liveCommit && i.local.commit.startsWith(liveCommit.slice(0, 8)) ? 'IS' : 'is NOT'} the deployed commit${liveCommit ? ` (deployed ${short(liveCommit)})` : ' (the deployed commit is unknown)'}.`);
  lines.push('');
  lines.push('## 2. Deployed environment');
  lines.push('');
  if (live) {
    lines.push(`- Production alias ${i.productionAlias} serves deployment ${live.id}, state ${live.state}, commit ${short(live.commit)}, ready ${live.readyAt ?? 'unknown'}${live.aliases.length ? ` (alias binding from the API: ${live.aliases.join(', ')})` : ' (alias binding inferred: newest READY production deployment; the API did not list aliases)'}.`);
  } else {
    lines.push(`- Production alias ${i.productionAlias}: no READY production deployment was read (see unread).`);
  }
  const others = i.deployments.filter((d) => d.id !== live?.id).slice(0, 4);
  if (others.length) lines.push(`- Other recent production deployments: ${others.map((d) => `${d.id} ${d.state} ${short(d.commit)}${d.readyAt ? ` ${d.readyAt}` : ''}`).join('; ')}.`);
  lines.push('- The environment a deployment runs with is the project environment snapshotted at ITS build; a project setting changed after that time is not in it until the next deploy.');
  if (i.deployedCrons) lines.push(`- Crons in the deployed build (${i.deployedCrons.length}): ${i.deployedCrons.map((c) => `${c.path} @ ${c.schedule}`).join('; ')}.`);
  else lines.push('- Crons in the deployed build: not read (the local vercel.json below is the code\'s declaration; the deployed set is what Vercel registered at build).');
  lines.push('');
  lines.push('## 3. Project settings (Vercel, now)');
  lines.push('');
  lines.push(`- Project ${i.project.name} (${i.project.id}) in team ${i.project.teamId}.`);
  const prodNames = i.envNames.filter((e) => e.targets.includes('production')).sort((a, b) => a.key.localeCompare(b.key));
  lines.push(`- Production environment variables (${prodNames.length} names; values are never in this receipt): ${prodNames.map((e) => `${e.key} [${e.type}]`).join(', ') || 'none read'}.`);
  const flags = i.flags.sort((a, b) => a.key.localeCompare(b.key));
  lines.push(`- Non-secret GAP flags as the project holds them now (${flags.length}): ${flags.map((f) => `${f.key}=${f.value ?? '(not shown)'}`).join(', ') || 'none read'}.`);
  lines.push(`- Crons declared by the local vercel.json (${i.localCrons.length}): ${i.localCrons.map((c) => `${c.path} @ ${c.schedule}`).join('; ')}.`);
  lines.push('');
  lines.push('## 4. Baseline pointer');
  lines.push('');
  if (i.baseline.line) {
    const agrees = !!(i.baseline.commit && liveCommit && liveCommit.startsWith(i.baseline.commit.slice(0, 7)));
    lines.push(`- ${i.baseline.file} says: ${i.baseline.line.trim().slice(0, 240)}${i.baseline.line.length > 240 ? ' ...' : ''}`);
    lines.push(agrees ? `- That pointer AGREES with the deployed commit (${short(liveCommit)}).` : `- HISTORICAL: that pointer names ${short(i.baseline.commit)} and the deployed commit is ${short(liveCommit)}; the pointer is a record of an earlier state, not the live one. Update it at its owning surface when a change ships.`);
  } else {
    lines.push(`- ${i.baseline.file}: no Production SHA line was read.`);
  }
  lines.push('');
  lines.push('## 5. Last successful source reads (health)');
  lines.push('');
  if (i.health) {
    lines.push(`- Health read ${i.health.checkedAt} (${i.health.source}): overall ${i.health.overall}.`);
    for (const c of i.health.components) lines.push(`- ${c.key}: ${c.state}. ${c.label}. ${c.detail}`);
  } else {
    lines.push('- Not read this run: the health route needs a seller session; pass --health <json file saved from /api/gap/health> to include it. Absent here means unread, not healthy.');
  }
  lines.push('');
  lines.push('## 6. Unread');
  lines.push('');
  if (i.unread.length) for (const u of i.unread) lines.push(`- ${u.source}: ${u.reason}`);
  else lines.push('- Every source above was read.');
  lines.push('');
  return lines.join('\n');
}

/**
 * Every configuration value the script saw that is not a flag word is redacted wherever it appears, named by its KEY
 * (a health line that quotes the sender address becomes "[value of GAP_GMAIL_USER_EMAIL]"); a token is redacted
 * without a name. The receipt then carries no configuration value at all.
 */
export function redactValues(receipt: string, seen: ReadonlyArray<{ key: string | null; value: string }>): string {
  let out = receipt;
  for (const { key, value } of [...seen].sort((a, b) => b.value.length - a.value.length)) {
    if (!value || value.length < 4) continue;
    out = out.split(value).join(key ? `[value of ${key}]` : '[redacted]');
  }
  return out;
}

/** Refuse a receipt that still carries any of the given values (the final guard after redaction). */
export function assertNoLeak(receipt: string, forbidden: ReadonlyArray<string>): void {
  for (const v of forbidden) {
    if (v && v.length >= 4 && receipt.includes(v)) throw new Error('the receipt would carry a configuration value that is not a flag word; refusing to write it');
  }
}
