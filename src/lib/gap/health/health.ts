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
export type HealthKey = 'mailbox' | 'hubspot' | 'suppression' | 'sender' | 'routing';

export interface HealthComponent {
  key: HealthKey;
  name: string;
  state: HealthState;
  /** One plain line for the seller. */
  label: string;
  /** Diagnostic detail for the disclosure. */
  detail: string;
}

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
}

/** Mailbox intake runs every 10 minutes: one missed run is fine, three are degraded, three hours is blocked. */
export const MAILBOX_HEALTHY_MS = 30 * 60_000;
export const MAILBOX_BLOCKED_MS = 3 * 60 * 60_000;
export const ROUTING_FRESH_MS = 24 * 60 * 60_000;
export const HUBSPOT_SLOW_MS = 5_000;

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
  if (i.verdict !== 'clear' && i.verdict !== 'suppressed') return { ...base, state: 'BLOCKED', label: 'Suppression authority unreachable · outbound blocked', detail: `The suppression contract did not give a verdict (${i.error ?? 'unknown'}).` };
  return { ...base, state: 'HEALTHY', label: 'Suppression authority OK', detail: `Contract answered in ${i.ms ?? '?'}ms.` };
}

function sender(i: HealthInputs['sender']): HealthComponent {
  const base = { key: 'sender' as const, name: 'GAP sender' };
  if (!i.configured) return { ...base, state: 'BLOCKED', label: 'GAP sender not configured · Send email unavailable', detail: 'GAP_GMAIL_USER_EMAIL and a credential are not both set.' };
  return { ...base, state: 'HEALTHY', label: `Sending as ${i.mailbox}`, detail: `GAP sends from ${i.mailbox}.` };
}

function routing(i: HealthInputs['routing'], now: Date): HealthComponent {
  const base = { key: 'routing' as const, name: 'Routing' };
  if (!i.lastRunAt) return { ...base, state: 'DEGRADED', label: 'No routing run yet · cards may be missing', detail: 'No completed routing run on record.' };
  const age = now.getTime() - i.lastRunAt.getTime();
  const detail = `Last completed routing run ${i.lastRunAt.toISOString()}. Every outbound click re-checks the card, so an old card cannot send stale.`;
  if (age > ROUTING_FRESH_MS) return { ...base, state: 'DEGRADED', label: `Routing refreshed ${ago(age)} · cards may be stale`, detail };
  return { ...base, state: 'HEALTHY', label: `routing refreshed ${ago(age)}`, detail };
}

export function evaluateHealth(inputs: HealthInputs, now: Date): HealthReport {
  const components = [mailbox(inputs.mailbox, now), hubspot(inputs.hubspot), suppression(inputs.suppression), sender(inputs.sender), routing(inputs.routing, now)];
  const overall = components.reduce<HealthState>((w, c) => (RANK[c.state] > RANK[w] ? c.state : w), 'HEALTHY');
  const routingC = components.find((c) => c.key === 'routing')!;
  const bad = components.filter((c) => c.state !== 'HEALTHY').sort((a, b) => RANK[b.state] - RANK[a.state]);
  const headline = overall === 'HEALTHY' ? `Healthy · ${routingC.label}` : bad.map((c) => c.label).join(' · ');
  return { overall, headline, components, checkedAt: now.toISOString() };
}
