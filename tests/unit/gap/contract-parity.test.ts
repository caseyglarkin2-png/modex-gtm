/**
 * UI-to-route contract parity (GAP Prospecting OS, Sprint 4, S4-T7).
 *
 * The Sprint 4 UI (S4-T5) was built against the spec's contract while the
 * routes (S4-T3) landed in parallel. The routes are the truth. This file
 * pins the UI side to them so a drift fails here, never on a page:
 *
 *   1. the disposition body the form builds parses under the route's zod
 *      schema (exercised through the real handler with the service mocked)
 *      for the two fixture bodies: a call-mode voicemail one-tap with the
 *      source id the page mints, and an email problem_confirmed with a
 *      business_problem BID, a root cause and the adopted AI suggestion id;
 *   2. a BID body parses under the bids route;
 *   3. a sample list item from list.ts satisfies the client's ReplyItem
 *      (runtime keys and types, plus a compile-time assignability check);
 *   4. a sample brief from brief.ts satisfies the client's CallBrief;
 *   5. the form's local rules (call-only classes, the quote rule, the
 *      objection rule, root cause and impact only with a problem class)
 *      agree with `validateDisposition` in disposition/model.ts over a table
 *      of inputs, and the constant lists they are built from are equal;
 *   6. the result and suggestion shapes the client types match what the
 *      services return.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedDisposition, mockedBid } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedDisposition: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedBid: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/disposition/service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/gap/disposition/service')>();
  return { ...original, recordDisposition: mockedDisposition };
});
vi.mock('@/lib/gap/bid/service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/gap/bid/service')>();
  return { ...original, recordBid: mockedBid };
});

const { POST: postDispositions } = await import('@/app/api/gap/dispositions/route');
const { POST: postBids } = await import('@/app/api/gap/bids/route');

import {
  DISPOSITION_SOURCE_KINDS as SERVICE_SOURCE_KINDS,
  type DispositionRefusalEntry,
  type RecordDispositionResult,
  type RecordedEffects,
} from '@/lib/gap/disposition/service';
import type { RecordBidBody } from '@/lib/gap/bid/service';
import {
  CALL_ONLY_RESPONSE_CLASSES,
  OBJECTION_REQUIRED_RESPONSE_CLASSES,
  QUOTE_REQUIRED_RESPONSE_CLASSES,
  RESOLVING_RESPONSE_CLASSES,
  validateDisposition,
} from '@/lib/gap/disposition/model';
import { callBrief, type CallBrief as ServiceCallBrief } from '@/lib/gap/replies/brief';
import { listReplies, suggestionFromRow, type ReplyItem as ServiceReplyItem, type StoredSuggestion } from '@/lib/gap/replies/list';
import type { SuggestResult as ServiceSuggestResult } from '@/lib/gap/replies/suggest';
import { RESPONSE_CLASSES, type Channel, type ResponseClass } from '@/lib/gap/taxonomy';
import {
  DISPOSITION_SOURCE_KINDS as CLIENT_SOURCE_KINDS,
  type BidBody,
  type BidResult,
  type CallBrief as ClientCallBrief,
  type DispositionBody,
  type DispositionEffects,
  type DispositionRefusal,
  type DispositionResult,
  type ReplyItem as ClientReplyItem,
  type ReplySuggestion,
  type SuggestResult as ClientSuggestResult,
} from '@/lib/gap/ui/gap-api-client';
import {
  CALL_ONLY_CLASSES,
  OBJECTION_REQUIRED_CLASSES,
  PROBLEM_CLASSES,
  QUOTE_REQUIRED_CLASSES,
  buildDispositionBody,
  emptyDraft,
  validateDraft,
  type DispositionDraft,
  type DispositionPrefill,
} from '@/components/gap/disposition-form';
import { callSourceId, personaIdParam } from '@/app/gap/call/[personaId]/call-mode';

/* eslint-disable @typescript-eslint/no-explicit-any */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;

