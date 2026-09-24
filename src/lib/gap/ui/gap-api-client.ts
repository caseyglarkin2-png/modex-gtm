/**
 * GAP API client for the Sprint 4 UI (GAP Prospecting OS, S4-T5; contract
 * parity with the S4-T3 routes in S4-T7).
 *
 * Typed fetch wrappers over the Sprint 4 routes. The types here are the
 * ROUTE shapes, field for field: `src/app/api/gap/dispositions/route.ts`
 * (zod body, 201 body), `src/app/api/gap/bids/route.ts`,
 * `src/lib/gap/replies/list.ts` (`ReplyItem`, `StoredSuggestion`),
 * `src/lib/gap/replies/suggest.ts` and `src/lib/gap/replies/brief.ts`
 * (`CallBrief`). tests/unit/gap/contract-parity.test.ts pins them to the
 * route side: a drift there fails that test, never a page at runtime.
 *
 * Every call goes through `request`, which never throws: a non-2xx answer
 * becomes `{ ok: false, status, error, field? }` with the server's `error`
 * string verbatim (a flag-off 404 carries the skip payload's `reason`, e.g.
 * `GAP_OS_ENABLED=false`) and its `field` when the body carries one (the 400
 * `invalid_body` shape); a network failure or an unparseable body becomes
 * `{ ok: false, status: 0 | status, error }`.
 *
 * `fetchImpl` is injectable on every function and on the client factory so
 * components render against a stub in tests.
 *
 * Voice: no em dashes, "yards" plural.
 */

import type { BidSource, BidType, Channel, ResponseClass } from '../taxonomy';

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ApiOk<T> {
  ok: true;
  status: number;
  data: T;
}

export interface ApiErr {
  ok: false;
  status: number;
  /** The server's `error` string verbatim (or a skip payload's `reason`), else `http_<status>` or `network_error`. */
  error: string;
  /** Present on a 400 `invalid_body` answer: the field the server refused. */
  field?: string;
}

export type ApiResult<T> = ApiOk<T> | ApiErr;

export interface ClientOptions {
  fetchImpl?: FetchLike;
}

// ---------------------------------------------------------------------------
// Contract types (route truth; see the header)
// ---------------------------------------------------------------------------

/**
 * Same members as `DISPOSITION_SOURCE_KINDS` in src/lib/gap/disposition/service.ts.
 * Duplicated because that module pulls Prisma glue into a client bundle; the
 * parity test asserts the two arrays are equal.
 */
export const DISPOSITION_SOURCE_KINDS = ['inbound_message', 'hubspot_engagement', 'call', 'meeting', 'manual'] as const;
export type DispositionSourceKind = (typeof DISPOSITION_SOURCE_KINDS)[number];

export interface DispositionSource {
  kind: DispositionSourceKind;
  id: string;
}

/** One entry of the route's `bids` array (zod `BidSchema`, strict). */
export interface DispositionBidInput {
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary?: string;
  numericValue?: number | string;
  unit?: string;
}

/**
 * `POST /api/gap/dispositions` body (zod `BodySchema`, strict: no extra keys).
 * Optional keys are omitted, never sent as null. `personaId` may be a number
 * or a digit string (the route transforms it). `resumeAt` (timing, ISO with
 * offset) and `referral` (referral) are the route's optional widening; the
 * form does not send them today.
 */
export interface DispositionBody {
  hypothesisId: string;
  personaId?: number | string;
  contactEmail: string;
  channel: Channel;
  responseClass: ResponseClass;
  rootCauseClass?: string;
  impactClass?: string;
  objection?: string;
  buyerLanguage?: string;
  nextBestAction?: string;
  source: DispositionSource;
  bids?: DispositionBidInput[];
  /** The unconfirmed AI row (`ReplySuggestion.id`) this submit adopts; 409 `ai_suggestion_mismatch` when it names another source or hypothesis. */
  aiSuggestionId?: string;
  resumeAt?: string;
  referral?: { name?: string; title?: string; email?: string };
}

export type DispositionStep = 'stop' | 'unsubscribe' | 'resolve' | 'retarget' | 'referral' | 'mirror';

/** One refusal the service recorded while applying effects (the row itself was written). */
export interface DispositionRefusal {
  step: DispositionStep;
  reason: string;
  id?: string;
}

/** The 201 `effects` block of a HUMAN (session) submit. `retarget` and `referral` appear only for those classes. */
export interface DispositionEffects {
  stopped: string[];
  unsubscribed: boolean;
  resolution: null | { outcome: string; confidence: number | null };
  mirrored: boolean;
  retarget?: { closedHypothesisId: string; draftHypothesisId: string | null };
  referral?: { fromBidId: string | null; name?: string; title?: string };
}

