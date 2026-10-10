import { nyDay, nyDayAt } from '../work/dates';
import type { ProducerStatus } from '../signals/producer-status';
/**
 * GAP system health (Phase 2 A3, 2026-09-28): can Casey trust the cockpit
 * right now? Five dependencies, each HEALTHY / DEGRADED / BLOCKED:
 *
 *   mailbox      GAP mailbox intake (cron gap-mailbox, every 10 minutes): replies and bounces
 *   hubspot      HubSpot opportunity reads: open-deal protection on every outbound click
 *   suppression  the suppression authority (clawd contract): DNC / unsubscribe / bounce truth
 *   sender       the GAP Gmail sender (casey@yardflow.ai) configured for Send email
 *   routing      the last completed routing run (card freshness)
 *
 * The overall state is the WORST component: a failed dependency is never
 * reported green because another one works. Pure evaluation (evaluateHealth)
 * is separate from the bounded probes (loadHealthInputs) so every state is
 * testable. No dashboard: one headline line, details under a disclosure.
 */

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'BLOCKED';
export type HealthKey = 'mailbox' | 'hubspot' | 'suppression' | 'sender' | 'routing' | 'briefing' | 'agents' | 'model' | 'context' | 'producers';

export interface HealthComponent {
  key: HealthKey;
  name: string;
  state: HealthState;
  /** One plain line for the seller. */
  label: string;
  /** Diagnostic detail for the disclosure. */
  detail: string;
  /** R63-A S16, not healthy only: who repairs it and how (the retry path in words), as the R65 operations lines do. */
  owner?: string;
  retry?: string;
}

/**
 * R63-A S16: "Blocked: Mailbox intake has never completed..." named no owner and no next step. Every component that is
 * not healthy now carries who repairs it and the retry path (the R65 FAILURE_OWNERSHIP shape).
 */
export const HEALTH_REPAIR: Readonly<Record<HealthKey, { owner: string; retry: string }>> = {
  mailbox: { owner: 'operator', retry: 'Read the last run message in the details; fix its cause, then run /api/cron/gap-mailbox/?mode=apply once with the cron secret (it also runs every 10 minutes on its own)' },
  hubspot: { owner: 'operator', retry: 'Check HUBSPOT_ACCESS_TOKEN in Vercel and that HubSpot answers; cold actions resume on their own once it reads' },
  suppression: { owner: 'operator', retry: 'Check CLAWD_CONTROL_PLANE_URL and its token in Vercel and that the clawd control plane answers; sends resume on their own once it gives a verdict' },
  sender: { owner: 'operator', retry: 'Set GAP_GMAIL_USER_EMAIL and its Gmail credential in Vercel, then redeploy' },
  routing: { owner: 'operator', retry: 'Recommendations refresh each weekday morning (the gap-routing schedule, GAP_ROUTING_CRON_ENABLED); to refresh now, open System at the foot of Work and press Run routing' },
  briefing: { owner: 'operator', retry: 'Check GAP_BRIEFING_ENABLED in Vercel and the briefing address on Settings; read the gap-briefing cron state and the briefing.failed rows for the day; run /api/cron/gap-briefing/ once with the cron secret (it also ticks every hour)' },
  agents: { owner: 'operator', retry: 'Check GAP_AGENT_TASKS_ENABLED in Vercel and the gap-agent-tasks cron state (every 5 minutes); a failed task keeps its error on its ledger row; reply REVISE again, or record the objection again, to queue a fresh task' },
  context: { owner: 'operator', retry: 'Commercial context is advisory: a send is never blocked by it, but a prepared angle on partial context is labelled so. Identity reads the canonicalCompany and gapAccountAlias tables; associations read HubSpot contacts; Sent reads the GAP sender\'s Gmail; the vault needs GAP_VAULT_DIR on the box that runs it; Clawd needs CLAWD_CONTROL_PLANE_URL and its token. A source rebuilt today whose newest knowledge is months old is said so; refresh the source, not the timestamp' },
  model: { owner: 'Casey', retry: 'Spend is the ledger rows ai.model_call this month against GAP_AI_MONTHLY_CEILING_USD (default $25); a blocked route names the provider reason on the last task row: fix AI_GATEWAY_API_KEY or the model in Vercel and redeploy, top up AI Gateway credits only with Casey, or raise the ceiling only with Casey; then decide the item again' },
  producers: { owner: 'operator', retry: 'Each producer is read from its intelligence.imported ledger rows (the import writes one per run) and the vault from knowledge.vault_synced; a stalled producer needs its export run and imported again through the import, a failed one carries its reason on the last row, and the vault needs the local push or GAP_VAULT_GITHUB_TOKEN in Vercel for the cron' },
};