const SERVICE_OK = {
  ok: true,
  dispositionId: 'D1',
  bidIds: ['B1'],
  humanConfirmed: true,
  effects: { stopped: ['E1'], unsubscribed: false, resolution: { outcome: 'confirmed', confidence: 85 }, mirrored: false },
  refusals: [{ step: 'mirror', reason: 'skipped:gap_mirror_disabled' }],
};
const BID_OK = { ok: true, bidId: 'B9', humanConfirmed: true, supersedesId: null };

function request(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  delete process.env.CRON_SECRET;
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedDisposition.mockReset();
  mockedDisposition.mockResolvedValue(SERVICE_OK);
  mockedBid.mockReset();
  mockedBid.mockResolvedValue(BID_OK);
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

// ---------------------------------------------------------------------------
// 1 and 2: the bodies the UI builds parse under the routes' zod schemas
// ---------------------------------------------------------------------------

describe('disposition bodies the form builds parse under the route schema', () => {
  it('voicemail one-tap from call mode: the minted call source id, channel call, no BID', async () => {
    const sourceId = callSourceId('41', () => 1_700_000_000_000);
    expect(sourceId).toMatch(/^call:41:1700000000000:[A-Za-z0-9-]+$/);
    const prefill: DispositionPrefill = {
      hypothesisId: 'hyp_1',
      personaId: personaIdParam('41'),
      contactEmail: 'Jordan@Acme.example',
      channel: 'call',
      source: { kind: 'call', id: sourceId },
      problemFamily: 'hidden_capacity',
    };
    const body = buildDispositionBody(prefill, { ...emptyDraft(), responseClass: 'voicemail' });
    expect(body).toEqual({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'call',
      responseClass: 'voicemail',
      source: { kind: 'call', id: sourceId },
    });

    const res = await postDispositions(request('http://localhost/api/gap/dispositions', body));
    expect(res.status).toBe(201);
    expect(mockedDisposition).toHaveBeenCalledTimes(1);
    const received = mockedDisposition.mock.calls[0][1];
    expect(received).toMatchObject({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'call',
      responseClass: 'voicemail',
      source: { kind: 'call', id: sourceId },
      bids: undefined,
      aiSuggestionId: null,
      actor: SESSION.user.email,
      actorKind: 'human',
    });
  });

  it('email problem_confirmed from reply triage: quote, a business_problem BID, a root cause and the adopted AI suggestion id', async () => {
    const suggestion = suggestionFromRow({
      id: 'disp_ai_1',
      human_confirmed: false,
      created_by: 'ai',
      ai_suggested: { responseClass: 'problem_confirmed', bids: [{ type: 'business_problem', quote: 'trucks sit at the gate for an hour', why: 'names it' }], why: 'agrees' },
    });
    expect(suggestion?.id).toBe('disp_ai_1');
    // The triage page prefills aiSuggestionId from the item's suggestion id; the form carries it through.
    const prefill: DispositionPrefill = {
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'email',
      source: { kind: 'inbound_message', id: 'gm_18f2' },
      problemFamily: 'hidden_capacity',
      aiSuggestionId: suggestion?.id ?? null,
    };
    const draft: DispositionDraft = {
      ...emptyDraft(),
      responseClass: 'problem_confirmed',
      rootCauseClass: 'Gate waiting',
      buyerLanguage: 'Yes, trucks sit at the gate for an hour every morning.',
      bids: [{ type: 'business_problem', rawBuyerLanguage: 'trucks sit at the gate for an hour' }],
    };
    expect(validateDraft(draft, 'email')).toBeNull();
    const body = buildDispositionBody(prefill, draft);
    expect(body).toEqual({
      hypothesisId: 'hyp_1',
      personaId: 41,
      contactEmail: 'jordan@acme.example',
      channel: 'email',
      responseClass: 'problem_confirmed',
      rootCauseClass: 'Gate waiting',
      buyerLanguage: 'Yes, trucks sit at the gate for an hour every morning.',
      source: { kind: 'inbound_message', id: 'gm_18f2' },
      bids: [{ type: 'business_problem', rawBuyerLanguage: 'trucks sit at the gate for an hour' }],
      aiSuggestionId: 'disp_ai_1',
    });

    const res = await postDispositions(request('http://localhost/api/gap/dispositions', body));
    expect(res.status).toBe(201);
    const received = mockedDisposition.mock.calls[0][1];
    expect(received).toMatchObject({
      rootCauseClass: 'Gate waiting',
      impactClass: null,
      buyerLanguage: 'Yes, trucks sit at the gate for an hour every morning.',
      bids: [{ type: 'business_problem', rawBuyerLanguage: 'trucks sit at the gate for an hour' }],
      aiSuggestionId: 'disp_ai_1',
      resumeAt: null,
      referral: null,
    });
    // The 201 body is exactly the client's DispositionResult shape.
    const json = (await res.json()) as DispositionResult;
    expect(Object.keys(json).sort()).toEqual(['bidIds', 'dispositionId', 'effects', 'refusals']);
    expect(json.effects.resolution).toEqual({ outcome: 'confirmed', confidence: 85 });
    expect(json.refusals).toEqual([{ step: 'mirror', reason: 'skipped:gap_mirror_disabled' }]);
  });

  it('a body with a key the route does not know is refused (the schema is strict), so the client type must not widen', async () => {
    const body = { ...buildDispositionBody({ hypothesisId: 'h', contactEmail: 'a@b.c', channel: 'call', source: { kind: 'call', id: 'x' } }, { ...emptyDraft(), responseClass: 'voicemail' }), tam: 'in' };
    const res = await postDispositions(request('http://localhost/api/gap/dispositions', body));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
    expect(mockedDisposition).not.toHaveBeenCalled();
  });

  it('a BID body parses under the bids route and the 201 body is the client BidResult', async () => {
    const body: BidBody = {
      hypothesisId: 'hyp_1',
      contactEmail: 'jordan@acme.example',
      dispositionId: 'D1',
      type: 'metric',
      rawBuyerLanguage: '40 minutes a truck',
      numericValue: 40,
      unit: 'minutes',
      source: 'email',
    };
    const res = await postBids(request('http://localhost/api/gap/bids', body));
    expect(res.status).toBe(201);
    expect(mockedBid.mock.calls[0][1]).toMatchObject({ ...body, actor: SESSION.user.email, actorKind: 'human', supersedesId: null });
    const json = (await res.json()) as BidResult;
    expect(Object.keys(json).sort()).toEqual(['bidId', 'humanConfirmed', 'supersedesId']);
  });

  it('the client and the service name the same disposition source kinds', () => {
    expect([...CLIENT_SOURCE_KINDS]).toEqual([...SERVICE_SOURCE_KINDS]);
  });
});

// ---------------------------------------------------------------------------
// 3: a list item from list.ts is the client's ReplyItem
// ---------------------------------------------------------------------------

const T = (n: number) => new Date(Date.UTC(2026, 8, 23, 12, 0, n));

function listPrisma(dispositions: any[]) {
  return {
    sequenceEnrollment: {
      findMany: asyncSpy(async () => [
        { id: 'E1', to_email: 'jordan@acme.example', status: 'paused', hypothesis_id: 'H1', persona_id: 7, account_name: 'Acme Logistics', hubspot_contact_id: 'hs-7', enrolled_at: T(0) },
      ]),
    },
    persona: {
      findMany: asyncSpy(async () => [
        { id: 7, email: 'Jordan@Acme.example', account_name: 'Acme Logistics', hubspot_contact_id: 'hs-7', prospecting_hypotheses: [{ id: 'H1', status: 'active', problem_family: 'hidden_capacity', created_at: T(0) }] },
      ]),
    },
    inboundMessage: {
      findMany: asyncSpy(async () => [
        { id: 'm5', source: 'gmail', from_email: 'jordan@acme.example', subject: 'Re: yards', body_text: null, body_html: '<p>Yes we <b>lose</b> trailers.</p>', snippet: null, received_at: T(5) },
      ]),
    },
    conversationDisposition: { findMany: asyncSpy(async () => dispositions) },
  };
}

/** Every key of the client's ReplyItem and the runtime check each must pass. Adding a key to the client type without a route field fails here. */
const REPLY_ITEM_CHECKS: Record<keyof ClientReplyItem, (v: unknown) => boolean> = {
  id: (v) => typeof v === 'string',
  source: (v) => typeof v === 'object' && v !== null && ['inbound_message', 'hubspot_engagement'].includes((v as any).kind) && typeof (v as any).id === 'string',
  contactEmail: (v) => typeof v === 'string',
  personaId: (v) => v === null || typeof v === 'number',
  accountName: (v) => typeof v === 'string',
  hypothesisId: (v) => typeof v === 'string',
  hypothesisTitle: (v) => v === null || typeof v === 'string',
  subject: (v) => v === null || typeof v === 'string',
  snippet: (v) => typeof v === 'string' && !/<[^>]+>/.test(v),
  receivedAt: (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)),
  enrollmentId: (v) => v === null || typeof v === 'string',
  enrollmentStatus: (v) => v === null || typeof v === 'string',
  suggestion: (v) => v === undefined || v === null || (typeof (v as any).id === 'string' && typeof (v as any).responseClass === 'string' && Array.isArray((v as any).bids) && typeof (v as any).why === 'string'),
  dispositionId: (v) => v === undefined || v === null || typeof v === 'string',
};
const OPTIONAL_REPLY_ITEM_KEYS: ReadonlySet<keyof ClientReplyItem> = new Set(['suggestion', 'dispositionId']);

