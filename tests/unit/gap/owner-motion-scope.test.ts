/**
 * R32 (GAP OS execution recovery, 2026-10-06): match the person to the MOTION and its SCOPE.
 *
 *   approach   a job-led thesis is matched on the posting's role (the hiring manager's function), never on every yard
 *              or trailer word in the posting's text; the site operator AT the site the posting names is eligible
 *   site       a fact that names a site makes a person who runs another site related, never direct
 *   division   a PBNA fact is not attributed to a Frito-Lay contact
 *   precedence warm routes and the open deal's contacts precede every cold alternative
 *   choice     a recorded choice (Tom) is never replaced by a recommendation; a large map yields three rows with
 *              reasons; a genuine tie asks ONE question, only when choosing blocks the next action
 * The anchor's "fits better" caution reads the same job-led context; the loader carries the thesis's approach, its
 * posting role and the open deal's contacts.
 */
import { describe, expect, it, vi } from 'vitest';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import { factSite, personSite, thesisRelevance } from '@/lib/gap/people/thesis-relevance';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import { projectAnchor } from '@/lib/gap/story/anchor';

const NOW = new Date('2026-10-06T12:00:00Z');
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } as unknown as OwnerCandidateInput['employment'], ...over });
const POSTING = 'PepsiCo is hiring a Yard Operations Manager at its Tulsa distribution center to manage trailer moves and dock appointments [S:f-job].';
const tom = gap(1, 'Tom Scratch', 'Senior Director, Transportation');
const ana = gap(2, 'Ana Ortiz', 'Yard Manager, Tulsa');
const ben = gap(3, 'Ben Fleet', 'VP Fleet');
const dee = gap(4, 'Dee Dallas', 'DC General Manager, Dallas');
const pam = gap(5, 'Pam Proc', 'Director of Procurement');
const hub = { read: true, count: 0, truncated: false, via: 'linked' as const };
const resolve = (over: Partial<OwnerResolutionInput> & Pick<OwnerResolutionInput, 'candidates'>) => resolveOwner({ account: { name: 'PepsiCo', entityType: 'shipper' as never }, purpose: 'HYPOTHESIS_ACTIVATION', hubspot: hub, now: NOW, ...over });
const jobLed = { id: 'h-job', status: 'approved', primaryPersonaId: null, observation: POSTING, approach: 'job_procurement_led', postingRole: 'Yard Operations Manager' };

describe('R32 approach: a job-led thesis is matched on the posting\'s function', () => {
  it('the posting\'s role decides the remit: transportation and the Tulsa yard manager are direct, the fleet is adjacent, procurement is outside; the event-led reading of the same text would call the fleet direct', () => {
    const r = resolve({ hypothesis: jobLed, candidates: [tom, ana, ben, dee, pam] });
    const tier = (name: string) => r.eligible.find((c) => c.name === name)?.relevance?.tier ?? 'not eligible';
    expect(tier('Tom Scratch')).toBe('direct');
    expect(tier('Ana Ortiz')).toBe('direct');
    expect(tier('Ben Fleet')).toBe('related');
    expect(r.eligible.find((c) => c.name === 'Ben Fleet')!.relevance!.why).toBe('runs the fleet, adjacent to the Yard Operations Manager the posting names');
    expect(r.hypothesis?.factLabel).toBe('a job posting for a Yard Operations Manager');
    expect(r.focus).toBe('the Yard Operations Manager posting at Tulsa');
    // Without the declared approach the posting's words (trailer moves) make the fleet direct: the approach is what changed.
    const eventRead = resolve({ hypothesis: { ...jobLed, approach: null, postingRole: null }, candidates: [tom, ana, ben, dee, pam] });
    expect(eventRead.eligible.find((c) => c.name === 'Ben Fleet')?.relevance?.tier).toBe('direct');
  });
  it('the site operator AT the posting\'s site is the hiring manager: eligible and recommended for the job-led thesis on thesis relevance; under the event-led doctrine a site operator is not the owner', () => {
    const r = resolve({ hypothesis: jobLed, candidates: [tom, ana, ben, dee, pam] });
    expect(r.eligible.map((c) => c.name)).toEqual(['Ana Ortiz', 'Tom Scratch', 'Ben Fleet']);
    expect(r.recommended).toMatchObject({ key: 'gap:2', firstDifference: 'thesis relevance' });
    expect(r.recommended!.why).toContain('at Tulsa, the site it names');
    // A site operator at ANOTHER site is not eligible (related, capped by the site), and procurement is not an operator.
    expect(r.others.flatMap((o) => o.names)).toEqual(expect.arrayContaining(['Dee Dallas', 'Pam Proc']));
    const eventRead = resolve({ hypothesis: { ...jobLed, approach: 'event_led', postingRole: null }, candidates: [tom, ana, ben, dee, pam] });
    expect(eventRead.eligible.map((c) => c.name)).not.toContain('Ana Ortiz');
  });
});

