/**
 * ALIAS REVIEW (enterprise graph, 2026-10-05). Banners and subsidiaries with their own name (Central Market at
 * H-E-B, King Soopers and City Market at Kroger, SDR Distribution at NFI) read as employment conflicts until an
 * alias exists. This turns that conflict evidence into POSSIBLE ACCOUNT ALIAS proposals for Casey, and a confirm is
 * the only path to a GapAccountAlias row: never name similarity, never automation. A rejection is remembered.
 */
import { describe, expect, it, vi } from 'vitest';
import { confirmAlias, loadRejectedAliases, proposeAliases, rejectAlias } from '@/lib/gap/people/alias-review';

const NOW = new Date('2026-10-05T16:00:00Z');

function fake(accounts: string[], aliases: Array<{ alias: string; normalized_alias: string; account_name: string }> = []) {
  const rows = aliases.map((a, i) => ({ id: `al_${i}`, ...a }));
  const audits: Array<{ id: string; data: Record<string, unknown> }> = [];
  return {
    rows,
    audits,
    account: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (accounts.includes(where.name) ? { name: where.name } : null)),
      findMany: vi.fn(async ({ where }: { where: { name?: { startsWith?: string; contains?: string } } }) => accounts.filter((n) => n.toLowerCase().startsWith(String(where.name?.startsWith ?? '').toLowerCase())).map((name) => ({ name }))),
    },
    gapAccountAlias: {
      findUnique: vi.fn(async ({ where }: { where: { normalized_alias: string } }) => rows.find((r) => r.normalized_alias === where.normalized_alias) ?? null),
      findMany: vi.fn(async () => rows),
      create: vi.fn(async ({ data }: { data: Record<string, string> }) => {
        const row = { id: `al_${rows.length}`, alias: data.alias, normalized_alias: data.normalized_alias, account_name: data.account_name, source: data.source, created_by: data.created_by };
        rows.push(row);
        return row;
      }),
    },
    gapAuditEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `au_${audits.length}`, data };
        audits.push(row);
        return { id: row.id };
      }),
      findMany: vi.fn(async ({ where }: { where: { kind: string; subject_id: string } }) => audits.filter((a) => a.data.kind === where.kind && a.data.subject_id === where.subject_id).map((a) => ({ payload: a.data.payload }))),
    },
  };
}

describe('proposeAliases', () => {
  const conflicts = [
    { personName: 'Jess Bess', company: 'Central Market', source: 'HubSpot', at: '2026-07-17T07:02:15Z' },
    { personName: 'Ana Ruiz', company: 'Central Market', source: 'HubSpot', at: null },
    { personName: 'Tom Hale', company: 'CENTRAL MARKET, Inc.', source: 'HubSpot', at: null },
    { personName: 'Jane Doe', company: 'Central Market', source: 'Apollo intake', at: '2026-05-04T00:00:00Z' },
    { personName: 'Dakota Socha', company: 'ADUSA Distribution', source: 'LinkedIn profile', at: '2026-10-05T00:00:00Z' },
  ];
  it('one proposal per normalized spelling, with the evidence lines, canonical = the account, never an alias row', () => {
    const p = proposeAliases({ accountName: 'H-E-B', aliases: ['HEB Grocery Company'], domains: ['heb.com'], conflicts, rejected: [] });
    expect(p.map((x) => [x.company, x.canonical, x.key])).toEqual([
      ['Central Market', 'H-E-B', 'central market'],
      ['ADUSA Distribution', 'H-E-B', 'adusa distribution'],
    ]);
    expect(p[0].evidence).toEqual(["Central Market: 3 HubSpot contacts' CRM company field; Apollo intake 2026-05-04 for Jane Doe", 'HubSpot: Jess Bess, Ana Ruiz, Tom Hale']);
    expect(p[1].evidence).toEqual(['ADUSA Distribution: LinkedIn profile 2026-10-05 for Dakota Socha']);
    expect(JSON.stringify(p)).not.toMatch(/"status"|created/);
  });
  it('a spelling already an alias, already the account (by the employer rule), or already rejected is never proposed', () => {
    const p = proposeAliases({
      accountName: 'H-E-B',
      aliases: ['Central Market'],
      domains: ['heb.com'],
      conflicts: [...conflicts, { personName: 'X', company: 'HEB Grocery Company', source: 'HubSpot', at: null }, { personName: 'Y', company: 'Heb', source: 'HubSpot', at: null }],
      rejected: ['adusa distribution'],
    });
    expect(p).toEqual([]);
  });
  it('a generic word, a person\'s own name, or a spelling shorter than three letters is never proposed', () => {
    const p = proposeAliases({
      accountName: 'Kroger',
      aliases: [],
      domains: [],
      conflicts: [
        { personName: 'Pat Lee', company: 'Logistics', source: 'HubSpot', at: null },
        { personName: 'Pat Lee', company: 'Pat Lee', source: 'HubSpot', at: null },
        { personName: 'Pat Lee', company: 'KS', source: 'HubSpot', at: null },
        { personName: 'Pat Lee', company: 'Self-employed', source: 'HubSpot', at: null },
        { personName: 'Pat Lee', company: 'King Soopers', source: 'HubSpot', at: null },
      ],
      rejected: [],
    });
    expect(p.map((x) => x.company)).toEqual(['King Soopers']);
  });
  it('name similarity alone proposes nothing: "Delta Dental" beside a "Delta" account is not evidence', () => {
    expect(proposeAliases({ accountName: 'Delta', aliases: [], domains: ['delta.com'], conflicts: [], rejected: [] })).toEqual([]);
  });
});

