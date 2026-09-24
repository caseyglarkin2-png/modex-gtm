/**
 * suggestReply (GAP Prospecting OS, Sprint 4, S4-T3). The AI client is a
 * stub. Pins: the flag gate, the strict parse (bad JSON -> null, a schema
 * miss -> null, a quote that is not verbatim in the text -> null, each
 * audited `reply.suggest_rejected`), the AI row invariant (the only write is
 * an UNCONFIRMED ConversationDisposition with created_by 'ai' that
 * `dispositionEffects` maps to NO_EFFECTS), idempotency on an existing AI
 * row, and the refusals. A structural check asserts this module never
 * writes an enrollment, persona, hypothesis, BID or unsubscribe row.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dispositionEffects, NO_EFFECTS } from '@/lib/gap/disposition/model';
import { buildPrompt, extractJson, parseSuggestion, suggestReply, SUGGESTABLE_RESPONSE_CLASSES } from '@/lib/gap/replies/suggest';

/* eslint-disable @typescript-eslint/no-explicit-any */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const TEXT = 'Thanks Casey. Honestly we lose two trailers a week at the Ohio gate.  Call me after Q1.';
const INBOUND = { id: 'm5', source: 'gmail', from_email: 'Jordan@Acme.example', subject: 'Re: yards', body_text: TEXT, body_html: null, snippet: null };
const GOOD = JSON.stringify({
  responseClass: 'problem_confirmed',
  bids: [{ type: 'business_problem', quote: 'we lose two trailers a week at the Ohio gate', why: 'names the loss' }],
  why: 'confirms the trailer loss in their words',
});

function makePrisma() {
  return {
    inboundMessage: { findUnique: asyncSpy(async () => INBOUND) },
    conversationDisposition: {
      findUnique: asyncSpy(async () => null),
      create: asyncSpy(async () => ({ id: 'D_ai' })),
      update: asyncSpy(async () => ({})),
    },
    sequenceEnrollment: {
      findMany: asyncSpy(async () => [
        { id: 'E1', to_email: 'jordan@acme.example', status: 'paused', hypothesis_id: 'H1', persona_id: 7, account_name: 'Acme Logistics', hubspot_contact_id: 'hs-7', enrolled_at: new Date() },
      ]),
    },
    persona: { findMany: asyncSpy(async () => []) },
    prospectingHypothesis: {
      findUnique: asyncSpy(async () => ({ id: 'H1', account_name: 'Acme Logistics', problem_family: 'hidden_capacity', problem_hypothesis: 'My guess is the gate runs on paper.' })),
    },
    gapAuditEvent: { create: asyncSpy(async () => ({ id: 'A' })) },
  };
}

let prisma: ReturnType<typeof makePrisma>;
let audit: ReturnType<typeof asyncSpy>;
let savedFlag: string | undefined;

beforeEach(() => {
  savedFlag = process.env.GAP_REPLY_CLASSIFICATION_ENABLED;
  process.env.GAP_REPLY_CLASSIFICATION_ENABLED = 'true';
  prisma = makePrisma();
  audit = asyncSpy(async () => ({ stored: true, reviewQueued: false }));
});

afterEach(() => {
  if (savedFlag === undefined) delete process.env.GAP_REPLY_CLASSIFICATION_ENABLED;
  else process.env.GAP_REPLY_CLASSIFICATION_ENABLED = savedFlag;
});

