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
import type { IntelItem, PursuedItem } from './intel';

/** The reply commands (X07). Named here so the render can keep every body line clear of them. */
export const COMMAND_WORDS = ['APPROVE', 'REVISE', 'SKIP', 'DEFER', 'DONE', 'NEXT', 'HELP', 'START'] as const;

export interface BriefingLinks {
  start: string;
  work: string;
  item: (it: PlanItem) => string;
  /** I04: a decision link for an intelligence item (null when links cannot be signed: the item then says "on Work"). */
  decide?: (key: string, decision: 'pursue' | 'skip' | 'dismiss' | 'more') => string | null;
  /** I05: the account page. */
  account?: (name: string) => string;
}

/** I04: the day's intelligence for the briefing (work/intel.ts) with the prepared angles by item key. */
export interface BriefingIntel {
  signals: IntelItem[];
  triggers: IntelItem[];
  people: IntelItem[];
  /** I05: what Casey pursued, with the angle when it is ready. */
  pursued?: PursuedItem[];
  totals: { signals: number; triggers: number; people: number };
  angles: Record<string, { whyItMatters: string; starters: string[]; peopleNamed: Array<{ name: string | null; title: string | null }>; proposedAction: string }>;
}

export interface BriefingInput {
  plan: DayPlan;
  dayToken: string;
  links: BriefingLinks;
  commandsEnabled: boolean;
  /** The legacy HubSpot pipeline digest (cron daily-digest) still runs: say so until Casey retires it (X19). */
  legacyDigest: boolean;
  /** I04: the intelligence sections; absent (an older caller) renders the items alone. */
  intel?: BriefingIntel | null;
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
  // X18: carried work says the day it came from.
  const parts = [endSentence(it.title), who(it) ? endSentence(who(it) as string) : null, it.why ? endSentence(it.why) : null, it.carriedFrom ? `Carried from ${dayLabel(it.carriedFrom)}.` : null].filter((x): x is string => !!x);
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
  // I04: intelligence first (the day is for new conversations), then the items in sections, deals in one line.
  const intel = input.intel ?? null;
  const decideLinks = (key: string) => {
    const parts = (['pursue', 'skip', 'dismiss', 'more'] as const).map((d) => {
      const href = links.decide ? links.decide(key, d) : null;
      return href ? { d, href } : null;
    }).filter((x): x is { d: 'pursue' | 'skip' | 'dismiss' | 'more'; href: string } => !!x);
    return { text: parts.length ? parts.map((p) => `${p.d.charAt(0).toUpperCase()}${p.d.slice(1)}: ${p.href}`).join('  ') : `Decide it on Work: ${links.work}`, html: parts.length ? parts.map((p) => `<a href="${esc(p.href)}">${esc(p.d.charAt(0).toUpperCase() + p.d.slice(1))}</a>`).join(' · ') : `<a href="${esc(links.work)}">Decide it on Work</a>` };
  };
  const intelLine = (it: IntelItem) => {
    const a = intel?.angles[it.key];
    const who = a?.peopleNamed.length ? ` Who: ${a.peopleNamed.map((p) => `${p.name ?? 'someone'}${p.title ? ` (${p.title})` : ''}`).join('; ')}.` : '';
    return `${it.accountName ?? it.accountHint ?? 'No account yet'}: ${it.title}. ${it.line}${a ? ` The angle: ${a.whyItMatters}${who} Ask: ${a.starters[0] ?? ''}` : ''}`;
  };
  // I05: what Casey pursued comes first: the angle when it is ready, the state when it is not.
  const pursued = (intel?.pursued ?? []).slice(0, 6);
  if (pursued.length) {
    lines.push('', `Pursued (${pursued.length}): what GAP prepared on your decisions.`);
    html.push(`<h3>Pursued (${pursued.length})</h3><p style="color:#666">What GAP prepared on your decisions.</p><ul>`);
    for (const p of pursued) {
      const where = p.accountName ?? p.accountHint ?? 'No account yet';
      const a = p.angle;
      const body = p.status === 'ready' && a ? `The angle: ${a.whyItMatters}${a.peopleNamed.length ? ` Who: ${a.peopleNamed.map((x) => `${x.name ?? 'someone'}${x.title ? ` (${x.title})` : ''}`).join('; ')}.` : a.roles.length ? ` Roles: ${a.roles.join(', ')}.` : ''} Ask: ${a.starters[0] ?? ''} Proposed: ${a.proposedAction === 'email' ? 'an email' : a.proposedAction === 'call' ? 'a call' : 'research first'}.${a.caveat ? ` ${a.caveat}` : ''}` : p.status === 'failed' ? `GAP could not develop the angle${p.error ? ` (${p.error.slice(0, 120)})` : ''}; decide it again on Work to retry.` : 'GAP is developing the angle; it comes back here and on Work.';
      const open = p.accountName && links.account ? links.account(p.accountName) : links.work;
      lines.push(`- ${where}: ${p.title}. ${body}`, `   ${p.accountName ? `Open ${p.accountName}` : 'Open Work'}: ${open}`);
      html.push(`<li>- ${esc(`${where}: ${p.title}. ${body}`)} <a href="${esc(open)}">${esc(p.accountName ? `Open ${p.accountName}` : 'Open Work')}</a></li>`);
    }
    html.push('</ul>');
  }
  if (intel && (intel.signals.length || intel.triggers.length || intel.people.length)) {
    // Reserved slots (the review's finding 4): the top signals and the top triggers both reach the email.
    const worth = [...intel.signals.slice(0, 4), ...intel.triggers.slice(0, 2), ...intel.signals.slice(4), ...intel.triggers.slice(2)].slice(0, 6);
    const worthTotal = intel.totals.signals + intel.totals.triggers;
    if (worth.length) {
      lines.push('', `Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${worthTotal}` : ''}). Any age, for your call; Pursue and GAP develops the angle.`);
      html.push(`<h3>Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${worthTotal}` : ''})</h3><p style="color:#666">Any age, for your call; Pursue and GAP develops the angle.</p><ul>`);
      worth.forEach((it) => {
        const d = decideLinks(it.key);
        lines.push(`- ${intelLine(it)}`, `   ${d.text}`);
        html.push(`<li>- ${esc(intelLine(it))} ${d.html}</li>`);
      });
      html.push('</ul>');
    }
    const people = intel.people.slice(0, 5);
    if (people.length) {
      lines.push('', `Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''}). They wrote to us and went quiet.`);
      html.push(`<h3>Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''})</h3><p style="color:#666">They wrote to us and went quiet.</p><ul>`);
      people.forEach((it) => {
        const d = decideLinks(it.key);
        lines.push(`- ${intelLine(it)}`, `   ${d.text}`);
        html.push(`<li>- ${esc(intelLine(it))} ${d.html}</li>`);
      });
      html.push('</ul>');
    }
  } else if (intel) {
    lines.push('', 'No intelligence is waiting for a decision today.');
    html.push('<p>No intelligence is waiting for a decision today.</p>');
  }
  if (n === 0) {
    lines.push('', 'Nothing on the list needs you today. Open Work to see what is waiting and what is parked.');
    html.push('<p>Nothing on the list needs you today. Open Work to see what is waiting and what is parked.</p>');
  } else {
    lines.push('', `Begin with the first item: ${links.start}`, '');
    html.push(`<p><a href="${esc(links.start)}" style="font-weight:600">Begin with the first item</a></p>`);
    // The sections: what is owed and prepared, numbered in the plan's order; the stalled deals in one line.
    const isDealHygiene = (it: PlanItem) => it.kind === 'deal' && it.stateKind === 'in_deal' && !/^Next step/i.test(it.title);
    const sections: Array<{ title: string; items: PlanItem[] }> = [
      { title: 'Ready to send', items: plan.items.filter((it) => it.kind === 'ready') },
      { title: 'Owed and in conversation', items: plan.items.filter((it) => it.kind === 'commitment' || it.kind === 'reply' || it.kind === 'meeting') },
      { title: 'Follow-ups', items: plan.items.filter((it) => it.kind === 'follow_up') },
      { title: 'Deals with a next step', items: plan.items.filter((it) => it.kind === 'deal' && !isDealHygiene(it)) },
      { title: 'Everything else', items: plan.items.filter((it) => !['ready', 'commitment', 'reply', 'meeting', 'follow_up', 'deal'].includes(it.kind)) },
    ];
    const index = new Map(plan.items.map((it, i) => [it.key, i + 1]));
    for (const s of sections) {
      if (!s.items.length) continue;
      lines.push(`${s.title} (${s.items.length})`);
      html.push(`<h3>${esc(s.title)} (${s.items.length})</h3><ol>`);
      for (const it of s.items) {
        const k = index.get(it.key) ?? 0;
        lines.push(itemLine(it, k), `   ${links.item(it)}`);
        html.push(`<li value="${k}">${esc(itemLine(it, k).replace(/^\d+\. /, ''))} <a href="${esc(links.item(it))}">Open</a></li>`);
      }
      html.push('</ol>');
      lines.push('');
    }
    const hygiene = plan.items.filter(isDealHygiene);
    if (hygiene.length) {
      const line = `Deals, in one line (${hygiene.length}): ${hygiene.map((it) => `${it.accountName}${it.why ? ` (${it.why.replace(/^(The deal's next step|A stalled deal): /, '').replace(/\.$/, '').slice(0, 70)})` : ''}`).join('; ')}. The deal workspace holds the detail.`;
      lines.push(line);
      html.push(`<p>${esc(line)}</p>`);
    }
  }
  // X18: the carried work, counted by the day it came from.
  const carried = plan.items.filter((it) => it.carriedFrom);
  if (carried.length) {
    const byDay = new Map<string, number>();
    for (const it of carried) byDay.set(it.carriedFrom as string, (byDay.get(it.carriedFrom as string) ?? 0) + 1);
    const words = (k: number) => (k === 1 ? 'one' : String(k));
    const line = `Carried over: ${carried.length} of ${n} (${[...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, k]) => `${words(k)} from ${dayLabel(d)}`).join(', ')}).`;
    lines.push('', line);
    html.push(`<p>${esc(line)}</p>`);
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
