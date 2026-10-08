// @vitest-environment node
/**
 * R65 (for the R64 repair): the stranded-draft dry run says what the R11 service would adopt and why not, through a
 * client that cannot write; the script refuses to run without --dry-run and never prints credentials. The real
 * service's agreement with the plan is proven on Postgres in tests/unit/gap/scratch/stranded-repair.scratch.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { planStrandedRepair } from '@/lib/gap/recovery/stranded-drafts';
import { databaseLabel, readOnlyPrisma, ReadOnlyRefusal, strandedRepairCommand } from '@/lib/gap/recovery/read-only';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-10-07T15:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('R65: the stranded-draft plan says what the R11 service would adopt, and why not', () => {
  const okText = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';
  const fact = (id: string, text: string) => ({ id, account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_secondary', evidence_text: text, evidence_url: `https://news.example.com/${id}`, observed_at: new Date('2026-09-20T00:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'PepsiCo news', claim_class: null, type: 'site_expansion', freshness_expires_at: null });
  const facts = [fact('f-ok', okText), fact('f-sens', 'PepsiCo is ceasing operations at a Maryland plant, which will result in 143 layoffs, according to a WARN notice.'), fact('f-word', '')];
  const draft = (id: string, persona: number, signals: Array<{ signal_id: string; role: string }>, created: string) => ({ id, account_name: 'PepsiCo', primary_persona_id: persona, problem_family: 'unmapped', created_at: new Date(created), primary_persona: { name: `Person ${persona}` }, signals });
  const drafts = [
    draft('d-adopt', 7, [{ signal_id: 'f-ok', role: 'primary' }], days(6)),
    draft('d-sensitive', 7, [{ signal_id: 'f-sens', role: 'supporting' }], days(5)),
    draft('d-held', 8, [{ signal_id: 'f-ok', role: 'supporting' }], days(4)),
    draft('d-older', 9, [{ signal_id: 'f-ok', role: 'supporting' }], days(3)),
    draft('d-nofact', 7, [], days(2)),
    draft('d-keyword', 10, [{ signal_id: 'f-word', role: 'primary' }, { signal_id: 'f-sens', role: 'supporting' }], days(1)),
  ];
  const writes: string[] = [];
  const write = (name: string) => () => {
    writes.push(name);
    return Promise.resolve();
  };
  const prisma = {
    prospectingHypothesis: {
      findMany: async (q: { where: Record<string, unknown> }) => {
        if (q.where.status === 'draft') return drafts;
        if (q.where.status === 'review_required') return [{ id: 'r-newer', primary_persona_id: 9, created_at: new Date(days(0.5)), signals: [{ signal_id: 'f-ok' }] }];
        if ((q.where.source_ref as { in?: string[] })?.in) return [{ id: 'h-holder', source_ref: 'anchor:f-ok:p8' }];
        return [];
      },
      update: write('update'),
      updateMany: write('updateMany'),
    },
    prospectingSignal: { findMany: async (q: { where: { id: { in: string[] } } }) => facts.filter((f) => q.where.id.in.includes(f.id)) },
    $executeRaw: write('$executeRaw'),
  };

  it('one adoption with its key; each other draft says why the service would not adopt it', async () => {
    const plan = await planStrandedRepair(readOnlyPrisma(prisma), NOW);
    const by = new Map(plan.items.map((i) => [i.hypothesisId, i]));
    expect(plan.counts).toEqual({ stranded: 6, adopt: 1, notAdopted: 5 });
    expect(by.get('d-adopt')).toMatchObject({ verdict: 'adopt', factId: 'f-ok', factRole: 'primary', key: 'anchor:f-ok:p7', ageDays: 6 });
    expect(by.get('d-sensitive')?.why).toMatch(/fails the service's checks now \(sensitive:/);
    expect(by.get('d-held')?.why).toMatch(/thesis h-holder already holds the story key anchor:f-ok:p8/);
    expect(by.get('d-older')?.why).toMatch(/a newer unkeyed thesis \(r-newer\) for the same fact and person would be adopted instead/);
    expect(by.get('d-nofact')).toMatchObject({ verdict: 'not_adopted', factId: null, key: null, why: expect.stringMatching(/^It cites no fact/) });
    expect(by.get('d-keyword')?.why).toMatch(/primary fact f-word fails the service's checks now \(keyword_only\); its supporting fact f-sens fails/);
    expect(writes).toEqual([]);
  });

  it('the read-only client refuses writes, raw SQL and transactions, and lets reads through', async () => {
    const ro = readOnlyPrisma(prisma);
    expect(() => ro.prospectingHypothesis.update()).toThrow(ReadOnlyRefusal);
    expect(() => ro.prospectingHypothesis.updateMany()).toThrow('read-only: prospectingHypothesis.updateMany refused (this tool never writes)');
    expect(() => ro.$executeRaw()).toThrow('read-only: $executeRaw refused (this tool never writes)');
    expect(writes).toEqual([]);
    expect((await ro.prospectingSignal.findMany({ where: { id: { in: ['f-ok'] } } })).map((f) => f.id)).toEqual(['f-ok']);
  });

  it('the script runs only as a dry run, and names the database without credentials', () => {
    expect(strandedRepairCommand(['--dry-run'])).toEqual({ ok: true, json: false });
    expect(strandedRepairCommand(['--dry-run', '--json'])).toEqual({ ok: true, json: true });
    expect(strandedRepairCommand([])).toMatchObject({ ok: false, code: 2, message: expect.stringMatching(/^Refused: this script only reads \(--dry-run\)\..*Nothing was read or written\.$/) });
    expect(strandedRepairCommand(['--apply'])).toMatchObject({ ok: false, code: 2, message: expect.stringMatching(/^Unknown argument --apply/) });
    const label = databaseLabel('postgresql://gapuser:s3cret-pass@db.example.internal:5432/gap_prod?sslmode=require');
    expect(label).toBe('db.example.internal:5432/gap_prod');
    expect(label).not.toMatch(/s3cret|gapuser/);
  });
});

