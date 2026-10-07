/**
 * THE PREPARED REPLY (GAP OS execution recovery, R42, 2026-10-06). Pure and client-safe.
 *
 * What the seller sees beside an incoming message on Work and on the account page: the message itself (who, when,
 * the subject, their words), what KIND of answer it is (a real reply, a referral, an objection, an opt-out, an
 * automatic notice, a bounce: replies/classify.ts), a few prepared notes read off their words (what they asked, the
 * day they named, who they named), where to answer it (the Gmail thread) and where to record it (the triage form).
 *
 * There is no governed reply copy family (the compiler's families are first touches), and no model is asked for words:
 * the notes are deterministic, built from the message alone (`copyFamily` stays null). R42b: a real reply or an
 * objection is ANSWERABLE: the panel prepares an editable answer from what they asked (replies/answer.ts), with what GAP
 * can cite and what is missing, and copying, a Gmail draft and a send stay three distinct, gated actions
 * (execution/seller-reply.ts, seller-send.ts). A referral or an opt-out prepares no answer and says why
 * (`noAnswerLine`). Pinned by tests/unit/gap/reply-prep.test.ts and reply-answer.test.tsx.
 */
import { classifyReply, type HumanReplyKind, type ReplyClassKind } from './classify';
import { dayLabel, nyDay, parseDuePhrase, parseReturnDate, type ParsedDay } from '../work/dates';

/** R42b: why a reply prepares no answer (said on the card instead of an answer). */
export const NO_ANSWER_REFERRAL = 'A referral prepares no reply here: record who they named; you decide how to approach them.';
export const NO_ANSWER_OPT_OUT = 'An opt-out: no reply goes back, and nothing else goes to them.';

export interface ReplyPrepInput {
  id: string;
  from: string;
  fromName?: string | null;
  subject: string | null;
  snippet: string;
  receivedAt: string;
  threadId?: string | null;
  accountName: string;
}

export interface ReplyPrep {
  messageId: string;
  from: string;
  fromName: string | null;
  at: string;
  subject: string | null;
  snippet: string;
  kind: ReplyClassKind;
  human: HumanReplyKind | null;
  label: string;
  /** Always null: no governed reply copy family exists; the answer is prepared from their message and edited by the seller. */
  copyFamily: null;
  /** R42b: a real reply or an objection: the panel prepares an editable answer (never sent without the seller). */
  answerable: boolean;
  /** R42b: why no answer is prepared (a referral, an opt-out), else null. */
  noAnswerLine: string | null;
  notes: string[];
  /** Answer it here: the Gmail thread in the GAP mailbox (or a search for the sender when the thread is unknown). */
  threadHref: string;
  /** Record what they said (the disposition), or null when there is nothing to record. */
  record: { href: string; label: string } | null;
  /** A referral: the name or address their words name, for the seller to confirm. */
  named: string | null;
  /** A day their words name (a proposed meeting day, a not-now date, an out-of-office return). */
  day: ParsedDay | null;
}

const sentences = (text: string) => (text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);
const ASK = /\?\s*$|^(?:can|could|would|will) you\b|\b(?:send|share) (?:me|us|over)\b|\bplease (?:send|share|call)\b/i;
/** "talk to Bob Lane", "reach out to bob.lane@x.com", "speak with Maria in operations": the person they point to. */
const NAMED = /\b(?:talk|speak|reach out|connect|get in touch)\s+(?:to|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|[\w.+-]+@[\w-]+\.[\w.]+)/;
const NAMED_LOOSE = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:is|would be|owns|runs|handles)\b/;
const OBJECTION_LINE = /\b(?:already|not a priority|no budget|happy with|locked|under contract|in-house|not a fit|all set)\b/i;

/** The Gmail thread in the seller's GAP mailbox, else a search for the sender there (never whichever account is /u/0). */
export function threadLink(threadId: string | null | undefined, from: string, mailbox: string | null | undefined): string {
  const who = mailbox ? `?authuser=${encodeURIComponent(mailbox)}` : '';
  if (threadId) return `https://mail.google.com/mail/u/0/${who}#all/${encodeURIComponent(threadId)}`;
  return `https://mail.google.com/mail/u/0/${who}#search/${encodeURIComponent(`from:"${from}"`)}`;
}

