/**
 * THE MORNING BRIEFING, rendered (X05a, GAP OS sales execution engine, 2026-10-08). Pure: the day's plan (work/plan.ts)
 * in, a subject, a plain-text body and an HTML body out. The cron (X05b) sends it from the GAP identity to the
 * seller's configured address.
 *
 * Rules (pinned by tests/unit/gap/briefing.test.ts):
 *   - the subject names the day, how many items need the seller and the day token in brackets (`[GAP#<token>]`),
 *     which a reply keeps, so the mailbox cron can bind a START or NEXT reply to this day (X07)
 *   - the items are listed in the plan's order: account, what, who, why, the link; the START link leads
 *   - NO line of the body starts with a command word: a reply that quotes the body must never read as a command
 *   - the commands footer appears only when email commands are enabled (X07); before that the links are the way
 *   - when nothing needs the seller the briefing says so in words; the legacy pipeline digest is named while it runs
 */
import type { DayPlan, PlanItem } from './plan';

/** The reply commands (X07). Named here so the render can keep every body line clear of them. */
export const COMMAND_WORDS = ['APPROVE', 'REVISE', 'SKIP', 'DEFER', 'DONE', 'NEXT', 'HELP', 'START'] as const;

export interface BriefingLinks {
  start: string;
  work: string;
  item: (it: PlanItem) => string;
}

export interface BriefingInput {
  plan: DayPlan;
  dayToken: string;
  links: BriefingLinks;
  commandsEnabled: boolean;
  /** The legacy HubSpot pipeline digest (cron daily-digest) still runs: say so until Casey retires it (X19). */
  legacyDigest: boolean;
}

export interface RenderedBriefing {
  subject: string;
  text: string;
  html: string;
}

const dayLabel = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const endSentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

function who(it: PlanItem): string | null {
  if (!it.person?.name) return null;
  return it.person.title ? `${it.person.name} (${it.person.title})` : it.person.name;
}

/** One item line: "1. Boston Beer: Someone replied. Phil Savastano (VP Operations). Phil Savastano wrote Oct 8." */
export function itemLine(it: PlanItem, n: number): string {
  const parts = [endSentence(it.title), who(it) ? endSentence(who(it) as string) : null, it.why ? endSentence(it.why) : null].filter((x): x is string => !!x);
  return `${n}. ${it.accountName}: ${parts.join(' ')}`;
}

export function renderBriefing(input: BriefingInput, now: Date): RenderedBriefing {
  const { plan, links } = input;
  const label = dayLabel(plan.day);
  const n = plan.items.length;
  const countText = n === 0 ? 'nothing needs you' : `${n} need${n === 1 ? 's' : ''} you`;
  const subject = `GAP today, ${label}: ${countText} [GAP#${input.dayToken}]`;
  const c = plan.counts;

  const lines: string[] = [];
  const html: string[] = [];
  lines.push(`Good morning. Here is ${label} from GAP, in order.`);
  html.push(`<p>Good morning. Here is ${esc(label)} from GAP, in order.</p>`);
  if (n === 0) {
    lines.push('', 'Nothing on the list needs you today. Open Work to see what is waiting and what is parked.');
    html.push('<p>Nothing on the list needs you today. Open Work to see what is waiting and what is parked.</p>');
  } else {
    lines.push('', `Begin with the first item: ${links.start}`, '');
    html.push(`<p><a href="${esc(links.start)}" style="font-weight:600">Begin with the first item</a></p>`);
    html.push('<ol>');
    plan.items.forEach((it, i) => {
      lines.push(itemLine(it, i + 1), `   ${links.item(it)}`);
      html.push(`<li>${esc(itemLine(it, i + 1).replace(/^\d+\. /, ''))} <a href="${esc(links.item(it))}">Open</a></li>`);
    });
    html.push('</ol>');
  }
  const counts = `Waiting on them: ${c.waiting}. Parked (research, holds, set aside): ${c.parked}. Snoozed: ${c.snoozed}.`;
  lines.push('', counts, `Everything, with what is waiting and parked: ${links.work}`);
  html.push(`<p>${esc(counts)}<br/><a href="${esc(links.work)}">Everything, with what is waiting and parked</a></p>`);
  if (input.commandsEnabled) {
    const cmd = 'To work from your inbox, reply with START and the first item arrives as its own email. Each item takes APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT or HELP on the first line of your reply.';
    lines.push('', cmd);
    html.push(`<p>${esc(cmd)}</p>`);
  }
  if (input.legacyDigest) {
    const legacy = 'The HubSpot pipeline digest still arrives separately each morning; say the word and it stops.';
    lines.push('', legacy);
    html.push(`<p style="color:#666">${esc(legacy)}</p>`);
  }
  const stamp = `Sent by GAP at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York. This is an internal message to you; nothing in it went to a buyer.`;
  lines.push('', stamp);
  html.push(`<p style="color:#888;font-size:12px">${esc(stamp)}</p>`);
  return { subject, text: lines.join('\n'), html: `<div style="font-family:system-ui,sans-serif;line-height:1.45">${html.join('\n')}</div>` };
}
