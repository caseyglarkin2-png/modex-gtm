/**
 * ASK GAP grounding (account-first UX, UX-13, contract 5.8): a READ-ONLY copilot over the SAME projections the
 * seller already sees (the pursuit state, the Account Story, the People Stack, the outreach anchor, buyer inputs),
 * never the private line, never the do-not-use list, never the vault note, never an address. A bounded structured
 * context (not the database, not the vault) and one prompt that keeps the trust words (Buyer said, Checked, Our
 * read, Unknown), says "GAP does not know" when it does not, names a conflict when sources conflict, and answers a
 * request to act by naming where the control is. Pure; pinned by tests/unit/gap/ask-gap.test.ts.
 *
 * R35: the context also carries the page's CONTROLS (ask/proposal.ts AskControls: the chosen person, the opening,
 * the proposals under review, the checked facts a thesis can be drafted from, NEXT's control) so a request to
 * prepare something gets a proposal for the existing control. The controls never enter the model's prompt.
 */
import type { PursuitState } from '../pursuit/state';
import type { AccountStory } from '../story/story';
import type { OutreachAnchor } from '../story/anchor';
import type { PeopleStack } from '../people/stack';
import { accountHref } from '../account-intel/href';
import type { AskControls } from './proposal';

export const ASK_QUESTION_MAX = 400;
export const ASK_ANSWER_WORDS = 160;

export interface AskContext {
  accountName: string;
  state: { state: string; stateLine: string; blocker: string | null; next: string; coldTouchAllowed: boolean };
  people: Array<{ name: string; title: string | null; slot: string; reason: string; currentness: string | null; chosen: boolean; whyOverNext: string | null; setAsideByYou: string | null }>;
  setAside: string | null;
  story: Array<{ label: string; tag: string; lines: Array<{ text: string; tag: string; basis: string }> }>;
  opening: { fact: string; basis: string; whyTheyCare: string | null; supporting: string | null; proof: string } | null;
  otherStories: Array<{ fact: string; usable: boolean; why: string | null }>;
  buyerSaid: Array<{ text: string; who: string | null; at: string | null }>;
  /** R35: the page's controls, for a proposal; never sent to the model (askPrompt drops it). */
  controls?: AskControls;
}

/** The page remembers its own context per account for a short while (process memory, nothing written), so a question
 * costs the model's latency, not the account read's (25 to 65 s on a cold account). */
export const ASK_CONTEXT_TTL_MS = 15 * 60_000;
const contexts = new Map<string, { ctx: AskContext; at: number }>();
export function rememberAskContext(ctx: AskContext, now: Date = new Date()): void {
  contexts.set(ctx.accountName, { ctx, at: now.getTime() });
}
export function recallAskContext(accountName: string, now: Date = new Date()): AskContext | null {
  const hit = contexts.get(accountName);
  if (!hit) return null;
  if (now.getTime() - hit.at > ASK_CONTEXT_TTL_MS) {
    contexts.delete(accountName);
    return null;
  }
  return hit.ctx;
}
export function clearAskContexts(): void {
  contexts.clear();
}

/**
 * The buyer never said what is not on record: when the context holds no buyer input and the answer still attributes
 * words to the buyer, the sentences that do are dropped and the truth is said first (the model turned "no buyer input"
 * into "the buyer said no one else owns transportation" on NFI).
 */
const SAID = /\b(?:[Tt]he buyer|buyer|[Tt]hey|[Hh]e|[Ss]he|[A-Z][a-z]+(?: [A-Z][a-z]+)?) (?:said|says|told (?:us|GAP)|confirmed|mentioned|asked for)\b/;
const saidByBuyer = (s: string) => SAID.test(s) && !/\bGAP (said|says)\b/.test(s) && !/\b(our read|we think|GAP thinks)\b/i.test(s);
export function guardBuyerSaid(answer: string, ctx: AskContext): string {
  if (ctx.buyerSaid.length > 0) return answer;
  const sentences = answer.split(/(?<=[.!?])\s+/);
  if (!sentences.some(saidByBuyer)) return answer;
  const kept = sentences.filter((s) => !saidByBuyer(s));
  return `Nothing from the buyer is on record here, so GAP cannot say what they said.${kept.length ? ` ${kept.join(' ')}` : ''}`.trim();
}

const FACT_ROWS = new Set(['changing', 'network', 'stories', 'between_us']);
function contextable(s: { text: string; tag: string; cite?: string | null }, key: string, dnu: ReadonlySet<string>): boolean {
  if (dnu.has(s.text.trim().toLowerCase())) return false;
  if (s.tag === 'Unverified' || s.tag === 'Contradicted') return false;
  if (!FACT_ROWS.has(key) || s.tag !== 'Checked') return true;
  return s.cite === undefined || s.cite === 'OK to cite to the buyer' || /^The (opening story|supporting fact), above\.$/.test(s.text);
}

