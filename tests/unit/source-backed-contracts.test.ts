import { describe, expect, it } from 'vitest';
import {
  SourceBackedReasonCodeSchema,
  SourceEvidenceSchema,
  SidecarHealthSchema,
} from '@/lib/source-backed/contracts';

describe('source-backed contracts', () => {
  it('accepts required reason codes and rejects unknown codes', () => {
    expect(SourceBackedReasonCodeSchema.parse('APPROVAL_REQUIRED')).toBe('APPROVAL_REQUIRED');
    expect(SourceBackedReasonCodeSchema.parse('MIXED_ACCOUNT_PAYLOAD')).toBe('MIXED_ACCOUNT_PAYLOAD');
    expect(SourceBackedReasonCodeSchema.parse('SIDECAR_UNAVAILABLE')).toBe('SIDECAR_UNAVAILABLE');
    expect(() => SourceBackedReasonCodeSchema.parse('NOT_REAL')).toThrow();
  });

  it('validates source evidence records', () => {
    const parsed = SourceEvidenceSchema.parse({
      accountName: 'Boston Beer Company',
      personaName: 'Pat Brewer',
      claim: 'Dock variability increased after the latest network shift.',
      sourceUrl: 'https://example.com/report',
      sourceType: 'web',
      provider: 'sales_agent',
      observedAt: '2026-05-05T10:00:00.000Z',
      confidence: 0.87,
      deterministicKey: 'bbc:dock-variance:example',
    });

    expect(parsed.observedAt).toBeInstanceOf(Date);
    expect(parsed.confidence).toBe(0.87);
  });

  it('rejects invalid source evidence payloads', () => {
    expect(() => SourceEvidenceSchema.parse({
      accountName: '',
      claim: 'tiny',
      sourceUrl: 'not-a-url',
      sourceType: 'web',
      provider: 'sales_agent',
      observedAt: 'bad-date',
      deterministicKey: 'short',
    })).toThrow();
  });

  it('validates sidecar diagnostics records', () => {
    const parsed = SidecarHealthSchema.parse({
      provider: 'clawd',
      status: 'degraded',
      message: 'rate-limited',
      checkedAt: '2026-05-05T10:00:00.000Z',
    });

    expect(parsed.checkedAt).toBeInstanceOf(Date);
    expect(parsed.status).toBe('degraded');
  });
});
