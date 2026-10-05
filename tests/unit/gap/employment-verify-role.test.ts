/**
 * VERIFY CURRENT ROLE answers five cases (owner resolution, 2026-10-05): same_role, different_role, left, conflict,
 * unknown. The store maps them (current / role_changed / left / conflict / audit only), never over Casey's own
 * correction, never without a source URL, and records a 'person.role_verified' audit row for a persona AND for a
 * HubSpot-only person (whose only record IS that row). Nothing here touches suppression, HubSpot or Apollo.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { readEmployment } from '@/lib/gap/people/employment';
import { ROLE_VERIFIED, loadHubSpotContactRoleEvidence, recordEmploymentVerification, recordHubSpotContactRoleVerification } from '@/lib/gap/people/employment-store';
import { buildEmploymentPrompt, parseEmploymentAnswer, roleVerifyPrompt, verifyEmployment } from '@/lib/gap/people/employment-verify';
import { readRole } from '@/lib/gap/people/role-currentness';

const NOW = new Date('2026-10-05T12:00:00Z');
/** The character the voice rules forbid, built without writing it. */
const EM_DASH = String.fromCharCode(0x2014);
const WALMART = 'Walmart Inc.';
const STORED = 'Sr Director - West Transportation Command Center';
const POST = 'https://www.linkedin.com/in/christian-burton-57161518b/';

type Field = { field_name: string; field_value: string | null; source: string; source_timestamp: Date | null; confidence: number | null; last_writer: string | null };

/** A hand-rolled prisma: personas, one enrichment per persona with fields, audit rows (readable back), no HubSpot. */
function db(seed: { personas?: any[]; fields?: Record<number, Field[]> } = {}) {
  const personas = seed.personas ?? [{ id: 42, account_name: WALMART, name: 'c mannella', title: STORED, email: 'x@walmart.com', hubspot_contact_id: null, do_not_contact: false, email_status: 'unverified' }];
  const fields = new Map<number, Field[]>(Object.entries(seed.fields ?? {}).map(([k, v]) => [Number(k), v]));
  const enrichmentIdOf = (pid: number) => 900 + pid;
  const audit: any[] = [];
  const personaUpdates: any[] = [];
  const gapAuditEvent = {
    create: vi.fn(async ({ data }: any) => {
      audit.push({ ...data, id: `aud_${audit.length + 1}`, created_at: new Date(NOW.getTime() + audit.length * 1000) });
      return { id: `aud_${audit.length}` };
    }),
    findMany: vi.fn(async ({ where }: any) => audit.filter((a) => a.kind === where.kind && a.subject_type === where.subject_type && where.subject_id.in.includes(a.subject_id)).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())),
  };
  const tx = {
    contactEnrichment: { upsert: vi.fn(async ({ where }: any) => { if (!fields.has(where.persona_id)) fields.set(where.persona_id, []); return { id: enrichmentIdOf(where.persona_id) }; }) },
    contactEnrichmentField: {
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const pid = where.contact_enrichment_id_field_name.contact_enrichment_id - 900;
        const rows = fields.get(pid)!;
        const i = rows.findIndex((r) => r.field_name === where.contact_enrichment_id_field_name.field_name);
        if (i >= 0) rows[i] = { ...rows[i], ...update };
        else rows.push({ ...create });
        return rows[i >= 0 ? i : rows.length - 1];
      }),
    },
    gapAuditEvent,
  };
  const prisma = {
    persona: {
      findUnique: vi.fn(async ({ where, select }: any) => {
        const p = personas.find((x) => x.id === where.id);
        if (!p) return null;
        return select?.enrichment ? { ...p, enrichment: fields.has(p.id) ? { fields: fields.get(p.id) } : null } : p;
      }),
      findMany: vi.fn(async ({ where }: any) => personas.filter((p) => where.id.in.includes(p.id))),
      update: vi.fn(async (args: any) => { personaUpdates.push(args); return {}; }),
    },
    contactEnrichment: { findMany: vi.fn(async ({ where }: any) => [...fields.entries()].filter(([pid]) => where.persona_id.in.includes(pid)).map(([pid, f]) => ({ persona_id: pid, fields: f }))) },
    conversationDisposition: { findMany: vi.fn(async () => []) },
    gapAuditEvent,
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { prisma, audit, fields, personaUpdates };
}

