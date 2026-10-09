/**
 * DEVELOP_ANGLE (I03, GAP OS prospecting first, 2026-10-08). Server only. The agent task Pursue and More queue.
 *
 * Casey decided an intelligence item is worth a look (work/decide.ts). This task develops the angle: why the item
 * could matter to YardFlow, which accounts and buyer roles it points at (named people at a known account, from the
 * roster GAP holds), two conversation starters, the action it proposes (an email, a call, or research first) and what
 * is not known. It is prepared material for Casey to read before anything is written to a buyer: never an email,
 * never sent, never a thesis by itself. The item's dates ride along, said as what they are (a historical observation
 * is never presented as today). Checked like every GAP text: no em dash, "yards" plural, no product claim or money,
 * no person outside the roster offered; a model answer that breaks a rule ends `could_not_satisfy`, final.
 *
 * C21/C22 (the commercial-context audit, 2026-10-08): the prompt consumes the bounded commercial-context packet
 * (context/assemble.ts, seeded from what the Pursue carried and joined with the vault, Clawd and the verified public
 * facts): the systems on record, the buyer's words, the last exchange, the deal's next step, the seller's hypotheses
 * as hypotheses, the checked facts with dates, the gaps. The answer carries SUPPORT per sentence (agents/angle-claims.ts):
 * an unsupported buyer claim, an invented installed system or an invented pain is re-asked, then refused, unless
 * labelled an inference; the result carries the claim references, the context revision (C23) and the gaps.
 */
import { gapGenerate } from '../ai/spend';
import { YARDFLOW_MESSAGING } from '@/lib/ai/yardflow-context';
import { HEDGE_TOKENS } from '../taxonomy';
import { SINGULAR_YARD_RE } from '../compiler/checks/c11-banned';
import { listAgentTasks, type ClaimedTask, type HandlerResult } from './tasks';
import { HISTORICAL_DAYS, isDateOnly } from '../work/intel';
import { assembleCommercialContext, type AssembleAdapters } from '../context/assemble';
import type { CommercialContextPacket } from '../context/commercial-context';
import { knowledgeAdapters } from '../story/load';
import { GATE_SIGNAL_SELECT, type GateSignal } from '../research/evidence-gate';
import { packetRecord, packetSeedFromInput, parseSupport, reaskClaimLine, validateAngleClaims, type ClaimCheck, type SupportEntry, type SupportedSentence } from './angle-claims';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface DevelopAngleDeps {
  generate?: (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;
  /** C21: the context adapters (the vault and Clawd from the env by default, the verified facts from the database; the timeline and the CRM when the caller wires them). */
  context?: AssembleAdapters;
  /** A packet already assembled (tests; a caller that holds one). */
  packet?: CommercialContextPacket;
}

const MAX_TOKENS = 700;
const ROSTER_MAX = 12;
export const BUYER_ROLE = /supply chain|operations|logistics|transportation|distribution|warehouse|yard|plant|fleet|network|coo|csco|vp|director|head of|manager/i;

export interface Angle {
  whyItMatters: string;
  accounts: string[];
  roles: string[];
  /** Persona ids from the roster offered, in order of fit; empty when no account is known. */
  people: number[];
  starters: string[];
  proposedAction: 'email' | 'call' | 'research';
  caveat: string | null;
  /** C22: the model's own support entries (per sentence: labels and fact or inference); validated into PreparedAngle.support. */
  support?: SupportEntry[];
}

export interface PreparedAngle extends Omit<Angle, 'support'> {
  /** C22: each sentence of whyItMatters and each starter with the record claims that support it and its fact-or-inference label. */
  support?: SupportedSentence[];
  /** C23: the packet revision the angle was prepared against. */
  contextRevision?: string;
  /** C20: the sources not read when the angle was prepared. */
  contextGaps?: string[];
  /** C21: the systems on record at the account, by the strongest class that names each. */
  incumbents?: Array<{ name: string; claimClass: string; at: string | null }>;
  /** A03d: a voice warning the answer kept after the re-asks (the compiler's C14 warns the same way); Casey edits before a buyer sees it. */
  warnings?: string[];
  /** C06: the angle is deal work at an open deal; `dealId` is the one deal when the scope is unambiguous. */
  inDeal?: boolean;
  dealId?: string | null;
  dealIds?: Array<string | null>;
  taskId: string;
  key: string;
  title: string;
  accountName: string | null;
  accountHint: string | null;
  /** "chainstoreage.com, published Oct 7, 2026 (a recent report)" or "(a historical observation)". */
  sourceLine: string;
  peopleNamed: Array<{ personaId: number; name: string | null; title: string | null }>;
  preparedAt: string;
}

/** C54-1 (C29 at this surface): a value at exactly midnight UTC is a DATE (a filing day) and names its own day; a real instant converts to New York. */
const dayText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: isDateOnly(iso) ? 'UTC' : 'America/New_York' });