describe('a listReplies item satisfies the client ReplyItem', () => {
  it('undispositioned with an AI suggestion: every client key is present with the right shape, and the source id is the inbound id', async () => {
    const page = await listReplies(listPrisma([
      { id: 'disp_ai_1', source_kind: 'inbound_message', source_id: 'm5', human_confirmed: false, created_by: 'ai', ai_suggested: { responseClass: 'timing', bids: [], why: 'says Q1' } },
    ]));
    expect(page.items).toHaveLength(1);
    const item = page.items[0];
    for (const key of Object.keys(REPLY_ITEM_CHECKS) as Array<keyof ClientReplyItem>) {
      if (!(key in item) && !OPTIONAL_REPLY_ITEM_KEYS.has(key)) throw new Error(`route item lacks client key ${key}`);
      expect(REPLY_ITEM_CHECKS[key](item[key]), `key ${key} = ${JSON.stringify(item[key])}`).toBe(true);
    }
    // No route key the client does not know about (a new route field is added to the client on purpose, not by accident).
    expect(Object.keys(item).filter((k) => !(k in REPLY_ITEM_CHECKS))).toEqual([]);
    expect(item.source).toEqual({ kind: 'inbound_message', id: 'm5' });
    expect(item.snippet).toBe('Yes we lose trailers.');
    expect(item.hypothesisTitle).toBe('hidden_capacity');
    expect(item.enrollmentStatus).toBe('paused');
    expect(item.personaId).toBe(7);
    expect(item.suggestion?.id).toBe('disp_ai_1');
    const asClient: ClientReplyItem = item;
    expect(asClient.suggestion?.id).toBe('disp_ai_1');
  });

  it('state=all carries dispositionId, which the client type declares optional', async () => {
    const page = await listReplies(listPrisma([{ id: 'D7', source_kind: 'inbound_message', source_id: 'm5', human_confirmed: true, created_by: 'casey', ai_suggested: null }]), { state: 'all' });
    expect(page.items[0].dispositionId).toBe('D7');
    expect(REPLY_ITEM_CHECKS.dispositionId(page.items[0].dispositionId)).toBe(true);
  });

  it('compile-time: the service item type is assignable to the client type, and the stored suggestion to ReplySuggestion', () => {
    expectTypeOf<ServiceReplyItem>().toMatchTypeOf<ClientReplyItem>();
    expectTypeOf<StoredSuggestion>().toMatchTypeOf<ReplySuggestion>();
    expectTypeOf<Extract<ServiceSuggestResult, { ok: true }>>().toMatchTypeOf<ClientSuggestResult>();
  });
});

