/**
 * callBrief (GAP Prospecting OS, Sprint 4, S4-T3). Pins: the persona's
 * active hypothesis wins over its newer draft and the account's active one
 * is the fallback; the FACT block carries the observation and the signals
 * with urls; wouldProveWrong is what_a_no_means plus contrary_evidence; the
 * last three dispositions and only the open (unconfirmed, unsuperseded)
 * BIDs; suggested questions come from the falsification lines (made
 * questions) because the catalog carries none, and from the catalog's
 * problem and causes when the hypothesis has no lines.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { asQuestion, callBrief, catalogQuestions, questionsFromCatalog, suggestedQuestionsFor } from '@/lib/gap/replies/brief';

/* eslint-disable @typescript-eslint/no-explicit-any */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const T = (n: number) => new Date(Date.UTC(2026, 8, 20 + n, 12));

const PERSONA = {
  id: 7, persona_id: 'acme:jordan', name: 'Jordan Lee', title: 'Director of Yard Ops', email: 'Jordan@Acme.example', phone: '+1 555 0100',
  role_in_deal: 'champion', do_not_contact: false, account_name: 'Acme Logistics',
  account: { name: 'Acme Logistics', hubspot_company_id: 'c-1', tier: 'Tier 1', vertical: 'CPG' },
};

function hyp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'H1', status: 'active', problem_family: 'hidden_capacity', confidence: 62,
    observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
    problem_hypothesis: 'My guess is the new DC runs gate checks on paper.',
    root_cause_hypotheses: ['Paper check-in'], impact_hypotheses: ['Fewer turns'], why_now: 'The Ohio site opened in August.',
    falsification_questions: ['Do drivers check in at a guard shack', 'Who owns dwell today?'],
    what_a_no_means: 'The gate is already digital.', contrary_evidence: null, predicted_buyer_language: 'trailers go missing',
    created_at: T(1),
    signals: [
      { role: 'primary', signal: { id: 'S1', title: 'Second DC opens', source_kind: 'pounce_trigger', evidence_url: 'https://x/news', evidence_text: null, observed_at: T(0) } },
      { role: 'supporting', signal: { id: 'S2', title: 'Trailer counts', source_kind: 'manual', evidence_url: null, evidence_text: 'Operator note', observed_at: null } },
    ],
    ...overrides,
  };
}

function makePrisma() {
  return {
    persona: { findUnique: asyncSpy(async () => PERSONA) },
    prospectingHypothesis: {
      findMany: asyncSpy(async () => [hyp({ id: 'H2', status: 'draft', created_at: T(3) }), hyp()]),
      findFirst: asyncSpy(async () => null),
    },
    conversationDisposition: {
      findMany: asyncSpy(async () => [
        { id: 'D3', channel: 'email', response_class: 'timing', buyer_language: null, human_confirmed: true, created_at: T(3) },
        { id: 'D2', channel: 'call', response_class: 'voicemail', buyer_language: null, human_confirmed: true, created_at: T(2) },
        { id: 'D1', channel: 'call', response_class: 'no_answer', buyer_language: null, human_confirmed: false, created_at: T(1) },
      ]),
    },
    buyerInputData: {
      findMany: asyncSpy(async () => [
        { id: 'B1', type: 'metric', raw_buyer_language: '40 min', human_confirmed: true, supersedes_id: null, captured_at: T(1) },
        { id: 'B2', type: 'metric', raw_buyer_language: '45 min', human_confirmed: false, supersedes_id: 'B1', captured_at: T(2) },
        { id: 'B3', type: 'objection', raw_buyer_language: 'we have a YMS', human_confirmed: false, supersedes_id: null, captured_at: T(2) },
        { id: 'B4', type: 'objection', raw_buyer_language: 'we had a YMS', human_confirmed: false, supersedes_id: 'B3', captured_at: T(3) },
      ]),
    },
  };
}

let prisma: ReturnType<typeof makePrisma>;

beforeEach(() => {
  prisma = makePrisma();
});

describe('pure question helpers', () => {
  it('asQuestion adds a trailing ? and strips a period', () => {
    expect(asQuestion('Do drivers check in at a guard shack.')).toBe('Do drivers check in at a guard shack?');
    expect(asQuestion('Who owns dwell today?')).toBe('Who owns dwell today?');
  });

  it('catalogQuestions is empty today (the catalog carries no questions) and questionsFromCatalog derives from problem and causes', () => {
    expect(catalogQuestions('hidden_capacity')).toEqual([]);
    expect(catalogQuestions('nope')).toEqual([]);
    const q = questionsFromCatalog('network_standardization');
    expect(q[0]).toBe('Does this describe your yards today: material operating variation across facilities?');
    expect(q[1]).toBe('Is it local processes per site?');
    expect(q).toHaveLength(4);
  });

  it('suggestedQuestionsFor prefers falsification lines, falls back to the catalog, and is empty without a hypothesis', () => {
    expect(suggestedQuestionsFor({ problemFamily: 'hidden_capacity', falsificationQuestions: ['Do drivers check in at a guard shack'] })).toEqual(['Do drivers check in at a guard shack?']);
    expect(suggestedQuestionsFor({ problemFamily: 'hidden_capacity', falsificationQuestions: [] })[0]).toMatch(/^Does this describe your yards today: /);
    expect(suggestedQuestionsFor(null)).toEqual([]);
  });
});