describe('confirmAlias', () => {
  it('creates the alias through registerAlias (source manual, created_by the actor) and one account.alias_confirmed audit row; a second confirm is ALREADY_MATCHED and writes nothing new', async () => {
    const prisma = fake(['H-E-B', 'Kroger']);
    const r = await confirmAlias(prisma, { accountName: 'H-E-B', alias: 'Central Market', actor: 'casey@freightroll.com', now: NOW, evidence: ['https://en.wikipedia.org/wiki/Central_Market_(Texas)'] });
    expect(r).toEqual({ ok: true, status: 'CREATED', id: 'al_0', auditId: 'au_0' });
    expect(prisma.rows).toEqual([{ id: 'al_0', alias: 'Central Market', normalized_alias: 'central market', account_name: 'H-E-B', source: 'manual', created_by: 'casey@freightroll.com' }]);
    expect(prisma.audits[0].data).toEqual({ kind: 'account.alias_confirmed', actor: 'casey@freightroll.com', subject_type: 'account', subject_id: 'H-E-B', payload: { alias: 'Central Market', normalized: 'central market', evidence: ['https://en.wikipedia.org/wiki/Central_Market_(Texas)'], actor: 'casey@freightroll.com', at: NOW.toISOString(), hubspotWritten: false } });
    const again = await confirmAlias(prisma, { accountName: 'H-E-B', alias: 'central market', actor: 'casey@freightroll.com', now: NOW, evidence: [] });
    expect(again).toEqual({ ok: true, status: 'ALREADY_MATCHED', id: 'al_0', auditId: null });
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.audits).toHaveLength(1);
  });
  it('refuses a spelling that already maps to another account (alias_conflict), an alias that is itself another GAP account (alias_is_account), a missing account, and a junk alias', async () => {
    const prisma = fake(['Delta', 'Delta Dental', 'Kroger'], [{ alias: 'City Market', normalized_alias: 'city market', account_name: 'Kroger' }]);
    expect(await confirmAlias(prisma, { accountName: 'Delta', alias: 'City Market', actor: 'c', now: NOW, evidence: [] })).toEqual({ ok: false, reason: 'alias_conflict', detail: '"City Market" already maps to Kroger' });
    expect(await confirmAlias(prisma, { accountName: 'Delta', alias: 'Delta Dental', actor: 'c', now: NOW, evidence: [] })).toEqual({ ok: false, reason: 'alias_is_account', detail: '"Delta Dental" is the GAP account Delta Dental: identity, not an alias' });
    expect(await confirmAlias(prisma, { accountName: 'Delta', alias: 'Delta', actor: 'c', now: NOW, evidence: [] })).toMatchObject({ ok: false, reason: 'invalid_alias' });
    expect(await confirmAlias(prisma, { accountName: 'Nobody', alias: 'Central Market', actor: 'c', now: NOW, evidence: [] })).toEqual({ ok: false, reason: 'account_not_found' });
    expect(await confirmAlias(prisma, { accountName: 'Delta', alias: ' ab ', actor: 'c', now: NOW, evidence: [] })).toMatchObject({ ok: false, reason: 'invalid_alias' });
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.audits).toHaveLength(0);
  });
});

describe('rejectAlias and loadRejectedAliases', () => {
  it('a rejection is one audit row and comes back as a normalized key; it never touches the alias table', async () => {
    const prisma = fake(['H-E-B']);
    const r = await rejectAlias(prisma, { accountName: 'H-E-B', alias: 'ADUSA Distribution, LLC', actor: 'casey@freightroll.com', now: NOW, note: 'Ahold Delhaize, not H-E-B' });
    expect(r).toEqual({ ok: true, auditId: 'au_0' });
    expect(prisma.audits[0].data).toEqual({ kind: 'account.alias_rejected', actor: 'casey@freightroll.com', subject_type: 'account', subject_id: 'H-E-B', payload: { alias: 'ADUSA Distribution, LLC', normalized: 'adusa distribution', note: 'Ahold Delhaize, not H-E-B', actor: 'casey@freightroll.com', at: NOW.toISOString() } });
    expect(await loadRejectedAliases(prisma, 'H-E-B')).toEqual(['adusa distribution']);
    expect(await loadRejectedAliases(prisma, 'Kroger')).toEqual([]);
    expect(prisma.rows).toEqual([]);
    expect(prisma.gapAccountAlias.create).not.toHaveBeenCalled();
  });
});
