/**
 * B4 compatibility: keys stored under the pre-2026-09-29 normalization (accents
 * and apostrophes became spaces) still match. An alias stored as "nestl usa"
 * resolves "Nestlé USA" AND "Nestle USA"; registering the plain spelling is
 * ALREADY_MATCHED, never a second row; a re-imported accented company is the
 * member it already was, never a duplicate.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadIdentityContext, registerAlias } from '@/lib/gap/identity/service';
import { legacyNormalizeCompanyName, normalizeCompanyName } from '@/lib/gap/identity/normalize';
import { legacyMemberKey, memberKey } from '@/lib/gap/intake/resolve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fn = (impl: (...a: any[]) => Promise<any>) => vi.fn(impl);

describe('legacy keys', () => {
  it('the legacy key is the old one; the new key folds accents', () => {
    expect(legacyNormalizeCompanyName('Nestlé USA')).toBe('nestl usa');
    expect(normalizeCompanyName('Nestlé USA')).toBe('nestle usa');
  });

  it('the identity context keys a stored alias under its old AND its recomputed key', async () => {
    const prisma = {
      account: { findMany: fn(async () => [{ name: 'Nestle USA', hubspot_company_id: null }]) },
      canonicalCompany: { findMany: fn(async () => []) },
      canonicalAccountLink: { findMany: fn(async () => []) },
      gapAccountAlias: { findMany: fn(async () => [{ alias: 'Nestlé USA', normalized_alias: 'nestl usa', account_name: 'Nestle USA' }]) },
    };
    const ctx = await loadIdentityContext(prisma);
    expect(ctx.aliasToAccounts.get('nestle usa')).toEqual(['Nestle USA']);
    expect(ctx.aliasToAccounts.get('nestl usa')).toEqual(['Nestle USA']);
  });

  it('registering a spelling whose legacy key is already stored is ALREADY_MATCHED (or a CONFLICT), never a second row', async () => {
    const create = fn(async () => ({ id: 'new' }));
    const prisma = {
      gapAccountAlias: {
        findUnique: fn(async ({ where }: { where: { normalized_alias: string } }) => (where.normalized_alias === 'nestl usa' ? { id: 'old', account_name: 'Nestle USA' } : null)),
        create,
      },
    };
    expect(await registerAlias(prisma, { alias: 'Nestlé USA', accountName: 'Nestle USA', source: 'manual', createdBy: 'x' })).toMatchObject({ status: 'ALREADY_MATCHED', id: 'old' });
    expect(await registerAlias(prisma, { alias: 'Nestlé USA', accountName: 'Other', source: 'manual', createdBy: 'x' })).toMatchObject({ status: 'CONFLICT', existingAccountName: 'Nestle USA' });
    expect(create).not.toHaveBeenCalled();
  });

  it('an intake member key has a legacy twin only when the old normalization differed', () => {
    const acct = { kind: 'account' as const, company: 'Nestlé USA', raw: {} };
    expect(memberKey(acct)).toBe('account:nestle usa');
    expect(legacyMemberKey(acct)).toBe('account:nestl usa');
    expect(legacyMemberKey({ kind: 'account' as const, company: 'Harbor Foods', raw: {} })).toBeNull();
    expect(legacyMemberKey({ kind: 'person' as const, name: 'Ana', company: "Kellogg's", title: 'VP', raw: {} })).toMatch(/kellogg s/);
  });

  it('the PLAIN spelling finds an accented alias stored under its legacy key (no second row)', async () => {
    const create = fn(async () => ({ id: 'new' }));
    const prisma = {
      gapAccountAlias: {
        findUnique: fn(async () => null),
        findMany: fn(async () => [{ id: 'old', alias: 'Nestlé USA', account_name: 'Nestle USA' }]),
        create,
      },
    };
    expect(await registerAlias(prisma, { alias: 'Nestle USA', accountName: 'Nestle USA', source: 'manual', createdBy: 'x' })).toMatchObject({ status: 'ALREADY_MATCHED', id: 'old' });
    expect(await registerAlias(prisma, { alias: 'Nestle USA', accountName: 'Other', source: 'manual', createdBy: 'x' })).toMatchObject({ status: 'CONFLICT' });
    expect(create).not.toHaveBeenCalled();
  });
});