// ---------------------------------------------------------------------------
// 4: a brief from brief.ts is the client's CallBrief
// ---------------------------------------------------------------------------

function briefPrisma() {
  const D = (n: number) => new Date(Date.UTC(2026, 8, 20 + n, 12));
  return {
    persona: {
      findUnique: asyncSpy(async () => ({
        id: 7, persona_id: 'acme:jordan', name: 'Jordan Lee', title: 'Director of Yard Ops', email: 'Jordan@Acme.example', phone: '+1 555 0100',
        role_in_deal: 'champion', do_not_contact: false, account_name: 'Acme Logistics',
        account: { name: 'Acme Logistics', hubspot_company_id: 'c-1', tier: 'Tier 1', vertical: 'CPG' },
      })),
    },
    prospectingHypothesis: {
      findMany: asyncSpy(async () => [
        {
          id: 'H1', status: 'active', problem_family: 'hidden_capacity', confidence: 62,
          observation: 'They opened a second DC in Ohio [S:S1].',
          problem_hypothesis: 'My guess is the new DC runs gate checks on paper.',
          root_cause_hypotheses: ['Paper check-in'], impact_hypotheses: ['Fewer turns'], why_now: 'August.',
          falsification_questions: ['Who owns dwell today?'],
          what_a_no_means: 'The gate is already digital.', contrary_evidence: null, predicted_buyer_language: 'trailers go missing',
          created_at: D(1),
          signals: [{ role: 'primary', signal: { id: 'S1', title: 'Second DC opens', source_kind: 'pounce_trigger', evidence_url: 'https://x/news', evidence_text: null, observed_at: D(0) } }],
        },
      ]),
      findFirst: asyncSpy(async () => null),
    },
    conversationDisposition: {
      findMany: asyncSpy(async () => [{ id: 'D2', channel: 'call', response_class: 'voicemail', buyer_language: null, human_confirmed: true, created_at: D(2) }]),
    },
    buyerInputData: {
      findMany: asyncSpy(async () => [{ id: 'B3', type: 'objection', raw_buyer_language: 'we have a YMS', human_confirmed: false, supersedes_id: null, captured_at: D(2) }]),
    },
  };
}