const fieldValue = (fields: Field[], name: string) => fields.find((f) => f.field_name === name)?.field_value ?? null;

describe('(8) parseEmploymentAnswer: five verdicts, and no URL asserts nothing', () => {
  const answer = (over: Record<string, unknown>) => JSON.stringify({ verdict: 'same_role', company: WALMART, title: STORED, priorTitle: null, sourceUrl: POST, sourceDate: '2026-10-05', confidence: 'high', summary: 's', ...over });
  it('same_role keeps the title and reads current for old callers', () => {
    const r = parseEmploymentAnswer(answer({}), {});
    expect(r).toMatchObject({ verdict: 'same_role', employmentVerdict: 'current', title: STORED, tier: 'strong', sourceDate: '2026-10-05', priorTitle: null });
  });
  it('different_role with a null title is still asserted (the role moved; the new title is not established)', () => {
    const r = parseEmploymentAnswer(answer({ verdict: 'different_role', title: null, priorTitle: STORED, summary: 'A colleague was promoted into the role.' }), {});
    expect(r).toMatchObject({ verdict: 'different_role', employmentVerdict: 'current', title: null, priorTitle: STORED, company: WALMART, sourceUrl: POST });
    expect(parseEmploymentAnswer(answer({ verdict: 'different_role', title: 'Vice President, Transportation' }), {}).title).toBe('Vice President, Transportation');
  });
  it('left names the other employer; conflict and unknown assert no company', () => {
    expect(parseEmploymentAnswer(answer({ verdict: 'left', company: 'Target', title: 'VP' }), {})).toMatchObject({ verdict: 'left', employmentVerdict: 'left', company: 'Target' });
    expect(parseEmploymentAnswer(answer({ verdict: 'conflict', title: null, summary: 'Two sources disagree.' }), {})).toMatchObject({ verdict: 'conflict', employmentVerdict: 'unknown', sourceUrl: POST });
    expect(parseEmploymentAnswer(answer({ verdict: 'unknown' }), {})).toMatchObject({ verdict: 'unknown', employmentVerdict: 'unknown', company: null, title: null, sourceUrl: null });
  });
  it('the legacy "current" verdict reads same_role; a verdict outside the five is unknown', () => {
    expect(parseEmploymentAnswer(answer({ verdict: 'current' }), {}).verdict).toBe('same_role');
    expect(parseEmploymentAnswer(answer({ verdict: 'promoted' }), {}).verdict).toBe('unknown');
  });
  it('no URL, a bad URL, prose or nothing: unknown, whatever the verdict', () => {
    for (const verdict of ['same_role', 'different_role', 'left', 'conflict']) {
      expect(parseEmploymentAnswer(answer({ verdict, sourceUrl: null }), {})).toMatchObject({ verdict: 'unknown', employmentVerdict: 'unknown', tier: 'weak' });
      expect(parseEmploymentAnswer(answer({ verdict, sourceUrl: 'linkedin' }), {}).verdict).toBe('unknown');
    }
    expect(parseEmploymentAnswer('They were probably promoted.', {}).verdict).toBe('unknown');
    expect(parseEmploymentAnswer(null, {}).verdict).toBe('unknown');
  });
  it('the prompt carries the stored title, says which signals count and which do not, and names the five verdicts', () => {
    const p = roleVerifyPrompt({ name: 'C M', title: STORED, company: WALMART, linkedinUrl: 'https://www.linkedin.com/in/x' });
    expect(p).toContain(STORED);
    expect(p).toMatch(/own current (public )?profile/i);
    expect(p).toMatch(/leadership or team page/i);
    expect(p).toMatch(/announcement/i);
    expect(p).toMatch(/speaker bio/i);
    expect(p).toMatch(/company post naming the role/i);
    expect(p).toMatch(/do not count/i);
    expect(p).toMatch(/CRM dates/i);
    expect(p).toMatch(/email domains/i);
    expect(p).toMatch(/stale aggregators/i);
    expect(p).toMatch(/old conference bios/i);
    for (const v of ['same_role', 'different_role', 'left', 'conflict', 'unknown']) expect(p).toContain(`"${v}"`);
    expect(p).toMatch(/Never invent a URL/);
    expect(p).not.toContain(EM_DASH);
    expect(buildEmploymentPrompt({ name: 'C M', title: STORED, company: WALMART })).toBe(roleVerifyPrompt({ name: 'C M', title: STORED, company: WALMART }));
  });
  it('verifyEmployment runs one injected search and carries the compatibility field', async () => {
    const search = vi.fn(async () => JSON.stringify({ verdict: 'different_role', company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST, sourceDate: '2026-10-05', confidence: 'high', summary: 'promoted' }));
    const r = await verifyEmployment({ name: 'C M', title: STORED, company: WALMART }, { search });
    expect(search).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ verdict: 'different_role', employmentVerdict: 'current', kind: 'profile', tier: 'strong', title: null });
  });
});