export function sourceLineFor(i: { source?: string | null; url?: string | null; publishedAt?: string | null; observedAt?: string | null }, now: Date): string {
  const host = i.source ?? (i.url ? (() => { try { return new URL(i.url as string).hostname.replace(/^www\./, ''); } catch { return 'the source'; } })() : 'the mailbox');
  const at = i.publishedAt ?? i.observedAt ?? null;
  if (!at) return `${host}, undated`;
  const old = now.getTime() - new Date(at).getTime() > HISTORICAL_DAYS * 86_400_000;
  return `${host}, ${i.publishedAt ? 'published' : 'observed'} ${dayText(at)} (${old ? 'a historical observation' : 'a recent report'})`;
}

export function parseAngle(text: string): Angle | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const o = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const strs = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()).slice(0, max) : []);
    const whyItMatters = typeof o.whyItMatters === 'string' ? o.whyItMatters.trim() : '';
    const starters = strs(o.starters, 3);
    const action = o.proposedAction === 'email' || o.proposedAction === 'call' || o.proposedAction === 'research' ? o.proposedAction : null;
    if (!whyItMatters || starters.length < 2 || !action) return null;
    // A03b: the model answers "id 1" as often as 1; both are the persona id.
    const people = Array.isArray(o.people) ? o.people.map((x) => (typeof x === 'number' ? x : typeof x === 'string' && /^(?:id\s*)?\d+$/i.test(x.trim()) ? Number(x.trim().replace(/^id\s*/i, '')) : NaN)).filter((x): x is number => Number.isInteger(x)).slice(0, 3) : [];
    return { whyItMatters, accounts: strs(o.accounts, 5), roles: strs(o.roles, 4), people, starters, proposedAction: action, caveat: typeof o.caveat === 'string' && o.caveat.trim() ? o.caveat.trim() : null, support: parseSupport(o.support) };
  } catch {
    return null;
  }
}

export type AngleCheck = { ok: true } | { ok: false; reason: 'em_dash' | 'yard_singular' | 'throughput' | 'product_named' | 'money_promised' | 'person_not_offered' | 'length'; detail?: string };

/**
 * A03 (2026-10-09): the first three production angles all failed `could_not_satisfy: yard_singular` (the model wrote
 * "yard" alone despite the rule). A voice-rule break is fixable by the model: it gets ONE re-ask naming the break, then
 * the refusal stands. At most two calls per task (both on the spend ledger); a person outside the roster is never re-asked.
 */
export const REASK_REASONS: ReadonlySet<string> = new Set(['em_dash', 'yard_singular', 'throughput', 'product_named', 'money_promised', 'length']);
export const MAX_ANGLE_CALLS = 3;

/** The offending word with its neighbours, so the re-ask points at the exact place ("...in their Austin yard outside..."). */
export function offendingSpan(text: string, re: RegExp): string {
  const m = new RegExp(re.source, re.flags.replace('g', '')).exec(text);
  if (!m || m.index === undefined) return '';
  const start = Math.max(0, m.index - 30);
  const end = Math.min(text.length, m.index + m[0].length + 30);
  return `${start > 0 ? '...' : ''}${text.slice(start, end).trim()}${end < text.length ? '...' : ''}`;
}

