import { describe, expect, it } from 'vitest';
import {
  ADVISORY_ONLY_SEND_STATES,
  generatedContentMissingSendBlocker,
  invalidPayloadSendBlocker,
  noSendableRecipientsSendBlocker,
  serializeSendBlocker,
  unsubscribedSendBlocker,
} from '@/lib/email/send-blockers';

describe('send blockers', () => {
  it('keeps advisory states out of the hard-block contract', () => {
    expect(ADVISORY_ONLY_SEND_STATES).toContain('checklist_incomplete');
    expect(ADVISORY_ONLY_SEND_STATES).toContain('quality_below_threshold');
    expect(ADVISORY_ONLY_SEND_STATES).toContain('legacy_cta_policy');
  });

  it('serializes hard blockers with stable code and message shape', () => {
    expect(serializeSendBlocker(unsubscribedSendBlocker('ops@example.com'))).toMatchObject({
      code: 'UNSUBSCRIBED',
      error: 'UNSUBSCRIBED',
      message: 'Cannot send to ops@example.com - recipient has unsubscribed.',
    });
    expect(serializeSendBlocker(generatedContentMissingSendBlocker([4, 7]))).toMatchObject({
      code: 'GENERATED_CONTENT_MISSING',
      error: expect.stringContaining('Missing ids: 4, 7'),
    });
  });

  it('captures payload and zero-recipient blockers cleanly', () => {
    expect(serializeSendBlocker(invalidPayloadSendBlocker({ field: ['Required'] }))).toMatchObject({
      code: 'INVALID_PAYLOAD',
      details: { field: ['Required'] },
    });
    expect(serializeSendBlocker(noSendableRecipientsSendBlocker({ skipped: 2 }))).toMatchObject({
      code: 'NO_SENDABLE_RECIPIENTS',
      details: { skipped: 2 },
    });
  });
});
