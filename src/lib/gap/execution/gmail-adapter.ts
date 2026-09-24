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
  createGmailDraft,
  sendGmailDraft,
  sendViaGmail,
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
  if (intent.threadContext) {
    payload.threadId = intent.threadContext.threadId;
    const headers: Record<string, string> = { Subject: intent.threadContext.subject };
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
export async function gmailDirectAdapter(intent: ExecutionIntent, input: GmailAdapterInput): Promise<ExecutionReceipt> {
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
export async function gmailDraftAdapter(intent: ExecutionIntent, input: GmailAdapterInput): Promise<ExecutionReceipt> {
  try {
    const result = await createGmailDraft(toPayload(intent, input));
    return {
      engine: 'gmail_draft',
      status: 'drafted',
      engineId: result.draftId,
      createdAt: intent.now,
      threadId: result.threadId,
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
): Promise<ExecutionReceipt> {
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