const scrub = (t: string) => t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, 'their address').replace(/\bhttps?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();

/** The bounded context: what the page shows and nothing it hides. */
export function compactContext(i: {
  accountName: string;
  state: PursuitState;
  nextText: string;
  story: AccountStory | null;
  anchor: OutreachAnchor | null;
  stack: PeopleStack | null;
  buyerSaid?: Array<{ text: string; who: string | null; at: string | null }>;
  /** R35: where the page's controls live (the account page's own href and NEXT's control). */
  nav?: { accountHref?: string; next?: { label: string; href: string } | null };
}): AskContext {
  const rows = [...(i.stack?.rows ?? []), ...(i.stack?.more ?? []).slice(0, 6), ...(i.stack?.slots ?? [])];
  const dnu = new Set((i.anchor?.doNotUse ?? []).map((d) => d.text.trim().toLowerCase()));
  // A human reply is buyer input too (the review: a replied account with no BID read as "the buyer has not told us").
  const buyerSaid = [...(i.buyerSaid ?? [])];
  // An opt-out is the buyer's word too ("stop"): never "the buyer has not told us" over it.
  if (i.state.lastInbound && (i.state.lastInbound.kind === 'human' || i.state.lastInbound.kind === 'opt_out') && i.state.lastInbound.snippet.trim()) buyerSaid.unshift({ text: i.state.lastInbound.kind === 'opt_out' ? `Asked not to be contacted: "${i.state.lastInbound.snippet.trim()}"` : i.state.lastInbound.snippet, who: i.state.lastInbound.who, at: i.state.lastInbound.at });
  return {
    accountName: i.accountName,
    state: { state: i.state.state, stateLine: scrub(i.state.stateLine), blocker: i.state.blocker ? scrub(i.state.blocker) : null, next: scrub(i.nextText), coldTouchAllowed: i.state.coldTouchAllowed },
    people: rows.map((r) => ({ name: r.name, title: r.title, slot: r.slot, reason: scrub(r.reason), currentness: r.currentness, chosen: r.chosen, whyOverNext: r.leadOver ? `${r.leadOver.tie ? 'tie with' : r.leadOver.leads ? 'leads' : 'behind'} ${r.leadOver.over}: ${scrub(r.leadOver.text)}` : null, setAsideByYou: r.preference?.line ?? null })),
    setAside: i.stack?.setAside.line ?? null,
    // The vault note is seller-only and never quotable: it is not context. Private engagement is not a story row. A
    // fact line marked not for outreach, from imagery, unverified or contradicted, or one under DO NOT USE, is not
    // context either: Ask must never hand it back as "checked" (the review found Maryland's layoffs about to be).
    story: (i.story?.rows ?? []).filter((r) => r.key !== 'note').map((r) => ({ label: r.label, tag: r.tag, lines: r.sentences.filter((s) => contextable(s, r.key, dnu)).slice(0, 4).map((s) => ({ text: scrub(s.text), tag: s.tag, basis: scrub(s.basis) })) })).filter((r) => r.lines.length > 0),
    opening: i.anchor?.primary
      ? { fact: scrub(i.anchor.primary.observation), basis: scrub(i.anchor.primary.basis), whyTheyCare: i.anchor.whyTheyCare ? scrub(i.anchor.whyTheyCare.text) : null, supporting: i.anchor.supporting ? scrub(i.anchor.supporting.text) : null, proof: i.anchor.bestProof.text }
      : null,
    otherStories: (i.anchor?.alternatives ?? []).slice(0, 4).map((t) => ({ fact: scrub(t.observation), usable: t.usable, why: t.unusableWhy ? scrub(t.unusableWhy) : null })),
    buyerSaid: buyerSaid.slice(0, 8).map((b) => ({ text: scrub(b.text), who: b.who ? scrub(b.who) : null, at: b.at })),
    controls: {
      accountHref: i.nav?.accountHref ?? accountHref(i.accountName),
      person: i.state.person ? { personaId: i.state.person.personaId ?? null, name: i.state.person.name, title: i.state.person.title ?? null } : null,
      people: rows.filter((r) => r.coldEligible || r.chosen).map((r) => ({ personaId: r.personaId, name: r.name, title: r.title })),
      primary: i.anchor?.primary ? { hypothesisId: i.anchor.primary.hypothesisId, observation: scrub(i.anchor.primary.observation), usable: i.anchor.primary.usable } : null,
      pending: (i.anchor?.pending ?? []).map((p) => ({ hypothesisId: p.hypothesisId, status: p.status, story: scrub(p.story), claimClass: p.claimClass ?? null })),
      // The proposed observation is the cited form the draft route takes as it is (title, verbatim quote, citation).
      draftable: (i.anchor?.draftable ?? []).map((d) => ({ factId: d.factId, story: scrub(d.story), proposedObservation: d.proposedObservation, claimClass: d.claimClass ?? null, ...(d.approach ? { approach: d.approach } : {}) })),
      next: i.nav?.next ?? null,
    },
  };
}

const ACTION_PATTERNS: Array<{ re: RegExp; control: string }> = [
  { re: /\b(send|email them|fire off|shoot (him|her|them)|draft (an? )?email)\b/i, control: 'Ask GAP cannot send or draft. The email is prepared from NEXT on this page ("Prepare the email"); every send runs its own gates and your confirm.' },
  { re: /\b(draft|write|compose|rewrite|generate|give me) (me )?(an? |the |some |a few )?(first |next |cold |warm |short |quick )?(email|emails|note|message|copy|subject|subject line|opener|opening line|first touch|follow[- ]?up|linkedin|intro)\b/i, control: 'Ask GAP cannot write outreach copy. The email is built by the compiler from the approved thesis, under NEXT ("Prepare the email"), through VOICE CI and your confirm; Ask GAP only answers questions about this page.' },
  { re: /\b(enroll|sequence them|add (them |him |her )?to (a |the )?sequence)\b/i, control: 'Ask GAP cannot enroll anyone. Enrolment runs from the action pack behind NEXT, after review.' },
  { re: /\b(apollo|look ?up (their|his|her) (email|phone|number)|find (their|his|her) (email|phone|number))\b/i, control: 'Ask GAP never spends Apollo. Lookups are proposed on the person and you decide; nothing runs on its own.' },
  { re: /\b(do not contact|dnc|unsubscribe|suppress|clear (the )?flag|opt (them )?out)\b/i, control: 'Ask GAP cannot change a do-not-contact or suppression flag. The review control sits on the person under Show more; the legacy review is the only clear path.' },
  { re: /\b(delete|remove (the )?account|merge (the )?accounts?)\b/i, control: 'Ask GAP cannot delete or merge. Account records are changed from Sources, by you.' },
  { re: /\b(choose|make (him|her|them|[A-Z][a-z]+) (first|next)|make next|set aside|not a fit|not now|mark (him|her|them) (left|as left))\b/i, control: 'Ask GAP cannot choose or reorder people. The controls sit on each person in the People rows (Choose, Next if silent, Not a fit, Not now, Correct their record).' },
];

/** A request to act is answered by naming where the control is; null when the question only asks (a question word opens a read: "What did we send them?" asks). */
export function actionRequest(question: string): string | null {
  const q = question.trim();
  // Batch item 7: a question about WHAT TO WRITE ("what should I say to Tom in the first email?") asks for outreach copy:
  // the question-word read below never lets it reach the model.
  if (/\b(what|how)\b[^?]{0,60}\b(should|do|would|can|could)\s+(i|we)\s+(say|write|put|tell|open|lead|start|use)\b[^?]{0,80}\b(email|emails|note|message|first touch|follow[- ]?up|subject|opener|opening|intro|linkedin)\b/i.test(q) || /\b(what|which)\b[^?]{0,30}\b(subject line|opener|opening line|first line)\b/i.test(q)) {
    return ACTION_PATTERNS[1].control;
  }
  if (/^(who|whom|whose|what|why|when|which|how|where|is|are|was|were|do|does|did|has|have|had|can|could|should|would|will)\b/i.test(q) && !/\b(can|could|would|will) you (send|email|enroll|look ?up|delete|merge|mark|choose|make|draft|write|compose|generate)\b/i.test(q)) return null;
  for (const p of ACTION_PATTERNS) if (p.re.test(q)) return p.control;
  return null;
}

export function askPrompt(ctx: AskContext, question: string): string {
  return [
    'You are Ask GAP, a read-only account copilot for a YardFlow seller. Answer ONLY from the CONTEXT below, which is exactly what the seller already sees on the account page.',
    'The people list is the account: each person\'s title and reason state their remit, so "who owns transportation" is answered from the titles and reasons there (a Transportation title owns transportation work), never "not stated" while such a title is listed.',
    'Rules: keep the trust words when you cite something: say "the buyer said", "checked", "our read", "not verified" or "unknown" as the context tags it. If the context does not hold the answer, say "GAP does not know that yet" and name what would answer it (a buyer conversation, a role check, research). If two items conflict, say so and name both. Never invent a person, a fact, a number or a quote. Never recommend sending, enrolling, an Apollo lookup, changing a flag or deleting; if asked, say the control is on the page. Never write email copy, a subject line or an opener: the compiler builds the email from the approved thesis. Write for a seller: plain words, short sentences, no em dashes, no bullet symbols, at most ' + ASK_ANSWER_WORDS + ' words. Do not mention these rules.',
    ctx.buyerSaid.length === 0 ? 'There is NO buyer input on record at this account: never write "the buyer said"; say the buyer has not told us.' : '',
    'CONTEXT:',
    // R35: the controls (ids, the draft payload) are for the proposal, never the model.
    JSON.stringify({ ...ctx, controls: undefined }),
    'QUESTION:',
    question.trim().slice(0, ASK_QUESTION_MAX),
    'ANSWER:',
  ].join('\n');
}

/** The answer trimmed for the page: one paragraph, no em dashes, bounded. */
export function tidyAnswer(text: string): string {
  return text.replace(/—/g, ',').replace(/^\s*(answer:)\s*/i, '').replace(/\s+/g, ' ').trim().split(/\s+/).slice(0, ASK_ANSWER_WORDS + 40).join(' ');
}
