/**
 * THE PREPARED ANSWER TO A REPLY (GAP OS execution recovery, R42b, 2026-10-06). Pure and client-safe.
 *
 * What the buyer asked is read from their actual message (every sentence that asks, each with its topic), and GAP
 * prepares an EDITABLE answer from what it can cite: the materials that exist for the account (Ours), and beside the
 * text the buyer's own confirmed words, the public fact the conversation started from and the last touch on record,
 * each with its trust word. Anything GAP cannot answer becomes an explicit "missing information" line AND a visible
 * placeholder in the text ("[Fill in: ...]"), so the seller sees exactly what to write; nothing goes out while a
 * placeholder remains (execution/seller-reply.ts refuses it).
 *
 * GAP never invents: no price, no availability or time, no attachment it does not hold, no commitment, no date or
 * outcome, no buyer agreement. Those asks are always missing information, never prepared values.
 *
 * Kinds that prepare NO answer: an opt-out (no reply goes back; it stops everything), a referral (record who they
 * named; the seller decides how to approach them), an automatic notice and a bounce. A reply that can be prepared but
 * not sent from GAP (no Gmail thread on record: it came through HubSpot's inbox; no GAP mailbox sender) is PARTIAL
 * and names that dependency; it is never "a later version".
 */
import { classifyReply } from './classify';
import { parseDuePhrase, type ParsedDay } from '../work/dates';

export type AskTopic = 'pricing' | 'security_legal' | 'commitment' | 'material' | 'availability' | 'question';

export interface Ask {
  /** The buyer's sentence, verbatim. */
  text: string;
  topic: AskTopic;
  /** What they asked for, when they asked for a thing ("the two-site comparison"). */
  thing: string | null;
  /** A day their sentence names (theirs, never a confirmed time). */
  day: ParsedDay | null;
}

export type AnswerTrust = 'Buyer confirmed' | 'Public source' | 'Recorded' | 'Ours';

export interface KnownFact {
  text: string;
  trust: AnswerTrust;
  source: string | null;
  href?: string | null;
}

export interface PreparedAnswer {
  /** ready: prepared and every action is available; partial: prepared, but drafting and sending depend on `dependency`; none: no reply is prepared (`why`). */
  status: 'ready' | 'partial' | 'none';
  why: string | null;
  dependency: string | null;
  to: string;
  subject: string;
  body: string;
  asks: Ask[];
  /** One line per thing GAP cannot answer, in the order they asked. */
  missing: string[];
  known: KnownFact[];
}

export const PLACEHOLDER = /\[Fill in:[^\]]*\]/g;
/** The placeholders still in a text (nothing is drafted or sent while one remains). */
export function unfilledPlaceholders(body: string): string[] {
  return body.match(PLACEHOLDER) ?? [];
}

const sentences = (text: string) => (text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);
const ASKS = /\?\s*$|^(?:can|could|would|will|do|does|is|are|what|when|how|who|where|which)\b|\b(?:send|share|forward) (?:me|us|over|along)\b|\bplease (?:send|share|call|let me know|confirm)\b|\blet me know\b/i;
const PRICING = /\b(?:price|pricing|cost|costs|quote|how much|budget|fees?|licens(?:e|ing)|per (?:site|yard|month|year|dock))\b/i;
const SECURITY = /\b(?:security|soc ?2|iso ?27001|insurance|msa|nda|contract|legal|terms and conditions|procurement|vendor (?:form|onboarding|setup)|w-?9|data (?:privacy|protection))\b/i;
const COMMITMENT = /\b(?:guarantee|commit(?:ment)?|by when|how long|timeline|go(?:ing)? live|live by|deliver(?:ed)? by|deadline|sla|implementation time)\b/i;
const MATERIAL = /\b(?:send|share|forward|attach)\b|\b(?:deck|case stud(?:y|ies)|one-?pager|comparison|report|pdf|slides|overview|proposal|references?|demo)\b/i;
const AVAILABILITY = /\b(?:available|availability|free (?:on|at|for|to)|a call|on a call|meet(?:ing)?|chat|calendar|schedule|time to talk|monday|tuesday|wednesday|thursday|friday|next week|tomorrow)\b/i;
const THING = /(?:send|share|forward|attach)\s+(?:me|us|over|along)?\s*(?:over\s+)?((?:the|a|an|your|some|any)\s+[^,.?;!]+?|[^,.?;!]+?)(?=\s+(?:by|before|on|this|next|when|so|and then|if)\b|[,.?;!]|$)/i;
const NOUN_THING = /\b((?:the|a|an|your)\s+(?:[\w-]+\s+){0,3}(?:deck|case stud(?:y|ies)|one-?pager|comparison|report|pdf|slides|overview|proposal|references?|demo))\b/i;

