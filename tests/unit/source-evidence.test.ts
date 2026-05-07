import { describe, expect, it } from 'vitest';
import {
  evaluateEvidenceFreshness,
  getAccountsWithoutFreshEvidence,
} from '@/lib/source-backed/evidence';

describe('source evidence freshness policy', () => {
  it('classifies fresh, aging, and stale windows', () => {
    const now = new Date('2026-05-07T12:00:00.000Z');
    const fresh = evaluateEvidenceFreshness(new Date('2026-05-06T12:00:00.000Z'), now);
    const aging = evaluateEvidenceFreshness(new Date('2026-05-04T12:00:00.000Z'), now);
    const stale = evaluateEvidenceFreshness(new Date('2026-04-20T12:00:00.000Z'), now);

    expect(fresh).toBe('fresh');
    expect(aging).toBe('aging');
    expect(stale).toBe('stale');
  });
});

describe('getAccountsWithoutFreshEvidence (per-account stale check)', () => {
  function makeFakeDb(freshAccountNames: string[]) {
    return {
      evidenceRecord: {
        findMany: async (_args: unknown) => {
          return freshAccountNames.map((name) => ({ account_name: name }));
        },
      },
    } as unknown as Parameters<typeof getAccountsWithoutFreshEvidence>[1];
  }

  it('returns empty set when given no accounts (no DB call)', async () => {
    const result = await getAccountsWithoutFreshEvidence([], makeFakeDb([]));
    expect(result.size).toBe(0);
  });

  it('returns the input names when none of them have fresh evidence', async () => {
    const db = makeFakeDb([]);
    const result = await getAccountsWithoutFreshEvidence(['Hormel Foods', 'AB InBev'], db);
    expect([...result].sort()).toEqual(['AB InBev', 'Hormel Foods']);
  });

  it('omits accounts that have at least one fresh evidence record', async () => {
    const db = makeFakeDb(['Hormel Foods']);
    const result = await getAccountsWithoutFreshEvidence(
      ['Hormel Foods', 'AB InBev', 'Diageo'],
      db,
    );
    expect([...result].sort()).toEqual(['AB InBev', 'Diageo']);
  });

  it('treats fresh evidence on an unrelated account as not affecting scope', async () => {
    // Even if fresh evidence exists for accounts outside the requested scope,
    // those names won't show up in the query result (Prisma filters by `in:`),
    // so all requested names should still be flagged stale.
    const db = makeFakeDb([]);
    const result = await getAccountsWithoutFreshEvidence(['Diageo'], db);
    expect([...result]).toEqual(['Diageo']);
  });
});
