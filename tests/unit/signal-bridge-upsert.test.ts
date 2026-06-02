import { describe, it, expect } from 'vitest';
import { upsertByKey } from '@/lib/signal-bridge/upsert';

describe('upsertByKey', () => {
  const key = (x: { id: string }) => x.id;

  it('appends a new entry', () => {
    const result = upsertByKey([{ id: 'a', v: 1 }], [{ id: 'b', v: 2 }], key);
    expect(result).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ]);
  });

  it('replaces an existing entry in place (idempotent re-run)', () => {
    const result = upsertByKey([{ id: 'a', v: 1 }], [{ id: 'a', v: 99 }], key);
    expect(result).toEqual([{ id: 'a', v: 99 }]);
  });

  it('preserves existing order and appends only the net-new entries', () => {
    const result = upsertByKey(
      [
        { id: 'a', v: 1 },
        { id: 'b', v: 2 },
      ],
      [
        { id: 'b', v: 22 },
        { id: 'c', v: 3 },
      ],
      key,
    );
    expect(result).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 22 },
      { id: 'c', v: 3 },
    ]);
  });

  it('does not mutate the original arrays', () => {
    const existing = [{ id: 'a', v: 1 }];
    upsertByKey(existing, [{ id: 'a', v: 2 }], key);
    expect(existing).toEqual([{ id: 'a', v: 1 }]);
  });
});