const repaired = (c: HealthComponent): HealthComponent => {
  if (c.state === 'HEALTHY') return c;
  const r = c.key === 'mailbox' && /intake off/.test(c.label) ? HEALTH_REPAIR.sender : HEALTH_REPAIR[c.key];
  return { ...c, owner: r.owner, retry: r.retry };
};

export interface HealthReport {
  overall: HealthState;
  headline: string;
  components: HealthComponent[];
  checkedAt: string;
}

/** One context source's coverage as retrieval.ts reports it (C20): configured, reachable, how complete, the newest knowledge it holds, when it was rebuilt or indexed. */
export interface ContextSourceCoverage {
  configured: boolean;
  reachable: boolean;
  completeness: 'complete' | 'partial' | 'unknown';
  /** The newest observation the source holds (its own clock); null when unknown. */
  watermark: string | null;
  /** When the source was rebuilt or indexed; a label, never the knowledge's date (C15). */
  indexedAt: string | null;
  omittedReason: string | null;
}

export interface HealthInputs {
  mailbox: { senderConfigured: boolean; lastSuccessAt: Date | null; lastFailureAt: Date | null; consecutiveFailures: number; lastMessage: string | null };
  hubspot: { configured: boolean; ok: boolean; ms: number | null; error: string | null };
  suppression: { configured: boolean; verdict: 'clear' | 'suppressed' | 'unknown' | null; ms: number | null; error: string | null };
  sender: { configured: boolean; mailbox: string | null };
  routing: { lastRunAt: Date | null };
  /** X20a: the morning briefing (cron gap-briefing, hourly; sends once a day at the seller's hour). */
  briefing?: { enabled: boolean; to: string | null; hourNy: number | null; lastSuccessAt: Date | null; consecutiveFailures: number; lastMessage: string | null; sentTodayAt: Date | null; failedToday: number };
  /** X20a: the agent tasks drain (cron gap-agent-tasks, every 5 minutes): REVISE, objections. */
  agents?: { enabled: boolean; lastSuccessAt: Date | null; consecutiveFailures: number; lastMessage: string | null; queued: number; oldestQueuedAt: Date | null; failedFinalToday: number };
  /** C46: the commercial-context sources: whether each can be read now and how fresh what it holds is. Advisory; send safety is elsewhere. Absent: not probed (nothing claimed); `{ failed }`: the probe itself threw (C57 F14: that is not health). */
  context?: { failed: string } | {
    identity: { readable: boolean; companies: number | null; aliases: number | null; error: string | null };
    /** The HubSpot contact association read (the C02 path); null when HubSpot is not configured. */
    associations: { readable: boolean; ms: number | null; error: string | null } | null;
    /** The GAP sender's Gmail Sent read; configured false when no sender. */
    sent: { configured: boolean; readable: boolean | null; ms: number | null; error: string | null };
    vault: ContextSourceCoverage;
    clawd: ContextSourceCoverage;
    /** The account the vault and Clawd reads were run for (the newest account on record); null when none. */
    canary: { account: string; domain: string | null } | null;
    /**
     * Stream A (2026-10-09): the synced vault table (gap_knowledge_notes) and the last gap-vault-sync tick from the
     * ledger; absent when not read. `commitSha` (and `branch`, when the reader returns it): the vault revision that
     * tick recorded (2026-10-10); optional so older callers keep their shape.
     */
    vaultTable?:
      | { readable: true; rows: number; lastSyncedAt: string | null; kinds: Record<string, number>; tokenConfigured: boolean; localDir: boolean; lastSync: { ok: boolean; at: string; error: string | null; written: number | null; skipped: boolean; commitSha?: string | null; branch?: string | null } | null }
      | { readable: false; error: string; tokenConfigured: boolean; localDir: boolean };
  };
  /** IW13: the intelligence producers (signals/producer-status.ts). Absent: not read (no component); null: the read failed. */
  producers?: ProducerStatus[] | null;
  /** A02: the GAP model route and its spend this month (src/lib/gap/ai/spend.ts). */
  model?: { month: string; label: string; monthUsd: number; ceilingUsd: number; warnFraction: number; calls: number; failed: number; refused: number; inFlight: number; lastCall: { at: string; outcome: string; model: string | null; errorCategory: string | null } | null; /** A04: the AI Gateway credit balance (every call on the route draws on it, metered or not); null when unread. */ credits?: { balance: number; totalUsed: number } | null };
}

