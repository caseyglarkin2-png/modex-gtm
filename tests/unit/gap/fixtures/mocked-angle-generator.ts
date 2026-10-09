/**
 * C54: a scripted angle generator for the harness check. It answers each prompt with an angle built from the case
 * the prompt names (its must-say phrases in a hedged, house-voice paragraph; two open questions, one admitting a no;
 * a support block that labels every sentence as an inference, so nothing is claimed as a buyer fact). One case
 * (`bad`) answers with a prohibited claim and a leaked seller note so the scorer is proven to catch both. This is a
 * harness check, never a quality claim about any model.
 */
import type { ReferenceCase } from '@/lib/gap/evaluation/reference-types';

type Generate = (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;

const first = (entry: string) => entry.split('|')[0].trim();

export function mockedGenerator(cases: readonly ReferenceCase[], opts: { bad?: string | null } = {}): Generate {
  return async (prompt) => {
    // The prompt names the person (a person item) or the item title (a signal item); the case is found by that, never by position.
    const c = cases.find((x) => (x.person ? prompt.includes(`The person: ${x.person.name}`) : prompt.includes(x.title))) ?? cases[0];
    const says = c.expected.mustSay.map(first).filter(Boolean);
    const bad = opts.bad === c.id;
    const why = bad
      ? `There is no live opportunity here, so a cold opener is the move: ${c.sources.find((s) => s.claimClass === 'seller_noted' || s.claimClass === 'inference')?.text ?? 'the committee is the problem and that is the angle to press on their yards today'}.`
      : `My guess is that the record already answers part of this (${says.join('; ') || 'what they wrote'}), so the conversation about their yards is worth having on that basis rather than as a fresh opener; the dates in the record say how current each point is.`;
    const starters = bad
      ? ['Can we book thirty minutes to show the product?', 'Who signs the contract?']
      : ['When a trailer reaches the gate at one of your yards today, who decides where it goes, or does the driver?', 'Is the plan you described still the plan, or has the timeline moved since you wrote?'];
    const support = [
      ...why.split(/(?<=[.;])\s+/).filter(Boolean).map((text) => ({ text, refs: [] as string[], kind: 'inference' })),
      ...starters.map((text) => ({ text, refs: [] as string[], kind: 'inference' })),
    ];
    return { text: JSON.stringify({ whyItMatters: why, accounts: c.account ? [c.account.name] : [], roles: ['VP Operations', 'Director of Distribution'], people: [], starters, proposedAction: c.expected.motion === 'review_first' ? 'research' : c.expected.motion === 'research_first' ? 'research' : 'email', caveat: 'Verify the record dates before writing.', support }), provider: 'mocked' };
  };
}
