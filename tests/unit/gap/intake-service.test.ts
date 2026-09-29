/**
 * Universal work intake: the service (2026-09-28). One source abstraction for
 * every intake type; preview writes nothing; commit is idempotent, keeps what
 * was supplied, never creates a Persona or an Account (a new person at a known
 * account is a staged candidate), and one person in two sources is two
 * provenance edges on ONE Persona.
 */
import { describe, expect, it, vi } from 'vitest';
import { createWorkSource, previewIntake, commitIntake, addPerson, setMemberStatus, currentWorkSource, setCurrentWorkSource, mapCompanyToAccount } from '@/lib/gap/intake/service';

const NOW = new Date('2026-09-28T15:00:00Z');
const ACTOR = 'casey@freightroll.com';

function db() {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  const t = {
    sources: [] as any[],
    members: [] as any[],
    candidates: [] as any[],
    audit: [] as any[],
    accounts: [{ name: 'Acme Foods', hubspot_company_id: null }, { name: 'Globex', hubspot_company_id: null }],
    personas: [{ id: 1, name: 'Angi Acosta', account_name: 'Acme Foods', email: 'angi@acmefoods.com', linkedin_url: null }],
  };
  const writes: string[] = [];
  const w = (k: string, f: any) => vi.fn(async (a: any) => { writes.push(k); return f(a); });
  const FROZEN = ['work_source_id', 'kind', 'member_key', 'raw', 'name', 'title', 'company', 'email', 'linkedin_url', 'company_domain', 'source_identifier', 'ingested_at', 'created_by'];
  const prisma: any = {
    account: { findMany: vi.fn(async () => t.accounts) },
    canonicalCompany: { findMany: vi.fn(async () => []) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    gapAccountAlias: { findMany: vi.fn(async () => [{ normalized_alias: 'acme', account_name: 'Acme Foods' }]) },
    persona: { findMany: vi.fn(async () => t.personas), create: w('persona.create', () => { throw new Error('never'); }) },
    gapWorkSource: {
      create: w('gapWorkSource.create', ({ data }: any) => { const s = { id: id('src'), status: 'active', intent: 'research', current_at: null, ...data }; t.sources.push(s); return s; }),
      findUnique: vi.fn(async ({ where }: any) => t.sources.find((s) => s.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => [...t.sources].filter((s) => s.status === 'active' && (!where?.current_at || s.current_at) && (!where?.name || s.name === where.name)).sort((a, b) => (b.current_at?.getTime() ?? 0) - (a.current_at?.getTime() ?? 0))[0] ?? null),
      update: w('gapWorkSource.update', ({ where, data }: any) => Object.assign(t.sources.find((s) => s.id === where.id), data)),
    },
    gapWorkSourceMember: {
      findUnique: vi.fn(async ({ where }: any) => { if (where.id) return t.members.find((m) => m.id === where.id) ?? null; const k = where.work_source_id_member_key; return t.members.find((m) => m.work_source_id === k.work_source_id && m.member_key === k.member_key) ?? null; }),
      findMany: vi.fn(async ({ where }: any) => t.members.filter((m) => !where?.work_source_id || m.work_source_id === where.work_source_id)),
      create: w('gapWorkSourceMember.create', ({ data }: any) => { const m = { id: id('mem'), status: 'active', ...data }; t.members.push(m); return m; }),
      update: w('gapWorkSourceMember.update', ({ where, data }: any) => {
        const bad = Object.keys(data).filter((k) => FROZEN.includes(k));
        if (bad.length) throw new Error(`GAP_WORK_MEMBER_FROZEN ${bad}`);
        return Object.assign(t.members.find((m) => m.id === where.id), data);
      }),
    },
    accountContactCandidate: {
      upsert: w('accountContactCandidate.upsert', ({ where, create }: any) => {
        const k = where.account_name_candidate_key;
        let c = t.candidates.find((x) => x.account_name === k.account_name && x.candidate_key === k.candidate_key);
        if (!c) { c = { id: t.candidates.length + 1, state: 'staged', ...create }; t.candidates.push(c); }
        return c;
      }),
    },
    gapAuditEvent: { create: w('gapAuditEvent.create', ({ data }: any) => { t.audit.push(data); return { id: id('a') }; }) },
  };
  return { prisma, t, writes };
}

const LIST = ['Name,Title,Company,Email', 'Angi Acosta,VP Distribution,Acme Foods,angi@acmefoods.com', 'Dana Lee,Director of Transportation,Acme,', 'Eve Unknown,Owner,Brown Dog Carriers,', 'Fran Slogan,Dog Dad,,'].join('\n');

describe('a work source is one abstraction whatever the type', () => {
  it('creates a newsletter source and a conference source the same way; intent defaults to research', async () => {
    const { prisma, t } = db();
    const a = await createWorkSource(prisma, { name: 'MMYQB subscribers', sourceType: 'newsletter', sourceRef: 'https://www.linkedin.com/newsletters/mmyqb-7505271012985352192/', relationshipContext: 'MMYQB subscriber', actor: ACTOR });
    const b = await createWorkSource(prisma, { name: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Met at Inland26', intent: 'find_people', actor: ACTOR });
    expect(a).toMatchObject({ ok: true });
    expect(t.sources.map((s) => [s.source_type, s.intent])).toEqual([['newsletter', 'research'], ['conference', 'find_people']]);
    expect(t.audit.map((x) => x.kind)).toEqual(['work_source.created', 'work_source.created']);
  });

  it('refuses an unknown source type or intent, with the reason', async () => {
    const { prisma } = db();
    expect(await createWorkSource(prisma, { name: 'x', sourceType: 'tiktok' as never, actor: ACTOR })).toEqual({ ok: false, reason: 'invalid_source_type' });
    expect(await createWorkSource(prisma, { name: 'x', sourceType: 'other', intent: 'spam' as never, actor: ACTOR })).toEqual({ ok: false, reason: 'invalid_intent' });
    expect(await createWorkSource(prisma, { name: '  ', sourceType: 'other', actor: ACTOR })).toEqual({ ok: false, reason: 'name_required' });
  });
});

describe('preview writes nothing', () => {
  it('shows each row with its resolution before anything is committed', async () => {
    const { prisma, writes } = db();
    const p = await previewIntake(prisma, { text: LIST, kind: 'people' });
    expect(p.counts).toEqual({ rows: 4, resolved: 1, new_candidate: 1, ambiguous: 0, unresolved: 2 });
    expect(p.rows.map((r) => [r.row.name, r.resolved.resolution])).toEqual([['Angi Acosta', 'resolved'], ['Dana Lee', 'new_candidate'], ['Eve Unknown', 'unresolved'], ['Fran Slogan', 'unresolved']]);
    expect(writes).toEqual([]);
  });
});

describe('commit', () => {
  it('stores exactly what was supplied, stages a new person as a candidate (never a Persona), creates no Account; idempotent', async () => {
    const { prisma, t, writes } = db();
    const src = await createWorkSource(prisma, { name: 'MMYQB subscribers', sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', actor: ACTOR });
    const r1 = await commitIntake(prisma, { workSourceId: (src as any).id, text: LIST, kind: 'people', actor: ACTOR, now: NOW });
    expect(r1).toMatchObject({ ok: true, created: 4, existing: 0, staged: 1 });
    const angi = t.members.find((m) => m.name === 'Angi Acosta');
    expect(angi).toMatchObject({ kind: 'person', resolution: 'resolved', persona_id: 1, account_name: 'Acme Foods', relationship_context: 'MMYQB subscriber', member_key: 'email:angi@acmefoods.com' });
    expect(angi.raw).toMatchObject({ Name: 'Angi Acosta', Email: 'angi@acmefoods.com' });
    const dana = t.members.find((m) => m.name === 'Dana Lee');
    expect(dana).toMatchObject({ resolution: 'new_candidate', account_name: 'Acme Foods', persona_id: null, candidate_id: 1 });
    expect(t.candidates[0]).toMatchObject({ account_name: 'Acme Foods', full_name: 'Dana Lee', source: 'gap_work_source', state: 'staged' });
    expect(writes).not.toContain('persona.create');
    const r2 = await commitIntake(prisma, { workSourceId: (src as any).id, text: LIST, kind: 'people', actor: ACTOR, now: NOW });
    expect(r2).toMatchObject({ ok: true, created: 0, existing: 4 });
    expect(t.members).toHaveLength(4);
    expect(t.audit.filter((a) => a.kind === 'work_source.imported')).toHaveLength(2);
  });

  it('one person in two sources: two provenance edges, ONE Persona', async () => {
    const { prisma, t } = db();
    const a = (await createWorkSource(prisma, { name: 'MMYQB subscribers', sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', actor: ACTOR })) as any;
    const b = (await createWorkSource(prisma, { name: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Met at Inland26', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: a.id, text: 'Name,Email\nAngi Acosta,angi@acmefoods.com', kind: 'people', actor: ACTOR, now: NOW });
    await commitIntake(prisma, { workSourceId: b.id, text: 'Name,Email\nAngi Acosta,angi@acmefoods.com', kind: 'people', actor: ACTOR, now: NOW });
    expect(t.members.map((m) => [m.work_source_id, m.persona_id, m.relationship_context])).toEqual([[a.id, 1, 'MMYQB subscriber'], [b.id, 1, 'Met at Inland26']]);
  });

  it('a re-import after identity improves updates only the derived identity, never the supplied provenance', async () => {
    const { prisma, t } = db();
    const src = (await createWorkSource(prisma, { name: 'List', sourceType: 'target_list', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: src.id, text: 'Company\nBrown Dog Carriers', kind: 'accounts', actor: ACTOR, now: NOW });
    expect(t.members[0].resolution).toBe('unresolved');
    t.accounts.push({ name: 'Brown Dog Carriers', hubspot_company_id: null });
    await commitIntake(prisma, { workSourceId: src.id, text: 'Company\nBrown Dog Carriers', kind: 'accounts', actor: ACTOR, now: NOW });
    expect(t.members[0]).toMatchObject({ resolution: 'resolved', account_name: 'Brown Dog Carriers' });
  });

  it('refuses an archived or unknown source, and a parse error, before any write', async () => {
    const { prisma, writes } = db();
    expect(await commitIntake(prisma, { workSourceId: 'nope', text: LIST, kind: 'people', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'source_not_found' });
    expect(writes).toEqual([]);
    const { prisma: p2, t: t2, writes: w2 } = db();
    t2.sources.push({ id: 'old', name: 'Old list', source_type: 'target_list', status: 'archived' });
    expect(await commitIntake(p2, { workSourceId: 'old', text: LIST, kind: 'people', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'source_archived' });
    expect(w2).toEqual([]);
  });
});

describe('conference mode: one person from a phone', () => {
  it('lands in the CURRENT source with that source relationship context; no current source means a "People I met" source', async () => {
    const { prisma, t } = db();
    const conf = (await createWorkSource(prisma, { name: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Met at Inland26', actor: ACTOR })) as any;
    await setCurrentWorkSource(prisma, { workSourceId: conf.id, actor: ACTOR, now: NOW });
    expect((await currentWorkSource(prisma))?.id).toBe(conf.id);
    const r = await addPerson(prisma, { name: 'Angi Acosta', company: 'Acme Foods', note: 'Asked about small carrier facility impact', actor: ACTOR, now: NOW });
    expect(r).toMatchObject({ ok: true, workSourceId: conf.id, resolution: 'resolved', buyerWords: true });
    expect(t.members[0]).toMatchObject({ note: 'Asked about small carrier facility impact', relationship_context: 'Met at Inland26' });
  });

  it('with no current source, a single person goes to "People I met"', async () => {
    const { prisma, t } = db();
    const r = await addPerson(prisma, { name: 'Dana Lee', company: 'Acme', actor: ACTOR, now: NOW });
    expect(r).toMatchObject({ ok: true, resolution: 'new_candidate', buyerWords: false });
    expect(t.sources[0]).toMatchObject({ name: 'People I met', source_type: 'relationship' });
  });
});

describe('member decisions', () => {
  it('ignore / not now / research requested are recorded and audited; an unknown status is refused', async () => {
    const { prisma, t } = db();
    const src = (await createWorkSource(prisma, { name: 'List', sourceType: 'target_list', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: src.id, text: 'Company\nGlobex', kind: 'accounts', actor: ACTOR, now: NOW });
    expect(await setMemberStatus(prisma, { memberId: t.members[0].id, status: 'research_requested', actor: ACTOR })).toEqual({ ok: true });
    expect(t.members[0].status).toBe('research_requested');
    expect(await setMemberStatus(prisma, { memberId: t.members[0].id, status: 'deleted' as never, actor: ACTOR })).toEqual({ ok: false, reason: 'invalid_status' });
    expect(t.audit.at(-1)).toMatchObject({ kind: 'work_source.member_status' });
  });
});

describe('Release A review fixes', () => {
  it('two new people at one account get distinct candidate source ids (both can be promoted)', async () => {
    const { prisma, t } = db();
    const src = (await createWorkSource(prisma, { name: 'List', sourceType: 'target_list', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: src.id, text: 'Name,Company\nDana Lee,Acme\nEli Moss,Acme', kind: 'people', actor: ACTOR, now: NOW });
    expect(t.candidates).toHaveLength(2);
    expect(new Set(t.candidates.map((c) => c.source_contact_id)).size).toBe(2);
  });

  it('a re-import never regresses or moves identity (a conflicting later row cannot demote a resolved member)', async () => {
    const { prisma, t } = db();
    const src = (await createWorkSource(prisma, { name: 'List', sourceType: 'crm_list', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: src.id, text: 'Name,Email\nAngi Acosta,angi@acmefoods.com', kind: 'people', actor: ACTOR, now: NOW });
    await commitIntake(prisma, { workSourceId: src.id, text: 'Name,Email,Company\nAngi Acosta,angi@acmefoods.com,Globex', kind: 'people', actor: ACTOR, now: NOW });
    expect(t.members).toHaveLength(1);
    expect(t.members[0]).toMatchObject({ resolution: 'resolved', persona_id: 1, account_name: 'Acme Foods' });
  });

  it('adding a known person again keeps the new note (appended, never lost)', async () => {
    const { prisma, t } = db();
    await addPerson(prisma, { name: 'Angi Acosta', company: 'Acme Foods', note: 'Met at the booth', actor: ACTOR, now: NOW });
    await addPerson(prisma, { name: 'Angi Acosta', company: 'Acme Foods', note: 'Asked about gate flow', actor: ACTOR, now: NOW });
    expect(t.members).toHaveLength(1);
    expect(t.members[0].note).toBe('Met at the booth\nAsked about gate flow');
  });

  it('two rows that are the same person in one paste are counted as a duplicate, never silently merged', async () => {
    const { prisma } = db();
    const p = await previewIntake(prisma, { text: 'Name,Email\nAngi Acosta,angi@acmefoods.com\nA. Acosta,angi@acmefoods.com', kind: 'people' });
    expect(p.counts.rows).toBe(1);
    expect(p.parse.skipped.duplicate).toBe(1);
  });
});

describe('NEEDS IDENTITY is actionable: Casey says which account a company is', () => {
  it('registers a curated alias, re-resolves the source, and people there become known at the account', async () => {
    const { prisma, t } = db();
    prisma.gapAccountAlias.findUnique = vi.fn(async () => null);
    prisma.gapAccountAlias.create = vi.fn(async ({ data }: any) => ({ id: 'al1', ...data }));
    prisma.account.findUnique = vi.fn(async ({ where }: any) => t.accounts.find((a) => a.name === where.name) ?? null);
    const src = (await createWorkSource(prisma, { name: 'MMYQB', sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', actor: ACTOR })) as any;
    await commitIntake(prisma, { workSourceId: src.id, text: 'Name,Title,Company\nHana Lee,Senior Director Supply Chain,Harbor Foods Group', kind: 'people', actor: ACTOR, now: NOW });
    expect(t.members[0].resolution).toBe('unresolved');
    t.accounts.push({ name: 'Harbor Foods', hubspot_company_id: null });
    const plan = vi.fn(async () => ({ members: 1, accounts: 1, deferredAccounts: 0, changed: 1, reresolved: 1, byState: {}, researchAccounts: [] }));
    const r = await mapCompanyToAccount(prisma, { workSourceId: src.id, company: 'Harbor Foods Group', accountName: 'Harbor Foods', actor: ACTOR, now: NOW }, { plan });
    expect(r).toMatchObject({ ok: true, alias: 'CREATED', reresolved: 1 });
    expect(prisma.gapAccountAlias.create).toHaveBeenCalledWith({ data: expect.objectContaining({ alias: 'Harbor Foods Group', account_name: 'Harbor Foods', source: 'manual', created_by: ACTOR }) });
    expect(plan).toHaveBeenCalledWith(prisma, expect.objectContaining({ workSourceId: src.id }));
    expect(t.audit.at(-1)).toMatchObject({ kind: 'work_source.company_mapped' });
  });

  it('refuses an account GAP does not have (never creates one) and reports an alias already pointing elsewhere', async () => {
    const { prisma } = db();
    prisma.account.findUnique = vi.fn(async () => null);
    expect(await mapCompanyToAccount(prisma, { workSourceId: 's', company: 'Costa Farms', accountName: 'Costa Farms', actor: ACTOR, now: NOW }, { plan: vi.fn() as never })).toEqual({ ok: false, reason: 'account_not_found' });
    prisma.account.findUnique = vi.fn(async () => ({ name: 'Harbor Foods' }));
    prisma.gapAccountAlias.findUnique = vi.fn(async () => ({ id: 'x', account_name: 'Oak Harbor Freight Lines' }));
    expect(await mapCompanyToAccount(prisma, { workSourceId: 's', company: 'Harbor Foods Group', accountName: 'Harbor Foods', actor: ACTOR, now: NOW }, { plan: vi.fn() as never })).toEqual({ ok: false, reason: 'alias_conflict:Oak Harbor Freight Lines' });
  });
});
