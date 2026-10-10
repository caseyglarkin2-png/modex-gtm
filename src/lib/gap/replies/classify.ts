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
 * A human reply also says WHAT kind of answer it is (R42, 2026-10-06), without changing its kind (it still pauses the
 * account and stops every cold follow-up there):
 *
 *   reply       a real answer (a question, a yes, a date)
 *   referral    they point to someone else ("I'm not the right person, talk to Bob"): the named person becomes a
 *               decision for the seller, never a cold target, never a relationship or a consent
 *   objection   they push back ("we already run a YMS", "not a priority this year"): acknowledge, test, record
 *
 * Pure and deterministic over the text GAP already stores (subject, snippet, sender). It decides presentation and
 * priority only: the send gates, the disposition workflow and the suppression writers are unchanged. The live
 * cases: Walmart's whole reply "stop" read as "Buyer replied" on the cockpit; FedEx's "my responses will be
 * delayed" drove NEXT as an unanswered thread for 125 days. Pinned by tests/unit/gap/reply-classify.test.ts.
 *
 * R42b (audit finding at 31f09c71): an out-of-office is an AUTOMATIC NOTICE, never a person answering. A message
 * that carries an Auto-Submitted or autoresponder header is rejected at ingestion (email/reply-precision.ts), so here
 * it is the canonical subject ("Automatic reply:", "Out of Office:") or the canonical notice body ("I am out of the
 * office until", "my responses will be delayed", "I will return on") WITH no first-person answer to our ask (no
 * question back, no yes, no day that works, no "send me"). "Sorry for the delayed response", "I was on vacation
 * last week" or "I'm out of the office this week but yes, send it" are people: they stay human, hold the account and
 * get a Work card. An explicit opt-out wins over an out-of-office notice in the same message ("I'm out of the office;
 * please remove me from your list" is an opt-out).
 */
import { AUTO_REPLY_SUBJECT } from './domains';

export type ReplyClassKind = 'human' | 'opt_out' | 'out_of_office' | 'bounce';
/** What a HUMAN reply is (R42); null for every other kind. */
export type HumanReplyKind = 'reply' | 'referral' | 'objection';

export interface ReplyClass {
  kind: ReplyClassKind;
  /** The seller word for the state line and the work card. */
  label: string;
  /** Does this reply hold every cold motion at the account (a human reply does; the others do not)? */
  pausesAccount: boolean;
  /** One sentence on what the class means for the next move. */
  consequence: string;
  /** R42: a real reply, a referral or an objection (human replies only). */
  human: HumanReplyKind | null;
}

export const HUMAN_REPLY_LABEL: Record<HumanReplyKind, string> = { reply: 'Someone replied', referral: 'They named someone', objection: 'They objected' };
const HUMAN_CONSEQUENCE: Record<HumanReplyKind, string> = {
  reply: 'Read it and record what they said.',
  referral: 'They pointed to someone else. Record who they named; how to approach them is your call.',
  objection: 'They pushed back. Acknowledge it, ask one question that tests it, and record it; no cold email here meanwhile.',
};

export const REPLY_CLASS_LABEL: Record<ReplyClassKind, string> = {
  human: 'Someone replied',
  opt_out: 'Opted out',
  out_of_office: 'Automatic reply',
  bounce: 'Address failed',
};

const CONSEQUENCE: Record<ReplyClassKind, string> = {
  human: 'Read it and record what they said.',
  opt_out: 'They asked not to be contacted: record it as do not contact. No reply goes back.',
  out_of_office: 'An automatic notice, not an answer. Nothing to reply to; the person is reachable again later.',
  bounce: 'The address failed. Find a working address or the next person.',
};

/** A message that IS the refusal and nothing else: "stop", "STOP.", "unsubscribe", "remove me", "opt out". */
const OPT_OUT = /^\W*(?:please\s+)?(?:stop|unsubscribe(?:\s+me)?|remove\s+me|opt\s*out|take\s+me\s+off(?:\s+(?:your|this|the)\s+list)?)\W*$/i;
const OPT_OUT_ANYWHERE = /\b(?:unsubscribe me|remove me from (?:your|this|the) (?:list|emails?)|do not (?:contact|email) me(?: again)?|take me off (?:your|this|the) list|^\W*not interested\b)/i;
/**
 * The canonical out-of-office NOTICE, in the present or the future: "I am out of the office until", "I'm currently on
 * vacation", "my responses will be delayed", "I will return on". Never an apology or the past ("sorry for the
 * delayed response", "I was out of the office"), which is a person writing back.
 */
const OUT_OF_OFFICE_NOTICE = /\b(?:(?:i\s+am|i'm|i\s+will\s+be|currently)\s+(?:(?:currently|now)\s+)?(?:out\s+of\s+(?:the\s+)?office|on\s+(?:vacation|holiday|leave|pto|parental\s+leave)|away\s+from\s+(?:the\s+)?office|traveling|travelling|ooo)\b|^\W*out\s+of\s+(?:the\s+)?office\b|out\s+of\s+(?:the\s+)?office\s+(?:until|through|from|and\s+will|with\s+limited)|responses?\s+(?:will|may)\s+be\s+delayed|(?:there\s+)?will\s+be\s+a\s+delay(?:ed)?\s+in\s+(?:my\s+)?(?:response|reply|responding)|limited\s+access\s+to\s+(?:my\s+)?e-?mail|will\s+(?:return|be\s+back)\s+(?:on|in\s+the\s+office|to\s+the\s+office)|automatic(?:ally)?\s+(?:reply|generated)|auto-?reply|this\s+is\s+an\s+automated)/i;
/**
 * A person answering us: a question back, a yes, a day that works, an ask for something. An automatic notice carries
 * none of these, so a notice phrase beside one of them is a person mentioning their week, not an auto-reply.
 */
const ANSWER_CUE = /\?|(?:^|[.!,;]\s*)(?:yes|yeah|yep|sure|absolutely|definitely)\b|\b(?:works\s+for\s+(?:me|us)|(?:monday|tuesday|wednesday|thursday|friday|tomorrow|next\s+week)\s+(?:works|is\s+(?:good|fine|great|open))|let'?s\s+(?:talk|meet|connect|chat|set|find|schedule|do)|send\s+(?:me|us|over)\b|set\s+up\s+(?:a|some)\s+time|(?:we|i)(?:'re|\s+are|'m|\s+am)\s+(?:interested|open\s+to)|sounds\s+(?:good|great)|count\s+me\s+in|happy\s+to\s+(?:talk|chat|meet|connect|hop\s+on|take\s+a\s+look))\b/i;
/** The canonical body of an automatic notice: the notice phrase, and no first-person answer to our ask. */
export function isOutOfOfficeNotice(text: string): boolean {
  return OUT_OF_OFFICE_NOTICE.test(text) && !ANSWER_CUE.test(text);
}
const BOUNCE_FROM = /^(?:mailer-daemon|postmaster|mail delivery (?:subsystem|system))\b/i;
const BOUNCE_SUBJECT = /^(?:undeliverable|delivery (?:status notification|failure)|mail delivery failed|returned mail|failure notice)/i;
/** "Not the right person", "talk to Bob", "I've copied my colleague": the answer points elsewhere. */
const REFERRAL = /\b(?:not the (?:right|best) (?:person|contact)|wrong person|(?:is|would be) (?:the )?(?:right|better|best) (?:person|contact)|better (?:person|contact) (?:to|for)|you should (?:talk|speak|reach out|connect) (?:to|with)|please (?:reach out|talk|speak) (?:to|with)|reach out to|(?:talk|speak) (?:to|with) my (?:colleague|boss|manager|team)|i(?:'ve| have) (?:copied|cc'?d|looped in|forwarded (?:this|your (?:email|note)) to)|looping in|copying (?:my|our|in)|adding my colleague|owns? (?:this|that|our yards?) (?:now|here)?)\b/i;
/** "We already run a YMS", "not a priority", "no budget this year": a push back that is still a conversation. */
const OBJECTION = /\b(?:we already (?:have|use|run)|already (?:have|use|run) (?:a|an|our) (?:yms|yard|system|solution|tool)|(?:is )?not a priority|no budget|not in (?:the|our) budget|happy with (?:our|what we|the current)|locked (?:in|into)|under contract with|we use \w+ for (?:that|this|our yards?)|built (?:it|our own|one) in-house|not a fit (?:for us)?|we(?:'re| are) (?:all )?set (?:on|for) (?:that|this|yards?))\b/i;
const BOUNCE_BODY = /\b(?:delivery to the following recipient(?:s)? failed|could not be delivered|address not found|user unknown|mailbox (?:unavailable|full|not found)|550\s+5\.\d\.\d)\b/i;

/**
 * THE one reading of "a person wrote back" (the lead's general defect, 2026-10-07): a person (a reply, a referral, an
 * objection) or an opt-out, read from the message TEXT and the subject; never an automatic notice or a bounce. The
 * account hold, the follow-up stop and learning's "replied" all read this, so a body-only out-of-office notice stops
 * nothing and counts as no reply anywhere.
 */
export function isPersonReply(m: { text?: string | null; snippet?: string | null; subject?: string | null; from?: string | null }): boolean {
  const kind = classifyReply({ snippet: m.text || m.snippet || '', subject: m.subject, from: m.from }).kind;
  return kind === 'human' || kind === 'opt_out';
}

export function classifyReply(input: { snippet: string | null | undefined; subject: string | null | undefined; from?: string | null }): ReplyClass {
  const snippet = (input.snippet ?? '').replace(/\s+/g, ' ').trim();
  const subject = (input.subject ?? '').trim();
  const from = (input.from ?? '').trim().toLowerCase();
  // Order: a bounce is a delivery failure; an explicit opt-out wins over a notice in the same message (it stops
  // everything, an out-of-office only pauses the person); then the canonical auto-reply subject or notice body.
  const kind: ReplyClassKind =
    BOUNCE_FROM.test(from) || BOUNCE_SUBJECT.test(subject) || BOUNCE_BODY.test(snippet)
      ? 'bounce'
      : OPT_OUT.test(snippet) || OPT_OUT_ANYWHERE.test(snippet)
        ? 'opt_out'
        : AUTO_REPLY_SUBJECT.test(subject) || isOutOfOfficeNotice(snippet)
          ? 'out_of_office'
          : 'human';
  if (kind !== 'human') return { kind, label: REPLY_CLASS_LABEL[kind], pausesAccount: false, consequence: CONSEQUENCE[kind], human: null };
  const human: HumanReplyKind = REFERRAL.test(snippet) ? 'referral' : OBJECTION.test(snippet) ? 'objection' : 'reply';
  return { kind, label: HUMAN_REPLY_LABEL[human], pausesAccount: true, consequence: HUMAN_CONSEQUENCE[human], human };
}
