/**
 * Contacts status labels (DNC / Invalid / Synced) are 12px text: in light mode a status hue needs the 700+ shade to
 * clear WCAG AA on white (red-500 3.81, amber-500 2.13, green-600 3.22 measured on production), with a dark: partner.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('contacts status label contrast', () => {
  it('every hue text class in the contacts table is 700+ in light mode and has a dark: partner', () => {
    const src = readFileSync('src/app/contacts/contacts-table.tsx', 'utf8');
    for (const cls of src.match(/className="[^"]*"/g) ?? []) {
      const light = cls.match(/(?<![:\w-])text-(red|green|amber|yellow|orange|emerald|sky|blue)-(\d{3})\b/g) ?? [];
      for (const l of light) {
        expect(Number(l.split('-').pop()), `${l} in ${cls}`).toBeGreaterThanOrEqual(700);
        expect(cls, `${l} has no dark: partner`).toMatch(/dark:text-/);
      }
    }
  });
});
