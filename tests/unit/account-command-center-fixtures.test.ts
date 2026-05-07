import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCOUNT_PAGE_SEND_ACCOUNTS,
  buildAccountPageSendFixture,
  buildSeededAccountContentContext,
} from '@/lib/proof/account-command-center-fixture';

describe('account command center fixtures', () => {
  it('builds deterministic duplicate-account send fixtures', () => {
    const fixture = buildAccountPageSendFixture();

    expect(fixture.primaryAccountName).toBe(ACCOUNT_PAGE_SEND_ACCOUNTS[0]);
    expect(fixture.aliasAccountName).toBe(ACCOUNT_PAGE_SEND_ACCOUNTS[1]);
    expect(fixture.cacheKey).toContain('agent-action:content_context');
    expect(fixture.validRecipient.email).toContain('@');
    expect(fixture.malformedRecipient.email).toBe('not-an-email');
    expect(fixture.unsubscribedRecipient.email).toContain('@');
    expect(fixture.stagedCandidate.email).toContain('@');
  });

  describe('seeded content context', () => {
    const fixedNow = new Date('2026-05-05T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('builds deterministic cached account intel for proof mode', () => {
      const result = buildSeededAccountContentContext(fixedNow);

      expect(result.action).toBe('content_context');
      expect(result.provider).toBe('modex');
      expect(result.status).toBe('ok');
      expect(result.cards.map((card) => card.title)).toContain('Research Summary');
      expect(result.nextActions[0]).toContain('Promote the staged logistics contact');
      expect(result.freshness.status).toBe('fresh');
    });
  });
});