/**
 * `POST /api/gap/dispositions` 201 body. The pages are session-authenticated,
 * so the actor is always human and `effects` is always the block above; an
 * agent (header-token) submit answers `effects: 'none'`, which this UI never
 * receives.
 *
 * 409 reasons the route emits: `duplicate_source` (with `existingId`),
 * `hypothesis_not_found`, `hypothesis_not_active`, `persona_not_found`,
 * `suppressed_target_mismatch`, `ai_suggestion_not_found`,
 * `ai_suggestion_not_adoptable`, `ai_suggestion_mismatch`, `agent_cannot_confirm`.
 */
export interface DispositionResult {
  dispositionId: string;
  bidIds: string[];
  effects: DispositionEffects;
  refusals: DispositionRefusal[];
}

/** `POST /api/gap/bids` body (zod, strict). `source` is a BID source, not the disposition channel. */
export interface BidBody {
  hypothesisId: string;
  contactEmail: string;
  dispositionId?: string;
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary?: string;
  numericValue?: number | string;
  unit?: string;
  source: BidSource;
  supersedesId?: string;
}

/** `POST /api/gap/bids` 201 body. */
export interface BidResult {
  bidId: string;
  humanConfirmed: boolean;
  supersedesId: string | null;
}

export interface ReplySuggestionBid {
  type: string;
  quote: string;
  why: string;
}

/**
 * The stored AI suggestion (`StoredSuggestion` in list.ts): the UNCONFIRMED
 * ai-created disposition row. `id` is that row's id and is what the form
 * sends back as `aiSuggestionId`. Never truth; the form never pre-selects it.
 */
export interface ReplySuggestion {
  id: string;
  responseClass: string;
  bids: ReplySuggestionBid[];
  why: string;
}

export type ReplySourceKind = Extract<DispositionSourceKind, 'inbound_message' | 'hubspot_engagement'>;

/** One row of `GET /api/gap/replies` (`ReplyItem` in list.ts). */
export interface ReplyItem {
  /** InboundMessage.id (the Gmail message id, or `hs:<engagementId>`). */
  id: string;
  /** kind by the message's source; id is ALWAYS the inbound row's id. */
  source: { kind: ReplySourceKind; id: string };
  contactEmail: string;
  personaId: number | null;
  accountName: string;
  /** Empty string when the address has no hypothesis. */
  hypothesisId: string;
  /** The hypothesis's problem family, else null. */
  hypothesisTitle: string | null;
  subject: string | null;
  /** First 280 chars of the plain text, no HTML. */
  snippet: string;
  receivedAt: string;
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  suggestion?: ReplySuggestion | null;
  /** The confirmed disposition id; present only when `state=all` returns a dispositioned reply. */
  dispositionId?: string | null;
}

export interface RepliesPage {
  items: ReplyItem[];
  nextCursor: string | null;
}

export type RepliesState = 'undispositioned' | 'all';

export interface ListRepliesParams {
  state?: RepliesState;
  cursor?: string | null;
}

/** `POST /api/gap/replies/[id]/suggest` body: `null` means the model's answer was unusable; `rejected` says why. */
export interface SuggestResult {
  suggestion: ReplySuggestion | null;
  rejected?: string;
}

export interface BriefPersona {
  id: number;
  personaKey: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  doNotContact: boolean;
}

export interface BriefAccount {
  name: string;
  hubspotCompanyId: string | null;
  tier: string | null;
  vertical: string | null;
}

/** A linked signal of the FACT block (`BriefSignal` in brief.ts; a superset of the FACT block's `FactSignal`). */
export interface BriefSignal {
  id: string;
  title: string | null;
  source_kind: string | null;
  evidence_url: string | null;
  evidence_text: string | null;
  observed_at: string | null;
}

export interface BriefHypothesis {
  id: string;
  status: string;
  problemFamily: string;
  confidence: number;
  /** FACT block */
  observation: string;
  signals: BriefSignal[];
  /** HYPOTHESIS block */
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  contraryEvidence: string | null;
  predictedBuyerLanguage: string | null;
  /** what_a_no_means and contrary_evidence, the non-empty ones. */
  wouldProveWrong: string[];
}

export interface BriefDisposition {
  id: string;
  channel: string;
  responseClass: string;
  buyerLanguage: string | null;
  humanConfirmed: boolean;
  createdAt: string;
}

/** An open BID: unconfirmed and unsuperseded, so `humanConfirmed` is always false here. */
export interface BriefBid {
  id: string;
  type: string;
  rawBuyerLanguage: string;
  humanConfirmed: boolean;
  capturedAt: string | null;
}