describe('pure parsing', () => {
  it('extractJson tolerates a code fence and prose around the object', () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```\nDone.')).toBe('{"a":1}');
    expect(extractJson('no braces here')).toBeNull();
  });

  it('parseSuggestion: bad JSON, a schema miss, an unknown class, too many bids and a call-only class are all rejected by name', () => {
    expect(parseSuggestion('{not json', TEXT)).toEqual({ ok: false, rejected: 'unparseable' });
    expect(parseSuggestion('{"responseClass":"problem_confirmed","bids":[],"why":"x","extra":1}', TEXT)).toEqual({ ok: false, rejected: 'schema:body' });
    expect(parseSuggestion('{"responseClass":"positive_interest","bids":[],"why":"x"}', TEXT)).toEqual({ ok: false, rejected: 'schema:responseClass' });
    expect(parseSuggestion('{"responseClass":"voicemail","bids":[],"why":"x"}', TEXT)).toEqual({ ok: false, rejected: 'schema:responseClass' });
    const four = JSON.stringify({ responseClass: 'timing', bids: Array(4).fill({ type: 'priority', quote: 'Call me after Q1', why: 'w' }), why: 'x' });
    expect(parseSuggestion(four, TEXT)).toEqual({ ok: false, rejected: 'schema:bids' });
    expect(parseSuggestion('{"responseClass":"timing","bids":[{"type":"priority","quote":"","why":"w"}],"why":"x"}', TEXT)).toEqual({ ok: false, rejected: 'schema:bids.0.quote' });
  });

  it('parseSuggestion: a quote that is not verbatim in the text is rejected naming the bid index; whitespace differences are forgiven', () => {
    const paraphrase = JSON.stringify({ responseClass: 'problem_confirmed', bids: [{ type: 'business_problem', quote: 'they lose trailers weekly', why: 'w' }], why: 'x' });
    expect(parseSuggestion(paraphrase, TEXT)).toEqual({ ok: false, rejected: 'quote_not_found:0' });
    const spaced = JSON.stringify({ responseClass: 'timing', bids: [{ type: 'priority', quote: 'Call   me after Q1', why: 'w' }], why: 'x' });
    expect(parseSuggestion(spaced, TEXT)).toMatchObject({ ok: true });
  });

  it('SUGGESTABLE_RESPONSE_CLASSES excludes the call-only three', () => {
    expect(SUGGESTABLE_RESPONSE_CLASSES).not.toContain('voicemail');
    expect(SUGGESTABLE_RESPONSE_CLASSES).not.toContain('no_answer');
    expect(SUGGESTABLE_RESPONSE_CLASSES).not.toContain('gatekeeper');
    expect(SUGGESTABLE_RESPONSE_CLASSES).toContain('out_of_office');
  });

  it('buildPrompt carries the classes, the verbatim rule, the hypothesis and the message', () => {
    const p = buildPrompt({ messageText: TEXT, subject: 'Re: yards', hypothesis: { problemFamily: 'hidden_capacity', problemHypothesis: 'guess' } });
    expect(p).toContain('problem_confirmed');
    expect(p).toContain('character for character');
    expect(p).toContain('hidden_capacity');
    expect(p).toContain(TEXT);
  });
});

describe('suggestReply', () => {
  it('flag off: refuses classification_disabled with zero reads', async () => {
    process.env.GAP_REPLY_CLASSIFICATION_ENABLED = 'false';
    const ai = asyncSpy();
    expect(await suggestReply(prisma, ai, 'm5', { audit })).toEqual({ ok: false, reason: 'classification_disabled' });
    expect(prisma.inboundMessage.findUnique).not.toHaveBeenCalled();
    expect(ai).not.toHaveBeenCalled();
  });

  it('writes ONLY an unconfirmed AI disposition row for the inbound source and returns the stored suggestion with its id', async () => {
    const ai = asyncSpy(async () => GOOD);
    const out = await suggestReply(prisma, ai, 'm5', { audit });
    expect(out).toEqual({
      ok: true,
      suggestion: {
        id: 'D_ai',
        responseClass: 'problem_confirmed',
        bids: [{ type: 'business_problem', quote: 'we lose two trailers a week at the Ohio gate', why: 'names the loss' }],
        why: 'confirms the trailer loss in their words',
      },
    });
    expect(ai).toHaveBeenCalledTimes(1);
    // The prompt carries the plain text (whitespace collapsed), never HTML.
    expect(ai.mock.calls[0][0]).toContain(TEXT.replace(/\s+/g, ' '));
    const data = prisma.conversationDisposition.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      contact_email: 'jordan@acme.example',
      hubspot_contact_id: 'hs-7',
      enrollment_id: 'E1',
      inbound_message_id: 'm5',
      hubspot_engagement_id: null,
      source_kind: 'inbound_message',
      source_id: 'm5',
      channel: 'email',
      response_class: 'problem_confirmed',
      human_confirmed: false,
      created_by: 'ai',
    });
    expect(data.ai_suggested).toEqual(JSON.parse(GOOD));
    // The AI row invariant: whatever its class, an unconfirmed row has no effects.
    expect(dispositionEffects({ responseClass: data.response_class, humanConfirmed: data.human_confirmed })).toBe(NO_EFFECTS);
    expect(audit.mock.calls.map((c) => c[1].kind)).toEqual(['reply.suggested']);
  });

  it('bad JSON from the model -> null, audited reply.suggest_rejected, nothing written', async () => {
    const out = await suggestReply(prisma, asyncSpy(async () => 'I think it is a timing reply.'), 'm5', { audit });
    expect(out).toEqual({ ok: true, suggestion: null, rejected: 'unparseable' });
    expect(prisma.conversationDisposition.create).not.toHaveBeenCalled();
    expect(audit.mock.calls[0][1]).toMatchObject({ kind: 'reply.suggest_rejected', subjectType: 'inbound_message', subjectId: 'm5', payload: { rejected: 'unparseable' } });
  });

  it('a quote not in the text -> null and audited with the bid index', async () => {
    const invented = JSON.stringify({ responseClass: 'problem_confirmed', bids: [{ type: 'metric', quote: 'we lose ten trailers a day', why: 'w' }], why: 'x' });
    const out = await suggestReply(prisma, asyncSpy(async () => invented), 'm5', { audit });
    expect(out).toEqual({ ok: true, suggestion: null, rejected: 'quote_not_found:0' });
    expect(prisma.conversationDisposition.create).not.toHaveBeenCalled();
  });

  it('an AI client throw -> null with ai_error, never thrown', async () => {
    const out = await suggestReply(prisma, asyncSpy(async () => { throw new Error('quota'); }), 'm5', { audit });
    expect(out).toEqual({ ok: true, suggestion: null, rejected: 'ai_error' });
    expect(audit.mock.calls[0][1].payload).toMatchObject({ rejected: 'ai_error', detail: 'quota' });
  });

  it('an existing unconfirmed AI row is returned as is without a second model call', async () => {
    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({
      id: 'D_ai', human_confirmed: false, created_by: 'ai', ai_suggested: { responseClass: 'timing', bids: [], why: 'Q1' },
    });
    const ai = asyncSpy();
    const out = await suggestReply(prisma, ai, 'm5', { audit });
    expect(out).toEqual({ ok: true, suggestion: { id: 'D_ai', responseClass: 'timing', bids: [], why: 'Q1' } });
    expect(ai).not.toHaveBeenCalled();
    expect(prisma.conversationDisposition.create).not.toHaveBeenCalled();
  });

  it('refusals: not_found, already_dispositioned, unknown_address, no_hypothesis', async () => {
    prisma.inboundMessage.findUnique.mockResolvedValueOnce(null);
    expect(await suggestReply(prisma, asyncSpy(), 'nope', { audit })).toEqual({ ok: false, reason: 'not_found' });

    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({ id: 'D1', human_confirmed: true, created_by: 'casey', ai_suggested: null });
    expect(await suggestReply(prisma, asyncSpy(), 'm5', { audit })).toEqual({ ok: false, reason: 'already_dispositioned' });

    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([]);
    expect(await suggestReply(prisma, asyncSpy(), 'm5', { audit })).toEqual({ ok: false, reason: 'unknown_address' });

    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([
      { id: 'E1', to_email: 'jordan@acme.example', status: 'active', hypothesis_id: null, persona_id: null, account_name: 'Acme', hubspot_contact_id: null, enrolled_at: new Date() },
    ]);
    expect(await suggestReply(prisma, asyncSpy(), 'm5', { audit })).toEqual({ ok: false, reason: 'no_hypothesis' });
  });

  it('a lost unique race returns the row that landed', async () => {
    prisma.conversationDisposition.create.mockRejectedValueOnce(Object.assign(new Error('unique'), { code: 'P2002' }));
    prisma.conversationDisposition.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'D_race', human_confirmed: false, created_by: 'ai', ai_suggested: { responseClass: 'timing', bids: [], why: 'r' } });
    const out = await suggestReply(prisma, asyncSpy(async () => GOOD), 'm5', { audit });
    expect(out).toEqual({ ok: true, suggestion: { id: 'D_race', responseClass: 'timing', bids: [], why: 'r' } });
  });
});

describe('structural: the suggestion module writes nothing but the AI disposition row', () => {
  it('has no create/update/delete on any delegate except conversationDisposition', () => {
    const src = readFileSync(path.resolve(__dirname, '../../../src/lib/gap/replies/suggest.ts'), 'utf8');
    const writes = Array.from(src.matchAll(/prisma\.(\w+)\.(create|update|updateMany|upsert|delete|deleteMany|createMany)\b/g)).map((m) => m[1]);
    expect(new Set(writes)).toEqual(new Set(['conversationDisposition']));
    // No `data:` object in this file ever sets human_confirmed true (select blocks name the column to read it).
    const dataBlocks = Array.from(src.matchAll(/\bdata\s*:\s*\{[^}]*\}/g)).map((m) => m[0]);
    expect(dataBlocks.length).toBeGreaterThan(0);
    expect(dataBlocks.some((b) => /human_confirmed:\s*true/.test(b))).toBe(false);
    expect(src).toMatch(/human_confirmed:\s*false/);
    expect(src).not.toMatch(/recordUnsubscribe|stopRunsForRecipient|transitionHypothesis|captureBid/);
  });
});