describe('a callBrief satisfies the client CallBrief', () => {
  it('runtime: the persona, account, hypothesis, disposition and BID keys are exactly the client keys', async () => {
    const brief = (await callBrief(briefPrisma(), 7)) as ServiceCallBrief;
    expect(Object.keys(brief).sort()).toEqual(['account', 'hypothesis', 'lastDispositions', 'openBids', 'persona', 'suggestedQuestions']);
    expect(Object.keys(brief.persona).sort()).toEqual(['doNotContact', 'email', 'id', 'name', 'personaKey', 'phone', 'role', 'title']);
    expect(Object.keys(brief.account).sort()).toEqual(['hubspotCompanyId', 'name', 'tier', 'vertical']);
    expect(Object.keys(brief.hypothesis!).sort()).toEqual([
      'confidence', 'contraryEvidence', 'falsificationQuestions', 'id', 'impactHypotheses', 'observation', 'predictedBuyerLanguage',
      'problemFamily', 'problemHypothesis', 'rootCauseHypotheses', 'signals', 'status', 'whatANoMeans', 'whyNow', 'wouldProveWrong',
    ]);
    expect(Object.keys(brief.hypothesis!.signals[0]).sort()).toEqual(['evidence_text', 'evidence_url', 'id', 'observed_at', 'source_kind', 'title']);
    expect(Object.keys(brief.lastDispositions[0]).sort()).toEqual(['buyerLanguage', 'channel', 'createdAt', 'humanConfirmed', 'id', 'responseClass']);
    expect(Object.keys(brief.openBids[0]).sort()).toEqual(['capturedAt', 'humanConfirmed', 'id', 'rawBuyerLanguage', 'type']);
    expect(brief.persona.id).toBe(7);
    expect(brief.account).toEqual({ name: 'Acme Logistics', hubspotCompanyId: 'c-1', tier: 'Tier 1', vertical: 'CPG' });
    expect(brief.openBids[0].humanConfirmed).toBe(false);
    const asClient: ClientCallBrief = brief;
    expect(asClient.persona.doNotContact).toBe(false);
  });

  it('compile-time: the service brief type is assignable to the client type', () => {
    expectTypeOf<ServiceCallBrief>().toMatchTypeOf<ClientCallBrief>();
  });
});