/** Mailbox intake runs every 10 minutes: one missed run is fine, three are degraded, three hours is blocked. */
export const MAILBOX_HEALTHY_MS = 30 * 60_000;
export const MAILBOX_BLOCKED_MS = 3 * 60 * 60_000;
export const ROUTING_FRESH_MS = 24 * 60 * 60_000;
/** X20a: the briefing cron ticks hourly at :05; past this grace after the seller's hour, an unsent briefing is degraded. */
export const BRIEFING_GRACE_MS = 90 * 60_000;
/** X20a: agent tasks drain every 5 minutes; a queued task older than this, or a drain older than this, is degraded. */
export const AGENTS_STALE_MS = 30 * 60_000;
export const AGENT_TASK_WAIT_MS = 20 * 60_000;
export const HUBSPOT_SLOW_MS = 5_000;
/** Past half the action-time suppression timeout, a click is at risk of timing out: DEGRADED. */
export const SUPPRESSION_SLOW_MS = 4_000;

const RANK: Record<HealthState, number> = { HEALTHY: 0, DEGRADED: 1, BLOCKED: 2 };

export function ago(ms: number): string {
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 172_800_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

function mailbox(i: HealthInputs['mailbox'], now: Date): HealthComponent {
  const base = { key: 'mailbox' as const, name: 'Mailbox intake' };
  if (!i.senderConfigured) return { ...base, state: 'BLOCKED', label: 'Mailbox intake off · replies are not being read', detail: 'GAP Gmail sender is not configured, so the gap-mailbox cron cannot read casey@yardflow.ai.' };
  if (!i.lastSuccessAt) return { ...base, state: 'BLOCKED', label: 'Mailbox intake has never completed · replies are not being read', detail: i.lastMessage ?? 'No successful gap-mailbox run on record.' };
  const age = now.getTime() - i.lastSuccessAt.getTime();
  const detail = `Last successful run ${ago(age)} (${i.lastSuccessAt.toISOString()}); ${i.consecutiveFailures} consecutive failure(s)${i.lastMessage ? `; last message: ${i.lastMessage}` : ''}.`;
  if (age > MAILBOX_BLOCKED_MS) return { ...base, state: 'BLOCKED', label: `Mailbox intake stopped ${ago(age)} · replies are not being seen`, detail };
  if (age > MAILBOX_HEALTHY_MS) return { ...base, state: 'DEGRADED', label: `Mailbox intake stale (${ago(age)}) · replies may be delayed`, detail };
  if (i.consecutiveFailures > 0) return { ...base, state: 'DEGRADED', label: 'Mailbox intake last run failed · replies may be delayed', detail };
  return { ...base, state: 'HEALTHY', label: `Mailbox intake ${ago(age)}`, detail };
}

function hubspot(i: HealthInputs['hubspot']): HealthComponent {
  const base = { key: 'hubspot' as const, name: 'HubSpot opportunity truth' };
  if (!i.configured) return { ...base, state: 'BLOCKED', label: 'HubSpot opportunity truth unavailable · cold actions fail closed', detail: 'HUBSPOT_ACCESS_TOKEN is not set: every open-deal check answers UNKNOWN and refuses.' };
  if (!i.ok) return { ...base, state: 'BLOCKED', label: 'HubSpot opportunity truth unavailable · cold actions fail closed', detail: `HubSpot read failed: ${i.error ?? 'unknown error'}.` };
  if (i.ms !== null && i.ms > HUBSPOT_SLOW_MS) return { ...base, state: 'DEGRADED', label: 'HubSpot slow · some cold actions may fail closed', detail: `HubSpot answered in ${i.ms}ms (checks time out at 15s and then refuse).` };
  return { ...base, state: 'HEALTHY', label: 'HubSpot reads OK', detail: `HubSpot answered in ${i.ms ?? '?'}ms.` };
}

function suppression(i: HealthInputs['suppression']): HealthComponent {
  const base = { key: 'suppression' as const, name: 'Suppression authority' };
  if (!i.configured) return { ...base, state: 'BLOCKED', label: 'Suppression authority not configured · outbound blocked', detail: 'CLAWD_CONTROL_PLANE_URL / TOKEN are not set: suppression answers unknown and every send refuses.' };
  if (i.verdict !== 'clear' && i.verdict !== 'suppressed') return { ...base, state: 'BLOCKED', label: 'Suppression authority unreachable · outbound blocked', detail: `The suppression contract did not give a verdict (${i.error ?? 'unknown'}). Drafts and sends refuse until it answers.` };
  if (i.ms !== null && i.ms > SUPPRESSION_SLOW_MS) return { ...base, state: 'DEGRADED', label: 'Suppression check slow · drafts and sends may time out', detail: `Contract answered in ${i.ms}ms; a click waits at most 8s and then refuses (nothing is created; retry).` };
  return { ...base, state: 'HEALTHY', label: 'Suppression authority OK', detail: `Contract answered in ${i.ms ?? '?'}ms.` };
}

function sender(i: HealthInputs['sender']): HealthComponent {
  const base = { key: 'sender' as const, name: 'GAP sender' };
  if (!i.configured) return { ...base, state: 'BLOCKED', label: 'GAP sender not configured · Send email unavailable', detail: 'GAP_GMAIL_USER_EMAIL and a credential are not both set.' };
  return { ...base, state: 'HEALTHY', label: `Sending as ${i.mailbox}`, detail: `GAP sends from ${i.mailbox}.` };
}

function routing(i: HealthInputs['routing'], now: Date): HealthComponent {
  const base = { key: 'routing' as const, name: 'Routing' };
  // R60: the health line on Work is read by the seller: the recommendations, never the routing machinery.
  if (!i.lastRunAt) return { ...base, state: 'DEGRADED', label: 'No recommendations made yet · cards may be missing', detail: 'No completed routing run on record.' };
  const age = now.getTime() - i.lastRunAt.getTime();
  const detail = `Last completed routing run ${i.lastRunAt.toISOString()}. Every outbound click re-checks the card, so an old card cannot send stale.`;
  if (age > ROUTING_FRESH_MS) return { ...base, state: 'DEGRADED', label: `Recommendations refreshed ${ago(age)} · cards may be stale`, detail };
  return { ...base, state: 'HEALTHY', label: `recommendations refreshed ${ago(age)}`, detail };
}

const hourText = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
const nyTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

function briefing(i: HealthInputs['briefing'], now: Date): HealthComponent {
  const base = { key: 'briefing' as const, name: 'Morning briefing' };
  if (!i || !i.enabled) return { ...base, state: 'HEALTHY', label: 'Morning briefing off', detail: 'GAP_BRIEFING_ENABLED is off: no briefing email goes out; Work is the list.' };
  if (!i.to) return { ...base, state: 'DEGRADED', label: 'No briefing address · the briefing cannot go out', detail: 'Set the briefing address on Settings (/gap/settings).' };
  const hour = i.hourNy ?? 7;
  const runState = `${i.lastSuccessAt ? `cron last ran ${ago(now.getTime() - i.lastSuccessAt.getTime())}` : 'the cron has never completed'}; ${i.consecutiveFailures} consecutive failure(s)${i.lastMessage ? `; last message: ${i.lastMessage}` : ''}`;
  if (i.sentTodayAt) return { ...base, state: 'HEALTHY', label: `Briefing sent ${nyTime(i.sentTodayAt)}`, detail: `Today's briefing went to ${i.to} at ${nyTime(i.sentTodayAt)} New York (${runState}).` };
  const due = nyDayAt(nyDay(now), hour);
  if (now.getTime() < due.getTime()) return { ...base, state: 'HEALTHY', label: `Briefing due ${hourText(hour)}`, detail: `Today's briefing to ${i.to} is due at ${hourText(hour)} New York (${runState}).` };
  if (i.failedToday > 0) return { ...base, state: 'DEGRADED', label: `Today's briefing failed (${i.failedToday} attempt${i.failedToday === 1 ? '' : 's'}) · the mailbox or the sender`, detail: `No briefing.sent row for today; ${i.failedToday} briefing.failed row(s) (${runState}).` };
  if (now.getTime() - due.getTime() > BRIEFING_GRACE_MS) return { ...base, state: 'DEGRADED', label: `Today's briefing has not gone out (due ${hourText(hour)})`, detail: `No briefing.sent row for today ${ago(now.getTime() - due.getTime())} past the hour (${runState}).` };
  return { ...base, state: 'HEALTHY', label: `Briefing due now (${hourText(hour)})`, detail: `The hourly tick after ${hourText(hour)} New York sends it (${runState}).` };
}

function agents(i: HealthInputs['agents'], now: Date): HealthComponent {
  const base = { key: 'agents' as const, name: 'Agent tasks' };
  if (!i || !i.enabled) return { ...base, state: 'HEALTHY', label: 'Agent tasks off', detail: 'GAP_AGENT_TASKS_ENABLED is off: REVISE and objection tasks queue and wait.' };
  const runState = `${i.consecutiveFailures} consecutive failure(s)${i.lastMessage ? `; last message: ${i.lastMessage}` : ''}; ${i.queued} queued`;
  if (!i.lastSuccessAt) return { ...base, state: 'DEGRADED', label: 'Agent tasks have never run · REVISE and objections wait', detail: `No successful gap-agent-tasks run on record (${runState}).` };
  const age = now.getTime() - i.lastSuccessAt.getTime();
  const detail = `Last successful drain ${ago(age)} (${i.lastSuccessAt.toISOString()}); ${runState}.`;
  if (age > AGENTS_STALE_MS) return { ...base, state: 'DEGRADED', label: `Agent tasks stale (${ago(age)}) · REVISE and objections wait`, detail };
  const waited = i.oldestQueuedAt ? now.getTime() - i.oldestQueuedAt.getTime() : 0;
  if (i.queued > 0 && waited > AGENT_TASK_WAIT_MS) return { ...base, state: 'DEGRADED', label: `${i.queued} task${i.queued === 1 ? '' : 's'} waiting ${ago(waited)}`, detail };
  if (i.failedFinalToday > 0) return { ...base, state: 'DEGRADED', label: `${i.failedFinalToday} task${i.failedFinalToday === 1 ? '' : 's'} failed today · read its error`, detail };
  return { ...base, state: 'HEALTHY', label: `Agent tasks ${ago(age)}`, detail };
}

/** C46: knowledge older than this, however recently rebuilt, is said to be old. */
export const CONTEXT_STALE_DAYS = 60;

/**
 * C46: the commercial-context component. Never BLOCKED (send safety is the suppression, sender and HubSpot components);
 * DEGRADED when a configured source cannot be read, when identity cannot be read, or when a source's newest knowledge
 * is older than CONTEXT_STALE_DAYS although it was rebuilt recently; a source that is not configured is said as
 * partial, not as healthy-and-complete. "Complete" is said only when every configured source read whole and fresh.
 */
function context(i: HealthInputs['context'], now: Date): HealthComponent {
  const base = { key: 'context' as const, name: 'Commercial context' };
  if (!i) return { ...base, state: 'HEALTHY', label: 'Commercial context not read', detail: 'The context sources were not probed this time; nothing here says they are complete.' };
  // C57 F14: the loader reads each source soft; when the probe itself throws, that is said as a failure, never as health.
  if ('failed' in i) return { ...base, state: 'DEGRADED', label: 'Commercial context not read (the probe failed)', detail: `The context sources could not be probed this time (${i.failed}); nothing here says they are complete.` };
  const problems: string[] = [];
  const partial: string[] = [];
  const facts: string[] = [];
  const days = (iso: string | null) => (iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000) : null);
  if (!i.identity.readable) problems.push(`identity tables unreadable${i.identity.error ? ` (${i.identity.error})` : ''}`);
  else facts.push(`identity: ${i.identity.companies ?? '?'} companies, ${i.identity.aliases ?? '?'} aliases`);
  if (i.associations === null) partial.push('HubSpot associations: HubSpot not configured');
  else if (!i.associations.readable) problems.push(`HubSpot associations unreadable${i.associations.error ? ` (${i.associations.error})` : ''}`);
  else facts.push(`HubSpot associations read in ${i.associations.ms ?? '?'}ms`);
  if (!i.sent.configured) partial.push('Sent: no GAP sender');
  else if (i.sent.readable === false) problems.push(`Gmail Sent unreadable${i.sent.error ? ` (${i.sent.error})` : ''}: who we wrote to is unknown, so quiet and answer owed are one-sided`);
  else if (i.sent.readable === null) partial.push('Sent: not probed');
  else facts.push(`Sent read in ${i.sent.ms ?? '?'}ms`);
  // Stream A: the synced vault table (gap_knowledge_notes) speaks for the vault source when it holds rows ("vault: N
  // notes (92 calls, 78 account notes), synced 10:39 New York"); a failed last gap-vault-sync tick is a problem; an
  // empty table while the coverage row says not configured is one "not configured" line naming what is missing.
  const vt = i.vaultTable;
  if (vt && !vt.readable) problems.push(`vault table unreadable (${vt.error})`);
  else if (vt && vt.readable) {
    if (vt.lastSync && !vt.lastSync.ok) problems.push(`vault sync failed: the last tick ${nyClock(vt.lastSync.at, now)}${vt.lastSync.error ? ` (${vt.lastSync.error})` : ''}; the table still serves what it held`);
    // The last good tick and the vault revision it recorded ("last sync 10:39 New York, vault revision 1a2b3c4"), so the
    // seller can tell which vault the table holds; a tick that recorded no revision says the time only.
    const tick = vt.lastSync && vt.lastSync.ok ? `, last sync ${nyClock(vt.lastSync.at, now)}${vt.lastSync.commitSha ? `, vault revision ${vt.lastSync.commitSha.slice(0, 7)}${vt.lastSync.branch ? ` (${vt.lastSync.branch})` : ''}` : ''}` : '';
    if (vt.rows > 0) facts.push(`vault: ${vt.rows} notes (${vaultKindWords(vt.kinds)})${vt.lastSyncedAt ? `, synced ${nyClock(vt.lastSyncedAt, now)}` : ''}${tick}`);
    else if (!i.vault.configured) partial.push(`vault: not configured (${vt.tokenConfigured ? 'the token is set; the knowledge table is empty until the first gap-vault-sync tick' : vt.localDir ? 'the local directory is set on this box only; the knowledge table is empty' : 'no GAP_VAULT_GITHUB_TOKEN, no GAP_VAULT_DIR, the knowledge table is empty'})`);
  }
  for (const [name, c] of [['vault', i.vault], ['Clawd', i.clawd]] as const) {
    if (name === 'vault' && vt?.readable && vt.rows === 0 && !c.configured) continue; // said above, once
    if (!c.configured) { partial.push(`${name}: not configured${c.omittedReason ? ` (${c.omittedReason})` : ''}`); continue; }
    if (!c.reachable) { problems.push(`${name} unreachable${c.omittedReason ? ` (${c.omittedReason})` : ''}`); continue; }
    const age = days(c.watermark);
    const rebuilt = days(c.indexedAt);
    const words = `${name}: ${c.completeness}${c.watermark ? `, newest knowledge ${c.watermark.slice(0, 10)}` : ', no dated knowledge'}${c.indexedAt ? `, rebuilt ${c.indexedAt.slice(0, 10)}` : ''}`;
    if (age !== null && age > CONTEXT_STALE_DAYS) problems.push(`${words}: ${age} days old${rebuilt !== null && rebuilt <= 7 ? ' although rebuilt this week: the rebuild carried no newer knowledge' : ''}`);
    else if (!c.watermark) partial.push(`${words} (no dated knowledge: nothing here is fresh)`);
    else if (c.completeness === 'partial') partial.push(words + (c.omittedReason ? ` (${c.omittedReason})` : ''));
    else facts.push(words);
  }
  const canary = i.canary ? ` Probed on ${i.canary.account}${i.canary.domain ? ` (${i.canary.domain})` : ''}.` : ' No account on record to probe the vault and Clawd with.';
  const detail = `${[...problems, ...partial, ...facts].join('; ')}.${canary}${problems.length ? ' A prepared angle on this context is labelled partial; sends are gated elsewhere and unchanged.' : ''}`;
  if (problems.length) return { ...base, state: 'DEGRADED', label: `Commercial context incomplete · ${problems[0].split(':')[0]}`, detail };
  if (partial.length) return { ...base, state: 'HEALTHY', label: `Commercial context partial · ${partial.map((p) => p.split(':')[0]).join(', ')}`, detail };
  return { ...base, state: 'HEALTHY', label: 'Commercial context complete and fresh', detail };
}

