/**
 * Call prep reads the SAME account pursuit state NOW shows (account-first UX, UX-06; lib/gap/pursuit/state.ts).
 * Under a reply, an opt-out, a deal or a hold the call page says so first and offers no opener. Bounded and soft:
 * an unreadable state is `null`, and the page offers no opener on null either (fail closed). House `prisma: any`.
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { loadPursuit } from '../pursuit/load';
import { thesisRelevance } from '../people/thesis-relevance';
import { remitCaution } from '../story/anchor-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CALL_PURSUIT_TIMEOUT_MS = 45_000;
export const CALL_HOLD_STATES: ReadonlySet<string> = new Set(['replied', 'opted_out', 'in_deal', 'held']);

export interface CallPursuit {
  state: string;
  stateLine: string;
  blocker: string | null;
  holdsCall: boolean;
  /** The thesis the pack opens on (usable), or null when nothing is usable: then no opener on the call page either. */
  hypothesisId: string | null;
  /** The usable theses: a brief whose thesis is not among them offers no opener (the send gate would refuse it). */
  usableTheses: string[];
  /** The remit caution NEXT carries on the account page, when the opening fact may not land on the chosen person. */
  caution: string | null;
}

/**
 * The remit caution for the call page, the same sentence NEXT carries: null when the opener's fact lands on the
 * chosen person's remit (direct or related), else the caution naming the eligible person it fits, if any.
 */
export function openerCaution(
  person: { name: string; title: string | null } | null,
  opener: { observation: { text: string }; problem: string } | null,
  people: Array<{ name: string; title: string | null }>,
): string | null {
  if (!person || !opener) return null;
  const ctx = { observation: opener.observation.text, problemHypothesis: opener.problem };
  const rel = thesisRelevance(person.title ?? null, ctx);
  if (rel.tier !== 'none') return null;
  const others = people.filter((o) => o.name !== person.name);
  const tierOf = (o: { title: string | null }) => thesisRelevance(o.title, ctx).tier;
  const fits = others.find((o) => tierOf(o) === 'direct') ?? others.find((o) => tierOf(o) === 'related') ?? null;
  return remitCaution(person.name.split(' ')[0], rel.factLabel, fits);
}

export async function callPursuit(prisma: PrismaLike, accountName: string, now: Date = new Date(), timeoutMs: number = CALL_PURSUIT_TIMEOUT_MS): Promise<CallPursuit | null> {
  const read = (async () => {
    const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
    if (!inputs) return null;
    const brief = buildAccountBrief(inputs, now);
    const ctx = await loadAccountContext(prisma, inputs, now);
    const p = await loadPursuit(prisma, { brief, inputs, ctx, now });
    // The same caution NEXT carries: the opener's fact against the chosen person's remit, and who it fits.
    const opener = p.hypothesisId ? brief.hypotheses.find((h) => h.id === p.hypothesisId) ?? null : null;
    const people = [...(p.stack?.rows ?? []), ...(p.stack?.more ?? [])].map((r) => ({ name: r.name, title: r.title ?? null }));
    const caution = openerCaution(p.state.person ? { name: p.state.person.name, title: p.state.person.title ?? null } : null, opener, people);
    return { state: p.state.state, stateLine: p.state.stateLine, blocker: p.state.blocker, holdsCall: CALL_HOLD_STATES.has(p.state.state), hypothesisId: p.hypothesisId, usableTheses: p.usableTheses, caution };
  })();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cap = new Promise<null>((r) => {
    timer = setTimeout(() => r(null), timeoutMs);
  });
  return Promise.race([read, cap])
    .catch(() => null)
    .finally(() => {
      if (timer) clearTimeout(timer);
    });
}
