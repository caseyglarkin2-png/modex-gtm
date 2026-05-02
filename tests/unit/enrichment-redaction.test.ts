import { describe, expect, it } from 'vitest';
import { redactText, redactUnknown } from '@/lib/enrichment/redaction';

describe('enrichment redaction', () => {
  it('redacts email and token-like strings', () => {
    const input = 'contact casey@freightroll.com with token sk_live_ABC12345678';
    const output = redactText(input);
    expect(output).toContain('ca***@freightroll.com');
    expect(output).toContain('[REDACTED_TOKEN]');
    expect(output).not.toContain('casey@freightroll.com');
  });

  it('redacts sensitive keys in structured payloads', () => {
    const output = redactUnknown({
      message: 'auth failed for test@example.com',
      authorization: 'Bearer abc123',
      nested: { apiToken: 'token-123', note: 'email hello@acme.com' },
    }) as Record<string, unknown>;

    expect(output.authorization).toBe('[REDACTED]');
    expect((output.nested as Record<string, unknown>).apiToken).toBe('[REDACTED]');
    expect((output.message as string)).toContain('te***@example.com');
  });
});
