import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('unsubscribe-token', () => {
  const MOCK_SECRET = 'test-secret-key-for-hmac-validation';
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, UNSUBSCRIBE_SECRET: MOCK_SECRET };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadModule() {
    return import('@/lib/email/unsubscribe-token');
  }

  it('generates a hex token for an email', async () => {
    const { generateToken } = await loadModule();
    const token = generateToken('test@example.com');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates deterministic tokens for the same email', async () => {
    const { generateToken } = await loadModule();
    const t1 = generateToken('test@example.com');
    const t2 = generateToken('test@example.com');
    expect(t1).toBe(t2);
  });

  it('normalizes email case and whitespace', async () => {
    const { generateToken } = await loadModule();
    const t1 = generateToken('Test@Example.com');
    const t2 = generateToken('  test@example.com  ');
    expect(t1).toBe(t2);
  });

  it('generates different tokens for different emails', async () => {
    const { generateToken } = await loadModule();
    const t1 = generateToken('alice@example.com');
    const t2 = generateToken('bob@example.com');
    expect(t1).not.toBe(t2);
  });

  it('validates a correct token', async () => {
    const { generateToken, validateToken } = await loadModule();
    const email = 'test@example.com';
    const token = generateToken(email);
    expect(validateToken(email, token)).toBe(true);
  });

  it('rejects an incorrect token', async () => {
    const { validateToken } = await loadModule();
    expect(validateToken('test@example.com', 'deadbeef')).toBe(false);
  });

  it('rejects empty token or email', async () => {
    const { validateToken } = await loadModule();
    expect(validateToken('test@example.com', '')).toBe(false);
    expect(validateToken('', 'sometoken')).toBe(false);
  });

  it('throws if UNSUBSCRIBE_SECRET is missing', async () => {
    delete process.env.UNSUBSCRIBE_SECRET;
    const { generateToken } = await loadModule();
    expect(() => generateToken('test@example.com')).toThrow('UNSUBSCRIBE_SECRET');
  });
});
