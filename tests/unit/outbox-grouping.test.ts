import { describe, expect, it } from 'vitest';
import {
  isSendable,
  groupSendableByAccount,
  groupSendableBySequence,
  type SendableLike,
} from '@/app/discovery/outbox-grouping';

const item = (p: Partial<SendableLike>): SendableLike => ({
  id: Math.floor(Math.random() * 1e9),
  account_name: 'Acme',
  status: 'draft',
  provider_message_id: null,
  sequence_id: null,
  ...p,
});

describe('isSendable', () => {
  it('is true for draft, approved, and retryable-failed (never reached Gmail)', () => {
    expect(isSendable(item({ status: 'draft' }))).toBe(true);
    expect(isSendable(item({ status: 'approved' }))).toBe(true);
    expect(isSendable(item({ status: 'failed', provider_message_id: null }))).toBe(true);
  });

  it('is false for sent and for failed-after-Gmail (needs manual reconcile)', () => {
    expect(isSendable(item({ status: 'sent' }))).toBe(false);
    expect(isSendable(item({ status: 'failed', provider_message_id: 'gmail-123' }))).toBe(false);
  });
});

describe('groupSendableByAccount', () => {
  it('groups sendable rows by account, excluding sent and needs-review', () => {
    const items = [
      item({ id: 1, account_name: 'Allentown Foods', status: 'draft' }),
      item({ id: 2, account_name: 'Allentown Foods', status: 'approved' }),
      item({ id: 3, account_name: 'Allentown Foods', status: 'sent' }), // excluded
      item({ id: 4, account_name: 'Allentown Foods', status: 'failed', provider_message_id: 'g1' }), // excluded
      item({ id: 5, account_name: 'Beta Logistics', status: 'draft' }),
    ];
    const groups = groupSendableByAccount(items);
    const allentown = groups.find((g) => g.label === 'Allentown Foods');
    expect(allentown?.ids).toEqual([1, 2]);
    const beta = groups.find((g) => g.label === 'Beta Logistics');
    expect(beta?.ids).toEqual([5]);
  });

  it('sorts groups by sendable count descending, then label', () => {
    const items = [
      item({ id: 1, account_name: 'Solo' }),
      item({ id: 2, account_name: 'Big' }),
      item({ id: 3, account_name: 'Big' }),
      item({ id: 4, account_name: 'Big' }),
    ];
    expect(groupSendableByAccount(items).map((g) => g.label)).toEqual(['Big', 'Solo']);
  });

  it('falls back to a stable label when account_name is missing', () => {
    const groups = groupSendableByAccount([item({ id: 1, account_name: null })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].ids).toEqual([1]);
    expect(groups[0].label.length).toBeGreaterThan(0);
  });

  it('returns an empty array when nothing is sendable', () => {
    expect(groupSendableByAccount([item({ status: 'sent' })])).toEqual([]);
  });
});

describe('groupSendableBySequence', () => {
  it('groups only sequence-enrolled sendable rows, keyed by sequence id', () => {
    const items = [
      item({ id: 1, sequence_id: 7, status: 'draft' }),
      item({ id: 2, sequence_id: 7, status: 'approved' }),
      item({ id: 3, sequence_id: null, status: 'draft' }), // not in a sequence
      item({ id: 4, sequence_id: 7, status: 'sent' }), // excluded
      item({ id: 5, sequence_id: 9, status: 'draft' }),
    ];
    const groups = groupSendableBySequence(items);
    const seq7 = groups.find((g) => g.key === 'seq:7');
    expect(seq7?.ids).toEqual([1, 2]);
    expect(groups.find((g) => g.key === 'seq:9')?.ids).toEqual([5]);
    expect(groups.some((g) => g.ids.includes(3))).toBe(false);
  });

  it('returns an empty array when no sendable row is enrolled', () => {
    expect(groupSendableBySequence([item({ sequence_id: null })])).toEqual([]);
  });
});
