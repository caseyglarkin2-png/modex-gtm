/**
 * R34 (GAP OS execution recovery, 2026-10-06): concise, channel-specific copy per evidence APPROACH.
 *
 *   - the four event-led seed families are byte-identical to before (steps hash and rendered bytes pinned to the
 *     values computed on the tree before R34)
 *   - the job / procurement-led family states only the posting's own words (the verified quote with its citation),
 *     one hedged sentence, ONE question (still open? are the yards where the day gets lost?); the fit-led family
 *     says nothing new prompted it; neither carries physical-change words, ROI, engagement, a layoff hook or
 *     familiarity; both pass every compiler check (a controlled critic pass)
 *   - the copy gate opens for exactly the approaches with a family; report-led stays closed
 *   - the action pack renders a thesis from ITS approach's family, never another's, wherever the version came from;
 *     both enroll paths refuse a version written for another approach; a drifted approach version is outdated copy
 *   - the call opening follows the approach; the event-led opening is unchanged
 *   - the singular-"yard" voice warning judges our prose, not the employer's title in a verified cited quote
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { compile } from '@/lib/gap/compiler/compile';
import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { voiceWarnings } from '@/lib/gap/compiler/checks/c11-banned';
import { findCtaSentences } from '@/lib/gap/compiler/checks/c07-structure';
import type { CompileContext } from '@/lib/gap/compiler/types';
import { renderStepCopy } from '@/lib/gap/sequence/render';
import { stepsHash } from '@/lib/gap/sequence/steps';
import { buildCallPack } from '@/lib/gap/sequence/call-pack';
import { APPROACH_FAMILIES, APPROACH_PROGRAM, SEED_FAMILIES, SEED_PROGRAM, approachFamilyFor, approachOfFamilyProgram } from '@/lib/gap/sequences/families';
import { seedCopyOutdated } from '@/lib/gap/sequences/seed-drift';
import { COPY_FAMILY_APPROACHES, copyFamilySupports, EVIDENCE_APPROACHES } from '@/lib/gap/research/approach-policy';
import { citedQuote } from '@/lib/gap/research/propose';
import { resolvePackVersion } from '@/lib/gap/execution/action-pack';
import { enroll, type EnrollInput } from '@/lib/gap/sequence/enrollment';
import { staticSuppressionReader } from '@/lib/gap/routing/suppression-read';

vi.mock('@/lib/gap/audit', () => ({ audit: vi.fn(async () => ({ stored: true, reviewQueued: false })) }));

const CRITIC_PASS = { score: vi.fn(async () => ({ ok: true as const, verdict: 'pass' as const, score: 100, findings: [] })) };
const POSTING = { title: 'Yard Operations Manager - Tulsa | Acme Careers', quote: 'Acme Logistics is hiring a Yard Operations Manager at its Tulsa distribution center to manage trailer moves and dock appointments.' };
const FIT = { title: 'Acme Logistics network overview', quote: 'Acme Logistics runs 14 regional distribution centers that ship to grocery stores across the Midwest.' };
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('R34: the event-led copy is byte-identical to before', () => {
  // Computed on the tree before R34 (scratchpad event-led-fingerprint.ts at 6f3fa5eb): steps hash, then the sha256 of
  // the queued subject and body rendered for Kara at Acme Logistics on one fixed observation.
  const BEFORE: Record<string, [string, string]> = {
    network_standardization: ['9808c9e2320444c8f65e1639e16cc81122d4196b4ec562dba2fa33ab561de187', '09c984d2f6fbada2bdbd6ec4435781dc7d7653edcad8dc6688d1eaf29eb97191'],
    hidden_capacity: ['e29955b890ba4e6348373fffd2f2ba33a2ce2439894d852504974feb4db2d2ea', 'cb98e2f348ee827591f0d165595c22ae3963fdab0cf96c5dd11f7e8cd2f6cb1b'],
    automation_readiness: ['d9ffed163187b3e6e34622be186c668898d5254fc609c54d4469f1caeac745fe', 'a082e83872e5b3a934aa1411b1c83726a3c5b8c29108c1b9b72a552aac587465'],
    new_sites_acquisitions: ['953a6f2e39ba0b5943c04e66166ea3fa9f10f52766683efa37b33124057c08f3', 'fbef13b440d7a7c8d87108c45de6b64605f15e312f7348b688b7b945cd3f35c6'],
  };
  it('every event-led seed family has the same steps hash and renders the same bytes', () => {
    expect(SEED_FAMILIES.map((f) => f.key)).toEqual(Object.keys(BEFORE));
    const obs = 'Acme Logistics news: "Acme Logistics opened a new distribution center in Reno." [S:sig1].';
    for (const f of SEED_FAMILIES) {
      const t = f.steps.steps[0].templates!;
      const r = renderStepCopy({ subject: t.subjectTemplate!, body: t.bodyTemplate! }, { firstName: 'Kara', account: 'Acme Logistics', observation: obs });
      expect([stepsHash(f.steps), sha(`${r.queued.subject}\n${r.queued.body}`)], f.key).toEqual(BEFORE[f.key]);
    }
  });
});

describe('R34: the approach families', () => {
  const fixture = (key: string) => (key === 'job_procurement_led' ? POSTING : FIT);
  const render = (key: string, firstName = 'Kara', account = 'Acme Logistics') => {
    const fam = APPROACH_FAMILIES.find((f) => f.key === key)!;
    const c = fixture(key);
    const obs = citedQuote(c.title, c.quote, 'sig1', 'Acme Logistics');
    const t = fam.steps.steps[0].templates!;
    return { fam, obs, c, r: renderStepCopy({ subject: t.subjectTemplate!, body: t.bodyTemplate! }, { firstName, account, observation: obs }) };
  };
  it.each(['job_procurement_led', 'fit_led'].flatMap((k) => [[k, true], [k, false]] as const))('%s (rendered=%s) passes every compiler check', async (key, rendered) => {
    const { obs, c, r } = render(key, rendered ? 'Kara' : '{{first_name}}', rendered ? 'Acme Logistics' : '{{account}}');
    const res = await compile(
      { hypothesisId: null, stepIndex: 0, subject: r.marked.subject, body: r.marked.body, priorBodies: [], contract: { hypothesis: { observation: obs, problemHypothesis: 'My guess is the yards are where the day gets lost.', problemFamily: 'hidden_capacity' }, evidence: [{ id: 'sig1', title: c.title, url: 'https://careers.acme.example.com/yard-ops', externalOk: true, fresh: true, superseded: false, firstParty: false, excerpt: c.quote }], claimsUsed: [], stepCount: 1 }, createdBy: 'approach-copy.test' },
      { critic: CRITIC_PASS, validateClaims: validateClaimsUsed },
    );
    expect(res.checks.filter((x) => !x.passed).map((x) => `${x.code}: ${x.detail}`)).toEqual([]);
    expect(res.verdict).toBe('pass');
  });
  it('the job-led email states the posting in its own words with its citation, one hedged sentence, and ONE question: still open, and are the yards where the day gets lost', () => {
    const { r } = render('job_procurement_led');
    expect(r.queued.body).toContain(`"${POSTING.quote.replace(/\.$/, '')}"`);
    expect(r.marked.body).toContain('[[SRC:sig1]]');
    expect(r.queued.body).not.toMatch(/\[\[SRC:|\[S:/);
    const ctas = findCtaSentences(r.queued.body);
    expect(ctas).toHaveLength(1);
    expect(ctas[0].sentence).toBe('Is the posting still open, and are the yards where the day gets lost at Acme Logistics?');
    expect(r.queued.body).toContain('A posting says what a role covers, not how the day actually goes, so I might be reading too much into it.');
  });
  it('neither approach family carries the physical-change words, ROI, an engagement reference, a layoff hook or fake familiarity', () => {
    const PHYSICAL = /\b(when a network grows|grows like that|volume moves|new or acquired sites|new sites|automation plans|expansion|opening|the change|network change|like that)\b/i;
    const FORBIDDEN = /\$|\d+\s?%|\bROI\b|\bsav(?:e|es|ings)\b|\bpayback\b|\bvisited\b|\byour (?:site|page|visit)\b|\bsaw you\b|\bnoticed you\b|\blayoffs?\b|\bWARN\b|\bas we discussed\b|\bgreat to (?:meet|connect)\b|\bhope you(?:'| a)re well\b|\bmeeting\b|\bcalendar\b|\bdemo\b|\u2014/i;
    for (const fam of APPROACH_FAMILIES) {
      const text = `${fam.steps.steps[0].templates!.subjectTemplate}\n${fam.steps.steps[0].templates!.bodyTemplate}`;
      expect(text, fam.key).not.toMatch(PHYSICAL);
      expect(text, fam.key).not.toMatch(FORBIDDEN);
      expect(text, fam.key).not.toMatch(/\bthe yard\b|\byard is\b/i);
      expect(fam.steps.steps[0].productProofAllowed, fam.key).toBe(false);
      expect(fam.problemFamily, fam.key).toBeNull();
      expect(approachOfFamilyProgram(fam.program), fam.key).toBe(fam.approach);
    }
    const fit = render('fit_led').r.queued.body;
    expect(fit).toContain('Nothing new prompted this note.');
    expect(findCtaSentences(fit)).toHaveLength(1);
  });
});

describe('R34: the copy gate opens for exactly the approaches with copy', () => {
  it('event-led, job / procurement-led and fit-led have copy; report-led does not; the list equals the families', () => {
    expect([...COPY_FAMILY_APPROACHES].sort()).toEqual(['event_led', ...APPROACH_FAMILIES.map((f) => f.approach)].sort());
    for (const a of EVIDENCE_APPROACHES) expect(copyFamilySupports(a), a).toBe(a === 'event_led' || !!approachFamilyFor(a));
    expect(copyFamilySupports('report_led')).toBe(false);
    expect(approachOfFamilyProgram(SEED_PROGRAM)).toBe('event_led');
    expect(approachOfFamilyProgram(null)).toBe('event_led');
  });
});

describe('R34: the action pack renders a thesis from its own approach\'s family', () => {
  const versions: Record<string, { id: string; family_id: string; version: number; status: string; steps: unknown; family: { id: string; name: string; engine: string; program: string } }> = {
    'v-event': { id: 'v-event', family_id: 'f-event', version: 1, status: 'draft', steps: SEED_FAMILIES[1].steps, family: { id: 'f-event', name: 'Hidden Capacity', engine: 'modex_draft_queue', program: SEED_PROGRAM } },
    'v-job': { id: 'v-job', family_id: 'f-job', version: 1, status: 'draft', steps: APPROACH_FAMILIES[0].steps, family: { id: 'f-job', name: 'Job or Procurement Posting', engine: 'modex_draft_queue', program: APPROACH_PROGRAM.job_procurement_led } },
  };
  const prisma = {
    sequenceVersion: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => versions[where.id] ?? null),
      findFirst: vi.fn(async ({ where }: { where: { family_id: string } }) => Object.values(versions).find((v) => v.family_id === where.family_id) ?? null),
    },
    sequenceFamily: {
      findMany: vi.fn(async ({ where }: { where: { program?: string; problem_family?: string } }) => (where.program === APPROACH_PROGRAM.job_procurement_led ? [{ id: 'f-job' }] : where.problem_family === 'hidden_capacity' ? [{ id: 'f-event' }] : [])),
    },
  };
  const hyp = (approach: string | null, pinned: { v?: string; f?: string } = {}) => ({ sequence_version_id: pinned.v ?? null, sequence_family_id: pinned.f ?? null, problem_family: 'hidden_capacity', metadata: approach ? { approach } : {} });
  it('a job-led thesis renders from the job family; an event-led thesis of the same problem family from the event-led family', async () => {
    expect((await resolvePackVersion(prisma, hyp('job_procurement_led'), 'modex_queue'))?.id).toBe('v-job');
    expect((await resolvePackVersion(prisma, hyp(null), 'modex_queue'))?.id).toBe('v-event');
  });
  it('a pinned version or family written for another approach is never used, either way round', async () => {
    expect((await resolvePackVersion(prisma, hyp('job_procurement_led', { v: 'v-event' }), 'modex_queue'))?.id).toBe('v-job');
    expect((await resolvePackVersion(prisma, hyp('job_procurement_led', { f: 'f-event' }), 'modex_queue'))?.id).toBe('v-job');
    expect((await resolvePackVersion(prisma, hyp('event_led', { v: 'v-job' }), 'modex_queue'))?.id).toBe('v-event');
  });
  it('an approach with no family here renders nothing (fit-led not seeded in this store; report-led never)', async () => {
    expect(await resolvePackVersion(prisma, hyp('fit_led'), 'modex_queue')).toBeNull();
    expect(await resolvePackVersion(prisma, hyp('report_led'), 'modex_queue')).toBeNull();
  });
  it('a stored approach version that drifted from the code is outdated copy; the current one is not', () => {
    const job = APPROACH_FAMILIES[0];
    expect(seedCopyOutdated({ steps: job.steps, family: { name: job.name, program: job.program } })).toBe(false);
    expect(seedCopyOutdated({ steps: SEED_FAMILIES[0].steps, family: { name: job.name, program: job.program } })).toBe(true);
    expect(seedCopyOutdated({ steps: job.steps, family: { name: 'Something else', program: job.program } })).toBe(true);
  });
});

describe('R34: enrollment never runs one approach on another\'s copy', () => {
  const JOB_SIGNAL = { id: 'sig_j', title: 'Yard Operations Manager | Acme Careers', claim_class: 'JOB_POSTING', evidence_url: 'https://careers.acme-logistics.example.com/yard-ops', external_ok: true, observed_at: new Date('2026-09-28T00:00:00.000Z'), freshness_expires_at: null, source_type: 'public_primary', evidence_text: 'Acme is hiring a Yard Operations Manager at its Columbus distribution center to run trailer moves and dock appointments.', source_kind: 'evidence_record', account_name: 'Acme', metadata: { verified: 'excerpt_found_at_source', claimType: 'job_posting', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } } };
  const prismaFor = (program: string) => ({
    sequenceVersion: { findUnique: vi.fn(async () => ({ id: 'v1', family_id: 'fam_1', status: 'draft', family: { program } })) },
    unsubscribedEmail: { findUnique: vi.fn(async () => null) },
    persona: { findUnique: vi.fn(async () => ({ do_not_contact: false })) },
    sequenceEnrollment: { findFirst: vi.fn(async () => null), findUnique: vi.fn(async () => null), findMany: vi.fn(async () => []), updateMany: vi.fn(async () => ({ count: 1 })) },
    prospectingHypothesis: { findUnique: vi.fn(async () => ({ status: 'active', account_name: 'Acme', metadata: { approach: 'job_procurement_led' }, observation: `${citedQuote(JOB_SIGNAL.title, JOB_SIGNAL.evidence_text, 'sig_j', 'Acme')}`, signals: [{ signal: JOB_SIGNAL }] })) },
    $transaction: vi.fn(async () => false),
  });
  const input = (over: Partial<EnrollInput> = {}): EnrollInput => ({ familyId: 'fam_1', versionId: 'v1', engine: 'modex_draft_queue', toEmail: 'jane@acme-logistics.example.com', accountName: 'Acme', personaId: 7, hypothesisId: 'H1', sender: 'casey@yardflow.ai', owner: 'casey@freightroll.com', draftItemId: 1, now: new Date('2026-10-06T12:00:00Z'), enrolledBy: 'casey', ...over });
  it('a job-led thesis on an event-led version is refused as a family mismatch, before any write; on the job family it proceeds', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const opts = { suppression: staticSuppressionReader('clear') };
    const wrong = prismaFor(SEED_PROGRAM);
    expect(await enroll(wrong, input(), opts)).toEqual({ ok: false, reason: 'family_mismatch' });
    expect(wrong.$transaction).not.toHaveBeenCalled();
    const right = prismaFor(APPROACH_PROGRAM.job_procurement_led);
    const r = await enroll(right, input(), opts);
    expect(r).toMatchObject({ ok: true });
    expect(right.$transaction).toHaveBeenCalledTimes(1);
    // An approach family's copy never runs without its thesis.
    expect(await enroll(prismaFor(APPROACH_PROGRAM.job_procurement_led), input({ hypothesisId: null }), opts)).toEqual({ ok: false, reason: 'family_mismatch' });
  });
});

describe('R34: routing and readiness judge a thesis under its own approach (the defect the scratch run found)', () => {
  const NOW = new Date('2026-10-06T12:00:00Z');
  const JOB = { id: 'sig_j', title: 'Yard Operations Manager | Acme Careers', claim_class: 'JOB_POSTING', evidence_url: 'https://careers.acme.example.com/yard-ops', external_ok: true, observed_at: new Date('2026-09-28T00:00:00Z'), freshness_expires_at: null, source_type: 'public_primary', evidence_text: 'Acme is hiring a Yard Operations Manager at its Columbus distribution center to run trailer moves and dock appointments.', source_kind: 'evidence_record', account_name: 'Acme', metadata: { verified: 'excerpt_found_at_source', claimType: 'job_posting', claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } } };
  const row = (metadata: unknown) => ({ id: 'H1', account_name: 'Acme', status: 'active', problem_family: 'yard_state_integrity', confidence: 40, observation: citedQuote(JOB.title, JOB.evidence_text, 'sig_j', 'Acme'), problem_hypothesis: 'My guess is the yards are where the day gets lost.', why_now: null, falsification_questions: [], what_a_no_means: null, expires_at: null, metadata, signals: [{ signal: JOB }] });
  it('routing: a live posting is not thin evidence for a job-led thesis; the same row read event-led is (a posting is not a physical change)', async () => {
    const { buildHypothesisForTest } = await import('@/lib/gap/routing/inputs');
    expect(buildHypothesisForTest(row({ approach: 'job_procurement_led' }) as never, NOW)!.evidenceThin).toBe(false);
    expect(buildHypothesisForTest(row({}) as never, NOW)!.evidenceThin).toBe(true);
  });
  it('readiness: the same rule, so the review surfaces never call a sendable job-led thesis insufficient', async () => {
    const { outreachReadiness } = await import('@/lib/gap/hypothesis/actionability');
    const r = row({ approach: 'job_procurement_led' });
    expect(outreachReadiness({ observation: r.observation, account_name: 'Acme', metadata: r.metadata, signals: [JOB as never] }, NOW)).toEqual({ ready: true, reason: null });
    expect(outreachReadiness({ observation: r.observation, account_name: 'Acme', signals: [JOB as never] }, NOW).ready).toBe(false);
  });
});

describe('R34: the call opening follows the approach', () => {
  const base = { firstName: 'Kara', senderFirstName: 'Casey', accountName: 'Acme', observationPlain: 'Acme is hiring a Yard Operations Manager at its Tulsa distribution center.', problemHypothesis: 'My guess is that the yards are where the day gets lost.', diagnosticQuestion: null, title: 'Director of Transportation' };
  it('job-led asks whether the posting is still open and whether the yards are where the day gets lost; no guess', () => {
    const p = buildCallPack({ ...base, approach: 'job_procurement_led' });
    expect(p.opener).toBe('Kara, Casey with YardFlow. You weren\'t expecting me, so tell me if this is off. Acme is hiring a Yard Operations Manager at its Tulsa distribution center. Is that posting still open, and are the yards where the day gets lost there, or am I off?');
    expect(p.opener).not.toMatch(/my guess/i);
    expect(p.voicemail).toContain('I have one question about that posting, not a pitch.');
  });
  it('the event-led opening is unchanged', () => {
    const p = buildCallPack(base);
    expect(p.opener).toBe('Kara, Casey with YardFlow. You weren\'t expecting me, so tell me if this is off. Acme is hiring a Yard Operations Manager at its Tulsa distribution center. My guess is that the yards are where the day gets lost. Is that actually an issue for you, or am I off?');
    expect(p.voicemail).toBe('Kara, Casey with YardFlow. Acme is hiring a Yard Operations Manager at its Tulsa distribution center. I have one question about whether that is changing anything for your team, not a pitch. Call me back if it is worth two minutes.');
  });
});

describe('R34: the singular-"yard" warning judges our prose, not the source\'s words', () => {
  const ctx = (excerpt: string): CompileContext => ({ stepIndex: 0, hypothesis: { observation: '', problemHypothesis: '', problemFamily: 'unmapped' }, evidence: [{ id: 'sig1', title: 't', url: null, externalOk: true, fresh: true, superseded: false, firstParty: false, excerpt }], priorStepBodies: [], contract: {} });
  const body = (quote: string) => `Hi Kara,\nYard Operations Manager | Acme Careers: "${quote}" [[SRC:sig1]].\n\nA posting says what a role covers, so I might be wrong.\n\nIs it still open?\n\nCasey Larkin, YardFlow by FreightRoll`;
  it('a verified cited quote and its source label are set aside; an unverified quote keeps its label and is judged', () => {
    expect(voiceWarnings(body(POSTING.quote.replace(/\.$/, '')), ctx(POSTING.quote))).toEqual([]);
    expect(voiceWarnings(body('Acme needs a yard fix now'), ctx(POSTING.quote)).map((w) => w.warning)).toEqual(['singular "yard" (yards is plural in the network sense): "Yard"']);
    // Our own prose is still judged: a singular yard in the hypothesis paragraph warns.
    const ours = `${body(POSTING.quote.replace(/\.$/, ''))}`.replace('A posting says', 'The yard says');
    expect(voiceWarnings(ours, ctx(POSTING.quote)).length).toBe(1);
  });
});
