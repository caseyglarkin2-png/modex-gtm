/**
 * V2 final safety review P1: legacy routes (send-bulk, send-bulk-async + process-send-jobs, monday-bump) never
 * passed the per-writer restriction gates. The restriction is now ALSO enforced at the wire, in the Gmail sender
 * every app send passes, before any network call. Exempt: operator alerts, and a genuine reply to the buyer's own
 * message (In-Reply-To). Pinned on all three sender entry points.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const autonomy = vi.fn(async () => undefined);
vi.mock('@/lib/email/autonomy-gate', () => ({ assertAutonomyPermitsSend: autonomy, assertHumanApprovedOneToOne: vi.fn() }));
vi.mock('@/lib/email/suppression-gate', () => ({ assertSuppressionPermitsSend: vi.fn(async () => undefined) }));
vi.mock('@/lib/email/daily-cap', () => ({ assertUnderDailyCap: vi.fn(async () => undefined) }));
const fetchSpy = vi.fn();
vi.stubGlobal('fetch', fetchSpy);

const { assertRestrictionPermitsSend, RestrictedRecipientError } = await import('@/lib/email/restriction-gate');
const { sendViaGmail, createGmailDraft, sendGmailDraft } = await import('@/lib/email/gmail-sender');

beforeEach(() => vi.clearAllMocks());

describe('restriction at the wire', () => {
  it('refuses a restricted domain in to, cc or bcc, with the reason', () => {
    for (const r of [{ to: 'heiko@danone.com' }, { to: 'a@acme.example', cc: ['x@us.danone.com'] }, { to: 'a@acme.example', bcc: 'y@dannon.com' }]) {
      expect(() => assertRestrictionPermitsSend(r, 'PROSPECT_OUTREACH')).toThrow(RestrictedRecipientError);
    }
    expect(() => assertRestrictionPermitsSend({ to: 'heiko@danone.com' }, undefined)).toThrow(/Mark Shaughnessy/);
  });
  it('lets an operator alert, a genuine reply, and an unrestricted recipient through', () => {
    expect(() => assertRestrictionPermitsSend({ to: 'heiko@danone.com' }, 'OPERATOR_ALERT')).not.toThrow();
    expect(() => assertRestrictionPermitsSend({ to: 'heiko@danone.com' }, 'PROSPECT_OUTREACH', { inReplyTo: '<abc@danone.com>' })).not.toThrow();
    expect(() => assertRestrictionPermitsSend({ to: 'ops@acme.example' }, 'PROSPECT_OUTREACH')).not.toThrow();
  });
  it('sendViaGmail, createGmailDraft and sendGmailDraft refuse before any network call or autonomy read', async () => {
    const payload = { to: 'heiko@danone.com', subject: 's', html: '<p>x</p>' };
    await expect(sendViaGmail(payload)).rejects.toThrow(RestrictedRecipientError);
    await expect(createGmailDraft(payload)).rejects.toThrow(RestrictedRecipientError);
    await expect(sendGmailDraft('d1', { to: 'heiko@danone.com' })).rejects.toThrow(RestrictedRecipientError);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(autonomy).not.toHaveBeenCalled();
  });
  it('a bump on our own old thread (threadId, no In-Reply-To) is still refused', async () => {
    await expect(sendViaGmail({ to: 'heiko@danone.com', subject: 's', html: 'x', threadId: 't1' })).rejects.toThrow(RestrictedRecipientError);
  });
});