export function detectNamed(text: string): string | null {
  return NAMED.exec(text)?.[1]?.trim() ?? NAMED_LOOSE.exec(text)?.[1]?.trim() ?? null;
}

export function prepareReply(r: ReplyPrepInput, opts: { mailbox?: string | null; now: Date }): ReplyPrep {
  const c = classifyReply({ snippet: r.snippet, subject: r.subject, from: r.from });
  const words = r.snippet.replace(/\s+/g, ' ').trim();
  const lines = sentences(words);
  // Batch item 8: a day the message names is read from when it was written, never from today's read.
  const written = Number.isNaN(Date.parse(r.receivedAt)) ? opts.now : new Date(r.receivedAt);
  const who = r.fromName?.trim() || r.from;
  const notes: string[] = [];
  let named: string | null = null;
  let day: ParsedDay | null = null;
  let record: ReplyPrep['record'] = { href: '/gap?lane=replies', label: 'Record what they said' };
  if (c.kind === 'human') {
    const ask = lines.find((s) => ASK.test(s));
    day = parseDuePhrase(words, written);
    if (c.human === 'referral') {
      named = detectNamed(words);
      notes.push(`They pointed to ${named ?? 'someone else'}. Thank them and ask for the introduction.`);
      notes.push(`${named ?? 'The person they named'} gets no cold email: record the referral and GAP lists them as named by ${who}; you decide how to approach them.`);
      record = { href: '/gap?lane=replies', label: 'Record who they named' };
    } else if (c.human === 'objection') {
      const objection = lines.find((s) => OBJECTION_LINE.test(s)) ?? lines[0] ?? words;
      notes.push(`They pushed back: "${objection}". Acknowledge it and ask one question that tests it; do not argue.`);
      notes.push('Record it as an objection (an existing solution, or not a priority) so the account cools.');
      record = { href: '/gap?lane=replies', label: 'Record the objection' };
    } else {
      if (ask) notes.push(`They asked: "${ask}". Answer that first.`);
      if (day) notes.push(`They named a day: ${day.phrase} (${dayLabel(day.day, opts.now)}${day.ambiguous ? ', check which one they mean' : ''}). Offer a time then, or ask what suits.`);
      if (!ask && !day) notes.push('Thank them and answer what they wrote, in the thread, in a few lines.');
    }
    notes.push('Then record what they said; the next step follows from it, and nobody at the account gets a cold email until then.');
  } else if (c.kind === 'opt_out') {
    notes.push('No reply goes back.');
    notes.push('Record it as do not contact; the person is set aside and the account cools.');
    record = { href: '/gap?lane=replies', label: 'Record the opt-out' };
  } else if (c.kind === 'out_of_office') {
    day = parseReturnDate(words, written);
    notes.push('An automatic notice: there is nothing to answer.');
    const backPast = !!day && day.day < nyDay(opts.now);
    notes.push(day ? (backPast ? `They were due back ${dayLabel(day.day, opts.now)}: the follow-up is due.` : `They are back ${dayLabel(day.day, opts.now)}: the follow-up waits until then.`) : 'The notice names no return day.');
    record = null;
  } else {
    notes.push('The address failed: find a working address or the next person.');
    record = { href: `/gap/accounts/${r.accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`, label: 'Find a working address' };
  }
  return {
    messageId: r.id,
    from: r.from,
    fromName: r.fromName?.trim() || null,
    at: r.receivedAt,
    subject: r.subject,
    snippet: words,
    kind: c.kind,
    human: c.human,
    label: c.label,
    copyFamily: null,
    answerable: c.kind === 'human' && c.human !== 'referral',
    noAnswerLine: c.kind === 'human' && c.human === 'referral' ? NO_ANSWER_REFERRAL : c.kind === 'opt_out' ? NO_ANSWER_OPT_OUT : null,
    notes,
    threadHref: threadLink(r.threadId, r.from, opts.mailbox),
    record,
    named,
    day,
  };
}
