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
 *   - C31: the headline names its count basis: "N to execute" is the plan's items, the same durable list in the same
 *     order START and NEXT walk (item 1 is what START opens, named in the body); "M to decide" is the intelligence
 *     shown, counted apart and never folded into the execution count
 *   - C32: each item card carries the identity, the relationship or motion, why it surfaced, the last material
 *     exchange, the next prepared action (whole, never cut mid-sentence), the source and date, and its own deep link;
 *     an intelligence item at an account with an open deal links to that deal's brief, never to generic Work
 *   - C33: the greeting follows the New York hour of the send (21:47 is "Good evening"); a replay of an earlier plan
 *     says when that plan was made and that what changed since is on Work
 */
import type { DayPlan, PlanItem } from './plan';
import type { IntelItem, PursuedItem } from './intel';

/**
 * C32: a long text kept whole or cut at a sentence end, never mid-sentence. Under `max` it is returned as is; over it,
 * the longest run of whole sentences that fits (a sentence ends at . ! ? or ;); when no sentence end fits, the whole
 * text stands rather than a fragment.
 */
export function clipAtSentence(text: string, max = 200): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max + 1);
  const ends = [...head.matchAll(/[.!?;](?=\s|$)/g)].map((m) => m.index as number).filter((i) => i > 0);
  return ends.length ? t.slice(0, ends[ends.length - 1] + 1).trim() : t;
}

/** C33: the greeting for a New York hour: morning until noon, afternoon until five, evening after; a neutral opener at night. */
export function greetingFor(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }).format(now)) % 24;
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  if (hour >= 17 && hour < 24) return 'Good evening.';
  return 'Hello.';
}

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
  /** C32: the account's deal brief (the deal workspace), for an item at an account with an open deal. */
  deal?: (name: string) => string;
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
  /** C33: an explicit resend (X22): said as such beside the plan's own time. */
  resend?: boolean;
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

const dateText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/**
 * C32: the card lines under an item: the relationship or motion, the last material exchange, the next prepared action
 * (whole), the source and date. Only what the plan item carries; nothing is invented, and a missing line is absent.
 */
export function itemCardLines(it: PlanItem): string[] {
  const c = it.context;
  if (!c) return [];
  const out: string[] = [];
  if (c.motion) out.push(endSentence(c.motion));
  if (c.lastExchange) out.push(`Last: ${endSentence(c.lastExchange)}`);
  if (c.nextAction) out.push(`Next: ${endSentence(clipAtSentence(c.nextAction, 400))}`);
  const src = [c.source, c.date ? dateText(c.date) : null].filter(Boolean).join(', ');
  if (src) out.push(`Source: ${src}.`);
  return out;
}