export function reaskLine(check: Exclude<AngleCheck, { ok: true }>): string {
  switch (check.reason) {
    case 'yard_singular': return `it says "yard" in the singular here: "${check.detail ?? 'yard'}". YardFlow copy says "yards" (plural) in prose: write "their yards", "operations in their yards", "the yards at the plant"; only yard network, yard management, yard system, yard check, yard truck, yard move and yard spotting keep the singular. Rewrite that sentence`;
    case 'throughput': return 'it says "throughput"; YardFlow copy says "production capacity" (or "turns", "flow")';
    case 'em_dash': return 'it contains an em dash; use a comma or a period instead';
    case 'product_named': return 'it names YardFlow or a product; name neither';
    case 'money_promised': return 'it promises money, savings, a percentage or ROI; remove the number or the claim';
    case 'length': return `"whyItMatters" is ${check.detail ?? 'the wrong length'}; it must be 15 to 120 words`;
    default: return check.reason;
  }
}

/** The rules every GAP text keeps; a person the roster did not offer is never named. */
export function validateAngle(a: Angle, roster: ReadonlySet<number>, opts: { allowSingularYard?: boolean } = {}): AngleCheck {
  const text = [a.whyItMatters, ...a.accounts, ...a.roles, ...a.starters, a.caveat ?? ''].join(' ');
  // The prose keeps the voice; a job title ("Yard Operations Manager") is the buyer's words, not ours.
  const prose = [a.whyItMatters, ...a.starters, a.caveat ?? ''].join(' ');
  if (/—/.test(text)) return { ok: false, reason: 'em_dash' };
  // A03b: the canonical C14 rule: singular "yard" outside the accepted compounds (yard network, yard management, ...).
  if (!opts.allowSingularYard && SINGULAR_YARD_RE.test(prose)) return { ok: false, reason: 'yard_singular', detail: offendingSpan(prose, SINGULAR_YARD_RE) };
  if (/\bthroughput\b/i.test(prose)) return { ok: false, reason: 'throughput' };
  if (/\b(yardflow|freightroll|flowgate|flowdriver|flowbol|flowvision|flowyms)\b/i.test([a.whyItMatters, ...a.starters].join(' ').replace(/to YardFlow/gi, ''))) return { ok: false, reason: 'product_named' };
  if (/\$\s?\d|\b\d+(\.\d+)?\s?%|\b(roi|savings|dollars)\b/i.test(text)) return { ok: false, reason: 'money_promised' };
  const stranger = a.people.find((id) => !roster.has(id));
  if (stranger !== undefined) return { ok: false, reason: 'person_not_offered', detail: String(stranger) };
  const words = a.whyItMatters.split(/\s+/).filter(Boolean).length;
  if (words < 15 || words > 120) return { ok: false, reason: 'length', detail: `${words} words` };
  return { ok: true };
}

