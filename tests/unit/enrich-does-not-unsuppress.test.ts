/**
 * Enrichment must never clear a do-not-contact decision.
 *
 * MEASURED 2026-08-16. `enrich-contacts.ts` ran
 * `prisma.persona.update({ where: { id }, data: { ..., do_not_contact: false } })`
 * on every successful enrichment. So a routine background job silently
 * un-suppressed anyone it happened to enrich, and `personas.do_not_contact` is
 * a bare boolean with no reason and no timestamp - which means the reversal
 * left no trace and the 242 suppressed personas could shrink without anybody
 * being able to tell it had happened, let alone why.
 *
 * WHY THIS TEST IS STRUCTURAL RATHER THAN BEHAVIOURAL. `enrichPersona` is
 * module-private and the script binds a module-level Prisma client, so there is
 * no seam to inject a fake through without reshaping a one-off script around
 * its test. The invariant is also genuinely a property of the FILE rather than
 * of one call: enrichment has no business writing this column at all, in any
 * direction, from any code path in here. Asserting the field is absent catches
 * reintroduction anywhere in the script, including in a path that does not exist
 * yet - which a unit test pinned to today's single call site would not.
 *
 * The narrow reading matters: `do_not_contact: false` inside a `create()` is a
 * default on a new row and is fine. This file has no create, so absence is the
 * right rule here and would be the wrong rule elsewhere.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '../../scripts/enrich-contacts.ts');
const source = readFileSync(SCRIPT, 'utf8');

describe('enrich-contacts never writes do_not_contact', () => {
  it('the file was actually read', () => {
    // Without this, a bad path would make the assertion below pass vacuously
    // against an empty string.
    expect(source.length).toBeGreaterThan(1000);
    expect(source).toContain('prisma.persona.update');
  });

  /**
   * The rule is narrower than "never mention the field", because two of the
   * three original sites are correct and a blunt rule would have deleted them:
   *
   *   `do_not_contact: true`  in a `data:` block  - SETS suppression on a
   *       banned/blocked domain. That is the script doing its job.
   *   `do_not_contact: false` in a `where:` block - SELECTS only unsuppressed
   *       personas. That is the script declining to touch suppressed people.
   *   `do_not_contact: false` in a `data:` block  - the bug.
   *
   * So it tracks whether the nearest enclosing key is `data:` or `where:` and
   * only forbids the write. Comment lines are ignored deliberately: the fix
   * leaves a comment naming the field to explain its absence, and a test that
   * forbade the explanation alongside the bug would push the next person to
   * delete the reasoning to get green.
   */
  it('never writes do_not_contact: false in a data block', () => {
    let context: 'data' | 'where' | null = null;
    const offending: [number, string][] = [];

    source.split('\n').forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (/\bdata\s*:\s*\{/.test(trimmed)) context = 'data';
      else if (/\bwhere\s*:\s*\{/.test(trimmed)) context = 'where';
      if (/\bdo_not_contact\s*:\s*false\b/.test(trimmed) && context === 'data') {
        offending.push([i + 1, trimmed]);
      }
    });

    expect(
      offending,
      `enrichment must not write do_not_contact: false; found:\n${offending
        .map(([n, l]) => `  ${n}: ${l}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('still SELECTS only unsuppressed personas, and still SETS true on a banned domain', () => {
    // The controls. Without them the rule above is satisfied by a script that
    // stopped honouring suppression entirely.
    expect(source).toMatch(/\bdo_not_contact\s*:\s*false\b/); // the where-clause filter
    expect(source).toMatch(/\bdo_not_contact\s*:\s*true\b/);  // the banned-domain set
  });
});