describe('callBrief', () => {
  it('null for an unknown persona', async () => {
    prisma.persona.findUnique.mockResolvedValueOnce(null);
    expect(await callBrief(prisma, 404)).toBeNull();
  });

  it('assembles the persona, account, the ACTIVE hypothesis (not the newer draft) with FACT and HYPOTHESIS blocks, dispositions, open BIDs and questions', async () => {
    const brief = await callBrief(prisma, 7);
    expect(brief).not.toBeNull();
    expect(brief!.persona).toEqual({
      id: 7, personaKey: 'acme:jordan', name: 'Jordan Lee', title: 'Director of Yard Ops', email: 'jordan@acme.example', phone: '+1 555 0100', role: 'champion', doNotContact: false,
    });
    expect(brief!.account).toEqual({ name: 'Acme Logistics', hubspotCompanyId: 'c-1', tier: 'Tier 1', vertical: 'CPG' });
    expect(brief!.hypothesis).toMatchObject({
      id: 'H1',
      status: 'active',
      problemFamily: 'hidden_capacity',
      confidence: 62,
      observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
      problemHypothesis: 'My guess is the new DC runs gate checks on paper.',
      rootCauseHypotheses: ['Paper check-in'],
      impactHypotheses: ['Fewer turns'],
      whyNow: 'The Ohio site opened in August.',
      falsificationQuestions: ['Do drivers check in at a guard shack', 'Who owns dwell today?'],
      whatANoMeans: 'The gate is already digital.',
      contraryEvidence: null,
      wouldProveWrong: ['The gate is already digital.'],
    });
    expect(brief!.hypothesis!.signals).toEqual([
      { id: 'S1', title: 'Second DC opens', source_kind: 'pounce_trigger', evidence_url: 'https://x/news', evidence_text: null, observed_at: T(0).toISOString() },
      { id: 'S2', title: 'Trailer counts', source_kind: 'manual', evidence_url: null, evidence_text: 'Operator note', observed_at: null },
    ]);
    expect(brief!.lastDispositions.map((d) => d.id)).toEqual(['D3', 'D2', 'D1']);
    expect(brief!.lastDispositions[0]).toEqual({ id: 'D3', channel: 'email', responseClass: 'timing', buyerLanguage: null, humanConfirmed: true, createdAt: T(3).toISOString() });
    expect(prisma.conversationDisposition.findMany.mock.calls[0][0]).toMatchObject({ take: 3, where: { OR: [{ persona_id: 7 }, { contact_email: 'jordan@acme.example' }] } });
    // B1 is confirmed (not open) and superseded; B2 corrects B1 and is open; B3 is superseded by B4; B4 is open.
    expect(brief!.openBids.map((b) => b.id)).toEqual(['B2', 'B4']);
    expect(brief!.openBids[0]).toEqual({ id: 'B2', type: 'metric', rawBuyerLanguage: '45 min', humanConfirmed: false, capturedAt: T(2).toISOString() });
    expect(brief!.suggestedQuestions).toEqual(['Do drivers check in at a guard shack?', 'Who owns dwell today?']);
  });

  it('falls back to the account\'s active hypothesis when the persona has none, and to null with no BIDs when the account has none', async () => {
    prisma.prospectingHypothesis.findMany.mockResolvedValueOnce([]);
    prisma.prospectingHypothesis.findFirst.mockResolvedValueOnce(hyp({ id: 'H9', falsification_questions: [] }));
    let brief = await callBrief(prisma, 7);
    expect(brief!.hypothesis!.id).toBe('H9');
    expect(prisma.prospectingHypothesis.findFirst.mock.calls[0][0].where).toEqual({ account_name: 'Acme Logistics', status: 'active' });
    expect(brief!.suggestedQuestions[0]).toMatch(/^Does this describe your yards today: /);

    prisma = makePrisma();
    prisma.prospectingHypothesis.findMany.mockResolvedValueOnce([]);
    brief = await callBrief(prisma, 7);
    expect(brief!.hypothesis).toBeNull();
    expect(brief!.openBids).toEqual([]);
    expect(brief!.suggestedQuestions).toEqual([]);
    expect(prisma.buyerInputData.findMany).not.toHaveBeenCalled();
  });

  it('the newest hypothesis is used when none is active', async () => {
    prisma.prospectingHypothesis.findMany.mockResolvedValueOnce([hyp({ id: 'H2', status: 'draft', created_at: T(3) }), hyp({ id: 'H1', status: 'approved' })]);
    const brief = await callBrief(prisma, 7);
    expect(brief!.hypothesis!.id).toBe('H2');
  });
});
