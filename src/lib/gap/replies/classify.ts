/**
 * REPLY CLASS (account-first UX, UX-03, 2026-10-05): what kind of reply is this, decided BEFORE anything ranks on it.
 *
 *   human          a person wrote back: pauses the account's cold motion until it is recorded (the existing rule)
 *   opt_out        "stop", "unsubscribe", "remove me", "do not contact": never "Buyer replied"; the person is set
 *                  aside by the existing suppression path, the account cools; it does not read as a conversation
 *   out_of_office  an auto-reply, out-of-office or delayed-response notice: pauses only that person until they are
 *                  back; never a live thread to answer
 *   bounce         a delivery failure notice: the address failed; never a reply
 *
 * Pure and deterministic over the text GAP already stores (subject, snippet, sender). It decides presentation and
 * priority only: the send gates, the disposition workflow and the suppression writers are unchanged. The live
 * cases: Walmart's whole reply "stop" read as "Buyer replied" on the cockpit; FedEx's "my responses will be
 * delayed" drove NEXT as an unanswered thread for 125 days. Pinned by tests/unit/gap/reply-classify.test.ts.
 */
import { AUTO_REPLY_SUBJECT } from './domains';

export type ReplyClassKind = 'human' | 'opt_out' | 'out_of_office' | 'bounce';

export interface ReplyClass {
  kind: ReplyClassKind;
  /** The seller word for the state line and the work card. */
  label: string;
  /** Does this reply hold every cold motion at the account (a human reply does; the others do not)? */
  pausesAccount: boolean;
  /** One sentence on what the class means for the next move. */
  consequence: string;
}

export const REPLY_CLASS_LABEL: Record<ReplyClassKind, string> = {
  human: 'Someone replied',
  opt_out: 'Opted out',
  out_of_office: 'Out of office',
  bounce: 'Address failed',
};

const CONSEQUENCE: Record<ReplyClassKind, string> = {
  human: 'Read it and record what they said before anyone at the account gets a cold email.',
  opt_out: 'They asked not to be contacted: record it as do not contact. No reply goes back.',
  out_of_office: 'An automatic notice, not an answer. Nothing to reply to; the person is reachable again later.',
  bounce: 'The address failed. Find a working address or the next person.',
};

/** A message that IS the refusal and nothing else: "stop", "STOP.", "unsubscribe", "remove me", "opt out". */
const OPT_OUT = /^\W*(?:please\s+)?(?:stop|unsubscribe(?:\s+me)?|remove\s+me|opt\s*out|take\s+me\s+off(?:\s+(?:your|this|the)\s+list)?)\W*$/i;
const OPT_OUT_ANYWHERE = /\b(?:unsubscribe me|remove me from (?:your|this|the) (?:list|emails?)|do not (?:contact|email) me(?: again)?|take me off (?:your|this|the) list|^\W*not interested\b)/i;
const OUT_OF_OFFICE_BODY = /\b(?:out of (?:the )?office|responses? (?:will|may) be delayed|delayed (?:response|reply)|limited access to (?:my )?e-?mail|on (?:vacation|holiday|leave|pto)|currently (?:traveling|travelling|away)|will (?:return|be back) on|automatic(?:ally)? (?:reply|generated)|auto-?reply|this is an automated)\b/i;
const BOUNCE_FROM = /^(?:mailer-daemon|postmaster|mail delivery (?:subsystem|system))\b/i;
const BOUNCE_SUBJECT = /^(?:undeliverable|delivery (?:status notification|failure)|mail delivery failed|returned mail|failure notice)/i;
const BOUNCE_BODY = /\b(?:delivery to the following recipient(?:s)? failed|could not be delivered|address not found|user unknown|mailbox (?:unavailable|full|not found)|550\s+5\.\d\.\d)\b/i;

export function classifyReply(input: { snippet: string | null | undefined; subject: string | null | undefined; from?: string | null }): ReplyClass {
  const snippet = (input.snippet ?? '').replace(/\s+/g, ' ').trim();
  const subject = (input.subject ?? '').trim();
  const from = (input.from ?? '').trim().toLowerCase();
  const kind: ReplyClassKind =
    BOUNCE_FROM.test(from) || BOUNCE_SUBJECT.test(subject) || BOUNCE_BODY.test(snippet)
      ? 'bounce'
      : AUTO_REPLY_SUBJECT.test(subject) || OUT_OF_OFFICE_BODY.test(snippet)
        ? 'out_of_office'
        : OPT_OUT.test(snippet) || OPT_OUT_ANYWHERE.test(snippet)
          ? 'opt_out'
          : 'human';
  return { kind, label: REPLY_CLASS_LABEL[kind], pausesAccount: kind === 'human', consequence: CONSEQUENCE[kind] };
}