// ---------------------------------------------------------------------------
// 5: the form's local rules agree with validateDisposition
// ---------------------------------------------------------------------------

describe('form rules agree with the disposition model', () => {
  it('the constant lists the rules are built from are the same lists', () => {
    expect([...CALL_ONLY_CLASSES]).toEqual([...CALL_ONLY_RESPONSE_CLASSES]);
    expect([...QUOTE_REQUIRED_CLASSES]).toEqual([...QUOTE_REQUIRED_RESPONSE_CLASSES]);
    expect([...OBJECTION_REQUIRED_CLASSES]).toEqual([...OBJECTION_REQUIRED_RESPONSE_CLASSES]);
    expect([...PROBLEM_CLASSES]).toEqual([...RESOLVING_RESPONSE_CLASSES]);
  });

  const variants: Array<[label: string, patch: Partial<DispositionDraft>]> = [
    ['plain', {}],
    ['root cause', { rootCauseClass: 'Gate waiting' }],
    ['impact', { impactClass: 'Fewer turns' }],
    ['quote', { buyerLanguage: 'we lose trailers' }],
    ['objection', { objection: 'runs a YMS' }],
    ['quote + objection + root cause', { buyerLanguage: 'we lose trailers', objection: 'runs a YMS', rootCauseClass: 'Gate waiting' }],
  ];
  const channels: Channel[] = ['call', 'email', 'meeting', 'linkedin'];

  it('every class x channel x field variant: the form refuses exactly when the model refuses, with the same reason and field', () => {
    let compared = 0;
    for (const responseClass of RESPONSE_CLASSES as readonly ResponseClass[]) {
      for (const channel of channels) {
        for (const [label, patch] of variants) {
          const draft: DispositionDraft = { ...emptyDraft(), responseClass, ...patch };
          const form = validateDraft(draft, channel);
          const model = validateDisposition({
            contactEmail: 'jordan@acme.example',
            channel,
            responseClass,
            rootCauseClass: draft.rootCauseClass || null,
            impactClass: draft.impactClass || null,
            objection: draft.objection || null,
            buyerLanguage: draft.buyerLanguage || null,
          });
          const where = `${responseClass} / ${channel} / ${label}`;
          if (model.ok) {
            expect(form, where).toBeNull();
          } else {
            expect(form, where).not.toBeNull();
            expect(form!.reason, where).toBe(model.reason);
            expect(form!.field, where).toBe(model.field);
          }
          compared += 1;
        }
      }
    }
    expect(compared).toBe(RESPONSE_CLASSES.length * channels.length * variants.length);
  });
});

// ---------------------------------------------------------------------------
// 6: result shapes
// ---------------------------------------------------------------------------

describe('result and effects shapes', () => {
  it('compile-time: the service effects, refusal, BID body and ok result match the client types', () => {
    expectTypeOf<RecordedEffects>().toMatchTypeOf<DispositionEffects>();
    expectTypeOf<DispositionRefusalEntry>().toMatchTypeOf<DispositionRefusal>();
    expectTypeOf<RecordBidBody>().toMatchTypeOf<BidResult>();
    // The human branch of the service result (effects is a block, never 'none') is the client's DispositionResult.
    type HumanOk = Omit<Extract<RecordDispositionResult, { ok: true }>, 'effects' | 'ok' | 'humanConfirmed'> & { effects: RecordedEffects };
    expectTypeOf<HumanOk>().toMatchTypeOf<DispositionResult>();
  });

  it('runtime: a disposition body the client types allow round-trips through the route unchanged', async () => {
    const body: DispositionBody = {
      hypothesisId: 'hyp_1',
      contactEmail: 'a@b.example',
      channel: 'email',
      responseClass: 'timing',
      source: { kind: 'manual', id: 'note-1' },
      resumeAt: '2026-11-01T00:00:00.000Z',
      referral: { name: 'Sam' },
    };
    const res = await postDispositions(request('http://localhost/api/gap/dispositions', body));
    expect(res.status).toBe(201);
    expect(mockedDisposition.mock.calls[0][1]).toMatchObject({ resumeAt: '2026-11-01T00:00:00.000Z', referral: { name: 'Sam' } });
  });
});
