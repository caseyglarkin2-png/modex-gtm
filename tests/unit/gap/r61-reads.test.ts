// @vitest-environment node
/**
 * R61: the account page waited on reads made one round trip after another and on reads repeated within one view
 * (measured under production-like latency: 144 to 153 database round trips and 4.5 to 5.0 s to the full page). These
 * pins hold the fixes: reads that need only the account's name start together; the seeded copy families are asked
 * once a minute per shape, never twice per page; an account-scoped card read never pulls every account's decisions;
 * the deal-state reconciliation runs beside the page's reads.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COPY_SHAPE_TTL_MS, copyAvailabilityMap } from '@/lib/gap/execution/copy-availability';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import { currentDecisions } from '@/lib/gap/routing/queue';
import { SEED_PROGRAM } from '@/lib/gap/sequences/families';

const src = (p: string) => readFileSync(p, 'utf8');
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('R61: the seeded copy families are asked once per shape, not twice per page', () => {
  const FAM = { id: 'fam-hc', problem_family: 'hidden_capacity', program: SEED_PROGRAM, archived_at: null };
  const db = (failFamilies = false) => {
    const calls = { families: 0 };
    return {
      calls,
      sequenceVersion: { findUnique: async () => null, findFirst: async () => ({ id: 'v1', family_id: FAM.id, version: 1, status: 'frozen', steps: {}, family: { id: FAM.id, name: FAM.id, engine: 'modex_draft_queue', program: FAM.program } }) },
      sequenceFamily: {
        findMany: async () => {
          calls.families += 1;
          if (failFamilies) throw new Error('read failed');
          return [{ id: FAM.id }];
        },
      },
      prospectingHypothesis: { findMany: async ({ where }: { where: { id: { in: string[] } } }) => where.id.in.map((id) => ({ id, problem_family: 'hidden_capacity', metadata: null })) },
    };
  };
  it('two theses of one shape, then the same shape again within the minute: one family read', async () => {
    const p = db();
    const t0 = 1_000_000;
    const a = await copyAvailabilityMap(p, ['h1', 'h2'], t0);
    expect([...a.values()].every((c) => c.installed)).toBe(true);
    await copyAvailabilityMap(p, ['h3'], t0 + 5_000);
    expect(p.calls.families).toBe(1);
    await copyAvailabilityMap(p, ['h4'], t0 + COPY_SHAPE_TTL_MS + 1);
    expect(p.calls.families).toBe(2);
  });
  it('each database client keeps its own answers, and a failed read is never kept', async () => {
    const p1 = db();
    const p2 = db();
    await copyAvailabilityMap(p1, ['h1'], 5);
    await copyAvailabilityMap(p2, ['h1'], 5);
    expect([p1.calls.families, p2.calls.families]).toEqual([1, 1]);
    const bad = db(true);
    await expect(copyAvailabilityMap(bad, ['h1'], 5)).rejects.toThrow('read failed');
    await tick();
    await expect(copyAvailabilityMap(bad, ['h1'], 6)).rejects.toThrow('read failed');
    expect(bad.calls.families).toBe(2);
  });
});

describe('R61: owner resolution starts every name-only read with the account row', () => {
  it('the people, aliases and employment context are asked before the account row has answered; the reasons stand', async () => {
    const order: string[] = [];
    let releaseAccount: (v: unknown) => void = () => {};
    const accountRow = new Promise((r) => (releaseAccount = r));
    const prisma = {
      account: {
        findUnique: async ({ select }: { select: Record<string, boolean> }) => {
          if (select.vertical) {
            order.push('account');
            return accountRow;
          }
          return { parent_brand: null };
        },
        findMany: async () => [],
      },
      prospectingHypothesis: { findUnique: async () => ({ id: 'h1', account_name: 'Other Co' }) },
      persona: { findMany: async () => (order.push('personas'), []) },
      gapAccountAlias: { findMany: async () => (order.push('aliases'), []) },
      canonicalAccountLink: { findMany: async () => (order.push('links'), []) },
      accountContactCandidate: { findMany: async () => [] },
      gapWorkSourceMember: { findMany: async () => [] },
      gapAuditEvent: { findMany: async () => [] },
      contactEnrichment: { findMany: async () => [] },
      conversationDisposition: { findMany: async () => [] },
      unsubscribedEmail: { findMany: async () => [] },
    };
    const run = loadOwnerResolution(prisma, { accountName: 'Acme Co', purpose: 'COLD_FIRST_TOUCH', now: new Date('2026-10-07T12:00:00Z'), hypothesisId: 'h1' } as never, { hubspotPeople: async () => ({ people: [], truncated: false }) } as never);
    await tick();
    await tick();
    expect(order).toEqual(expect.arrayContaining(['account', 'personas', 'aliases', 'links']));
    releaseAccount({ name: 'Acme Co', vertical: null, hubspot_company_id: null, parent_brand: null });
    expect(await run).toEqual({ ok: false, reason: 'hypothesis_not_at_account' });
    const missing = { ...prisma, account: { ...prisma.account, findUnique: async () => null } };
    expect(await loadOwnerResolution(missing, { accountName: 'Gone Co', purpose: 'COLD_FIRST_TOUCH', now: new Date('2026-10-07T12:00:00Z') } as never, { hubspotPeople: async () => ({ people: [], truncated: false }) } as never)).toEqual({ ok: false, reason: 'account_not_found' });
  });
});

describe('R61: an account-scoped card read never pulls every account\'s decisions', () => {
  it('currentDecisions with an account asks for that account\'s rows; without one, every row (Work)', async () => {
    const asked: unknown[] = [];
    const prisma = { routingDecision: { findMany: async (q: Record<string, unknown>) => (asked.push(q.where ?? null), []) } };
    await currentDecisions(prisma, { accountName: 'Acme Co' });
    await currentDecisions(prisma);
    expect(asked).toEqual([{ account_name: 'Acme Co' }, null]);
    expect(src('src/lib/gap/routing/queue.ts')).toMatch(/currentDecisions\(prisma, \{ accountName: opts\.accountName \?\? null \}\)/);
  });
});

describe('R61: reads that need only the account start together', () => {
  it('the pursuit read starts the send gate and its copy check before its other reads, and awaits them after', () => {
    const load = src('src/lib/gap/pursuit/load.ts');
    const start = load.indexOf('const sendableP = soft(loadSendableTheses(prisma, accountName, now), null);');
    const reads = load.indexOf('const [resolutionRes, queue, choices, assigned, repliesPage, preferences] = await Promise.all([');
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan(reads);
    expect(load).toMatch(/const sendableTheses = await sendableP;/);
  });
  it('the account inputs read the names and domains early, and the employment and role evidence together', () => {
    const load = src('src/lib/gap/account-intel/load.ts');
    expect(load.indexOf('const empCtxP =')).toBeLessThan(load.indexOf('await Promise.all(['));
    expect(load).toMatch(/const \[employment, roleEvidence\] = await Promise\.all\(\[/);
    expect(src('src/lib/gap/people/employment-store.ts')).toMatch(/export const accountEmploymentContext = cache\(readAccountEmploymentContext\);/);
  });
  it('the deal-state reconciliation runs beside the page\'s reads; only the obligations wait for it', () => {
    const page = src('src/app/gap/accounts/[slug]/page.tsx');
    expect(page).not.toMatch(/await syncDealStates\(/);
    expect(page).toMatch(/dealsSynced\.then\(\(\) => loadCommitments\(prisma, \{ accountNames: \[brief\.accountName\] \}\)\)/);
  });
});

describe('R61: HubSpot identity and the contacts\' employment ask their independent reads together', () => {
  const ID = { accountName: 'Acme Co', hubspotCompanyId: '101', domains: ['acme.example.com'], contactIds: [] };
  const reads = (over: Record<string, unknown> = {}) => {
    const started: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const r = {
      started,
      release: () => release(),
      companiesById: async () => (started.push('byId'), await gate, { companies: [{ id: '101', name: 'Acme Co' }], missing: [] }),
      companiesByDomains: async () => (started.push('byDomain'), { companies: [], truncated: false }),
      companiesByNames: async () => ({ companies: [], truncated: false }),
      associations: async () => ({ byId: new Map(), truncated: false }),
      ...over,
    };
    return r;
  };
  it('the domain search is asked while the company read is still out; the identity is the same', async () => {
    const { resolveCompanyIdentity } = await import('@/lib/gap/opportunity/active-opportunity');
    const r = reads();
    const run = resolveCompanyIdentity(ID, r as never);
    await tick();
    expect(r.started).toEqual(['byId', 'byDomain']);
    r.release();
    expect(await run).toEqual({ ok: true, companyIds: ['101'] });
  });
  it('the reason given is unchanged: the company read is judged first, then the domain search', async () => {
    const { resolveCompanyIdentity } = await import('@/lib/gap/opportunity/active-opportunity');
    const both = reads({ companiesById: async () => { throw new Error('503'); }, companiesByDomains: async () => { throw new Error('429'); } });
    const a = await resolveCompanyIdentity(ID, both as never);
    expect(a.ok === false && a.truth).toMatchObject({ status: 'UNKNOWN', reason: 'hubspot_error' });
    expect(a.ok === false && (a.truth as { detail: string }).detail).toMatch(/^company read: /);
    const domainOnly = reads({ companiesById: async () => ({ companies: [{ id: '101', name: 'Acme Co' }], missing: [] }), companiesByDomains: async () => { throw new Error('429'); } });
    const b = await resolveCompanyIdentity(ID, domainOnly as never);
    expect(b.ok === false && (b.truth as { detail: string }).detail).toMatch(/^company search: /);
    const gone = reads({ companiesById: async () => ({ companies: [], missing: ['101'] }) });
    const c = await resolveCompanyIdentity(ID, gone as never);
    expect(c.ok === false && c.truth).toMatchObject({ reason: 'identity_unresolved' });
  });
  it('the contacts\' employment asks the people, their enrichments and their confirmed answers together', async () => {
    const { loadEmployment } = await import('@/lib/gap/people/employment-store');
    const started: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const prisma = {
      persona: { findMany: async () => (started.push('people'), await gate, [{ id: 1, account_name: 'Acme Co', title: 'VP Ops', email: 'a@acme.example.com', hubspot_contact_id: null }]) },
      contactEnrichment: { findMany: async () => (started.push('enrichments'), []) },
      conversationDisposition: { findMany: async () => (started.push('answers'), []) },
    };
    const run = loadEmployment(prisma, [1], { now: new Date('2026-10-07T12:00:00Z') } as never);
    await tick();
    expect(started).toEqual(['people', 'enrichments', 'answers']);
    release();
    expect((await run).has(1)).toBe(true);
  });
});
