/**
 * CONTACT CURRENTNESS: the store and the bounded verification (owner resolution, 2026-10-05). Casey's "this person
 * left" is a human-confirmed correction (audit row + provenanced fields) that takes effect at once and is never
 * overwritten by automation; it never touches suppression, the email or HubSpot. A verification without a source URL
 * asserts nothing.
 */
import { describe, expect, it, vi } from 'vitest';
import { evidenceFromFields, loadEmployment, recordEmploymentCorrection, recordEmploymentVerification, type HubSpotEmploymentProps } from '@/lib/gap/people/employment-store';
import { buildEmploymentPrompt, parseEmploymentAnswer, verifyEmployment } from '@/lib/gap/people/employment-verify';

const NOW = new Date('2026-10-05T12:00:00Z');

type Field = { field_name: string; field_value: string | null; source: string; source_timestamp: Date | null; confidence: number | null; last_writer: string | null };

/** A hand-rolled prisma: personas, one enrichment per persona with fields, audit rows, dispositions. */
function db(seed: { personas?: any[]; fields?: Record<number, Field[]>; dispositions?: any[] } = {}) {
  const personas = seed.personas ?? [{ id: 1306, account_name: 'H-E-B', name: 'dakota socha', title: 'transportation & reverse logistics', email: 'socha.dakota@heb.com', hubspot_contact_id: '218964806213', do_not_contact: false, email_status: 'unverified' }];
  const fields = new Map<number, Field[]>(Object.entries(seed.fields ?? {}).map(([k, v]) => [Number(k), v]));
  const enrichmentIdOf = (pid: number) => 900 + pid;
  const audit: any[] = [];
  const personaUpdates: any[] = [];
  const tx = {
    contactEnrichment: {
      upsert: vi.fn(async ({ where }: any) => {
        if (!fields.has(where.persona_id)) fields.set(where.persona_id, []);
        return { id: enrichmentIdOf(where.persona_id) };
      }),
    },
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
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { audit.push(data); return { id: `aud_${audit.length}` }; }) },
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
    conversationDisposition: { findMany: vi.fn(async ({ where }: any) => (seed.dispositions ?? []).filter((d) => where.persona_id.in.includes(d.persona_id))) },
    gapAuditEvent: tx.gapAuditEvent,
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { prisma, audit, fields, personaUpdates, tx };
}

