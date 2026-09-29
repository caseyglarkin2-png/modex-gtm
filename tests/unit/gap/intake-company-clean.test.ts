/**
 * Real LinkedIn headlines (MMYQB dogfood, 2026-09-28) carry the company inside
 * a sentence. Resolution reads the company name only; what was supplied stays
 * frozen as supplied.
 */
import { describe, expect, it } from 'vitest';
import { cleanCompanyName, splitHeadline } from '@/lib/gap/intake/parse';

describe('cleanCompanyName', () => {
  it.each([
    ['Petsmart with expertise in logistics management.', 'Petsmart'],
    ['BWS Logistics - Father - Husband - Chaser of a Little White Ball', 'BWS Logistics'],
    ['A.N. Webber Logistics, Inc. Family Man. 4th Gen in Freight.', 'A.N. Webber Logistics, Inc.'],
    ['Chunker. 2x Inc 5000, 5x Utah 100.', 'Chunker'],
    ['YardFlow by FreightRoll - Building yard automation through observation.', 'YardFlow by FreightRoll'],
    ['Bitfreighter 🫈💚', 'Bitfreighter'],
    ['Riteload, Rite-Mobile and Piney Hollow Investments. Changing the way transportation happens', 'Riteload, Rite-Mobile and Piney Hollow Investments'],
    ['Harbor Foods Group', 'Harbor Foods Group'],
    ['Nestlé', 'Nestlé'],
    ['Acme Foods, Inc.', 'Acme Foods, Inc.'],
  ])('%s -> %s', (raw, clean) => {
    expect(cleanCompanyName(raw)).toBe(clean);
  });

  it('the headline split uses it', () => {
    expect(splitHeadline('Operations Supervisor at Petsmart with expertise in logistics management.')).toEqual({ title: 'Operations Supervisor', company: 'Petsmart' });
  });
});
