/**
 * GAP Prospecting OS, Sprint 6C: Gmail execution adapters.
 *
 * Two DISTINCT engines (owner addendum, 2026-09-24): `gmail_direct` sends
 * immediately; `gmail_draft` only ever creates a draft, a separate later
 * call sends it. Both wrap the existing Gmail sender (../../email/gmail-sender.ts)
 * unchanged -- this file translates in and out, it does not reimplement
 * MIME building, OAuth or the safety gates.
 *
 * Ships DARK in this phase: nothing here is called from a live code path
 * yet (6C's job is the adapter contract, proven with fakes/tests; wiring a
 * real caller is a later, owner-gated step). No new flag is needed because
 * nothing calls these adapters in production; GAP_OS_ENABLED still gates
 * every GAP surface that will eventually invoke them.
 */
import {
  createGmailDraft as defaultCreateGmailDraft,
  sendGmailDraft as defaultSendGmailDraft,
  sendViaGmail as defaultSendViaGmail,
  type GmailSendPayload,
} from '@/lib/email/gmail-sender';
import type { ExecutionIntent, ExecutionReceipt } from './contract';

export interface GmailAdapterInput {
  to: string;
  cc?: string[];
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  sender?: { refreshToken: string; userEmail: string };
  /** Extra MIME headers (e.g. List-Unsubscribe). Threading headers from the intent win on a clash. */
  headers?: Record<string, string>;
}

/**
 * Injectable transport, mirroring `hubspotSequenceAdapter`'s `deps.fetchImpl`.
 * Defaults to the real `gmail-sender.ts` functions; a caller proving the
 * adapter end to end with a fake transport (never a real Gmail/OAuth call)
 * overrides one or more here. Never used to weaken a real guard: the real
 * functions' autonomy/suppression/cap checks still run whenever the real
 * functions are the ones actually called.
 */
export interface GmailAdapterDeps {
  createGmailDraft?: typeof defaultCreateGmailDraft;
  sendGmailDraft?: typeof defaultSendGmailDraft;
  sendViaGmail?: typeof defaultSendViaGmail;
}

function toPayload(intent: ExecutionIntent, input: GmailAdapterInput): GmailSendPayload {
  const payload: GmailSendPayload = {
    to: input.to,
    subject: input.subject,
    html: input.html,
    purpose: 'PROSPECT_OUTREACH',
  };
  if (input.cc !== undefined) payload.cc = input.cc;
  if (input.bcc !== undefined) payload.bcc = input.bcc;
  if (input.text !== undefined) payload.text = input.text;
  if (input.replyTo !== undefined) payload.replyTo = input.replyTo;
  if (input.sender !== undefined) payload.sender = input.sender;
  if (input.headers !== undefined) payload.headers = { ...input.headers };
  if (intent.threadContext) {
    payload.threadId = intent.threadContext.threadId;
    const headers: Record<string, string> = { ...(payload.headers ?? {}), Subject: intent.threadContext.subject };
    if (intent.threadContext.inReplyTo) headers['In-Reply-To'] = intent.threadContext.inReplyTo;
    if (intent.threadContext.references?.length) headers.References = intent.threadContext.references.join(' ');
    payload.headers = headers;
  }
  return payload;
}

function refusedReceipt(engine: ExecutionReceipt['engine'], now: Date, err: unknown): ExecutionReceipt {
  return {
    engine,
    status: 'refused',
    engineId: null,
    createdAt: now,
    refusalReason: err instanceof Error ? err.message : String(err),
  };
}

/** engine: 'gmail_direct'. Sends immediately through the existing sendViaGmail (autonomy + suppression + daily cap, unchanged). */
export async function gmailDirectAdapter(intent: ExecutionIntent, input: GmailAdapterInput, deps: GmailAdapterDeps = {}): Promise<ExecutionReceipt> {
  const sendViaGmail = deps.sendViaGmail ?? defaultSendViaGmail;
  try {
    const result = await sendViaGmail(toPayload(intent, input));
    return {
      engine: 'gmail_direct',
      status: 'sent',
      engineId: result.id,
      createdAt: intent.now,
      sentAt: intent.now,
      threadId: result.threadId,
    };
  } catch (err) {
    return refusedReceipt('gmail_direct', intent.now, err);
  }
}

/** engine: 'gmail_draft'. Creates a draft only (createGmailDraft: suppression checked, autonomy/cap deliberately not). */
export async function gmailDraftAdapter(intent: ExecutionIntent, input: GmailAdapterInput, deps: GmailAdapterDeps = {}): Promise<ExecutionReceipt> {
  const createGmailDraft = deps.createGmailDraft ?? defaultCreateGmailDraft;
  try {
    const result = await createGmailDraft(toPayload(intent, input));
    return {
      engine: 'gmail_draft',
      status: 'drafted',
      engineId: result.draftId,
      createdAt: intent.now,
      threadId: result.threadId,
      draftMessageId: result.messageId,
    };
  } catch (err) {
    return refusedReceipt('gmail_draft', intent.now, err);
  }
}

/**
 * Send a draft a prior `gmailDraftAdapter` call created. The returned
 * receipt's `supersedesEngineId` names the draft's `engineId` -- lineage
 * preserved, never collapsed into the draft's own receipt (owner addendum).
 */
export async function sendDraftedGmailAdapter(
  intent: ExecutionIntent,
  draftReceipt: ExecutionReceipt,
  recipients: { to: string; cc?: string[]; bcc?: string },
  deps: GmailAdapterDeps = {},
): Promise<ExecutionReceipt> {
  const sendGmailDraft = deps.sendGmailDraft ?? defaultSendGmailDraft;
  if (draftReceipt.engine !== 'gmail_draft' || draftReceipt.status !== 'drafted' || !draftReceipt.engineId) {
    return refusedReceipt('gmail_direct', intent.now, new Error('supersedes_receipt_not_a_draft'));
  }
  try {
    const result = await sendGmailDraft(draftReceipt.engineId, recipients);
    return {
      engine: 'gmail_direct',
      status: 'sent',
      engineId: result.id,
      createdAt: intent.now,
      sentAt: intent.now,
      threadId: result.threadId,
      supersedesEngineId: draftReceipt.engineId,
    };
  } catch (err) {
    return refusedReceipt('gmail_direct', intent.now, err);
  }
}
