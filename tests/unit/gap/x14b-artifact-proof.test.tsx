/**
 * X14b (GAP OS sales execution engine, 2026-10-08): a copied recap likewise. The copy of a deal artifact records who it
 * was for; the mailbox cron finds the send in Sent to that recipient after the copy and records `deal.artifact_sent`
 * with the Gmail id; the workspace says what the ledger proves (copied, GAP has not seen it sent; or sent, found in
 * Sent); the view shows it; the activity projection reads the copy as content copied and the sent row as a message
 * sent (provider-proven). Without a recipient on the copy there is nothing to match: it stays a copy.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ARTIFACT_SENT, ARTIFACT_USED, type PreparedArtifact } from '@/lib/gap/deals/artifacts';
import { artifactProofOf } from '@/lib/gap/deals/workspace';
import { DealArtifacts, recipientFor } from '@/components/gap/deal-artifacts';
import { reconcileCopiesFromSent } from '@/lib/gap/execution/copies-reconcile';
import { projectActivity } from '@/lib/gap/work/activity';

const NOW = new Date('2026-10-08T20:00:00Z');
const COPIED_AT = new Date('2026-10-08T15:00:00Z');
const ACCOUNT = 'Kroger Scratch Co';
const art = (over: Partial<PreparedArtifact> = {}): PreparedArtifact => ({ kind: 'recap', title: 'The recap', dealId: '70001', why: 'Their words are confirmed.', to: 'Ann Scratch', text: 'Ann, here is what you said about the yards. Trailers sit two hours before a door opens.', citations: [], gaps: [], status: 'Prepared, not sent', governed: false, problems: [], ...over });

describe('X14b: the recipient on the copy', () => {
  it('recipientFor: the addressee by name (full or first), else the one person with an address, else none', () => {
    const people = [{ name: 'Ann Scratch', email: 'ann@kroger.example.com' }, { name: 'Cal Scratch', email: 'cal@kroger.example.com' }];
    expect(recipientFor(art(), people)).toBe('ann@kroger.example.com');
    expect(recipientFor(art({ to: 'Cal' }), people)).toBe('cal@kroger.example.com');
    expect(recipientFor(art({ to: null }), people)).toBeNull();
    expect(recipientFor(art({ to: null }), [people[1]])).toBe('cal@kroger.example.com');
    expect(recipientFor(art({ to: 'Nobody' }), [{ name: 'Ann Scratch', email: null }])).toBeNull();
  });

  it('the copy posts the recipient and says so; the proof line reads copied or sent', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => undefined) } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, id: 'u1' }), { status: 201 }));
    try {
      const a = art();
      const { unmount } = render(<DealArtifacts next={a} all={[a]} accountName={ACCOUNT} dealId="70001" people={[{ personaId: 1, name: 'Ann Scratch', email: 'ann@kroger.example.com' }]} proof={{ kind: 'recap', state: 'copied', at: COPIED_AT.toISOString(), recipient: 'ann@kroger.example.com' }} />);
      expect(screen.getByTestId('artifact-proof')).toHaveAttribute('data-state', 'copied');
      expect(screen.getByTestId('artifact-proof').textContent).toContain('GAP has not seen it sent');
      fireEvent.click(screen.getByTestId('artifact-copy'));
      await waitFor(() => expect(screen.getByTestId('artifact-copied').textContent).toBe('Copied and recorded for ann@kroger.example.com. Not sent until Sent shows it.'));
      const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body));
      expect(body).toMatchObject({ accountName: ACCOUNT, dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com' });
      unmount();
      render(<DealArtifacts next={a} all={[a]} accountName={ACCOUNT} dealId="70001" proof={{ kind: 'recap', state: 'sent', at: '2026-10-08T15:30:00.000Z', recipient: 'ann@kroger.example.com' }} />);
      expect(screen.getByTestId('artifact-proof')).toHaveAttribute('data-state', 'sent');
      expect(screen.getByTestId('artifact-proof').textContent).toContain('(found in Sent)');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('artifactProofOf: the newest sent row wins as sent; else the newest copy is copied; else nothing', () => {
    const used = [{ payload: { dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com' }, created_at: COPIED_AT }];
    const sent = [{ payload: { dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com', sentAt: '2026-10-08T15:30:00.000Z' }, created_at: NOW }];
    expect(artifactProofOf(used, [], '70001', 'recap')).toEqual({ kind: 'recap', state: 'copied', at: COPIED_AT.toISOString(), recipient: 'ann@kroger.example.com' });
    expect(artifactProofOf(used, sent, '70001', 'recap')).toEqual({ kind: 'recap', state: 'sent', at: '2026-10-08T15:30:00.000Z', recipient: 'ann@kroger.example.com' });
    expect(artifactProofOf(used, sent, '70002', 'recap')).toBeNull();
    expect(artifactProofOf(used, sent, '70001', 'introduction')).toBeNull();
  });
});

describe('X14b: the Sent reconcile for artifacts', () => {
  const sent = (id: string, to: string, when: string) => ({ id, threadId: `th-${id}`, internalDate: new Date(when), to, subject: 'Recap of what you said' });
  const world = (recipient: string | null) =>
    ledgerDb({
      accounts: [ACCOUNT],
      audit: [{ id: 'u1', kind: ARTIFACT_USED, subject_type: 'account', subject_id: ACCOUNT, actor: 'casey@freightroll.com', created_at: COPIED_AT, payload: { dealId: '70001', kind: 'recap', textHash: 'h1', ...(recipient ? { recipient } : {}) } }],
    }, NOW);

  it('a copy with a recipient found in Sent after the copy becomes deal.artifact_sent with the Gmail id, once; a copy without a recipient is never checked; an older Sent message never counts', async () => {
    const db = world('ann@kroger.example.com');
    const listSent = vi.fn(async (to: string) => (to === 'ann@kroger.example.com' ? [sent('old', to, '2026-10-08T14:00:00Z'), sent('g1', to, '2026-10-08T15:30:00Z')] : []));
    const r = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent, recordManual: vi.fn() });
    expect(r.artifacts).toMatchObject({ checked: 1, reconciled: 1 });
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === ARTIFACT_SENT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ subject_type: 'account', subject_id: ACCOUNT, payload: { dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com', gmailSentMessageId: 'g1', sentAt: '2026-10-08T15:30:00.000Z', reconciledFromSent: true } });
    const again = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent, recordManual: vi.fn() });
    expect(again.artifacts).toMatchObject({ checked: 0, reconciled: 0 });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === ARTIFACT_SENT)).toHaveLength(1);
    const none = await reconcileCopiesFromSent(world(null).client(), { now: NOW }, { listSent, recordManual: vi.fn() });
    expect(none.artifacts).toMatchObject({ checked: 0, reconciled: 0 });
    const early = await reconcileCopiesFromSent(world('ann@kroger.example.com').client(), { now: NOW }, { listSent: vi.fn(async (to: string) => [sent('old', to, '2026-10-08T14:00:00Z')]), recordManual: vi.fn() });
    expect(early.artifacts).toMatchObject({ checked: 1, reconciled: 0 });
  });

  it('the activity projection: the copy is content copied (self-reported), the sent row a message sent (provider) that completes the deal item', () => {
    const copied = projectActivity({ kind: ARTIFACT_USED, subject_type: 'account', subject_id: ACCOUNT, payload: { dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com' }, created_at: COPIED_AT });
    expect(copied).toMatchObject({ kind: 'content_copied', basis: 'self_reported', accountName: ACCOUNT, who: 'ann@kroger.example.com' });
    const went = projectActivity({ kind: ARTIFACT_SENT, subject_type: 'account', subject_id: ACCOUNT, payload: { dealId: '70001', kind: 'recap', recipient: 'ann@kroger.example.com', gmailSentMessageId: 'g1' }, created_at: NOW });
    expect(went).toMatchObject({ kind: 'message_sent', basis: 'provider', line: 'The recap went to ann@kroger.example.com (found in Sent).', completes: [`deal:${ACCOUNT}:2026-10-08`] });
  });
});