export function buildAnglePrompt(input: { title: string; sourceLine: string; accountName: string | null; accountHint: string | null; categories: string[]; note: string | null; person: { name: string | null; title: string | null; email: string; lastWroteAt?: string | null; subject?: string | null; excerpt?: string | null; messages?: number | null } | null; roster: Array<{ id: number; name: string | null; title: string | null }>; theses: Array<{ family: string | null; observation: string }>; recent: string[]; candidateAccounts: string[]; decision: string; /** C06: the person's open deals, when the Pursue found them. */ deals?: Array<{ id: string | null; name: string | null; stage: string; nextStep: string | null }>; /** C21: the packet's record block (angle-claims.ts packetRecord), labelled [K1]... */ record?: string }): string {
  const pains = YARDFLOW_MESSAGING.painFramework.defaultPains.map((p) => `- ${p}`).join('\n');
  return [
    'You develop ONE commercial angle for a YardFlow seller from one piece of intelligence. Answer with one JSON object only: {"whyItMatters": "...", "accounts": [...], "roles": [...], "people": [persona ids], "starters": ["...", "..."], "proposedAction": "email" | "call" | "research", "caveat": "..." | null, "support": [{"text": "<one sentence of whyItMatters or one starter, verbatim>", "refs": ["K1"], "kind": "fact" | "inference"}]}. No prose around it.',
    '',
    'YardFlow, in one breath: the yards of plants and distribution centers run on manual gate check-in, radio dispatching and tribal knowledge; dwell, detention and dock friction hide lost production capacity. YardFlow standardizes the driver journey (gate check-in, yard routing, dock assignment, BOL proof) first and automates after. Typical realities a buyer recognizes:',
    pains,
    `Best fit: ${YARDFLOW_MESSAGING.bestFitProfile}`,
    '',
    `The item (Casey chose "${input.decision}"): ${input.title}`,
    `Source: ${input.sourceLine}.`,
    input.categories.length ? `Themes GAP tagged: ${input.categories.map((c) => c.replace(/_/g, ' ')).join(', ')}.` : '',
    input.note ? `Casey's note: "${input.note}"` : '',
    input.accountName ? `Account: ${input.accountName}.` : input.accountHint ? `The company named is ${input.accountHint}; it is not a GAP account yet. Name the accounts (that company, or others the item points at) in "accounts".` : 'No account is named. Name the kinds of company and any specific accounts the item points at in "accounts".',
    input.candidateAccounts.length ? `GAP accounts whose names match: ${input.candidateAccounts.join('; ')}.` : '',
    input.person ? `The person: ${input.person.name ?? input.person.email}${input.person.title ? `, ${input.person.title}` : ''}${input.person.lastWroteAt ? `; they last wrote to us ${dayText(input.person.lastWroteAt)}${input.person.messages ? ` (${input.person.messages} message${input.person.messages === 1 ? '' : 's'} on record)` : ''}` : ''}. The angle is for continuing that conversation, not opening a new one.` : '',
    input.person?.excerpt ? `What they last wrote${input.person.lastWroteAt ? ` (${dayText(input.person.lastWroteAt)}${input.person.subject ? `, subject "${input.person.subject.slice(0, 80)}"` : ''})` : ''}, their words, quoted for you only: "${input.person.excerpt.slice(0, 600)}". Build on what they said; do not ask what they already answered.` : '',
    input.deals?.length ? `${input.accountName ?? 'This account'} is in ${input.deals.length === 1 ? 'an open HubSpot deal' : `${input.deals.length} open HubSpot deals`}: ${input.deals.map((d) => `${d.name ?? 'a deal'}${d.stage ? ` (${d.stage})` : ''}${d.nextStep ? `, next step: ${d.nextStep.slice(0, 160)}` : ''}`).join('; ')}. The angle is deal work: carry the deal's next step forward from the conversation; never a cold opener; "proposedAction" is email or call${input.deals.length > 1 ? '; say in the caveat which deal the angle serves' : ''}.` : '',
    input.roster.length ? `People GAP holds at the account (offer at most three by persona id, the best fit first; never anyone else):\n${input.roster.map((p) => `- id ${p.id}: ${p.name ?? 'unnamed'}${p.title ? `, ${p.title}` : ''}`).join('\n')}` : 'No people are on record for this account: leave "people" empty and name the roles.',
    input.theses.length ? `What GAP already thinks about the account (hypotheses, not facts):\n${input.theses.map((t) => `- ${t.family ?? 'unmapped'}: ${t.observation.slice(0, 200)}`).join('\n')}` : '',
    input.recent.length ? `Other recent items at the account: ${input.recent.map((r) => `"${r.slice(0, 80)}"`).join('; ')}.` : '',
    input.record ? `\n${input.record}` : '',
    '',
    'Hard rules (a checker rejects the answer otherwise):',
    '- "whyItMatters": 15 to 120 words, hedged (' + HEDGE_TOKENS.slice(0, 6).join(', ') + '). Say what the item suggests about their yards and why a conversation could be worth having. State the date as the source line says it: a historical observation is never presented as happening today.',
    '- "roles": 2 to 4 buyer roles (titles) worth the conversation. "people": persona ids from the list only, best fit first.',
    '- "starters": exactly 2 open questions about their operation, in plain words, no pitch.',
    '- "proposedAction": "email" when a person and a sayable angle exist, "call" when a person exists and the item is a conversation opener, "research" when GAP should check the source or find the people first.',
    '- "caveat": what is not known or should be verified before writing (or null).',
    '- "support": one entry per sentence of "whyItMatters" and per starter: the [K] labels from the record that support it and "kind": "fact" when a label supports it, "inference" when it is your guess. Never attribute words or intent to the buyer without a "Buyer said" label; never name an installed system the record does not name; a pain you cannot cite is an inference, said as one. A dated record is cited with its date, never as today.',
    '- Never name YardFlow or a product, never promise savings, money, percentages or ROI, never invent a number. No em dashes. Say "yards" (plural) in prose: "their yards", "operations in their yards", never "the yard", "yard operations" or "yard processes" (only yard network, yard management, yard system, yard check, yard truck, yard move and yard spotting keep the singular). Say "production capacity", never "throughput". "people" holds plain integers.',
  ].filter((l) => l !== '').join('\n');
}