describe('R32 scope: site and division', () => {
  it('the site a fact names is read from the fact; a state, a region or a month is never a site', () => {
    expect(factSite(POSTING, 'PepsiCo')).toBe('Tulsa');
    expect(factSite('PepsiCo opened a new distribution center in Tulsa, Oklahoma.', 'PepsiCo')).toBe('Tulsa');
    expect(factSite('The company said the Fort Worth plant will close.', 'PepsiCo')).toBe('Fort Worth');
    expect(factSite('Kroger will open a new plant in Texas.', 'Kroger')).toBeNull();
    expect(factSite('PBNA is consolidating its network in North America.', 'PepsiCo')).toBeNull();
    expect(personSite('DC Manager, Dallas', null)).toBe('Dallas');
    expect(personSite('Distribution Center Manager', 'Dallas, Texas, United States')).toBe('Dallas');
    // A network title is never read as a site from where the person is based.
    expect(personSite('Director of Transportation', 'Purchase, New York, United States')).toBeNull();
    expect(personSite('Director, Transportation', null)).toBeNull();
  });
  it('a person who runs another site is related, never direct; the same site stays direct; a network remit is not capped', () => {
    const fact = { observation: 'PepsiCo opened a new distribution center in Tulsa, Oklahoma.' };
    const other = thesisRelevance('Distribution Center Manager', fact, { accountName: 'PepsiCo', location: 'Dallas, Texas, United States' });
    expect(other).toMatchObject({ tier: 'related', cappedBy: 'site' });
    expect(other.why).toContain('but they run Dallas, and the fact names Tulsa');
    expect(thesisRelevance('Distribution Center Manager', fact, { accountName: 'PepsiCo', location: 'Tulsa, Oklahoma, United States' })).toMatchObject({ tier: 'direct', siteMatch: true });
    expect(thesisRelevance('Director of Distribution', fact, { accountName: 'PepsiCo', location: 'Purchase, New York, United States' }).tier).toBe('direct');
  });
  it('a PBNA fact is never attributed to a Frito-Lay contact; a PBNA contact stays direct; a contact with no division on record keeps the tier and the reason says whose fact it is', () => {
    const fact = { id: 'h-pbna', status: 'approved', primaryPersonaId: null, observation: 'PBNA opened a new distribution center in Denver, Colorado [S:f1].' };
    const r = resolve({
      hypothesis: fact,
      candidates: [gap(11, 'Fran Lay', 'Director of Transportation, Frito-Lay'), gap(12, 'Bev North', 'Director of Transportation', { company: 'PepsiCo Beverages North America' }), gap(13, 'Cory Porate', 'Director of Transportation')],
    });
    const rel = (name: string) => r.eligible.find((c) => c.name === name)!.relevance!;
    expect(rel('Fran Lay')).toMatchObject({ tier: 'related', cappedBy: 'division' });
    expect(rel('Fran Lay').why).toContain("but they sit in Frito-Lay, and the fact is PBNA's");
    expect(rel('Bev North').tier).toBe('direct');
    expect(rel('Cory Porate').tier).toBe('direct');
    expect(rel('Cory Porate').why).toContain("(the fact is PBNA's; their division is not on record)");
    expect(r.eligible[r.eligible.length - 1].name).toBe('Fran Lay');
  });
});

