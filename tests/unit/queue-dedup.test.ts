import { describe, it, expect } from 'vitest';
import { dedupDecision } from '@/lib/queue/dedup';

describe('dedupDecision', () => {
  const clean = { unsubscribed: false, emailLogHit: false, queuedHit: false, gmailThread: false };
  it('blocks unsubscribed first (hard)', () => {
    expect(dedupDecision({ ...clean, unsubscribed: true, emailLogHit: true })).toEqual({ allow: false, reason: 'unsubscribed' });
  });
  it('blocks already-emailed (EmailLog hit)', () => {
    expect(dedupDecision({ ...clean, emailLogHit: true })).toEqual({ allow: false, reason: 'already_emailed' });
  });
  it('blocks when a Gmail thread exists even though EmailLog is empty (manual send case)', () => {
    expect(dedupDecision({ ...clean, gmailThread: true })).toEqual({ allow: false, reason: 'already_emailed' });
  });
  it('blocks already-in-queue', () => {
    expect(dedupDecision({ ...clean, queuedHit: true })).toEqual({ allow: false, reason: 'already_queued' });
  });
  it('allows a clean contact', () => {
    expect(dedupDecision(clean)).toEqual({ allow: true });
  });
});
