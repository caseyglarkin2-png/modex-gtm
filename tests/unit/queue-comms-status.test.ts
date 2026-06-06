import { describe, it, expect } from 'vitest';
import {
  commsDecision,
  recipientCommsStatus,
  type CommsInputs,
  type CommsDeps,
} from '@/lib/queue/comms-status';

const clean: CommsInputs = {
  unsubscribed: false,
  gmailThread: false,
  emailLogHit: false,
  hubspot: { configured: true, found: false },
};

describe('commsDecision', () => {
  it('unsubscribed wins over everything', () => {
    const i: CommsInputs = {
      unsubscribed: true,
      gmailThread: true,
      emailLogHit: true,
      hubspot: { configured: true, found: true },
    };
    expect(commsDecision(i, new Date()).state).toBe('unsubscribed');
  });

  it('gmailThread → in_thread even when EmailLog is empty', () => {
    const i: CommsInputs = { ...clean, gmailThread: true };
    expect(commsDecision(i, null).state).toBe('in_thread');
  });

  it('emailLogHit → emailed', () => {
    const i: CommsInputs = { ...clean, emailLogHit: true };
    expect(commsDecision(i, null).state).toBe('emailed');
  });

  it('hubspot configured+found (no gmail/emaillog) → emailed', () => {
    const i: CommsInputs = { ...clean, hubspot: { configured: true, found: true } };
    expect(commsDecision(i, null).state).toBe('emailed');
  });

  it('nothing positive + hubspot NOT configured → unknown', () => {
    const i: CommsInputs = { ...clean, hubspot: { configured: false, found: false } };
    expect(commsDecision(i, null).state).toBe('unknown');
  });

  it('nothing positive + hubspot configured-but-not-found → new', () => {
    expect(commsDecision(clean, null).state).toBe('new');
  });

  it('carries lastAt and sets a human detail', () => {
    const d = new Date('2026-05-01T00:00:00.000Z');
    const r = commsDecision({ ...clean, emailLogHit: true }, d);
    expect(r.lastAt).toBe(d);
    expect(typeof r.detail).toBe('string');
    expect(r.detail.length).toBeGreaterThan(0);
  });
});

describe('recipientCommsStatus', () => {
  function deps(over: Partial<CommsDeps> = {}): CommsDeps {
    return {
      isUnsubscribed: async () => false,
      gmailThread: async () => false,
      emailLogHit: async () => false,
      hubspot: async () => ({ configured: true, found: false, lastAt: null }),
      ...over,
    };
  }

  it('injected gmail thread → in_thread', async () => {
    const r = await recipientCommsStatus('a@b.com', deps({ gmailThread: async () => true }));
    expect(r.state).toBe('in_thread');
  });

  it('all-clean + hubspot configured → new', async () => {
    const r = await recipientCommsStatus('a@b.com', deps());
    expect(r.state).toBe('new');
  });

  it('all-clean + hubspot unconfigured → unknown', async () => {
    const r = await recipientCommsStatus(
      'a@b.com',
      deps({ hubspot: async () => ({ configured: false, found: false, lastAt: null }) }),
    );
    expect(r.state).toBe('unknown');
  });

  it('hubspot found (no gmail/emaillog) → emailed and surfaces hubspot lastAt', async () => {
    const d = new Date('2026-03-15T00:00:00.000Z');
    const r = await recipientCommsStatus(
      'a@b.com',
      deps({ hubspot: async () => ({ configured: true, found: true, lastAt: d }) }),
    );
    expect(r.state).toBe('emailed');
    expect(r.lastAt).toEqual(d);
  });
});
