// @vitest-environment node
/**
 * Batch item 6 (audit at 31f09c71): the send panel answered "Not sent: no version." and kept Send offered. Every code
 * the send route can return (the seller-draft and seller-send refusal unions, read from source) is worded for the
 * seller, and a refusal no second click can fix (no installed copy) stops offering Send.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const codesOf = (file: string, typeName: string): string[] => {
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf(`export type ${typeName} =`);
  const end = src.indexOf(';', start);
  return [...src.slice(start, end).matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
};

describe('every send refusal is worded (item 6)', () => {
  it('each code in the seller-draft and seller-send refusal unions has seller words', async () => {
    const { sendRefusalWords } = await import('@/components/gap/send-from-yardflow');
    const codes = [...new Set([...codesOf('src/lib/gap/execution/seller-draft.ts', 'SellerDraftRefusal'), ...codesOf('src/lib/gap/execution/seller-send.ts', 'SellerSendRefusal')])];
    expect(codes.length).toBeGreaterThan(40);
    const missing = codes.filter((c) => !sendRefusalWords(c));
    expect(missing).toEqual([]);
    expect(sendRefusalWords('no_version')).toBe('No first-touch copy is installed for this thesis: its copy family must be seeded first. Nothing was sent.');
  });
});