/** Every sentence that asks something, with its topic. Their words, never paraphrased. */
export function readAsks(text: string, now: Date): Ask[] {
  const out: Ask[] = [];
  for (const s of sentences(text)) {
    if (!ASKS.test(s)) continue;
    const topic: AskTopic = PRICING.test(s) ? 'pricing' : SECURITY.test(s) ? 'security_legal' : COMMITMENT.test(s) ? 'commitment' : MATERIAL.test(s) ? 'material' : AVAILABILITY.test(s) ? 'availability' : 'question';
    const thing = topic === 'material' ? (THING.exec(s)?.[1] ?? NOUN_THING.exec(s)?.[1] ?? null)?.replace(/\s+/g, ' ').trim() ?? null : null;
    out.push({ text: s, topic, thing, day: parseDuePhrase(s, now) });
  }
  return out;
}

export interface AnswerInput {
  messageText: string;
  subject: string | null;
  from: string;
  fromName: string | null;
  now: Date;
  /** Batch item 8: when they wrote it; a day their words name ("by Friday") is read from then. */
  receivedAt?: string | null;
  /** The account's materials that exist (Ours). */
  materials: ReadonlyArray<{ kind: string; label: string; href: string }>;
  /** This person's own confirmed words (Buyer confirmed). */
  confirmed: ReadonlyArray<{ type: string; quote: string; at: string }>;
  /** The public fact the conversation started from (the thesis's primary fact), when one exists. */
  story: { title: string; url: string | null; at: string | null } | null;
  /** The last touch GAP recorded to this person. */
  lastTouch: { subject: string; at: string } | null;
  /** A dependency that keeps GAP from drafting or sending (no Gmail thread, no GAP mailbox sender), else null. */
  dependency: string | null;
}

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const firstName = (fromName: string | null, from: string) => (fromName?.trim().split(/\s+/)[0] || from.split('@')[0].split(/[._-]/)[0]).replace(/^\w/, (c) => c.toUpperCase());

/** The material GAP holds for an ask, matched by an explicit word only (a demo, an overview page); else none. */
function materialFor(thing: string, materials: AnswerInput['materials']) {
  const t = thing.toLowerCase();
  if (/\bdemo\b/.test(t)) return materials.find((m) => m.kind === 'demo') ?? null;
  if (/\b(?:overview|more information|more info|details about (?:you|yardflow))\b/.test(t)) return materials.find((m) => m.kind === 'microsite') ?? null;
  return null;
}

