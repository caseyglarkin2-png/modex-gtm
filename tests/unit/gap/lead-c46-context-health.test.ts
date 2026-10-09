// @vitest-environment node
/**
 * C46 (the commercial-context audit, 2026-10-08): health covers contextual completeness. A Clawd snapshot rebuilt
 * this week whose newest knowledge is from July cannot report complete context; an unreadable Sent mailbox cannot
 * either; a source that is not configured is said as partial, never as complete; complete and fresh is said only
 * when every configured source read whole and fresh. The component never blocks (send safety is elsewhere) and
 * labels the consequence for a prepared angle. The loader reads each source soft and bounded.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { CONTEXT_STALE_DAYS, evaluateHealth, HEALTH_REPAIR, type HealthInputs } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';

const NOW = new Date('2026-10-08T15:00:00Z');
const base = (): HealthInputs => ({
  mailbox: { senderConfigured: true, lastSuccessAt: new Date(NOW.getTime() - 60_000), lastFailureAt: null, consecutiveFailures: 0, lastMessage: null },
  hubspot: { configured: true, ok: true, ms: 100, error: null },
  suppression: { configured: true, verdict: 'clear', ms: 200, error: null },
  sender: { configured: true, mailbox: 'casey@yardflow.ai' },
  routing: { lastRunAt: new Date(NOW.getTime() - 3_600_000) },
});
type ContextProbe = Exclude<NonNullable<HealthInputs['context']>, { failed: string }>;
const fresh = (): ContextProbe => ({
  identity: { readable: true, companies: 412, aliases: 96, error: null },
  associations: { readable: true, ms: 140, error: null },
  sent: { configured: true, readable: true, ms: 900, error: null },
  vault: { configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-07T00:00:00.000Z', indexedAt: '2026-10-08T06:00:00.000Z', omittedReason: null },
  clawd: { configured: true, reachable: true, completeness: 'complete', watermark: '2026-10-06T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z', omittedReason: null },
  canary: { account: 'Kenco Logistics', domain: 'kencogroup.com' },
});
const ctx = (i: HealthInputs) => evaluateHealth(i, NOW).components.find((c) => c.key === 'context')!;

describe('C46: the commercial-context component', () => {
  it('complete and fresh only when every configured source read whole and fresh; the canary account is named', () => {
    const c = ctx({ ...base(), context: fresh() });
    expect(c).toMatchObject({ state: 'HEALTHY', label: 'Commercial context complete and fresh' });
    expect(c.detail).toContain('identity: 412 companies, 96 aliases');
    expect(c.detail).toContain('Probed on Kenco Logistics (kencogroup.com).');
    expect(evaluateHealth({ ...base(), context: fresh() }, NOW).components.map((x) => x.key)).toContain('context');
  });

  it('a Clawd snapshot rebuilt this week whose newest knowledge is from July cannot report complete: DEGRADED, the rebuild said to carry no newer knowledge, the angle consequence labelled, never BLOCKED', () => {
    const i = fresh();
    i.clawd = { ...i.clawd, watermark: '2026-07-11T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z' };
    const c = ctx({ ...base(), context: i });
    expect(c.state).toBe('DEGRADED');
    expect(c.label).toBe('Commercial context incomplete · Clawd');
    expect(c.detail).toContain('Clawd: complete, newest knowledge 2026-07-11, rebuilt 2026-10-08: 89 days old although rebuilt this week: the rebuild carried no newer knowledge');
    expect(c.detail).toContain('A prepared angle on this context is labelled partial; sends are gated elsewhere and unchanged.');
    expect(c.owner).toBe('operator');
    expect(c.retry).toBe(HEALTH_REPAIR.context.retry);
    expect(CONTEXT_STALE_DAYS).toBe(60);
    expect(evaluateHealth({ ...base(), context: i }, NOW).overall).toBe('DEGRADED');
  });

  it('an unreadable Sent mailbox cannot report complete context and says what is then one-sided; identity unreadable degrades too', () => {
    const i = fresh();
    i.sent = { configured: true, readable: false, ms: 8000, error: 'no answer in 8000ms' };
    const c = ctx({ ...base(), context: i });
    expect(c.state).toBe('DEGRADED');
    expect(c.label).toBe('Commercial context incomplete · Gmail Sent unreadable (no answer in 8000ms)');
    expect(c.detail).toContain('who we wrote to is unknown, so quiet and answer owed are one-sided');
    const j = fresh();
    j.identity = { readable: false, companies: null, aliases: 96, error: 'canonicalCompany not readable' };
    expect(ctx({ ...base(), context: j })).toMatchObject({ state: 'DEGRADED', label: 'Commercial context incomplete · identity tables unreadable (canonicalCompany not readable)' });
  });

  it('a source that is not configured is said as partial, never complete; a vault read in production has no directory; not read at all says so', () => {
    const i = fresh();
    i.vault = { configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: 'no vault configured' };
    i.associations = null;
    const c = ctx({ ...base(), context: i });
    expect(c.state).toBe('HEALTHY');
    expect(c.label).toBe('Commercial context partial · HubSpot associations, vault');
    expect(c.detail).toContain('vault: not configured (no vault configured)');
    expect(c.detail).not.toContain('complete and fresh');
    const none = ctx(base());
    expect(none).toMatchObject({ state: 'HEALTHY', label: 'Commercial context not read' });
    expect(none.detail).toContain('nothing here says they are complete');
    // C57 F14: a probe that threw is said as a failure, never as health.
    const failed = ctx({ ...base(), context: { failed: 'canonicalCompany not readable' } });
    expect(failed).toMatchObject({ state: 'DEGRADED', label: 'Commercial context not read (the probe failed)' });
    expect(failed.detail).toContain('(canonicalCompany not readable)');
    // C57 F14: a reachable source with no dated knowledge is partial, never complete and fresh.
    const undated = fresh();
    undated.vault = { ...undated.vault, watermark: null };
    expect(ctx({ ...base(), context: undated }).label).toBe('Commercial context partial · vault');
  });
});

describe('C46: the loader reads each context source soft and bounded', () => {
  it('counts the identity tables, probes associations and Sent, reads the vault and Clawd coverage for the newest account; a throwing probe is unreadable, never a crash', async () => {
    const db = ledgerDb({ accounts: ['Kenco Logistics'] }, NOW);
    const client = db.client() as Record<string, unknown>;
    const prisma = {
      ...client,
      canonicalCompany: { count: async () => 412, findMany: async () => [], findFirst: async () => ({ primary_account_name: 'Kenco Logistics', domain: 'kencogroup.com' }) },
      gapAccountAlias: { count: async () => 96, findMany: async () => [] },
    };
    const knowledge = vi.fn(async () => ({ coverage: [
      { source: 'vault', configured: true, reachable: true, completeness: 'complete' as const, watermark: '2026-10-07T00:00:00.000Z', indexedAt: '2026-10-08T06:00:00.000Z', omittedReason: null },
      { source: 'clawd', configured: true, reachable: true, completeness: 'complete' as const, watermark: '2026-07-11T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z', omittedReason: null },
    ] }));
    const env = { HUBSPOT_ACCESS_TOKEN: 'set', GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'r' };
    const inputs = await loadHealthInputs(prisma as never, { env, clock: () => NOW.getTime(), hubspotPing: async () => undefined, associationsProbe: async () => undefined, sentProbe: async () => { throw new Error('Gmail 503'); }, knowledge });
    expect(inputs.context).toMatchObject({
      identity: { readable: true, companies: 412, aliases: 96 },
      associations: { readable: true },
      sent: { configured: true, readable: false, error: 'Gmail 503' },
      vault: { configured: true, reachable: true, watermark: '2026-10-07T00:00:00.000Z' },
      clawd: { configured: true, reachable: true, watermark: '2026-07-11T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z' },
      canary: { account: 'Kenco Logistics', domain: 'kencogroup.com' },
    });
    expect(knowledge).toHaveBeenCalledWith({ accountName: 'Kenco Logistics', domain: 'kencogroup.com', now: NOW });
    const c = evaluateHealth(inputs, NOW).components.find((x) => x.key === 'context')!;
    expect(c.state).toBe('DEGRADED');
    expect(c.detail).toContain('Gmail Sent unreadable (Gmail 503)');
    expect(c.detail).toContain('Clawd: complete, newest knowledge 2026-07-11, rebuilt 2026-10-08: 89 days old although rebuilt this week');
    // No identity tables and no sender: unreadable identity, Sent not configured, no canary: said, not crashed.
    const bare = await loadHealthInputs({ gapAuditEvent: { findMany: async () => [], findFirst: async () => null, count: async () => 0 } } as never, { env: {}, clock: () => NOW.getTime() });
    expect(bare.context).toMatchObject({ identity: { readable: false }, associations: null, sent: { configured: false, readable: null }, vault: { configured: false, omittedReason: 'no account on record to probe with' }, canary: null });
  });
});