describe('R32 precedence: warm routes and the open deal before cold alternatives', () => {
  it('a relationship, then a contact on the open deal, then the cold operators; the lead is said in words on the open deal', () => {
    const cold = gap(21, 'Vic Prime', 'VP Transportation');
    const deal = gap(22, 'Dot Deal', 'Transportation Manager', { openDeal: 'PepsiCo Tulsa pilot' });
    const warm = gap(23, 'Wes Warm', 'Transportation Manager', { relationship: 'met at Inland26' });
    for (const purpose of ['COLD_FIRST_TOUCH', 'HYPOTHESIS_ACTIVATION'] as const) {
      const r = resolve({ purpose, hypothesis: purpose === 'HYPOTHESIS_ACTIVATION' ? jobLed : null, candidates: [cold, deal, warm] });
      expect(r.eligible.map((c) => c.name)).toEqual(['Wes Warm', 'Dot Deal', 'Vic Prime']);
    }
    const r = resolve({ purpose: 'HYPOTHESIS_ACTIVATION', hypothesis: jobLed, candidates: [cold, deal] });
    expect(r.recommended).toMatchObject({ key: 'gap:22', firstDifference: 'open deal' });
    expect(r.recommended!.why).toContain('they are a contact on the open deal (PepsiCo Tulsa pilot)');
    expect(r.eligible[0].reasons).toContain('On the open deal: PepsiCo Tulsa pilot.');
    const stack = buildPeopleStack(r, { chosenKey: null });
    expect(stack.rows[0].leadOver?.text).toBe('Dot is a contact on the open deal (PepsiCo Tulsa pilot); Vic is not.');
  });
});

describe('R32 the choice: recorded, small, and one question only when it blocks', () => {
  it("Tom's recorded choice persists: he leads the stack as chosen while Ana carries the recommendation as a badge; nobody is preselected", () => {
    const r = resolve({ hypothesis: jobLed, candidates: [tom, ana, ben, dee, pam] });
    expect(r.preselected).toBeNull();
    const stack = buildPeopleStack(r, { chosenKey: 'gap:1', chosenBy: 'casey@yardflow.ai' });
    expect(stack.rows[0]).toMatchObject({ name: 'Tom Scratch', chosen: true, chosenBy: 'casey@yardflow.ai', badge: null });
    expect(stack.rows.find((x) => x.name === 'Ana Ortiz')).toMatchObject({ chosen: false, badge: 'Recommended: thesis relevance' });
    expect(stack.chosenMissing).toBeNull();
    expect(stack.question).toBeNull();
  });
  it('only a material invalidation drops the choice, and it is said: Tom left the company', () => {
    const left = { ...tom, employment: { state: 'LEFT_COMPANY_CONFIRMED', why: 'Now at Acme.', decidedBy: [], elsewhere: { company: 'Acme', title: 'VP' }, verifyNeeded: false } as unknown as OwnerCandidateInput['employment'] };
    const r = resolve({ hypothesis: jobLed, candidates: [left, ana, ben] });
    const stack = buildPeopleStack(r, { chosenKey: 'gap:1', chosenBy: 'casey@yardflow.ai' });
    expect(stack.rows.some((x) => x.chosen)).toBe(false);
    expect(stack.chosenMissing).toMatch(/Your chosen person is no longer among the eligible people at PepsiCo/);
  });
  it('a large map (NFI, seven eligible) yields three rows, each with its own reason, and the rest one counted step away', () => {
    const titles = ['VP Network Operations', 'Director of Linehaul', 'Director of Terminal Operations', 'VP Operations Planning and Engineering', 'Director of Hub Operations', 'Senior Director Network Operations, East', 'Director of Sortation'];
    const people = titles.map((t, k) => gap(40 + k, `Person ${String.fromCharCode(65 + k)}`, t, { location: ['Cherry Hill, New Jersey', 'Ontario, California', 'Dallas, Texas', 'Camden, New Jersey', 'Chicago, Illinois', 'Atlanta, Georgia', 'Memphis, Tennessee'][k] }));
    const r = resolveOwner({ account: { name: 'NFI', entityType: '3pl' as never }, purpose: 'COLD_FIRST_TOUCH', candidates: people, hubspot: hub, now: NOW });
    expect(r.eligible.length).toBeGreaterThanOrEqual(6);
    const stack = buildPeopleStack(r, { chosenKey: null });
    expect(stack.rows).toHaveLength(3);
    expect(stack.more).toHaveLength(r.eligible.length - 3);
    expect(stack.showAllLabel).toMatch(new RegExp(`^Show ${r.eligible.length - 3} more on record`));
    expect(new Set(stack.rows.map((x) => x.reason)).size).toBe(3);
    expect(stack.rows.every((x) => x.reason.length > 0 && !/^Nothing on record/.test(x.reason))).toBe(true);
  });
  it('a genuine tie asks ONE concrete question, only when choosing blocks the next action; never with a choice recorded, never when the order is evidence', () => {
    const a = gap(31, 'Ann Same', 'Director of Transportation');
    const b = gap(32, 'Bob Same', 'Director of Transportation');
    const r = resolve({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [a, b] });
    expect(buildPeopleStack(r, { chosenKey: null }).question).toBe('Who owns transportation and the yards at PepsiCo: Ann Same or Bob Same?');
    expect(buildPeopleStack(r, { chosenKey: null, choiceBlocks: false }).question).toBeNull();
    expect(buildPeopleStack(r, { chosenKey: 'gap:31', chosenBy: 'casey@yardflow.ai' }).question).toBeNull();
    const ranked = resolve({ hypothesis: jobLed, candidates: [tom, ben] });
    expect(buildPeopleStack(ranked, { chosenKey: null }).question).toBeNull();
    const tiedOnPosting = resolve({ hypothesis: jobLed, candidates: [a, b] });
    expect(buildPeopleStack(tiedOnPosting, { chosenKey: null }).question).toBe('Who owns the Yard Operations Manager posting at Tulsa at PepsiCo: Ann Same or Bob Same?');
  });
});

