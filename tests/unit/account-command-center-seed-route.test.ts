import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockedTransaction,
  },
}));

const routeModule = await import('@/app/api/proof/account-command-center-seed/route');

describe('account command center proof seed route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllow = process.env.ALLOW_PROOF_SEED_IN_PRODUCTION;
  const originalSecret = process.env.E2E_SEED_SECRET;

  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockedTransaction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    process.env.ALLOW_PROOF_SEED_IN_PRODUCTION = originalAllow;
    process.env.E2E_SEED_SECRET = originalSecret;
  });

  it('accepts trimmed production proof env values', async () => {
    setNodeEnv('production');
    process.env.ALLOW_PROOF_SEED_IN_PRODUCTION = '1\n';
    process.env.E2E_SEED_SECRET = 'proof-secret\n';

    const response = await routeModule.POST(new NextRequest('http://localhost/api/proof/account-command-center-seed', {
      method: 'POST',
      headers: {
        'x-e2e-seed-secret': 'proof-secret',
      },
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedTransaction).toHaveBeenCalled();
  });

  it('rejects production proof seed requests when the gate is disabled', async () => {
    setNodeEnv('production');
    process.env.ALLOW_PROOF_SEED_IN_PRODUCTION = '0';
    process.env.E2E_SEED_SECRET = 'proof-secret';

    const response = await routeModule.POST(new NextRequest('http://localhost/api/proof/account-command-center-seed', {
      method: 'POST',
      headers: {
        'x-e2e-seed-secret': 'proof-secret',
      },
    }));

    expect(response.status).toBe(401);
    expect(mockedTransaction).not.toHaveBeenCalled();
  });
});
