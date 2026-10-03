/**
 * The tinted badge variants (success / warning / info: a 15% tint of the hue) need the -800 text shade in light mode
 * to clear WCAG AA 4.5:1 at 12px; -700 measured 4.48 on production (Contacts "Needs Enrichment"). Dark keeps -400.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('badge tinted variants', () => {
  it('light text is -800 on a /15 tint, dark text -400', () => {
    const src = readFileSync('src/components/ui/badge.tsx', 'utf8');
    for (const v of ['success', 'warning', 'info']) {
      const line = src.split('\n').find((l) => l.trim().startsWith(`${v}:`))!;
      expect(line).toMatch(/bg-\w+-500\/15 text-\w+-800 dark:text-\w+-400/);
    }
  });
});