describe('(9) recordEmploymentVerification maps the verdicts, refuses over Casey, audits with suppressionTouched false', () => {
  const base = { personaId: 42, actor: 'casey', now: NOW, company: WALMART, title: null as string | null, priorTitle: STORED, sourceUrl: POST, sourceDate: '2026-10-05', confidence: 'high' as const, summary: 'A colleague was promoted into the role.' };
  it('different_role with no title: status role_changed, title null; role reads changed and not usable; employment stays current', async () => {
    const { prisma, audit, fields, personaUpdates } = db();
    const r = await recordEmploymentVerification(prisma, { ...base, verdict: 'different_role' });
    expect(r.ok && r.recorded).toBe(true);
    if (!r.ok) return;
    expect(fieldValue(fields.get(42)!, 'employment_status')).toBe('role_changed');
    expect(fieldValue(fields.get(42)!, 'employment_title')).toBeNull();
    expect(fieldValue(fields.get(42)!, 'employment_company')).toBe(WALMART);
    expect(fields.get(42)!.every((f) => f.source === 'derived')).toBe(true);
    expect(r.read.state).toBe('CURRENT_CONFIRMED');
    expect(r.role).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, priorTitle: STORED });
    expect(audit.map((a) => a.kind)).toEqual(['person.employment_verified', ROLE_VERIFIED]);
    expect(audit[1]).toMatchObject({ actor: 'casey', subject_type: 'persona', subject_id: '42', payload: { verdict: 'different_role', status: 'role_changed', company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST, sourceDate: '2026-10-05', evidenceClass: 'profile', tier: 'strong', actor: 'casey', provider: 'gemini_grounded_search', confidence: 'high', summary: 'A colleague was promoted into the role.', recorded: true, suppressionTouched: false, hubspotWritten: false, apolloSpent: 0 } });
    expect(typeof audit[1].payload.retrievedAt).toBe('string');
    expect(audit[0].payload).toMatchObject({ verdict: 'different_role', suppressionTouched: false });
    expect(personaUpdates).toEqual([]);
    expect(JSON.stringify(audit)).not.toMatch(/do_not_contact|email_status/i);
  });
  it('different_role with the new title: role changed with the title, usable; same_role: current with the title, role confirmed', async () => {
    const a = db();
    const r1 = await recordEmploymentVerification(a.prisma, { ...base, verdict: 'different_role', title: 'Vice President, Transportation' });
    expect(r1.ok && fieldValue(a.fields.get(42)!, 'employment_status')).toBe('role_changed');
    expect(r1.ok && r1.role).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'Vice President, Transportation', usableForRanking: true });
    const b = db();
    const r2 = await recordEmploymentVerification(b.prisma, { ...base, verdict: 'same_role', title: 'Senior Director, West Transportation Command Center', priorTitle: null });
    expect(r2.ok && fieldValue(b.fields.get(42)!, 'employment_status')).toBe('current');
    expect(r2.ok && r2.role).toMatchObject({ state: 'ROLE_CURRENT_CONFIRMED', effectiveTitle: 'Senior Director, West Transportation Command Center', titleSource: 'verified' });
    expect(r2.ok && r2.read.state).toBe('CURRENT_CONFIRMED');
    // The legacy 'current' verdict still maps to status current.
    const c = db();
    const r3 = await recordEmploymentVerification(c.prisma, { ...base, verdict: 'current', title: STORED });
    expect(r3.ok && fieldValue(c.fields.get(42)!, 'employment_status')).toBe('current');
  });
  it('conflict: status conflict (derived), the audit says conflict, role conflicts, employment is untouched', async () => {
    const { prisma, audit, fields } = db();
    const r = await recordEmploymentVerification(prisma, { ...base, verdict: 'conflict', summary: 'Two sources disagree.' });
    expect(r.ok && r.recorded).toBe(true);
    expect(fields.get(42)!.find((f) => f.field_name === 'employment_status')).toMatchObject({ field_value: 'conflict', source: 'derived' });
    expect(audit[0].payload).toMatchObject({ verdict: 'conflict', status: 'conflict' });
    expect(r.ok && r.role.state).toBe('ROLE_CONFLICT');
    expect(r.ok && r.read.state).toBe('CURRENT_UNVERIFIED');
  });
  it('(10) left still reads LEFT_COMPANY_CONFIRMED through readEmployment; the role is not usable here', async () => {
    const { prisma, fields } = db();
    const r = await recordEmploymentVerification(prisma, { ...base, verdict: 'left', company: 'Target', title: 'VP Transportation' });
    expect(r.ok && r.read.state).toBe('LEFT_COMPANY_CONFIRMED');
    expect(r.ok && r.read.elsewhere).toMatchObject({ company: 'Target' });
    expect(fieldValue(fields.get(42)!, 'employment_status')).toBe('left');
    expect(r.ok && r.role.usableForRanking).toBe(true);
    expect(r.ok && r.role.state).toBe('ROLE_UNVERIFIED');
  });
  it('unknown writes the two audit rows and nothing else; no URL asserts nothing whatever the verdict', async () => {
    const { prisma, audit, fields } = db();
    const r = await recordEmploymentVerification(prisma, { ...base, verdict: 'unknown', sourceUrl: null, company: null, summary: 'no source found' });
    expect(r.ok && r.recorded).toBe(false);
    const r2 = await recordEmploymentVerification(prisma, { ...base, verdict: 'different_role', sourceUrl: null });
    expect(r2.ok && r2.recorded).toBe(false);
    expect(fields.get(42) ?? []).toEqual([]);
    expect(audit.map((a) => a.kind)).toEqual(['person.employment_verified', ROLE_VERIFIED, 'person.employment_verified', ROLE_VERIFIED]);
    expect(audit.every((a) => a.payload.recorded === false && a.payload.suppressionTouched === false)).toBe(true);
  });
  it('a human correction stands: every verdict is refused before any write', async () => {
    const { prisma, audit, fields } = db({ fields: { 42: [{ field_name: 'employment_status', field_value: 'role_changed', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }, { field_name: 'employment_title', field_value: 'VP Transportation', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }] } });
    for (const verdict of ['same_role', 'different_role', 'left', 'conflict'] as const) {
      expect(await recordEmploymentVerification(prisma, { ...base, verdict, actor: 'bot', title: STORED })).toEqual({ ok: false, reason: 'human_correction_stands' });
    }
    expect(audit).toHaveLength(0);
    expect(fieldValue(fields.get(42)!, 'employment_title')).toBe('VP Transportation');
    expect(await recordEmploymentVerification(prisma, { ...base, personaId: 9, verdict: 'same_role' })).toEqual({ ok: false, reason: 'persona_not_found' });
  });
});

