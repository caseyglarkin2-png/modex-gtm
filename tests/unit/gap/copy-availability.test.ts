// @vitest-environment node
/**
 * Batch item 6 (R34): "is first-touch copy installed?" is asked of the SEEDED rows through the action pack's own
 * resolver, never a code constant; the family to seed is named; Work never calls an email card without copy READY.
 */
import { describe, expect, it } from 'vitest';
import { copyAvailabilityFor, copyAvailabilityMap, copyFamilyName } from '@/lib/gap/execution/copy-availability';
import { cardReadiness, sellerLaneOf, type ReadinessInput } from '@/lib/gap/routing/card-readiness';
import { APPROACH_PROGRAM, SEED_PROGRAM } from '@/lib/gap/sequences/families';

type Fam = { id: string; problem_family: string | null; program: string; archived_at: null };
function db(families: Fam[], theses: Array<Record<string, unknown>> = []) {
  const versionOf = (f: Fam) => ({ id: `v-${f.id}`, family_id: f.id, version: 1, status: 'frozen', steps: {}, family: { id: f.id, name: f.id, engine: 'modex_draft_queue', program: f.program } });
  return {
    sequenceVersion: {
      findUnique: async () => null,
      findFirst: async ({ where }: { where: { family_id: string } }) => {
        const f = families.find((x) => x.id === where.family_id);
        return f ? versionOf(f) : null;
      },
    },
    sequenceFamily: {
      findMany: async ({ where }: { where: { program?: string; problem_family?: string } }) => families.filter((f) => (where.program ? f.program === where.program : f.problem_family === where.problem_family)).map((f) => ({ id: f.id })),
    },
    prospectingHypothesis: { findMany: async ({ where }: { where: { id: { in: string[] } } }) => theses.filter((t) => where.id.in.includes(String(t.id))) },
  };
}
const EVENT_HIDDEN: Fam = { id: 'fam-hc', problem_family: 'hidden_capacity', program: SEED_PROGRAM, archived_at: null };
const JOB: Fam = { id: 'fam-job', problem_family: null, program: APPROACH_PROGRAM.job_procurement_led, archived_at: null };

describe('copy availability, asked of the seeded rows (item 6)', () => {
  it('an event-led thesis has copy only when its problem family is seeded; the family is named', async () => {
    expect(await copyAvailabilityFor(db([EVENT_HIDDEN]), { problem_family: 'hidden_capacity', metadata: null })).toEqual({ installed: true, familyName: 'Hidden Capacity', detail: null });
    expect(await copyAvailabilityFor(db([]), { problem_family: 'hidden_capacity', metadata: null })).toEqual({ installed: false, familyName: 'Hidden Capacity', detail: 'No first-touch copy is installed for Hidden Capacity: seed that copy family before this thesis can open an email. Nothing goes out.' });
    expect(copyFamilyName({ problem_family: 'yard_state_integrity', metadata: null })).toBe('yard state integrity (no copy family written)');
  });
  it('a job-led thesis needs its approach family seeded (an event-led family never stands in for it)', async () => {
    const job = { problem_family: 'hidden_capacity', metadata: { approach: 'job_procurement_led' } };
    expect(await copyAvailabilityFor(db([EVENT_HIDDEN]), job)).toMatchObject({ installed: false, familyName: 'Job or Procurement Posting' });
    expect(await copyAvailabilityFor(db([EVENT_HIDDEN, JOB]), job)).toMatchObject({ installed: true, familyName: 'Job or Procurement Posting' });
  });
  it('the map answers every thesis read, once per shape', async () => {
    const m = await copyAvailabilityMap(db([EVENT_HIDDEN], [{ id: 'h1', problem_family: 'hidden_capacity', metadata: null }, { id: 'h2', problem_family: 'yard_state_integrity', metadata: null }]), ['h1', 'h2', 'h1']);
    expect([...m.entries()].map(([id, c]) => [id, c.installed])).toEqual([['h1', true], ['h2', false]]);
  });
});

describe('Work never calls an email card without copy READY (item 6)', () => {
  const card = (copy: ReadinessInput['copy']): ReadinessInput => ({ id: 'd1', action: 'one_off_email', blocked: false, ruleId: 'enroll', account: { name: 'Tyson', hubspotCompanyId: '1' }, persona: { id: 7, displayName: 'Rae Scratch', email: 'rae@tyson.example.com', hubspotContactId: null }, hypothesis: { id: 'h1', status: 'active' }, copy });
  it('no installed copy is a missing prerequisite that names the family, never the ready lane; installed copy opens the pack', () => {
    const missing = cardReadiness(card({ installed: false, detail: 'No first-touch copy is installed for Job or Procurement Posting: seed that copy family before this thesis can open an email. Nothing goes out.' }));
    expect(missing).toMatchObject({ state: 'missing_prerequisite', missing: expect.stringMatching(/^No first-touch copy is installed for Job or Procurement Posting/) });
    expect(sellerLaneOf({ ...card({ installed: false, detail: 'x' }), humanAction: null })).not.toBe('ready');
    expect(cardReadiness(card({ installed: true, detail: null }))).toMatchObject({ state: 'actionable' });
    // An older caller that never read copy keeps its behavior.
    expect(cardReadiness(card(undefined))).toMatchObject({ state: 'actionable' });
  });
});