export function renderBriefing(input: BriefingInput, now: Date): RenderedBriefing {
  const { plan, links } = input;
  const label = dayLabel(plan.day);
  const n = plan.items.length;
  const intel = input.intel ?? null;
  // C31: the intelligence SHOWN (the same selection the sections render), counted apart from the execution count.
  const worthAll = intel ? [...intel.signals.slice(0, 4), ...intel.triggers.slice(0, 2), ...intel.signals.slice(4), ...intel.triggers.slice(2)].slice(0, 6) : [];
  const peopleAll = intel ? intel.people.slice(0, 5) : [];
  const toDecide = worthAll.length + peopleAll.length;
  const decideTotal = intel ? intel.totals.signals + intel.totals.triggers + intel.totals.people : 0;
  const execText = n === 0 ? 'nothing to execute' : `${n} to execute`;
  const countText = toDecide > 0 ? `${execText}, ${toDecide} to decide` : n === 0 ? 'nothing needs you' : execText;
  const subject = `GAP today, ${label}: ${countText} [GAP#${input.dayToken}]`;
  const c = plan.counts;

  const lines: string[] = [];
  const html: string[] = [];
  // C33: the greeting follows the hour the email actually goes out; a replay says when its plan was made.
  const greeting = greetingFor(now);
  lines.push(`${greeting} Here is ${label} from GAP, in order.`);
  html.push(`<p>${esc(greeting)} Here is ${esc(label)} from GAP, in order.</p>`);
  const plannedAt = new Date(plan.plannedAt);
  const replay = !plan.fresh && now.getTime() - plannedAt.getTime() > 5 * 60_000;
  if (replay || input.resend) {
    const when = `${plannedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York on ${dayLabel(plan.day)}`;
    const replayLine = `${input.resend ? 'This is a resend. ' : ''}${replay ? `This replays the plan GAP made at ${when}, as it stood then; what changed since is on Work, not here.` : `The plan was made at ${when}.`}`;
    lines.push(replayLine);
    html.push(`<p style="color:#666">${esc(replayLine)}</p>`);
  }
  // C31: the count basis, in words: the plan's items are what START and NEXT walk; intelligence is counted apart.
  const basis = [n === 0 ? 'Nothing to execute on the plan' : `${n} to execute: the plan's items, the same list START and NEXT walk, in this order`, toDecide > 0 ? `${toDecide} to decide: intelligence, counted apart${decideTotal > toDecide ? ` (${decideTotal} waiting in all)` : ''}` : null].filter(Boolean).join('. ');
  lines.push(`${basis}.`);
  html.push(`<p style="color:#666">${esc(basis)}.</p>`);
  // I04: intelligence first (the day is for new conversations), then the items in sections, deals in one line.
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
    // C5 (2026-10-09): an ambiguous placement is said with its names (the line carries it), never "No account yet".
    return `${it.accountName ?? (it.ambiguousAmong?.length ? `Claimed by ${it.ambiguousAmong.join(' and ')}` : null) ?? it.accountHint ?? 'No account yet'}: ${it.title}. ${it.line}${a ? ` The angle: ${a.whyItMatters}${who} Ask: ${a.starters[0] ?? ''}` : ''}`;
  };
  // C32: an item at an account with an open deal names the deal (stage and its whole next step) and links to its brief.
  const dealLine = (it: IntelItem): { text: string; href: string } | null => {
    if (it.opportunity !== 'open' || !it.accountName) return null;
    const href = links.deal ? links.deal(it.accountName) : links.account ? links.account(it.accountName) : links.work;
    const deals = it.person?.deals ?? [];
    // C57 pass 2: with more than one open deal and no settled scope, no deal is presented as the person's; the brief
    // is linked without naming one (the same rule decide.ts holds for the contact lookup).
    if (deals.length > 1) return { text: `${deals.length} open deals at ${it.accountName}; the person's deal is not settled. Work it from the deal brief: ${href}`, href };
    const d = deals[0] ?? null;
    const name = d?.name ?? 'an open HubSpot deal';
    const step = d?.nextStep ? ` Next step: ${endSentence(clipAtSentence(d.nextStep, 400))}` : '';
    return { text: `In a deal at ${it.accountName}: ${name}${d?.stage ? ` (${d.stage})` : ''}.${step} Work it from the deal: ${href}`, href };
  };
  // I05: what Casey pursued comes first: the angle when it is ready, the state when it is not.
  const pursued = (intel?.pursued ?? []).slice(0, 6);
  if (pursued.length) {
    lines.push('', `Pursued (${pursued.length}): what GAP prepared on your decisions.`);
    html.push(`<h3>Pursued (${pursued.length})</h3><p style="color:#666">What GAP prepared on your decisions.</p><ul>`);
    for (const p of pursued) {
      // C5 (2026-10-09): an ambiguous placement is said with its names, never "No account yet"; a read-time placement says its line.
      const where = p.accountName ?? (p.ambiguousAmong?.length ? (p.ambiguityLine ?? `Claimed by ${p.ambiguousAmong.join(' and ')}: choose the account`) : null) ?? p.accountHint ?? 'No account yet';
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
    const worth = worthAll;
    const worthTotal = intel.totals.signals + intel.totals.triggers;
    const pushIntel = (it: IntelItem) => {
      const d = decideLinks(it.key);
      const deal = dealLine(it);
      lines.push(`- ${intelLine(it)}`, ...(deal ? [`   ${deal.text}`] : []), `   ${d.text}`);
      html.push(`<li>- ${esc(intelLine(it))}${deal ? ` ${esc(deal.text.replace(/ Work it from the deal: .*$/, ''))} <a href="${esc(deal.href)}">Work it from the deal</a>` : ''} ${d.html}</li>`);
    };
    if (worth.length) {
      lines.push('', `Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${worthTotal}` : ''}). Any age, for your call; Pursue and GAP develops the angle.`);
      html.push(`<h3>Intelligence worth a look (${worth.length}${worthTotal > worth.length ? ` of ${worthTotal}` : ''})</h3><p style="color:#666">Any age, for your call; Pursue and GAP develops the angle.</p><ul>`);
      worth.forEach(pushIntel);
      html.push('</ul>');
    }
    const people = peopleAll;
    if (people.length) {
      lines.push('', `Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''}). They wrote to us and went quiet.`);
      html.push(`<h3>Prospects to reengage (${people.length}${intel.totals.people > people.length ? ` of ${intel.totals.people}` : ''})</h3><p style="color:#666">They wrote to us and went quiet.</p><ul>`);
      people.forEach(pushIntel);
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
    // C31: the START target is item 1 of the plan, named here so the pointer and the rows reconcile.
    const first = plan.items[0];
    lines.push('', `Begin with item 1, ${first.accountName}: ${endSentence(first.title)} ${links.start}`, '');
    html.push(`<p><a href="${esc(links.start)}" style="font-weight:600">Begin with item 1, ${esc(first.accountName)}: ${esc(endSentence(first.title))}</a></p>`);
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
        const card = itemCardLines(it);
        lines.push(itemLine(it, k), ...card.map((l) => `   ${l}`), `   ${links.item(it)}`);
        html.push(`<li value="${k}">${esc(itemLine(it, k).replace(/^\d+\. /, ''))}${card.length ? `<br/><span style="color:#666">${card.map(esc).join('<br/>')}</span>` : ''} <a href="${esc(links.item(it))}">Open</a></li>`);
      }
      html.push('</ol>');
      lines.push('');
    }
    const hygiene = plan.items.filter(isDealHygiene);
    if (hygiene.length) {
      // C32: a deal's words are kept whole or cut at a sentence end, never mid-sentence.
      const line = `Deals, in one line (${hygiene.length}): ${hygiene.map((it) => `${it.accountName}${it.why ? ` (${clipAtSentence(it.why.replace(/^(The deal's next step|A stalled deal): /, ''), 160).replace(/\.$/, '')})` : ''}`).join('; ')}. The deal workspace holds the detail.`;
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
