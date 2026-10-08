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
 */
import { generateTextWithMetadata } from '@/lib/ai/client';
import { YARDFLOW_MESSAGING } from '@/lib/ai/yardflow-context';
import { HEDGE_TOKENS } from '../taxonomy';
import { listAgentTasks, type ClaimedTask, type HandlerResult } from './tasks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface DevelopAngleDeps {
  generate?: (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;
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
}

export interface PreparedAngle extends Angle {
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

const dayText = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

export function sourceLineFor(i: { source?: string | null; url?: string | null; publishedAt?: string | null; observedAt?: string | null }, now: Date): string {
  const host = i.source ?? (i.url ? (() => { try { return new URL(i.url as string).hostname.replace(/^www\./, ''); } catch { return 'the source'; } })() : 'the mailbox');
  const at = i.publishedAt ?? i.observedAt ?? null;
  if (!at) return `${host}, undated`;
  const old = now.getTime() - new Date(at).getTime() > 45 * 86_400_000;
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
    const people = Array.isArray(o.people) ? o.people.filter((x): x is number => typeof x === 'number' && Number.isInteger(x)).slice(0, 3) : [];
    return { whyItMatters, accounts: strs(o.accounts, 5), roles: strs(o.roles, 4), people, starters, proposedAction: action, caveat: typeof o.caveat === 'string' && o.caveat.trim() ? o.caveat.trim() : null };
  } catch {
    return null;
  }
}

export type AngleCheck = { ok: true } | { ok: false; reason: 'em_dash' | 'yard_singular' | 'product_named' | 'money_promised' | 'person_not_offered' | 'length'; detail?: string };

/** The rules every GAP text keeps; a person the roster did not offer is never named. */
export function validateAngle(a: Angle, roster: ReadonlySet<number>): AngleCheck {
  const text = [a.whyItMatters, ...a.accounts, ...a.roles, ...a.starters, a.caveat ?? ''].join(' ');
  // The prose keeps the voice; a job title ("Yard Operations Manager") is the buyer's words, not ours.
  const prose = [a.whyItMatters, ...a.starters, a.caveat ?? ''].join(' ');
  if (/—/.test(text)) return { ok: false, reason: 'em_dash' };
  if (/\byard\b/i.test(prose)) return { ok: false, reason: 'yard_singular' };
  if (/\b(yardflow|freightroll|flowgate|flowdriver|flowbol|flowvision|flowyms)\b/i.test([a.whyItMatters, ...a.starters].join(' ').replace(/to YardFlow/gi, ''))) return { ok: false, reason: 'product_named' };
  if (/\$\s?\d|\b\d+(\.\d+)?\s?%|\b(roi|savings|dollars)\b/i.test(text)) return { ok: false, reason: 'money_promised' };
  const stranger = a.people.find((id) => !roster.has(id));
  if (stranger !== undefined) return { ok: false, reason: 'person_not_offered', detail: String(stranger) };
  const words = a.whyItMatters.split(/\s+/).filter(Boolean).length;
  if (words < 15 || words > 120) return { ok: false, reason: 'length', detail: `${words} words` };
  return { ok: true };
}

export function buildAnglePrompt(input: { title: string; sourceLine: string; accountName: string | null; accountHint: string | null; categories: string[]; note: string | null; person: { name: string | null; title: string | null; email: string; lastWroteAt?: string | null } | null; roster: Array<{ id: number; name: string | null; title: string | null }>; theses: Array<{ family: string | null; observation: string }>; recent: string[]; candidateAccounts: string[]; decision: string }): string {
  const pains = YARDFLOW_MESSAGING.painFramework.defaultPains.map((p) => `- ${p}`).join('\n');
  return [
    'You develop ONE commercial angle for a YardFlow seller from one piece of intelligence. Answer with one JSON object only: {"whyItMatters": "...", "accounts": [...], "roles": [...], "people": [persona ids], "starters": ["...", "..."], "proposedAction": "email" | "call" | "research", "caveat": "..." | null}. No prose around it.',
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
    input.person ? `The person: ${input.person.name ?? input.person.email}${input.person.title ? `, ${input.person.title}` : ''}${input.person.lastWroteAt ? `; they last wrote to us ${dayText(input.person.lastWroteAt)}` : ''}. The angle is for reopening that conversation.` : '',
    input.roster.length ? `People GAP holds at the account (offer at most three by persona id, the best fit first; never anyone else):\n${input.roster.map((p) => `- id ${p.id}: ${p.name ?? 'unnamed'}${p.title ? `, ${p.title}` : ''}`).join('\n')}` : 'No people are on record for this account: leave "people" empty and name the roles.',
    input.theses.length ? `What GAP already thinks about the account (hypotheses, not facts):\n${input.theses.map((t) => `- ${t.family ?? 'unmapped'}: ${t.observation.slice(0, 200)}`).join('\n')}` : '',
    input.recent.length ? `Other recent items at the account: ${input.recent.map((r) => `"${r.slice(0, 80)}"`).join('; ')}.` : '',
    '',
    'Hard rules (a checker rejects the answer otherwise):',
    '- "whyItMatters": 15 to 120 words, hedged (' + HEDGE_TOKENS.slice(0, 6).join(', ') + '). Say what the item suggests about their yards and why a conversation could be worth having. State the date as the source line says it: a historical observation is never presented as happening today.',
    '- "roles": 2 to 4 buyer roles (titles) worth the conversation. "people": persona ids from the list only, best fit first.',
    '- "starters": exactly 2 open questions about their operation, in plain words, no pitch.',
    '- "proposedAction": "email" when a person and a sayable angle exist, "call" when a person exists and the item is a conversation opener, "research" when GAP should check the source or find the people first.',
    '- "caveat": what is not known or should be verified before writing (or null).',
    '- Never name YardFlow or a product, never promise savings, money, percentages or ROI, never invent a number. No em dashes. Say "yards" never "yard" alone.',
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
  const person = m[1] === 'person' ? { email: str(input.email) ?? m[2], name: str(input.name), title: str(input.title), lastWroteAt: str(input.lastWroteAt) } : null;

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
  const prompt = buildAnglePrompt({ title, sourceLine, accountName, accountHint, categories, note: str(input.note), person, roster, theses, recent, candidateAccounts, decision: str(input.decision) ?? task.request });
  const out = await (deps.generate ?? generateTextWithMetadata)(prompt, MAX_TOKENS);
  const angle = parseAngle(out.text);
  if (!angle) return { ok: false, reason: 'could_not_satisfy', detail: 'the model returned something that is not a usable angle' };
  const check = validateAngle(angle, new Set(roster.map((p) => p.id)));
  if (!check.ok) return { ok: false, reason: 'could_not_satisfy', detail: `${check.reason}${check.detail ? ` ${check.detail}` : ''}` };
  const peopleNamed = angle.people.map((id) => roster.find((p) => p.id === id)).filter((p): p is { id: number; name: string | null; title: string | null } => !!p).map((p) => ({ personaId: p.id, name: p.name, title: p.title }));
  const result: Omit<PreparedAngle, 'taskId' | 'preparedAt'> & { provider: string } = { key: task.itemKey, title, accountName, accountHint, sourceLine, ...angle, peopleNamed, provider: out.provider };
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
