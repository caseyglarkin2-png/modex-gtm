/**
 * GAP API client for the Sprint 4 UI (GAP Prospecting OS, S4-T5).
 *
 * Typed fetch wrappers over the Sprint 4 contract in
 * docs/GAP_PROSPECTING_OS.md ("API contract (fixed here so the UI and the
 * service can be built in parallel)"). Every call goes through `request`,
 * which never throws: a non-2xx answer becomes `{ ok: false, status, error,
 * field? }` with the server's `error` string verbatim and its `field` when
 * the body carries one (the 400 `invalid_body` shape); a network failure or
 * an unparseable body becomes `{ ok: false, status: 0 | status, error }`.
 *
 * `fetchImpl` is injectable on every function and on the client factory so
 * components render against a stub in tests and the routes can land later.
 *
 * Voice: no em dashes, "yards" plural.
 */

import type { BidSource, BidType, Channel, ResponseClass } from '../taxonomy';
import type { FactSignal } from '@/components/gap/fact-hypothesis-blocks';

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
  /** The server's `error` string verbatim, else `http_<status>` or `network_error`. */
  error: string;
  /** Present on a 400 `invalid_body` answer: the field the server refused. */
  field?: string;
}

export type ApiResult<T> = ApiOk<T> | ApiErr;

export interface ClientOptions {
  fetchImpl?: FetchLike;
}

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

export const DISPOSITION_SOURCE_KINDS = ['inbound_message', 'hubspot_engagement', 'call', 'meeting', 'manual'] as const;
export type DispositionSourceKind = (typeof DISPOSITION_SOURCE_KINDS)[number];

export interface DispositionSource {
  kind: DispositionSourceKind;
  id: string;
}

export interface DispositionBidInput {
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary?: string;
  numericValue?: number;
  unit?: string;
}

/** `POST /api/gap/dispositions` body. Optional keys are omitted, never sent as null. */
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
  aiSuggestionId?: string;
}

export interface DispositionEffects {
  stopped: string[];
  unsubscribed: boolean;
  resolution: null | { outcome: string; confidence: number };
  mirrored: boolean;
}

/** `POST /api/gap/dispositions` 201 body. */
export interface DispositionResult {
  dispositionId: string;
  bidIds: string[];
  effects: DispositionEffects;
  refusals: unknown[];
}

/** `POST /api/gap/bids` body. */
export interface BidBody {
  hypothesisId: string;
  contactEmail: string;
  dispositionId?: string;
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary?: string;
  numericValue?: number;
  unit?: string;
  source: BidSource;
  supersedesId?: string;
}

export interface BidResult {
  bidId: string;
}

export interface ReplySuggestionBid {
  type: BidType | string;
  quote: string;
  why: string;
}

/** The AI suggestion on a reply. Never truth; the form never pre-selects it. */
export interface ReplySuggestion {
  id?: string;
  responseClass: ResponseClass | string;
  bids: ReplySuggestionBid[];
  why: string;
}

export type ReplySourceKind = Extract<DispositionSourceKind, 'inbound_message' | 'hubspot_engagement'>;

/** One row of `GET /api/gap/replies`. */
export interface ReplyItem {
  id: string;
  source: { kind: ReplySourceKind; id: string };
  contactEmail: string;
  personaId: number | string | null;
  accountName: string;
  hypothesisId: string;
  /** Optional widening of the contract: the hypothesis's family or title when the route sends one. */
  hypothesisTitle?: string | null;
  subject: string | null;
  /** First 280 chars, no HTML. */
  snippet: string;
  receivedAt: string;
  enrollmentId: string | null;
  /** Optional widening of the contract: the enrollment's status when the route sends one. */
  enrollmentStatus?: string | null;
  suggestion?: ReplySuggestion | null;
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

export interface SuggestResult {
  suggestion: ReplySuggestion | null;
}

export interface BriefPersona {
  id: number | string;
  name: string | null;
  title?: string | null;
  email: string | null;
  phone?: string | null;
  personaKey?: string | null;
}

export interface BriefAccount {
  name: string;
  hubspotCompanyId?: string | null;
  tam?: string | null;
  tamTier?: string | null;
  heatTier?: number | null;
}

export interface BriefHypothesis {
  id: string;
  status: string;
  problemFamily: string;
  confidence: number;
  observation: string;
  signals: FactSignal[];
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  wouldProveWrong: string[];
}

export interface BriefDisposition {
  id: string;
  channel: string;
  responseClass: string;
  buyerLanguage?: string | null;
  createdAt: string;
}

export interface BriefBid {
  id: string;
  type: string;
  rawBuyerLanguage: string;
  humanConfirmed: boolean;
  capturedAt?: string | null;
}

/** `GET /api/gap/call/[personaId]` body: the pre-call brief. */
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
  const error = typeof record.error === 'string' && record.error.length > 0 ? record.error : `http_${res.status}`;
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
