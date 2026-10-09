import { nyDay, nyDayAt } from '../work/dates';
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
export type HealthKey = 'mailbox' | 'hubspot' | 'suppression' | 'sender' | 'routing' | 'briefing' | 'agents' | 'model';

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
  model: { owner: 'Casey', retry: 'Spend is the ledger rows ai.model_call this month against GAP_AI_MONTHLY_CEILING_USD (default $25); a blocked route names the provider reason on the last task row: fix AI_GATEWAY_API_KEY or the model in Vercel and redeploy, top up AI Gateway credits only with Casey, or raise the ceiling only with Casey; then decide the item again' },
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
  /** A02: the GAP model route and its spend this month (src/lib/gap/ai/spend.ts). */
  model?: { month: string; label: string; monthUsd: number; ceilingUsd: number; warnFraction: number; calls: number; failed: number; refused: number; inFlight: number; lastCall: { at: string; outcome: string; model: string | null; errorCategory: string | null } | null };
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

/** The provider reasons that do not get better by trying again: the route is blocked until someone changes it. */
export const MODEL_PERMANENT = new Set(['billing', 'authentication', 'model_missing', 'configuration']);

function model(i: HealthInputs['model']): HealthComponent {
  const base = { key: 'model' as const, name: 'Model route and spend' };
  if (!i) return { ...base, state: 'HEALTHY', label: 'Model spend not read', detail: 'The spend ledger was not read this time.' };
  // A real but tiny spend is shown as such, never rounded to nothing (three calls at $0.0002 each are not $0.00).
  const usd = (n: number) => (n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
  const pct = i.ceilingUsd > 0 ? Math.round((i.monthUsd / i.ceilingUsd) * 100) : 0;
  const detail = `${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label} (${pct}%): ${i.calls} call${i.calls === 1 ? '' : 's'}, ${i.failed} failed, ${i.refused} refused, ${i.inFlight} in flight${i.lastCall ? `; last call ${i.lastCall.outcome}${i.lastCall.model ? ` on ${i.lastCall.model}` : ''}${i.lastCall.errorCategory ? ` (${i.lastCall.errorCategory})` : ''} at ${i.lastCall.at}` : '; no call this month'}.`;
  if (i.lastCall && i.lastCall.outcome === 'failed' && i.lastCall.errorCategory && MODEL_PERMANENT.has(i.lastCall.errorCategory)) return { ...base, state: 'BLOCKED', label: `No funded model route · the last call failed (${i.lastCall.errorCategory})`, detail };
  if (i.monthUsd >= i.ceilingUsd) return { ...base, state: 'BLOCKED', label: `Model ceiling reached · ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label}`, detail };
  if (i.monthUsd >= i.ceilingUsd * i.warnFraction) return { ...base, state: 'DEGRADED', label: `Model spend ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label} (${pct}%)`, detail };
  if (i.lastCall && i.lastCall.outcome === 'refused') return { ...base, state: 'DEGRADED', label: `The last model call was refused (${i.lastCall.errorCategory ?? 'budget'})`, detail };
  return { ...base, state: 'HEALTHY', label: `Model spend ${usd(i.monthUsd)} of ${usd(i.ceilingUsd)} for ${i.label}`, detail };
}

export function evaluateHealth(inputs: HealthInputs, now: Date): HealthReport {
  const components = [mailbox(inputs.mailbox, now), hubspot(inputs.hubspot), suppression(inputs.suppression), sender(inputs.sender), routing(inputs.routing, now), briefing(inputs.briefing, now), agents(inputs.agents, now), model(inputs.model)].map(repaired);
  const overall = components.reduce<HealthState>((w, c) => (RANK[c.state] > RANK[w] ? c.state : w), 'HEALTHY');
  const routingC = components.find((c) => c.key === 'routing')!;
  const bad = components.filter((c) => c.state !== 'HEALTHY').sort((a, b) => RANK[b.state] - RANK[a.state]);
  const headline = overall === 'HEALTHY' ? `Healthy · ${routingC.label}` : bad.map((c) => c.label).join(' · ');
  return { overall, headline, components, checkedAt: now.toISOString() };
}
