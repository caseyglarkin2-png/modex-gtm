import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getRefreshTokenFor,
  isTokenStoreConfigured,
  storeRefreshTokenForUser,
} from '@/lib/email/gmail-token-store';

// Fixed 32-byte key (64 hex chars) used for the encryption round-trip tests.
const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ORIGINAL_KEY = process.env.TOKEN_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.TOKEN_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.TOKEN_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

/** Minimal in-memory mock of the prisma.gmailToken delegate. */
function makePrismaMock() {
  const calls: { upsert: any[]; findUnique: any[] } = { upsert: [], findUnique: [] };
  let stored: any = null;
  return {
    calls,
    setStored(row: any) {
      stored = row;
    },
    gmailToken: {
      async upsert(args: any) {
        calls.upsert.push(args);
        stored = {
          email: args.where.email,
          ...args.create,
        };
        return stored;
      },
      async findUnique(args: any) {
        calls.findUnique.push(args);
        if (!stored) return null;
        if (stored.email !== args.where.email) return null;
        return stored;
      },
    },
  };
}

describe('isTokenStoreConfigured', () => {
  it('returns true when a valid 64-char hex key is present', () => {
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
    expect(isTokenStoreConfigured()).toBe(true);
  });

  it('returns true when a valid 44-char base64 key is present', () => {
    // 32 zero-bytes base64-encoded = 'AAAA...' (44 chars including padding).
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32).toString('base64');
    expect(isTokenStoreConfigured()).toBe(true);
  });

  it('returns false when the env var is deleted', () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(isTokenStoreConfigured()).toBe(false);
  });

  it('returns false for a bad-length key', () => {
    process.env.TOKEN_ENCRYPTION_KEY = 'tooshort';
    expect(isTokenStoreConfigured()).toBe(false);
  });
});

describe('storeRefreshTokenForUser + getRefreshTokenFor round-trip', () => {
  it('encrypts on store and decrypts back to the original token', async () => {
    const prisma = makePrismaMock();
    const token = '1//refresh-token-abc-123';

    const ok = await storeRefreshTokenForUser(prisma as any, 'Jake@Example.com', token);
    expect(ok).toBe(true);
    expect(prisma.calls.upsert).toHaveLength(1);

    // Stored under the lowercased email.
    const upsertArgs = prisma.calls.upsert[0];
    expect(upsertArgs.where.email).toBe('jake@example.com');

    // The persisted ciphertext is NOT the plaintext.
    expect(upsertArgs.create.encrypted).not.toBe(token);
    expect(upsertArgs.create.encrypted).not.toContain('refresh-token');

    // Feed the stored row back through findUnique -> original token.
    const out = await getRefreshTokenFor(prisma as any, 'jake@example.com');
    expect(out).toBe(token);
  });

  it('looks up by lowercased email on read', async () => {
    const prisma = makePrismaMock();
    await storeRefreshTokenForUser(prisma as any, 'jake@example.com', 'tok');
    await getRefreshTokenFor(prisma as any, 'JAKE@example.com');
    expect(prisma.calls.findUnique.at(-1).where.email).toBe('jake@example.com');
  });
});

describe('not configured (no key)', () => {
  it('storeRefreshTokenForUser returns false and never calls upsert', async () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    const prisma = makePrismaMock();
    const ok = await storeRefreshTokenForUser(prisma as any, 'jake@example.com', 'tok');
    expect(ok).toBe(false);
    expect(prisma.calls.upsert).toHaveLength(0);
  });

  it('getRefreshTokenFor returns null and never calls findUnique', async () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    const prisma = makePrismaMock();
    const out = await getRefreshTokenFor(prisma as any, 'jake@example.com');
    expect(out).toBeNull();
    expect(prisma.calls.findUnique).toHaveLength(0);
  });
});

describe('absent row', () => {
  it('getRefreshTokenFor returns null when no row exists', async () => {
    const prisma = makePrismaMock();
    const out = await getRefreshTokenFor(prisma as any, 'nobody@example.com');
    expect(out).toBeNull();
  });
});

describe('tamper / wrong key', () => {
  it('returns null (no throw) when decrypted with a different key', async () => {
    const prisma = makePrismaMock();
    await storeRefreshTokenForUser(prisma as any, 'jake@example.com', 'secret-token');

    // Swap to a different key before reading.
    process.env.TOKEN_ENCRYPTION_KEY =
      'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

    const out = await getRefreshTokenFor(prisma as any, 'jake@example.com');
    expect(out).toBeNull();
  });

  it('returns null (no throw) when the auth_tag is corrupted', async () => {
    const prisma = makePrismaMock();
    await storeRefreshTokenForUser(prisma as any, 'jake@example.com', 'secret-token');

    // Corrupt the stored auth tag.
    const row = prisma.calls.upsert[0].create;
    prisma.setStored({
      email: 'jake@example.com',
      encrypted: row.encrypted,
      iv: row.iv,
      auth_tag: Buffer.alloc(16).toString('base64'),
    });

    const out = await getRefreshTokenFor(prisma as any, 'jake@example.com');
    expect(out).toBeNull();
  });
});