describe('R32 the loader carries the approach, the posting role and the open deal', () => {
  it('a job-led thesis is read with its declared approach and the role its primary claim names; a persona on the open deal carries it; nothing is written', async () => {
    const writes: string[] = [];
    const prisma = {
      account: { findUnique: vi.fn(async () => ({ name: 'PepsiCo', vertical: 'CPG', hubspot_company_id: null, parent_brand: null })) },
      prospectingHypothesis: {
        findUnique: vi.fn(async () => ({
          id: 'h-job', account_name: 'PepsiCo', status: 'approved', primary_persona_id: null, observation: POSTING, problem_hypothesis: 'My guess is the yard is where the day gets lost.', problem_family: 'yard_execution',
          metadata: { approach: 'job_procurement_led' },
          signals: [{ signal: { claim_class: 'JOB_POSTING', metadata: { claimAttributes: { role: 'Yard Operations Manager', postingStatus: 'open' } } } }],
        })),
      },
      persona: { findMany: vi.fn(async ({ where }: { where: { account_name?: string } }) => (where.account_name ? [{ id: 1, account_name: 'PepsiCo', name: 'Tom Scratch', title: 'Senior Director, Transportation', email: 'tom@example.test', do_not_contact: false, email_status: 'valid', hubspot_contact_id: '900' }, { id: 3, account_name: 'PepsiCo', name: 'Ben Fleet', title: 'VP Fleet', email: 'ben@example.test', do_not_contact: false, email_status: 'valid', hubspot_contact_id: null }] : [])), update: vi.fn(async () => { writes.push('persona.update'); }) },
      gapAccountAlias: { findMany: vi.fn(async () => []) },
      accountContactCandidate: { findMany: vi.fn(async () => []) },
      gapWorkSourceMember: { findMany: vi.fn(async () => []) },
      unsubscribedEmail: { findMany: vi.fn(async () => []) },
      contactEnrichment: { findMany: vi.fn(async () => []) },
      conversationDisposition: { findMany: vi.fn(async () => []) },
      canonicalAccountLink: { findMany: vi.fn(async () => []) },
      gapAuditEvent: { create: vi.fn(async () => { writes.push('audit.create'); }), findMany: vi.fn(async () => []) },
    };
    const r = await loadOwnerResolution(prisma as never, { accountName: 'PepsiCo', purpose: 'HYPOTHESIS_ACTIVATION', hypothesisId: 'h-job', now: NOW, openDeals: [{ name: 'PepsiCo Tulsa pilot', contactIds: ['900'] }] }, { company: { configured: () => true } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.focus).toBe('the Yard Operations Manager posting at Tulsa');
    expect(r.resolution.hypothesis?.factLabel).toBe('a job posting for a Yard Operations Manager');
    const tomRow = r.resolution.eligible.find((c) => c.name === 'Tom Scratch')!;
    expect(tomRow.openDeal).toBe('PepsiCo Tulsa pilot');
    expect(r.resolution.eligible[0].name).toBe('Tom Scratch');
    expect(r.resolution.eligible.find((c) => c.name === 'Ben Fleet')?.relevance?.tier).toBe('related');
    expect(writes).toEqual([]);
  });
});

describe('R32 the anchor: the "fits better" caution reads the job-led context', () => {
  const job = { id: 'f-job', quote: 'PepsiCo is hiring a Yard Operations Manager at its Tulsa distribution center to manage trailer moves and dock appointments.', url: 'https://www.pepsicojobs.com/yard-ops-tulsa', title: 'Yard Operations Manager', publishedAt: '2026-09-28T00:00:00Z', expiresAt: null, continuity: 'event' as const, currentness: null, claimClass: 'JOB_POSTING' };
  const hyp = { id: 'h-job', status: 'approved', observation: `${job.quote.replace(/\.$/, '')} [S:f-job].`, problem: 'My guess is the yard is where the day gets lost at Tulsa.', rootCauses: [], impacts: [], falsification: ['Is the role still open?'], whatANoMeans: 'The yard runs. A no closes it.', primarySignalId: 'f-job', reviewedAt: '2026-10-01T00:00:00Z', approach: 'job_procurement_led' };
  const personas = [
    { id: 61, name: 'Pat Planner', title: 'Director of Operations Planning and Engineering', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    { id: 62, name: 'Ben Fleet', title: 'VP Fleet', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    { id: 63, name: 'Tom Scratch', title: 'Senior Director, Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
  ];
  const ctx: AccountContext = {
    relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
    engagement: projectEngagement([], NOW),
    history: [], assets: [], legacyNote: null,
  };
  const inputsWith = (h: typeof hyp): AccountInputs => ({
    account: { name: 'PepsiCo', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '2' },
    aliases: [], domains: ['pepsico.com'], siblings: [], watched: true, watchReasons: [],
    facts: [job], signals: [], lastResearch: null,
    hypotheses: [h], bids: [], personas, candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  } as unknown as AccountInputs);
  const anchorFor = (i: AccountInputs, personaId: number) => {
    const brief = buildAccountBrief(i, NOW);
    const v = projectNow(brief, ctx, i, NOW);
    const eligible = i.personas.map((p) => ({ key: `gap:${p.id}`, personaId: p.id, name: p.name, title: p.title }));
    const state = projectPursuitState({ accountName: 'PepsiCo', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    const story = projectStory({ accountName: 'PepsiCo', now: NOW, state, brief, inputs: i, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] });
    const p = i.personas.find((x) => x.id === personaId)!;
    return projectAnchor({ accountName: 'PepsiCo', person: { personaId: p.id, name: p.name, title: p.title }, people: i.personas.map((x) => ({ personaId: x.id, name: x.name, title: x.title })), brief, inputs: i, story, anchorChoice: null, privateLine: null, sendable: new Set(['h-job']), now: NOW });
  };
  it('a chosen person outside the posting\'s function gets the caution naming the person whose function it is (not the fleet, which is only adjacent)', () => {
    const a = anchorFor(inputsWith(hyp), 61);
    expect(a.primary?.hypothesisId).toBe('h-job');
    expect(a.primary?.relevance.tier).toBe('none');
    expect(a.primary?.factLabel).toBe('a job posting for a Yard Operations Manager');
    expect(a.fitsBetter?.name).toBe('Tom Scratch');
    expect(a.whyTheyCare?.text).toContain('Tom Scratch (Senior Director, Transportation) fits it');
  });
  it('the same thesis read without its approach is the event-led reading (the planner is adjacent there, so no caution): the approach is what drives it', () => {
    const a = anchorFor(inputsWith({ ...hyp, approach: 'event_led' }), 61);
    expect(a.primary?.relevance.tier).toBe('related');
    expect(a.fitsBetter).toBeNull();
  });
});