export function prepareAnswer(i: AnswerInput): PreparedAnswer {
  const c = classifyReply({ snippet: i.messageText, subject: i.subject, from: i.from });
  const subject = `Re: ${(i.subject ?? '').replace(/^\s*(?:re:\s*)+/i, '').trim() || 'your note'}`;
  const none = (why: string): PreparedAnswer => ({ status: 'none', why, dependency: null, to: i.from, subject, body: '', asks: [], missing: [], known: [] });
  if (c.kind === 'opt_out') return none('They opted out: no reply goes back, and nothing else goes to them. Record it as do not contact.');
  if (c.kind === 'out_of_office') return none('An automatic notice: there is nothing to answer.');
  if (c.kind === 'bounce') return none('The address failed: there is nobody to answer.');
  if (c.human === 'referral') return none('A referral prepares no reply: record who they named; you decide how to approach them (no cold email to them).');

  const written = i.receivedAt && !Number.isNaN(Date.parse(i.receivedAt)) ? new Date(i.receivedAt) : i.now;
  const asks = readAsks(i.messageText, written);
  const missing: string[] = [];
  const lines: string[] = [];
  const known: KnownFact[] = [];
  for (const a of asks) {
    const quoted = `"${a.text}"`;
    if (a.topic === 'pricing') {
      missing.push(`Pricing (${quoted}): GAP holds no price for them; you decide what to quote.`);
      lines.push('[Fill in: your answer on pricing.]');
    } else if (a.topic === 'security_legal') {
      missing.push(`Security, legal or contract (${quoted}): GAP records no such answer or approval.`);
      lines.push('[Fill in: your answer on the security, legal or contract question.]');
    } else if (a.topic === 'commitment') {
      missing.push(`Timing or a commitment (${quoted}): GAP never promises a date or an outcome for you.`);
      lines.push('[Fill in: your answer on timing.]');
    } else if (a.topic === 'material') {
      const m = a.thing ? materialFor(a.thing, i.materials) : null;
      if (m) {
        lines.push(`Here is ${m.label}: ${m.href}`);
        known.push({ text: m.label, trust: 'Ours', source: 'what already exists for the account', href: m.href });
      } else {
        missing.push(`${a.thing ? a.thing.replace(/^\w/, (x) => x.toUpperCase()) : 'What they asked you to send'} (${quoted}): GAP holds no such material; attach it yourself or say when it will come.`);
        lines.push(`[Fill in: ${a.thing ?? 'what they asked for'}, or when you will send it.]`);
      }
      if (a.day) missing.push(`They named ${a.day.phrase} for it: confirm the day yourself; GAP does not promise it.`);
    } else if (a.topic === 'availability') {
      missing.push(`Your availability (${quoted}): GAP does not know your calendar${a.day ? `; they named ${a.day.phrase}` : ''}.`);
      lines.push(a.day ? `[Fill in: whether ${a.day.phrase} works for you, and a time.]` : '[Fill in: times that work for you.]');
    } else {
      missing.push(`Your answer to ${quoted}.`);
      lines.push(`[Fill in: your answer to ${quoted}]`);
    }
  }
  if (c.human === 'objection') {
    const said = sentences(i.messageText)[0] ?? i.messageText;
    lines.unshift(`[Fill in: acknowledge "${said}" and ask one question that tests it.]`);
    missing.unshift(`Your response to their objection ("${said}"): acknowledge it and ask one question; do not argue.`);
  }
  if (lines.length === 0) {
    missing.push('Your answer to what they wrote: they asked nothing GAP could read as a question.');
    lines.push('[Fill in: your answer to what they wrote.]');
  }
  for (const b of i.confirmed.slice(0, 3)) known.push({ text: `"${b.quote}"`, trust: 'Buyer confirmed', source: `${i.fromName ?? i.from}, ${dayOf(b.at)}` });
  if (i.story) known.push({ text: i.story.title, trust: 'Public source', source: `the fact your first note cited${i.story.at ? `, ${dayOf(i.story.at)}` : ''}`, href: i.story.url });
  if (i.lastTouch) known.push({ text: `Your last note: "${i.lastTouch.subject}"`, trust: 'Recorded', source: dayOf(i.lastTouch.at) });
  const body = [`Hi ${firstName(i.fromName, i.from)},`, '', c.human === 'objection' ? 'Thanks for telling me straight.' : 'Thanks for getting back to me.', '', ...lines.flatMap((l, n) => (n ? ['', l] : [l]))].join('\n');
  return { status: i.dependency ? 'partial' : 'ready', why: null, dependency: i.dependency, to: i.from, subject, body, asks, missing, known };
}
