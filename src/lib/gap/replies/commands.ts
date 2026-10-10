/**
 * EMAIL COMMANDS, judged (X07a, GAP OS sales execution engine, 2026-10-08). Pure.
 *
 * The seller replies to a GAP assignment (X06) or briefing (X05) in the GAP mailbox. The mailbox cron (gap-mailbox.ts)
 * asks this module two things before it does anything else with the message: is it a command (a reply in a thread
 * GAP sent, or naming a GAP message id), and is it AUTHENTICATED (the independent review's B5):
 *   1. the sender is one of the configured command senders (work/settings.ts; the GAP mailbox itself is refused there)
 *   2. the message sits in the Gmail thread of a recorded assignment or briefing, or its In-Reply-To / References
 *      name one of their RFC message ids
 *   3. Gmail's Authentication-Results shows `dmarc=pass` with `header.from` aligned to the From domain (freightroll.com
 *      and yardflow.ai both publish SPF including Google and a DMARC record, checked 2026-10-08)
 *   4. not auto-submitted (Auto-Submitted other than "no", the vendor autoresponder headers, Precedence bulk/junk/
 *      list/auto_reply) and not a forward (a Fwd: subject or a forwarded-message marker as the first line)
 * The PARSER reads the first non-quoted line only: APPROVE | REVISE: words | SKIP [reason] | DEFER [when] | DONE: what
 * happened | NEXT | HELP | START | ITEM [n]. A line of sentence length that is none of these is REVISE with the body as
 * the critique (the mandate's example); a short unknown line is `unknown` and draws one HELP reply. A command word
 * inside quoted text is never read. Effects live in commands-apply.ts (X07b); nothing here writes or sends.
 *
 * Direct selection (GUI-09, the Gmail action UI audit, 2026-10-10): `ITEM 6`, `OPEN 6` and `SEND ME 6` select item 6
 * of the day's plan (`ITEM #6` and `item 6 please` read the same); `ITEM` with no number asks for the list. OPEN and
 * SEND ME count only WITH a number: a reply that opens "Open to that, but make it shorter and lead with the gate" is a
 * critique, never a selection.
 */
import type { MailboxMessage } from '@/lib/email/gmail-inbox';

export type ParsedCommand =
  | { kind: 'approve' }
  | { kind: 'revise'; text: string }
  | { kind: 'skip'; reason: string | null }
  | { kind: 'defer'; when: string | null }
  | { kind: 'done'; note: string | null }
  | { kind: 'next' }
  | { kind: 'help' }
  | { kind: 'start' }
  /** GUI-09: item `n` of the day's plan (1-based); null asks for the list. */
  | { kind: 'item'; n: number | null }
  | { kind: 'unknown'; line: string };

export interface AssignmentRef {
  itemKey: string;
  itemToken: string;
  revision: number;
  contentHash: string;
  day: string;
}
export interface BriefingRef {
  day: string;
  dayToken: string;
}

export interface CommandContext {
  /** Lowercase addresses allowed to command (work/settings.ts commandSenders). */
  senders: readonly string[];
  assignmentsByThread: Map<string, AssignmentRef>;
  assignmentsByMessageId: Map<string, AssignmentRef>;
  briefingsByThread: Map<string, BriefingRef>;
}

export type CommandTarget = ({ kind: 'assignment' } & AssignmentRef) | ({ kind: 'briefing' } & BriefingRef);

export type CommandAuth =
  | { ok: true; target: CommandTarget; bound: 'thread' | 'message_id' }
  | { ok: false; reason: 'sender_not_allowed' | 'no_assignment_match' | 'no_authentication_results' | 'dmarc_not_passed' | 'dmarc_not_aligned' | 'auto_submitted' | 'forwarded' };

const lower = (s: string | null | undefined) => String(s ?? '').trim().toLowerCase();
const header = (h: Record<string, string> | undefined, name: string): string => {
  if (!h) return '';
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? h[key] : '';
};
/** A sentence-length line (eight or more words) that is no command reads as a critique. */
export const REVISE_MIN_WORDS = 8;
const FORWARD_SUBJECT = /^\s*(fwd?|fw|tr|wg)\s*:/i;
const FORWARD_MARKER = /^-{2,}\s*forwarded message\s*-{2,}|^begin forwarded message:/i;

