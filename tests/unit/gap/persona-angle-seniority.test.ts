/** Scale dogfood: WHY YOU never tells an individual contributor they own the network (PepsiCo "senior supply chain specialist"). */
import { describe, expect, it } from 'vitest';
import { suggestAngle } from '@/lib/gap/motion/persona-angle';

describe('suggested angle respects seniority', () => {
  it.each(['Senior Supply Chain Specialist', 'Transportation Analyst', 'Logistics Coordinator', 'Distribution Planner'])('%s is close to the work, not its owner', (title) => {
    const a = suggestAngle({ title, personaKey: null, accountName: 'PepsiCo' })!;
    expect(a).toMatch(/^Close to the day-to-day/);
    expect(a).not.toMatch(/\b(Owns|Runs|Executive owner)\b/);
  });
  it('owners and yard-floor roles keep their angles', () => {
    expect(suggestAngle({ title: 'VP Supply Chain', personaKey: null, accountName: 'PepsiCo' })).toMatch(/^Owns the PepsiCo supply chain network/);
    expect(suggestAngle({ title: 'Yard Coordinator', personaKey: null, accountName: 'PepsiCo' })).toMatch(/^Works the yard and dock/);
  });
});
