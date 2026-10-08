/**
 * R63 matrix (acceptB): card readiness body text still said "hypothesis" ("No hypothesis covers <name> at <account>",
 * "The hypothesis rests on stale or expired evidence."). The R60 vocabulary applies to body text too: "thesis".
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('R63 matrix: card readiness speaks of a thesis', () => {
  it('no seller sentence in card-readiness says "hypothesis"', () => {
    const src = readFileSync('src/lib/gap/routing/card-readiness.ts', 'utf8');
    // Every string literal (quotes and template literals) shown to the seller.
    const literals = [...src.matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? '');
    const said = literals.filter((s) => /\s/.test(s) && /\bhypothes(?:is|es)\b/i.test(s));
    expect(said).toEqual([]);
    expect(src).toContain('No thesis covers ${name} at ${item.account.name}');
    expect(src).toContain('The thesis rests on stale or expired evidence.');
  });
});
