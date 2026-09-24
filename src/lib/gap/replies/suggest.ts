/**
 * AI reply suggestion (GAP Prospecting OS, Sprint 4, S4-T3):
 * `POST /api/gap/replies/[id]/suggest`, behind GAP_REPLY_CLASSIFICATION_ENABLED.
 *
 * One JSON-only prompt to the injected AI client (production passes
 * `generateText` from src/lib/ai/client.ts; tests pass a stub): a response
 * class from RESPONSE_CLASSES minus the call-only three, up to three BIDs
 * whose `quote` must be a VERBATIM substring of the message's plain text
 * (whitespace-normalized on both sides, nothing else), and a `why`. The
 * reply is parsed with strict zod. Unparseable JSON, a schema miss, or a
 * quote that is not in the text -> `null`, audited `reply.suggest_rejected`
 * with the reason. The model never gets to invent buyer language.
 *
 * Storage: the suggestion is an UNCONFIRMED ConversationDisposition row,
 * `created_by: 'ai'`, `human_confirmed: false`, `ai_suggested` = the JSON,
 * source = (inbound_message | hubspot_engagement, InboundMessage.id). That
 * row has no effects by construction (`dispositionEffects` returns
 * NO_EFFECTS for any unconfirmed row: it never stops a run, never
 * unsubscribes, never resolves) and it BECOMES the human's row when they
 * submit with `aiSuggestionId` (disposition/service.ts step 2). This file
 * writes nothing else: no enrollment, no persona, no hypothesis.
 *
 * Idempotent: an existing AI row for the source is returned as is (no second
 * model call); a confirmed row for the source refuses `already_dispositioned`.
 *
 * House convention for DB glue is `prisma: any`. Voice: no em dashes.
 */

import { z } from 'zod';
import { audit as defaultAudit } from '../audit';
import { CALL_ONLY_RESPONSE_CLASSES } from '../disposition/model';
import { gapFlag } from '../flags';
import { BID_TYPES, RESPONSE_CLASSES, type ResponseClass } from '../taxonomy';
import { loadKnownAddresses, plainTextOf, sourceOfInbound, suggestionFromRow, type StoredSuggestion } from './list';

export type AiClient = (prompt: string, maxTokens?: number) => Promise<string>;

export const AI_ACTOR = 'ai' as const;
export const MAX_SUGGESTED_BIDS = 3;
/** The message text is clipped before it reaches the prompt; quotes are checked against the clipped text. */
export const MAX_MESSAGE_CHARS = 6000;

/** Classes a written reply can be. The call-only three are never suggested for a message. */
export const SUGGESTABLE_RESPONSE_CLASSES = RESPONSE_CLASSES.filter(
  (c): c is ResponseClass => !(CALL_ONLY_RESPONSE_CLASSES as readonly string[]).includes(c),
);

export const SuggestionSchema = z
  .object({
    responseClass: z.enum(SUGGESTABLE_RESPONSE_CLASSES as [ResponseClass, ...ResponseClass[]]),
    bids: z
      .array(
        z
          .object({
            type: z.enum(BID_TYPES as unknown as [string, ...string[]]),
            quote: z.string().trim().min(1),
            why: z.string().trim().min(1),
          })
          .strict(),
      )
      .max(MAX_SUGGESTED_BIDS),
    why: z.string().trim().min(1),
  })
  .strict();

export type Suggestion = z.infer<typeof SuggestionSchema>;

export type SuggestRefusal = 'classification_disabled' | 'not_found' | 'unknown_address' | 'no_hypothesis' | 'already_dispositioned';

export type SuggestRejection = 'ai_error' | 'unparseable' | `schema:${string}` | `quote_not_found:${number}` | 'empty_message';

export type SuggestResult =
  | { ok: true; suggestion: StoredSuggestion }
  | { ok: true; suggestion: null; rejected: SuggestRejection }
  | { ok: false; reason: SuggestRefusal };

export interface SuggestDeps {
  audit?: typeof defaultAudit;
  now?: () => Date;
}

// ---------------------------------------------------------------------------
// Pure pieces
// ---------------------------------------------------------------------------

