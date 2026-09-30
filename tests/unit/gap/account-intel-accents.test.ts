/**
 * Release M: accented names. "Nestlé USA" and "Nestle USA" are the same company (normalizeCompanyName folds
 * accents), so each sees the other as a duplicate shell; an accented first letter ("Élan Foods") still resolves
 * by slug; and folding never collapses different companies ("Nestle Purina" is not "Nestle").
 * The SQL fake below applies the same fold and slug rules the queries run in Postgres (verified on scratch).
 */
import { describe, expect, it } from 'vitest';
import { accountNamesForSlug, FOLD_FROM, FOLD_TO, foldAccents, loadAccountInputs } from '@/lib/gap/account-intel/load';
import { accountSlug } from '@/lib/gap/account-intel/href';

const BOOK = ['Nestlé USA', 'Nestle USA', 'Nestle Purina', 'Élan Foods', 'Elan Foods', 'Kroger'];
function sqlFake(names: string[]) {
  // every other table is empty
  const empty = { findMany: async () => [], findUnique: async () => null, findFirst: async () => null, count: async () => 0 };
  const own = {
    $queryRaw: async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const sql = strings.join('?');
      if (sql.includes('regexp_replace')) return names.filter((n) => accountSlug(n) === vals[0]).map((name) => ({ name }));
      const prefix = String(vals[2]).replace(/%$/, '');
      return names.filter((n) => foldAccents(n).toLowerCase().startsWith(prefix)).map((name) => ({ name }));
    },
    account: { findUnique: async ({ where }: { where: { name: string } }) => (names.includes(where.name) ? { name: where.name, tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: null } : null), findMany: async () => [] },
  };
  return new Proxy(own, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'string' && !k.startsWith('$') && k !== 'then' ? empty : undefined) });
}

describe('accented account names', () => {
  it('a slug with a dropped accented letter still resolves, and only to that account', async () => {
    const p = sqlFake(BOOK);
    expect(accountSlug('Élan Foods')).toBe('lan-foods');
    expect(await accountNamesForSlug(p, 'lan-foods')).toEqual(['Élan Foods']);
    expect(await accountNamesForSlug(p, 'nestl-usa')).toEqual(['Nestlé USA']);
    expect(await accountNamesForSlug(p, 'nestle-usa')).toEqual(['Nestle USA']);
  });

  it('Nestlé USA and Nestle USA see each other as duplicate shells, from either spelling; Nestle Purina is neither', async () => {
    const p = sqlFake(BOOK) as never;
    const now = new Date('2026-09-29T12:00:00Z');
    expect((await loadAccountInputs(p, 'Nestle USA', now))?.siblings).toEqual(['Nestlé USA']);
    expect((await loadAccountInputs(p, 'Nestlé USA', now))?.siblings).toEqual(['Nestle USA']);
    expect((await loadAccountInputs(p, 'Nestle Purina', now))?.siblings).toEqual([]);
    // an accented FIRST letter: the query token is folded too ("elan", not "")
    expect((await loadAccountInputs(p, 'Élan Foods', now))?.siblings).toEqual(['Elan Foods']);
  });

  it('a database that cannot run the fold (WIN1252) falls back to the plain read instead of failing the brief', async () => {
    const p = sqlFake(BOOK) as Record<string, unknown>;
    p.$queryRaw = async () => { throw new Error('22P05 character has no equivalent in encoding WIN1252'); };
    p.account = { ...(p.account as object), findMany: async ({ where }: { where: { name: { startsWith: string } } }) => BOOK.filter((n) => n.toLowerCase().startsWith(where.name.startsWith)).map((name) => ({ name })) };
    const i = await loadAccountInputs(p as never, 'Nestle USA', new Date('2026-09-29T12:00:00Z'));
    expect(i).not.toBeNull();
    // the plain read cannot fold accents, so the accented shell is missed: degraded, never a failed page
    expect(i?.siblings).toEqual([]);
  });

  it('the translate() pairs line up one to one', () => {
    expect([...FOLD_FROM].length).toBe(FOLD_TO.length);
    expect(foldAccents(FOLD_FROM).toLowerCase()).toBe(FOLD_TO);
  });
});