describe('the HubSpot-only person: one audit row is the whole record, and it reads back as evidence', () => {
  const verification = { verdict: 'different_role' as const, company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST, sourceDate: '2026-10-05', confidence: 'high' as const, summary: 'A colleague was promoted into the role.' };
  it('record writes exactly one person.role_verified row with the full provenance and touches nothing else', async () => {
    const { prisma, audit, personaUpdates } = db();
    const r = await recordHubSpotContactRoleVerification(prisma, { hubspotContactId: '7001', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey', now: NOW, verification, companyDomains: ['walmart.com'] });
    expect(r).toMatchObject({ ok: true, auditId: 'aud_1', recorded: true });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: ROLE_VERIFIED, actor: 'casey', subject_type: 'hubspot_contact', subject_id: '7001', payload: { accountName: WALMART, name: 'C M', storedTitle: STORED, verdict: 'different_role', status: 'role_changed', company: WALMART, title: null, priorTitle: STORED, sourceUrl: POST, sourceDate: '2026-10-05', retrievedAt: NOW.toISOString(), evidenceClass: 'profile', tier: 'strong', companyDomains: ['walmart.com'], actor: 'casey', provider: 'gemini_grounded_search', confidence: 'high', summary: 'A colleague was promoted into the role.', recorded: true, suppressionTouched: false, hubspotWritten: false, apolloSpent: 0 } });
    expect(prisma.persona.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(personaUpdates).toEqual([]);
    expect(JSON.stringify(audit)).not.toMatch(/do_not_contact|email_status/i);
  });
  it('round trip: the Walmart pattern loads back as a strong profile row with roleChanged and reads ROLE_CHANGED_CONFIRMED, not usable; employment current', async () => {
    const { prisma } = db();
    await recordHubSpotContactRoleVerification(prisma, { hubspotContactId: '7001', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey', now: NOW, verification, companyDomains: ['walmart.com'] });
    const map = await loadHubSpotContactRoleEvidence(prisma, ['7001', '7002']);
    expect(map.get('7002') ?? []).toEqual([]);
    const ev = map.get('7001')!;
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ kind: 'profile', tier: 'strong', company: WALMART, title: null, roleChanged: true, url: POST, at: expect.stringMatching(/^2026-10-05/) });
    const role = readRole({ accountName: WALMART, storedTitle: STORED, evidence: ev, now: NOW });
    expect(role).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, priorTitle: STORED });
    expect(readEmployment({ accountName: WALMART, evidence: ev, now: NOW }).state).toBe('CURRENT_CONFIRMED');
  });
  it('newest first, at most five per contact; an unsourced automation row reads weak (ignored); a human row reads human and strong', async () => {
    const { prisma } = db();
    for (let i = 0; i < 7; i++) {
      await recordHubSpotContactRoleVerification(prisma, { hubspotContactId: '7001', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey', now: new Date(NOW.getTime() + i * 60_000), verification: { ...verification, verdict: 'same_role', title: `Title ${i}`, sourceDate: null } });
    }
    const ev = (await loadHubSpotContactRoleEvidence(prisma, ['7001'])).get('7001')!;
    expect(ev).toHaveLength(5);
    expect(ev.map((e) => e.title)).toEqual(['Title 6', 'Title 5', 'Title 4', 'Title 3', 'Title 2']);
    const u = db();
    await recordHubSpotContactRoleVerification(u.prisma, { hubspotContactId: '1', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey', now: NOW, verification: { ...verification, verdict: 'unknown', sourceUrl: null, company: null } });
    expect((await loadHubSpotContactRoleEvidence(u.prisma, ['1'])).get('1')![0]).toMatchObject({ tier: 'weak', company: null, title: null });
    const h = db();
    await recordHubSpotContactRoleVerification(h.prisma, { hubspotContactId: '2', accountName: WALMART, name: 'C M', storedTitle: STORED, actor: 'casey@yardflow.ai', now: NOW, verification: { ...verification, title: 'VP Transportation', sourceUrl: null, provider: 'human' } });
    const hv = (await loadHubSpotContactRoleEvidence(h.prisma, ['2'])).get('2')![0];
    expect(hv).toMatchObject({ kind: 'human', tier: 'strong', roleChanged: true, title: 'VP Transportation', company: WALMART });
    expect(h.audit[0].payload).toMatchObject({ provider: 'casey@yardflow.ai', evidenceClass: 'human', tier: 'strong', recorded: true });
    expect(readRole({ accountName: WALMART, storedTitle: STORED, evidence: [hv], now: NOW })).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'VP Transportation', titleSource: 'human' });
  });
  it('a fake without the audit table answers empty, never throws', async () => {
    expect(await loadHubSpotContactRoleEvidence({} as any, ['1'])).toEqual(new Map());
    expect(await loadHubSpotContactRoleEvidence(db().prisma, [])).toEqual(new Map());
  });
});