export function normalizeForQuote(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Strip a ```json fence and any prose around the outermost braces. */
export function extractJson(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return body.slice(start, end + 1);
}

export type ParseOutcome = { ok: true; value: Suggestion } | { ok: false; rejected: SuggestRejection };

/** JSON -> zod -> every quote verbatim in the text. Any miss names why. */
export function parseSuggestion(raw: string, messageText: string): ParseOutcome {
  const json = extractJson(raw);
  if (json === null) return { ok: false, rejected: 'unparseable' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, rejected: 'unparseable' };
  }
  const result = SuggestionSchema.safeParse(parsed);
  if (!result.success) {
    const path = result.error.issues[0]?.path.map(String).join('.') || 'body';
    return { ok: false, rejected: `schema:${path}` };
  }
  const haystack = normalizeForQuote(messageText);
  for (let i = 0; i < result.data.bids.length; i += 1) {
    if (!haystack.includes(normalizeForQuote(result.data.bids[i].quote))) return { ok: false, rejected: `quote_not_found:${i}` };
  }
  return { ok: true, value: result.data };
}

export interface PromptInput {
  messageText: string;
  subject: string | null;
  hypothesis: { problemFamily: string; problemHypothesis: string } | null;
}

export function buildPrompt(input: PromptInput): string {
  const classes = SUGGESTABLE_RESPONSE_CLASSES.join(', ');
  const types = BID_TYPES.join(', ');
  const hypothesis = input.hypothesis
    ? `The seller's hypothesis (family ${input.hypothesis.problemFamily}): ${input.hypothesis.problemHypothesis}`
    : 'No hypothesis is on file.';
  return [
    'You classify ONE inbound email reply from a prospect for a sales team. Answer with JSON only, no prose, no code fence.',
    'Schema: {"responseClass": <one of the classes>, "bids": [{"type": <one of the BID types>, "quote": <verbatim substring of the message>, "why": <one sentence>}], "why": <one sentence>}',
    `Classes: ${classes}.`,
    `BID types: ${types}. A BID is something the BUYER said about their own operation. Give at most ${MAX_SUGGESTED_BIDS}; give none when the message carries nothing in the buyer's own words.`,
    'Every "quote" MUST be copied character for character from the message text below. Never paraphrase a quote. Never invent one.',
    'out_of_office is an autoresponder. do_not_contact is an explicit opt-out. bounce is a delivery failure. no_signal is a reply with nothing in it.',
    hypothesis,
    `Subject: ${input.subject ?? '(none)'}`,
    'Message text:',
    '"""',
    input.messageText,
    '"""',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// suggestReply
// ---------------------------------------------------------------------------

interface InboundRow {
  id: string;
  source?: string | null;
  from_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
}

interface ExistingRow {
  id: string;
  human_confirmed: boolean;
  created_by: string;
  ai_suggested: unknown;
}

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002';
}

async function safeAudit(auditFn: typeof defaultAudit, prisma: any, input: Parameters<typeof defaultAudit>[1]): Promise<void> {
  try {
    await auditFn(prisma, input);
  } catch {
    // never gates
  }
}

export async function suggestReply(prisma: any, ai: AiClient, inboundId: string, deps: SuggestDeps = {}): Promise<SuggestResult> {
  if (!gapFlag('GAP_REPLY_CLASSIFICATION_ENABLED')) return { ok: false, reason: 'classification_disabled' };
  const auditFn = deps.audit ?? defaultAudit;
  const now = deps.now ?? (() => new Date());

  const inbound: InboundRow | null = await prisma.inboundMessage.findUnique({
    where: { id: inboundId },
    select: { id: true, source: true, from_email: true, subject: true, body_text: true, body_html: true, snippet: true },
  });
  if (!inbound) return { ok: false, reason: 'not_found' };
  const source = sourceOfInbound(inbound);

  const existing: ExistingRow | null = await prisma.conversationDisposition.findUnique({
    where: { source_kind_source_id: { source_kind: source.kind, source_id: source.id } },
    select: { id: true, human_confirmed: true, created_by: true, ai_suggested: true },
  });
  if (existing) {
    if (existing.human_confirmed) return { ok: false, reason: 'already_dispositioned' };
    const stored = suggestionFromRow(existing);
    if (stored) return { ok: true, suggestion: stored };
  }

  const known = await loadKnownAddresses(prisma);
  const address = known.get((inbound.from_email ?? '').trim().toLowerCase());
  if (!address) return { ok: false, reason: 'unknown_address' };
  if (!address.hypothesisId) return { ok: false, reason: 'no_hypothesis' };
  const hypothesis: { id: string; account_name: string; problem_family: string; problem_hypothesis: string } | null =
    await prisma.prospectingHypothesis.findUnique({
      where: { id: address.hypothesisId },
      select: { id: true, account_name: true, problem_family: true, problem_hypothesis: true },
    });
  if (!hypothesis) return { ok: false, reason: 'no_hypothesis' };

  const messageText = plainTextOf(inbound).slice(0, MAX_MESSAGE_CHARS);
  const reject = async (rejected: SuggestRejection, detail?: string): Promise<SuggestResult> => {
    await safeAudit(auditFn, prisma, {
      kind: 'reply.suggest_rejected',
      actor: AI_ACTOR,
      subjectType: 'inbound_message',
      subjectId: inbound.id,
      payload: { rejected, ...(detail ? { detail } : {}), hypothesisId: hypothesis.id },
    });
    return { ok: true, suggestion: null, rejected };
  };
  if (messageText.length === 0) return reject('empty_message');

  let raw: string;
  try {
    raw = await ai(
      buildPrompt({
        messageText,
        subject: inbound.subject,
        hypothesis: { problemFamily: hypothesis.problem_family, problemHypothesis: hypothesis.problem_hypothesis },
      }),
    );
  } catch (err) {
    return reject('ai_error', err instanceof Error ? err.message : String(err));
  }
  const parsed = parseSuggestion(raw, messageText);
  if (!parsed.ok) return reject(parsed.rejected);

  const suggestion = parsed.value;
  const data = {
    hypothesis_id: hypothesis.id,
    account_name: hypothesis.account_name,
    persona_id: address.personaId,
    contact_email: address.email,
    hubspot_contact_id: address.hubspotContactId,
    enrollment_id: address.enrollmentId,
    inbound_message_id: source.kind === 'inbound_message' ? source.id : null,
    hubspot_engagement_id: source.kind === 'hubspot_engagement' ? source.id : null,
    source_kind: source.kind,
    source_id: source.id,
    channel: 'email',
    response_class: suggestion.responseClass,
    ai_suggested: suggestion,
    human_confirmed: false,
    created_by: AI_ACTOR,
  };

  let rowId: string;
  if (existing) {
    // An unconfirmed row whose JSON was unreadable: refresh it (allowed while unconfirmed).
    await prisma.conversationDisposition.update({ where: { id: existing.id }, data: { response_class: suggestion.responseClass, ai_suggested: suggestion } });
    rowId = existing.id;
  } else {
    try {
      const created = await prisma.conversationDisposition.create({ data, select: { id: true } });
      rowId = created.id;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Lost a race with another suggest call: return what landed.
      const raced: ExistingRow | null = await prisma.conversationDisposition.findUnique({
        where: { source_kind_source_id: { source_kind: source.kind, source_id: source.id } },
        select: { id: true, human_confirmed: true, created_by: true, ai_suggested: true },
      });
      const stored = raced ? suggestionFromRow(raced) : null;
      if (stored) return { ok: true, suggestion: stored };
      return { ok: false, reason: 'already_dispositioned' };
    }
  }

  await safeAudit(auditFn, prisma, {
    kind: 'reply.suggested',
    actor: AI_ACTOR,
    subjectType: 'disposition',
    subjectId: rowId,
    payload: { inboundMessageId: inbound.id, hypothesisId: hypothesis.id, responseClass: suggestion.responseClass, bids: suggestion.bids.length, at: now().toISOString() },
  });

  return { ok: true, suggestion: { id: rowId, responseClass: suggestion.responseClass, bids: suggestion.bids, why: suggestion.why } };
}
