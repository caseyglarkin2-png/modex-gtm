/**
 * Is this thesis the account's CURRENT actionable thesis? (execution acceptance, 2026-10-01)
 *
 * The rule itself is account-intel/build.ts `thesisCurrentness` (pure). This loads its inputs (database only, no
 * HubSpot) and fails closed: an account or thesis that cannot be read is `unknown`, which every outward action
 * treats as a refusal. Read only.
 */
import { loadAccountInputs } from '../account-intel/load';
import { thesisCurrentness } from '../account-intel/build';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ThesisCurrentness =
  | { current: true }
  | { current: false; reason: string; bestFact: string | null; opener: string | null }
  | { current: 'unknown'; reason: string };

export type ThesisCurrentnessCheck = (prisma: PrismaLike, accountName: string, hypothesisId: string, now: Date) => Promise<ThesisCurrentness>;

export const checkThesisCurrent: ThesisCurrentnessCheck = async (prisma, accountName, hypothesisId, now) => {
  try {
    // Lean: theses, facts, buyer truth and review acks only (fast at a click), and a failed read throws (fails closed).
    const inputs = await loadAccountInputs(prisma, accountName, now, { hypothesisId, lean: true });
    if (!inputs) return { current: 'unknown', reason: `The account ${accountName} could not be read, so GAP cannot confirm this thesis is current.` };
    return thesisCurrentness(inputs, hypothesisId, now);
  } catch (e) {
    return { current: 'unknown', reason: `Could not check whether this thesis is current (${e instanceof Error ? e.message.slice(0, 120) : 'error'}).` };
  }
};