describe('loadEmployment: the CRM alone is unverified; HubSpot props and dispositions become evidence', () => {
  it('a persona with nothing on record is CURRENT_UNVERIFIED', async () => {
    const { prisma } = db();
    const r = (await loadEmployment(prisma, [1306], { now: NOW })).get(1306)!;
    expect(r.state).toBe('CURRENT_UNVERIFIED');
    expect(r.accountName).toBe('H-E-B');
  });
  it('live HubSpot props: a last-modified date does not confirm; an Apollo moved_out raises a conflict', async () => {
    const { prisma } = db();
    const hs = new Map<string, HubSpotEmploymentProps>([['218964806213', { company: 'Heb', title: 'transportation & reverse logistics', email: 'socha.dakota@heb.com', lastModifiedAt: '2026-08-18T17:45:54Z', apolloEmploymentStatus: null, apolloVerifiedAt: null }]]);
    expect((await loadEmployment(prisma, [1306], { now: NOW, hubspot: hs })).get(1306)!.state).toBe('CURRENT_UNVERIFIED');
    hs.set('218964806213', { ...hs.get('218964806213')!, apolloEmploymentStatus: 'moved_out', apolloVerifiedAt: '2026-09-11T00:00:00Z' });
    expect((await loadEmployment(prisma, [1306], { now: NOW, hubspot: hs })).get(1306)!.state).toBe('EMPLOYMENT_CONFLICT');
  });
  it('a human-confirmed buyer answer at the account within 180 days confirms them', async () => {
    const { prisma } = db({ dispositions: [{ persona_id: 1306, created_at: new Date('2026-09-01T00:00:00Z'), response_class: 'problem_confirmed', channel: 'email' }] });
    expect((await loadEmployment(prisma, [1306], { now: NOW })).get(1306)!.state).toBe('CURRENT_CONFIRMED');
  });
  it('evidenceFromFields: a manual left row is human; a derived row takes its tier from the URL; intake company fields are supporting', () => {
    const rows: Field[] = [
      { field_name: 'employment_status', field_value: 'left', source: 'manual', source_timestamp: new Date('2026-10-05T00:00:00Z'), confidence: 1, last_writer: 'casey@yardflow.ai' },
      { field_name: 'employment_company', field_value: 'ADUSA Distribution', source: 'manual', source_timestamp: new Date('2026-10-05T00:00:00Z'), confidence: 1, last_writer: 'casey@yardflow.ai' },
      { field_name: 'company_name', field_value: 'H-E-B', source: 'apollo', source_timestamp: new Date('2026-05-04T00:00:00Z'), confidence: null, last_writer: 'apollo_intake' },
    ];
    const ev = evidenceFromFields(rows, 'H-E-B');
    expect(ev.map((e) => [e.kind, e.tier, e.company, e.left ?? false])).toEqual([['human', 'strong', 'ADUSA Distribution', true], ['apollo', 'supporting', 'H-E-B', false]]);
    const derived: Field[] = [
      { field_name: 'employment_status', field_value: 'left', source: 'derived', source_timestamp: new Date('2026-09-20T00:00:00Z'), confidence: 0.9, last_writer: 'employment_verify:casey' },
      { field_name: 'employment_company', field_value: 'ADUSA Distribution', source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
      { field_name: 'employment_source_url', field_value: 'https://www.linkedin.com/in/x', source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
    ];
    expect(evidenceFromFields(derived, 'H-E-B')[0]).toMatchObject({ kind: 'profile', tier: 'strong', left: true, company: 'ADUSA Distribution' });
    expect(evidenceFromFields([{ ...derived[0] }, { ...derived[1] }, { ...derived[2], field_value: 'https://www.zoominfo.com/p/x' }], 'H-E-B')[0]).toMatchObject({ kind: 'aggregator', tier: 'supporting' });
  });
});

describe('recordEmploymentCorrection: THIS PERSON LEFT is human-confirmed, audited, immediate, and never suppression', () => {
  it('writes the five manual fields, one audit row with before / after, and the read becomes LEFT_COMPANY_CONFIRMED', async () => {
    const { prisma, audit, fields, personaUpdates } = db();
    const r = await recordEmploymentCorrection(prisma, { personaId: 1306, actor: 'casey@yardflow.ai', now: NOW, status: 'left', newCompany: 'ADUSA Distribution', newTitle: 'Director of Distribution Operations', sourceUrl: 'https://www.linkedin.com/in/x', note: 'Confirmed by hand.' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.read.state).toBe('LEFT_COMPANY_CONFIRMED');
    expect(r.read.elsewhere).toMatchObject({ company: 'ADUSA Distribution', title: 'Director of Distribution Operations' });
    const written = fields.get(1306)!;
    expect(written.map((f) => [f.field_name, f.field_value, f.source])).toEqual([
      ['employment_status', 'left', 'manual'],
      ['employment_company', 'ADUSA Distribution', 'manual'],
      ['employment_title', 'Director of Distribution Operations', 'manual'],
      ['employment_source_url', 'https://www.linkedin.com/in/x', 'manual'],
      ['employment_note', 'Confirmed by hand.', 'manual'],
    ]);
    expect(written.every((f) => f.confidence === 1 && f.last_writer === 'casey@yardflow.ai')).toBe(true);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'person.employment_corrected', actor: 'casey@yardflow.ai', subject_type: 'persona', subject_id: '1306', payload: { status: 'left', before: { accountName: 'H-E-B', title: 'transportation & reverse logistics' }, after: { company: 'ADUSA Distribution', title: 'Director of Distribution Operations' }, sourceUrl: 'https://www.linkedin.com/in/x', suppressionTouched: false } });
    // Never do-not-contact, never the email, never HubSpot.
    expect(personaUpdates).toEqual([]);
    expect(JSON.stringify(audit)).not.toMatch(/do_not_contact|hubspot/i);
  });
  it('a bad URL or an unknown persona refuses before any write', async () => {
    const { prisma, audit } = db();
    expect(await recordEmploymentCorrection(prisma, { personaId: 1306, actor: 'c', now: NOW, status: 'left', sourceUrl: 'not a url' })).toEqual({ ok: false, reason: 'invalid_url' });
    expect(await recordEmploymentCorrection(prisma, { personaId: 9, actor: 'c', now: NOW, status: 'left' })).toEqual({ ok: false, reason: 'persona_not_found' });
    expect(audit).toHaveLength(0);
  });
  it('"current" and "role_changed" keep them at the account (confirmed), with the corrected title', async () => {
    const { prisma } = db();
    const r = await recordEmploymentCorrection(prisma, { personaId: 1306, actor: 'c', now: NOW, status: 'role_changed', newTitle: 'Director of Transportation' });
    expect(r.ok && r.read.state).toBe('CURRENT_CONFIRMED');
    expect(r.ok && r.read.why).toMatch(/as Director of Transportation/);
  });
});

describe('recordEmploymentVerification: derived evidence never overwrites Casey; no URL asserts nothing', () => {
  it('a sourced "left" verdict records derived fields with the URL tier and an audit row', async () => {
    const { prisma, audit, fields } = db();
    const r = await recordEmploymentVerification(prisma, { personaId: 1306, actor: 'casey', now: NOW, verdict: 'left', company: 'ADUSA Distribution', title: 'Director of Distribution Operations', sourceUrl: 'https://www.linkedin.com/in/x', sourceDate: '2026-09-20', summary: 'Profile shows ADUSA.' });
    expect(r.ok && r.recorded).toBe(true);
    expect(r.ok && r.read.state).toBe('LEFT_COMPANY_CONFIRMED');
    expect(fields.get(1306)!.find((f) => f.field_name === 'employment_status')).toMatchObject({ field_value: 'left', source: 'derived', confidence: 0.9 });
    expect(audit[0]).toMatchObject({ kind: 'person.employment_verified', payload: { verdict: 'left', tier: 'strong', recorded: true } });
  });
  it('an unknown verdict, or a verdict with no source, writes only the audit row', async () => {
    const { prisma, audit, fields } = db();
    const r = await recordEmploymentVerification(prisma, { personaId: 1306, actor: 'casey', now: NOW, verdict: 'unknown', company: null, title: null, sourceUrl: null, sourceDate: null, summary: 'no source found' });
    expect(r.ok && r.recorded).toBe(false);
    expect(r.ok && r.read.state).toBe('CURRENT_UNVERIFIED');
    const r2 = await recordEmploymentVerification(prisma, { personaId: 1306, actor: 'casey', now: NOW, verdict: 'left', company: 'X', title: null, sourceUrl: null, sourceDate: null, summary: null });
    expect(r2.ok && r2.recorded).toBe(false);
    expect(fields.get(1306) ?? []).toEqual([]);
    expect(audit).toHaveLength(2);
  });
  it('a human correction stands: automation is refused', async () => {
    const { prisma, audit } = db({ fields: { 1306: [{ field_name: 'employment_status', field_value: 'left', source: 'manual', source_timestamp: NOW, confidence: 1, last_writer: 'casey' }] } });
    expect(await recordEmploymentVerification(prisma, { personaId: 1306, actor: 'bot', now: NOW, verdict: 'current', company: 'H-E-B', title: null, sourceUrl: 'https://www.linkedin.com/in/x', sourceDate: null, summary: null })).toEqual({ ok: false, reason: 'human_correction_stands' });
    expect(audit).toHaveLength(0);
  });
});

describe('verifyEmployment: the prompt asks for a source; the parse asserts nothing without one', () => {
  it('parses a fenced JSON answer and tiers it by the URL', () => {
    const text = 'Here is what I found:\n```json\n{"verdict":"left","company":"ADUSA Distribution","title":"Director of Distribution Operations","sourceUrl":"https://www.linkedin.com/in/dakota-x","sourceDate":"2026-09","confidence":"high","summary":"Profile headline shows ADUSA."}\n```';
    expect(parseEmploymentAnswer(text, {})).toMatchObject({ verdict: 'left', company: 'ADUSA Distribution', tier: 'strong', sourceDate: '2026-09' });
    expect(parseEmploymentAnswer('{"verdict":"left","company":"X","sourceUrl":"https://www.zoominfo.com/p/x","confidence":"high"}', {}).tier).toBe('supporting');
  });
  it('no URL, a bad URL, prose, or an unknown verdict is unknown', () => {
    expect(parseEmploymentAnswer('{"verdict":"left","company":"X","sourceUrl":null,"confidence":"high","summary":"I think so"}', {})).toMatchObject({ verdict: 'unknown', summary: 'I think so' });
    expect(parseEmploymentAnswer('{"verdict":"left","company":"X","sourceUrl":"linkedin"}', {}).verdict).toBe('unknown');
    expect(parseEmploymentAnswer('They probably left.', {}).verdict).toBe('unknown');
    expect(parseEmploymentAnswer('{"verdict":"maybe","sourceUrl":"https://a.b/c"}', {}).verdict).toBe('unknown');
    expect(parseEmploymentAnswer(null, {}).verdict).toBe('unknown');
  });
  it('the prompt names the CRM claim and demands a source; the search is injected and a throwing search is unknown', async () => {
    const prompt = buildEmploymentPrompt({ name: 'Dakota Socha', title: 'transportation & reverse logistics', company: 'H-E-B', linkedinUrl: 'https://www.linkedin.com/in/x' });
    expect(prompt).toMatch(/Our CRM says they are "transportation & reverse logistics" at "H-E-B"/);
    expect(prompt).toMatch(/Never invent a URL/);
    const search = vi.fn(async () => '{"verdict":"current","company":"H-E-B","title":"Director","sourceUrl":"https://www.heb.com/leadership","confidence":"medium"}');
    const r = await verifyEmployment({ name: 'D', title: null, company: 'H-E-B', companyDomains: ['heb.com'] }, { search });
    expect(r).toMatchObject({ verdict: 'current', tier: 'strong', kind: 'employer_page' });
    expect(search).toHaveBeenCalledTimes(1);
    expect((await verifyEmployment({ name: 'D', title: null, company: 'H-E-B' }, { search: async () => { throw new Error('down'); } })).verdict).toBe('unknown');
  });
});
