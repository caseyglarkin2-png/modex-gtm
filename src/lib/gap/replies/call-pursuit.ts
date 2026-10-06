/**
 * Call prep reads the SAME account pursuit state NOW shows (account-first UX, UX-06; lib/gap/pursuit/state.ts).
 * Under a reply, an opt-out, a deal or a hold the call page says so first and offers no opener. Bounded and soft:
 * an unreadable state is `null`, and the page offers no opener on null either (fail closed). House `prisma: any`.
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { loadPursuit } from '../pursuit/load';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CALL_PURSUIT_TIMEOUT_MS = 45_000;
export const CALL_HOLD_STATES: ReadonlySet<string> = new Set(['replied', 'opted_out', 'in_deal', 'held']);

export interface CallPursuit {
  state: string;
  stateLine: string;
  blocker: string | null;
  holdsCall: boolean;
}

export async function callPursuit(prisma: PrismaLike, accountName: string, now: Date = new Date(), timeoutMs: number = CALL_PURSUIT_TIMEOUT_MS): Promise<CallPursuit | null> {
  const read = (async () => {
    const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
    if (!inputs) return null;
    const brief = buildAccountBrief(inputs, now);
    const ctx = await loadAccountContext(prisma, inputs, now);
    const p = await loadPursuit(prisma, { brief, inputs, ctx, now });
    return { state: p.state.state, stateLine: p.state.stateLine, blocker: p.state.blocker, holdsCall: CALL_HOLD_STATES.has(p.state.state) };
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
