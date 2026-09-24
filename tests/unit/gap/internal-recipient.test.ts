/**
 * S3-T2: the internal-recipient predicate, a structural copy of the
 * perform-send internal-domain bypass rule. Internal recipients never freeze
 * a SequenceVersion (is_test).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { INTERNAL_ADDRESSES, INTERNAL_DOMAINS, isInternalRecipient } from '@/lib/gap/sequence/internal-recipient';

describe('isInternalRecipient', () => {
  const saved = process.env.FROM_EMAIL;

  beforeEach(() => {
    delete process.env.FROM_EMAIL;
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.FROM_EMAIL;
    else process.env.FROM_EMAIL = saved;
  });

  it('accepts the four positives from the bypass rule', () => {
    expect(isInternalRecipient('casey@freightroll.com')).toBe(true);
    expect(isInternalRecipient('jake@freightroll.com')).toBe(true);
    expect(isInternalRecipient('ops@yardflow.ai')).toBe(true);
    process.env.FROM_EMAIL = 'sender@example.org';
    expect(isInternalRecipient('sender@example.org')).toBe(true);
  });

  it('rejects an external recipient, blanks and non-strings', () => {
    expect(isInternalRecipient('buyer@acmefoods.com')).toBe(false);
    expect(isInternalRecipient('')).toBe(false);
    expect(isInternalRecipient('   ')).toBe(false);
    expect(isInternalRecipient(null)).toBe(false);
    expect(isInternalRecipient(undefined)).toBe(false);
  });

  it('is case-insensitive and trims whitespace, and matches the domain only after the @', () => {
    expect(isInternalRecipient('  Casey@FreightRoll.COM ')).toBe(true);
    expect(isInternalRecipient('Someone@YardFlow.AI')).toBe(true);
    expect(isInternalRecipient('freightroll.com@evil.example')).toBe(false);
    expect(isInternalRecipient('x@notfreightroll.com')).toBe(false);
  });

  it('FROM_EMAIL matches case-insensitively and an unset FROM_EMAIL matches nothing', () => {
    expect(isInternalRecipient('sender@example.org')).toBe(false);
    process.env.FROM_EMAIL = ' Sender@Example.org ';
    expect(isInternalRecipient('sender@example.org')).toBe(true);
    process.env.FROM_EMAIL = '';
    expect(isInternalRecipient('')).toBe(false);
  });

  it('structurally: every literal in this predicate still appears in perform-send.ts', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/email/perform-send.ts'), 'utf8');
    expect(src).toContain('function allowBypass(');
    for (const dom of INTERNAL_DOMAINS) expect(src).toContain(`'${dom}'`);
    for (const addr of INTERNAL_ADDRESSES) expect(src).toContain(`'${addr}'`);
    expect(src).toContain('process.env.FROM_EMAIL');
    expect(INTERNAL_DOMAINS).toEqual(['freightroll.com', 'yardflow.ai']);
    expect(INTERNAL_ADDRESSES).toEqual(['casey@freightroll.com']);
  });
});
