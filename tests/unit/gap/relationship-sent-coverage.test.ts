// @vitest-environment node
/**
 * R5 review (finding 8): the relationship read (work/relationship-state.ts, the assignment packet's source) built its
 * Sent reader from the CONFIGURED seller mailboxes only, so with casey@freightroll.com not configured it read
 * casey@yardflow.ai alone and called our Sent read: the packet could say "nothing sent since" while the account page
 * said not known. Missing access is unknown, never "nothing sent": when any seller mailbox is not configured (or its
 * read failed), the Sent read is not complete, the mailbox is named, and the outbound read says not known.
 */
import { describe, expect, it, vi } from 'vitest';

const listSentTo = vi.fn(async () => [] as unknown[]);
const listDraftsTo = vi.fn(async () => [] as unknown[]);
vi.mock('@/lib/email/gmail-inbox', async (orig) => ({ ...(await orig<typeof import('@/lib/email/gmail-inbox')>()), listSentTo: (...a: unknown[]) => (listSentTo as any)(...a), listDraftsTo: (...a: unknown[]) => (listDraftsTo as any)(...a) }));

import { ledgerDb } from './fixtures/ledger-db';
import { relationshipStateFor } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T14:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const deps = { companyFor: async () => null, commitments: async () => [], conversations: async () => [] };
const db = () => ledgerDb({ accounts: ['Kenco'], personas: [{ id: 11, name: 'Craig Morrison', email: CRAIG, account_name: 'Kenco' }] }, NOW).client();
/** Placeholder credentials: the Gmail reads are stand-ins, nothing is called. */
const GAP_ONLY = { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'placeholder' };
const BOTH = { ...GAP_ONLY, GOOGLE_REFRESH_TOKEN: 'placeholder', GMAIL_USER_EMAIL: 'casey@freightroll.com' };

describe('the relationship read says which seller mailboxes its Sent read covered (R5 review, finding 8)', () => {
  it('casey@freightroll.com not configured: the Sent read is not complete, the mailbox is named, and what we sent is not known', async () => {
    const s = await relationshipStateFor(db(), { accountName: 'Kenco', email: CRAIG, name: 'Craig Morrison', now: NOW }, { ...deps, env: GAP_ONLY });
    expect(listSentTo).toHaveBeenCalled();
    expect(s.outboundRead.read).toBe(false);
    expect(s.outboundRead.basis).toContain('casey@freightroll.com not read: not configured');
    expect(s.outboundRead.basis).toContain('so what we sent is not known');
  });

  it('both mailboxes configured and read: the Sent read is complete', async () => {
    const s = await relationshipStateFor(db(), { accountName: 'Kenco', email: CRAIG, name: 'Craig Morrison', now: NOW }, { ...deps, env: BOTH });
    expect(s.outboundRead).toMatchObject({ read: true });
    expect(s.outboundRead.basis).toMatch(/^our Sent was read \(0 messages to them\)/);
  });
});