/** The text the command is read from: the quote-stripped text, else the HTML with tags removed and the quoted history cut. */
export function commandTextOf(m: Pick<MailboxMessage, 'bodyText' | 'bodyHtml'>): string {
  if (m.bodyText && m.bodyText.trim()) return m.bodyText;
  const html = m.bodyHtml ?? '';
  if (!html.trim()) return '';
  const cut = html.split(/<div[^>]*class="?gmail_quote|<blockquote/i)[0];
  return cut
    .replace(/<(br|\/p|\/div|\/li|\/tr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/** The first line that is not blank and not quoted. */
function firstLine(text: string): string {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('>')) continue;
    return line;
  }
  return '';
}

/** The body from the first command line on (a REVISE critique may run several lines). */
function fromFirstLine(text: string): string {
  const lines = text.split(/\r?\n/);
  const i = lines.findIndex((l) => l.trim() && !l.trim().startsWith('>'));
  if (i < 0) return '';
  const out: string[] = [];
  for (const l of lines.slice(i)) {
    if (l.trim().startsWith('>')) break;
    if (/^On .+ wrote:$/.test(l.trim())) break;
    out.push(l);
  }
  return out.join('\n').trim();
}

/** The words after the command word: the leading separator goes, the seller's own punctuation stays. */
const strip = (s: string) => s.replace(/^[\s:,\-–]+/, '').trim();

/** GUI-09: `ITEM 6` | `ITEM #6` | `OPEN 6` | `SEND ME 6` (the number required for OPEN and SEND ME); `ITEM` alone is the list. */
const SELECT_WITH_NUMBER = /^(?:item|open|send\s+me)\s*#?\s*(\d{1,3})(?!\d)/i;
const SELECT_LIST = /^item(?![a-z])/i;

/** The selection a first line makes, or null when it makes none. Exported for the renderers' no-command-line rule. */
export function parseSelection(line: string): Extract<ParsedCommand, { kind: 'item' }> | null {
  const m = SELECT_WITH_NUMBER.exec(line.trim());
  if (m) return { kind: 'item', n: Number(m[1]) };
  if (SELECT_LIST.test(line.trim())) return { kind: 'item', n: null };
  return null;
}

export function parseCommand(text: string): ParsedCommand {
  const line = firstLine(text);
  const body = fromFirstLine(text);
  const selection = parseSelection(line);
  if (selection) return selection;
  const word = /^([A-Za-z]+)\b/.exec(line)?.[1]?.toUpperCase() ?? '';
  const rest = (s: string) => strip(s.replace(/^[A-Za-z]+/, ''));
  switch (word) {
    case 'APPROVE':
    case 'APPROVED':
      return { kind: 'approve' };
    case 'REVISE': {
      const t = strip(body.replace(/^[A-Za-z]+/, ''));
      return { kind: 'revise', text: t };
    }
    case 'SKIP':
      return { kind: 'skip', reason: rest(line) || null };
    case 'DEFER':
      return { kind: 'defer', when: rest(line) || null };
    case 'DONE':
      return { kind: 'done', note: strip(body.replace(/^[A-Za-z]+/, '')) || null };
    case 'NEXT':
      return { kind: 'next' };
    case 'HELP':
      return { kind: 'help' };
    case 'START':
      return { kind: 'start' };
    default:
      break;
  }
  const words = line.split(/\s+/).filter(Boolean).length;
  if (words >= REVISE_MIN_WORDS) return { kind: 'revise', text: body };
  return { kind: 'unknown', line };
}

/** The assignment or briefing a message is a reply to: by its Gmail thread, else by the message ids it names. */
export function matchCommandTarget(m: Pick<MailboxMessage, 'threadId' | 'headers'>, ctx: CommandContext): { target: CommandTarget; bound: 'thread' | 'message_id' } | null {
  const a = ctx.assignmentsByThread.get(m.threadId);
  if (a) return { target: { kind: 'assignment', ...a }, bound: 'thread' };
  const b = ctx.briefingsByThread.get(m.threadId);
  if (b) return { target: { kind: 'briefing', ...b }, bound: 'thread' };
  const named = `${header(m.headers, 'In-Reply-To')} ${header(m.headers, 'References')}`.match(/<[^>]+>/g) ?? [];
  for (const id of named) {
    const ref = ctx.assignmentsByMessageId.get(id);
    if (ref) return { target: { kind: 'assignment', ...ref }, bound: 'message_id' };
  }
  return null;
}

function isAutoSubmitted(h: Record<string, string> | undefined): boolean {
  const auto = header(h, 'Auto-Submitted');
  if (auto && lower(auto.split(';')[0]) !== 'no') return true;
  if (['X-Autoreply', 'X-Autorespond', 'X-Auto-Reply-From', 'X-Autoresponder'].some((n) => header(h, n))) return true;
  const prec = lower(header(h, 'Precedence'));
  return ['bulk', 'junk', 'list', 'auto_reply'].includes(prec);
}

function dmarc(h: Record<string, string> | undefined, fromDomain: string): CommandAuth | null {
  const ar = header(h, 'Authentication-Results') || header(h, 'ARC-Authentication-Results');
  if (!ar) return { ok: false, reason: 'no_authentication_results' };
  const parts = ar.split(';').map((p) => p.trim());
  const d = parts.find((p) => /^dmarc=/i.test(p));
  if (!d || !/^dmarc=pass\b/i.test(d)) return { ok: false, reason: 'dmarc_not_passed' };
  const from = /header\.from=([^\s;]+)/i.exec(d)?.[1] ?? /header\.from=([^\s;]+)/i.exec(ar)?.[1] ?? '';
  if (lower(from) !== fromDomain) return { ok: false, reason: 'dmarc_not_aligned' };
  return null;
}

export function authenticateCommand(m: Pick<MailboxMessage, 'fromEmail' | 'threadId' | 'headers' | 'subject' | 'bodyText' | 'bodyHtml'>, ctx: CommandContext): CommandAuth {
  const from = lower(m.fromEmail);
  if (!from || !ctx.senders.map(lower).includes(from)) return { ok: false, reason: 'sender_not_allowed' };
  const match = matchCommandTarget(m, ctx);
  if (!match) return { ok: false, reason: 'no_assignment_match' };
  if (isAutoSubmitted(m.headers)) return { ok: false, reason: 'auto_submitted' };
  if (FORWARD_SUBJECT.test(m.subject ?? '') || FORWARD_MARKER.test(firstLine(commandTextOf(m)))) return { ok: false, reason: 'forwarded' };
  const failed = dmarc(m.headers, from.split('@')[1] ?? '');
  if (failed) return failed;
  return { ok: true, target: match.target, bound: match.bound };
}