/** `GET /api/gap/call/[personaId]` body: the pre-call brief (`CallBrief` in brief.ts). */
export interface CallBrief {
  persona: BriefPersona;
  account: BriefAccount;
  hypothesis: BriefHypothesis | null;
  lastDispositions: BriefDisposition[];
  openBids: BriefBid[];
  suggestedQuestions: string[];
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function resolveFetch(fetchImpl: FetchLike | undefined): FetchLike | null {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch === 'function') return (input, init) => fetch(input, init);
  return null;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The error string of a non-2xx body: `error` verbatim, else a flag-off skip payload's `reason`, else `http_<status>`. */
export function errorOf(body: unknown, status: number): string {
  const record = isRecord(body) ? body : {};
  if (typeof record.error === 'string' && record.error.length > 0) return record.error;
  if (record.skipped === true && typeof record.reason === 'string' && record.reason.length > 0) return record.reason;
  return `http_${status}`;
}

/** One request. Never throws; the result carries the outcome. */
export async function request<T>(url: string, init: RequestInit, opts: ClientOptions = {}): Promise<ApiResult<T>> {
  const doFetch = resolveFetch(opts.fetchImpl);
  if (!doFetch) return { ok: false, status: 0, error: 'fetch_unavailable' };

  let res: Response;
  try {
    res = await doFetch(url, { cache: 'no-store', ...init });
  } catch (caught) {
    return { ok: false, status: 0, error: caught instanceof Error && caught.message ? caught.message : 'network_error' };
  }

  const body = await readJson(res);
  if (res.ok) {
    return { ok: true, status: res.status, data: (body ?? {}) as T };
  }

  const record = isRecord(body) ? body : {};
  const error = errorOf(body, res.status);
  const field = typeof record.field === 'string' && record.field.length > 0 ? record.field : undefined;
  return field ? { ok: false, status: res.status, error, field } : { ok: false, status: res.status, error };
}

function postJson<T>(url: string, body: unknown, opts: ClientOptions): Promise<ApiResult<T>> {
  return request<T>(
    url,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    opts,
  );
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export function repliesUrl(params: ListRepliesParams = {}): string {
  const query = new URLSearchParams();
  query.set('state', params.state ?? 'undispositioned');
  if (params.cursor) query.set('cursor', params.cursor);
  return `/api/gap/replies?${query.toString()}`;
}

export function callBriefUrl(personaId: number | string): string {
  return `/api/gap/call/${encodeURIComponent(String(personaId))}`;
}

export function suggestUrl(replyId: string): string {
  return `/api/gap/replies/${encodeURIComponent(replyId)}/suggest`;
}

export const DISPOSITIONS_URL = '/api/gap/dispositions';
export const BIDS_URL = '/api/gap/bids';

export async function listReplies(params: ListRepliesParams = {}, opts: ClientOptions = {}): Promise<ApiResult<RepliesPage>> {
  const result = await request<Partial<RepliesPage>>(repliesUrl(params), { method: 'GET' }, opts);
  if (!result.ok) return result;
  return {
    ok: true,
    status: result.status,
    data: {
      items: Array.isArray(result.data.items) ? (result.data.items as ReplyItem[]) : [],
      nextCursor: typeof result.data.nextCursor === 'string' && result.data.nextCursor.length > 0 ? result.data.nextCursor : null,
    },
  };
}

export function getCallBrief(personaId: number | string, opts: ClientOptions = {}): Promise<ApiResult<CallBrief>> {
  return request<CallBrief>(callBriefUrl(personaId), { method: 'GET' }, opts);
}

export function postDisposition(body: DispositionBody, opts: ClientOptions = {}): Promise<ApiResult<DispositionResult>> {
  return postJson<DispositionResult>(DISPOSITIONS_URL, body, opts);
}

export function postBid(body: BidBody, opts: ClientOptions = {}): Promise<ApiResult<BidResult>> {
  return postJson<BidResult>(BIDS_URL, body, opts);
}

export function suggestReply(replyId: string, opts: ClientOptions = {}): Promise<ApiResult<SuggestResult>> {
  return postJson<SuggestResult>(suggestUrl(replyId), {}, opts);
}

// ---------------------------------------------------------------------------
// Client object (what components take as a prop)
// ---------------------------------------------------------------------------

export interface GapApiClient {
  listReplies(params?: ListRepliesParams): Promise<ApiResult<RepliesPage>>;
  getCallBrief(personaId: number | string): Promise<ApiResult<CallBrief>>;
  postDisposition(body: DispositionBody): Promise<ApiResult<DispositionResult>>;
  postBid(body: BidBody): Promise<ApiResult<BidResult>>;
  suggestReply(replyId: string): Promise<ApiResult<SuggestResult>>;
}

export function createGapApiClient(opts: ClientOptions = {}): GapApiClient {
  return {
    listReplies: (params) => listReplies(params, opts),
    getCallBrief: (personaId) => getCallBrief(personaId, opts),
    postDisposition: (body) => postDisposition(body, opts),
    postBid: (body) => postBid(body, opts),
    suggestReply: (replyId) => suggestReply(replyId, opts),
  };
}

/** The client components use when none is injected: the page's own fetch. */
export const defaultGapApiClient: GapApiClient = createGapApiClient();