/** "92 calls, 78 account notes, 85 meeting notes" from the table's counts by kind (stream A). */
function vaultKindWords(kinds: Record<string, number>): string {
  const parts: string[] = [];
  const say = (n: number | undefined, one: string, many: string) => (n ?? 0) > 0 && parts.push(`${n} ${n === 1 ? one : many}`);
  say(kinds.raw, 'call', 'calls');
  say(kinds.account, 'account note', 'account notes');
  say(kinds.meeting, 'meeting note', 'meeting notes');
  say(kinds.deal, 'deal note', 'deal notes');
  say(kinds.person, 'people note', 'people notes');
  return parts.length ? parts.join(', ') : 'no notes by kind';
}

/** "10:39 New York" for an instant (today's clock), or "Oct 8, 10:39 New York" when it is another day. */
function nyClock(iso: string, now?: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const sameDay = now ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d) === new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now) : false;
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).format(d);
  return sameDay ? `${time} New York` : `${day}, ${time} New York`;
}

/** The provider reasons that do not get better by trying again: the route is blocked until someone changes it. */
export const MODEL_PERMANENT = new Set(['billing', 'authentication', 'model_missing', 'configuration']);

function model(i: HealthInputs['model']): HealthComponent {
  const base = { key: 'model' as const, name: 'Model route and spend' };
  if (!i) return { ...base, state: 'HEALTHY', label: 'Model spend not read', detail: 'The spend ledger was not read this time.' };
  // A real but tiny spend is shown as such, never rounded to nothing (three calls at $0.0002 each are not $0.00).
  const usd = (n: number) => (n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
  const pct = i.ceilingUsd > 0 ? Math.round((i.monthUsd / i.ceilingUsd) * 100) : 0;
  const credits = i.credits ? `; AI Gateway credits ${usd(i.credits.balance)} left (${usd(i.credits.totalUsed)} used, every path on the route)` : '';
  const detail = `${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label} (${pct}%): ${i.calls} call${i.calls === 1 ? '' : 's'}, ${i.failed} failed, ${i.refused} refused, ${i.inFlight} in flight${i.lastCall ? `; last call ${i.lastCall.outcome}${i.lastCall.model ? ` on ${i.lastCall.model}` : ''}${i.lastCall.errorCategory ? ` (${i.lastCall.errorCategory})` : ''} at ${i.lastCall.at}` : '; no call this month'}${credits}.`;
  if (i.credits && i.credits.balance <= 0) return { ...base, state: 'BLOCKED', label: 'AI Gateway credits are spent', detail };
  if (i.lastCall && i.lastCall.outcome === 'failed' && i.lastCall.errorCategory && MODEL_PERMANENT.has(i.lastCall.errorCategory)) return { ...base, state: 'BLOCKED', label: `No funded model route · the last call failed (${i.lastCall.errorCategory})`, detail };
  if (i.monthUsd >= i.ceilingUsd) return { ...base, state: 'BLOCKED', label: `Model ceiling reached · ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label}`, detail };
  if (i.monthUsd >= i.ceilingUsd * i.warnFraction) return { ...base, state: 'DEGRADED', label: `Model spend ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label} (${pct}%)`, detail };
  if (i.lastCall && i.lastCall.outcome === 'refused') return { ...base, state: 'DEGRADED', label: `The last model call was refused (${i.lastCall.errorCategory ?? 'budget'})`, detail };
  return { ...base, state: 'HEALTHY', label: `Model spend ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label}${i.credits ? ` · gateway credits ${usd(i.credits.balance)}` : ''}`, detail };
}

/**
 * IW13: the intelligence producers. HEALTHY when every producer that has ever imported is current (named), DEGRADED
 * when any is stalled or failed (named, with since when), HEALTHY "No producer has imported yet" when none has. Never
 * BLOCKED: a producer that stops is missing intelligence, not a safety matter. Absent input: not read, no component
 * (the older callers' reports keep their shape); null: the read itself failed, said as such.
 */
function producers(i: HealthInputs['producers']): HealthComponent | null {
  const base = { key: 'producers' as const, name: 'Intelligence producers' };
  if (i === undefined) return null;
  if (i === null) return { ...base, state: 'DEGRADED', label: 'Intelligence producers not readable', detail: 'The producer ledger could not be read this time.' };
  const detail = i.map((s) => s.line).join(' ') || 'No producer on record.';
  // A producer whose consumer has no credential yet (not_configured) is a setup step, not a stalled source: named in the detail, not in the label.
  const ever = i.filter((s) => s.state !== 'never' && s.state !== 'not_configured');
  if (!ever.length) return { ...base, state: 'HEALTHY', label: 'No producer has imported yet', detail };
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  const bad = ever.filter((s) => s.state === 'stale' || s.state === 'failed');
  if (bad.length) {
    const words = bad.map((s) => (s.state === 'failed' ? `${s.label} failed ${day(s.lastImportAt!)}` : `${s.label} stalled since ${day(s.lastImportAt!)}`));
    return { ...base, state: 'DEGRADED', label: `Intelligence producers: ${words.join('; ')}`, detail };
  }
  return { ...base, state: 'HEALTHY', label: `Intelligence producers current: ${ever.map((s) => s.label).join(', ')}`, detail };
}

export function evaluateHealth(inputs: HealthInputs, now: Date): HealthReport {
  const components = [mailbox(inputs.mailbox, now), hubspot(inputs.hubspot), suppression(inputs.suppression), sender(inputs.sender), routing(inputs.routing, now), briefing(inputs.briefing, now), agents(inputs.agents, now), model(inputs.model), context(inputs.context, now), producers(inputs.producers)].filter((c): c is HealthComponent => c !== null).map(repaired);
  const overall = components.reduce<HealthState>((w, c) => (RANK[c.state] > RANK[w] ? c.state : w), 'HEALTHY');
  const routingC = components.find((c) => c.key === 'routing')!;
  const bad = components.filter((c) => c.state !== 'HEALTHY').sort((a, b) => RANK[b.state] - RANK[a.state]);
  const headline = overall === 'HEALTHY' ? `Healthy · ${routingC.label}` : bad.map((c) => c.label).join(' · ');
  return { overall, headline, components, checkedAt: now.toISOString() };
}