const ANGLE_KEY = /^(signal|trigger|person):(.+)$/;

export async function developAngle(task: ClaimedTask, ctx: { prisma: PrismaLike; now: Date }, deps: DevelopAngleDeps = {}): Promise<HandlerResult> {
  const { prisma, now } = ctx;
  const m = ANGLE_KEY.exec(task.itemKey);
  if (!m) return { ok: false, reason: 'not_an_intelligence_item', detail: task.itemKey };
  const input = (task.input ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const accountName = str(input.accountName);
  const accountHint = str(input.accountHint);
  const title = str(input.title) ?? (m[1] === 'person' ? `${str(input.name) ?? str(input.email) ?? 'A person'} wrote to us` : 'An item');
  const categories = Array.isArray(input.categories) ? input.categories.filter((c): c is string => typeof c === 'string') : [];
  const person = m[1] === 'person' ? { email: str(input.email) ?? m[2], name: str(input.name), title: str(input.title), lastWroteAt: str(input.lastWroteAt), subject: str(input.subject), excerpt: str(input.excerpt), messages: typeof input.messages === 'number' ? input.messages : null } : null;
  // C06: the open deals the Pursue scoped the person to (the day's CRM read); the angle is deal work, never a cold opener.
  const deals = Array.isArray(input.deals) ? (input.deals as Array<{ id?: string | null; name?: string | null; stage?: string; nextStep?: string | null }>).filter((d) => d && typeof d === 'object') : [];

  const roster: Array<{ id: number; name: string | null; title: string | null }> = accountName && typeof prisma?.persona?.findMany === 'function'
    ? (await prisma.persona.findMany({ where: { account_name: accountName, do_not_contact: false }, select: { id: true, name: true, title: true }, take: 60 }).catch(() => []) as Array<{ id: number; name: string | null; title: string | null }>)
        .sort((a, b) => Number(BUYER_ROLE.test(b.title ?? '')) - Number(BUYER_ROLE.test(a.title ?? '')))
        .slice(0, ROSTER_MAX)
    : [];
  const theses: Array<{ family: string | null; observation: string }> = accountName && typeof prisma?.prospectingHypothesis?.findMany === 'function'
    ? (await prisma.prospectingHypothesis.findMany({ where: { account_name: accountName, status: { in: ['active', 'approved', 'review_required'] } }, select: { problem_family: true, observation: true }, take: 3 }).catch(() => []) as Array<{ problem_family: string | null; observation: string | null }>).map((h) => ({ family: h.problem_family, observation: String(h.observation ?? '').replace(/\s*\[S:[A-Za-z0-9_-]+\]/g, '') }))
    : [];
  const recent: string[] = accountName && typeof prisma?.gapSignal?.findMany === 'function'
    ? (await prisma.gapSignal.findMany({ where: { account_name: accountName }, select: { title: true }, orderBy: { created_at: 'desc' }, take: 6 }).catch(() => []) as Array<{ title: string | null }>).map((s) => s.title).filter((t): t is string => !!t && t !== title).slice(0, 5)
    : [];
  const candidateAccounts: string[] = !accountName && accountHint && typeof prisma?.account?.findMany === 'function'
    ? (await prisma.account.findMany({ where: { name: { contains: accountHint.split(' ')[0], mode: 'insensitive' } }, select: { name: true }, take: 5 }).catch(() => []) as Array<{ name: string }>).map((a) => a.name)
    : [];

  const sourceLine = sourceLineFor({ source: str(input.source), url: str(input.url), publishedAt: str(input.publishedAt), observedAt: str(input.lastWroteAt) ?? str(input.observedAt) }, now);
  // C21: the commercial-context packet, seeded from what the Pursue carried (the placement, the day's deal read, the
  // message) and joined with the vault and Clawd (the env's adapters), the verified public facts and whatever the
  // caller wired (the timeline, the CRM). Every source failure is a gap on the packet, never a thrown task.
  const seed = packetSeedFromInput(input);
  const emailDomain = person?.email.toLowerCase().split('@')[1] ?? null;
  const domain = emailDomain && !/^(gmail|yahoo|hotmail|outlook|icloud|aol|me|live|msn|protonmail)\.com$/.test(emailDomain) ? emailDomain : accountHint?.includes('.') ? accountHint.toLowerCase() : null;
  const publicFacts = deps.context?.publicFacts ?? (typeof prisma?.gapSignal?.findMany === 'function' ? async (q: { accountName: string }) => (await prisma.gapSignal.findMany({ where: { account_name: q.accountName }, select: GATE_SIGNAL_SELECT, orderBy: { observed_at: 'desc' }, take: 20 }).catch(() => [])) as GateSignal[] : undefined);
  const packet = deps.packet ?? (await assembleCommercialContext({ ...(deps.context ?? {}), knowledge: deps.context?.knowledge ?? knowledgeAdapters(), publicFacts }, { accountName, domain, people: seed.identity.people, threadId: str(input.threadId), now, seed })).packet;
  const record = packetRecord(packet);
  const prompt = buildAnglePrompt({ title, sourceLine, accountName, accountHint, categories, note: str(input.note), person, roster, theses, recent, candidateAccounts, decision: str(input.decision) ?? task.request, deals: deals.map((d) => ({ id: d.id ?? null, name: d.name ?? null, stage: d.stage ?? '', nextStep: d.nextStep ?? null })), record: record.text });
  const generate = deps.generate ?? ((p: string, m?: number) => gapGenerate(ctx.prisma, { prompt: p, maxTokens: m ?? MAX_TOKENS, tier: task.input && (task.input as Record<string, unknown>).decision === 'more' ? 'strong' : 'routine', task: { id: task.id, kind: task.kind, itemKey: task.itemKey }, now: ctx.now }));
  const rosterIds = new Set(roster.map((p) => p.id));
  let out = await generate(prompt, MAX_TOKENS);
  let angle = parseAngle(out.text);
  if (!angle) return { ok: false, reason: 'could_not_satisfy', detail: 'the model returned something that is not a usable angle' };
  let check = validateAngle(angle, rosterIds);
  // C22: the claims are checked once the voice passes (a style break is re-asked first); a claim break is re-asked the same way.
  const claimsOf = (ang: Angle, styleOk: boolean): ClaimCheck => (styleOk ? validateAngleClaims(ang, ang.support ?? [], record.refs) : { ok: true, support: [] });
  let claims = claimsOf(angle, check.ok);
  let calls = 1;
  // A03/A03c: a fixable voice-rule break is re-asked, naming the break and quoting the place, at most twice (three
  // calls per task, all on the spend ledger); the refusal stands if the last answer still breaks a rule.
  while (((!check.ok && REASK_REASONS.has(check.reason)) || (check.ok && !claims.ok)) && calls < MAX_ANGLE_CALLS) {
    const why = !check.ok ? reaskLine(check) : reaskClaimLine(claims as Exclude<ClaimCheck, { ok: true }>);
    const again = await generate(`${prompt}

Your previous answer was rejected by the checker: ${why}. Fix only that and answer again with the complete JSON object.

Previous answer:
${out.text.slice(0, 3000)}`, MAX_TOKENS);
    calls += 1;
    const fixed = parseAngle(again.text);
    if (!fixed) break;
    out = again;
    angle = fixed;
    check = validateAngle(fixed, rosterIds);
    claims = claimsOf(fixed, check.ok);
  }
  // A03d: after the re-asks a singular "yard" is a WARNING carried on the angle (the compiler's C14 treats it the same
  // way), never a refusal: the angle is material Casey reads, and the compiler judges any copy before a buyer sees it.
  const warnings: string[] = [];
  if (!check.ok && check.reason === 'yard_singular') {
    const relaxed = validateAngle(angle, rosterIds, { allowSingularYard: true });
    if (relaxed.ok) {
      warnings.push(`Voice: it says "yard" in the singular (${check.detail ?? 'yard'}); the canon says yards. Edit that before a buyer reads it.`);
      check = relaxed;
      claims = claimsOf(angle, true);
    }
  }
  const after = calls > 1 ? ` (after ${calls - 1 === 1 ? 'one re-ask' : `${calls - 1} re-asks`})` : '';
  if (!check.ok) return { ok: false, reason: 'could_not_satisfy', detail: `${check.reason}${check.detail ? ` ${check.detail}` : ''}${after}` };
  if (!claims.ok) return { ok: false, reason: 'could_not_satisfy', detail: `${claims.reason} ${claims.detail}${after}` };
  const peopleNamed = angle.people.map((id) => roster.find((p) => p.id === id)).filter((p): p is { id: number; name: string | null; title: string | null } => !!p).map((p) => ({ personaId: p.id, name: p.name, title: p.title }));
  const { support: _raw, ...body } = angle;
  void _raw;
  const result: Omit<PreparedAngle, 'taskId' | 'preparedAt'> & { provider: string; calls: number } = { key: task.itemKey, title, accountName, accountHint, sourceLine, ...body, support: claims.support, contextRevision: packet.revision, contextGaps: record.gaps, incumbents: record.incumbents.map((i) => ({ name: i.name, claimClass: i.claimClass, at: i.at })), peopleNamed, provider: out.provider, calls, warnings, ...(deals.length ? { inDeal: true, dealId: deals.length === 1 ? deals[0].id ?? null : null, dealIds: deals.map((d) => d.id ?? null) } : {}) };
  return { ok: true, result };
}

/** The prepared angles for the given item keys (the succeeded tasks' results), newest first per key. Soft. */
export async function loadAngles(prisma: PrismaLike, opts: { keys?: readonly string[]; now: Date }): Promise<Map<string, PreparedAngle>> {
  const out = new Map<string, PreparedAngle>();
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const tasks = await listAgentTasks(prisma, { now: opts.now, status: 'succeeded' }).catch(() => []);
  for (const t of tasks.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))) {
    if (t.kind !== 'develop_angle' || !t.result || typeof t.result.whyItMatters !== 'string') continue;
    if (opts.keys && !opts.keys.includes(t.itemKey)) continue;
    if (out.has(t.itemKey)) continue;
    const r = t.result as unknown as Omit<PreparedAngle, 'taskId' | 'preparedAt'>;
    out.set(t.itemKey, { ...r, taskId: t.id, preparedAt: t.queuedAt });
  }
  return out;
}
