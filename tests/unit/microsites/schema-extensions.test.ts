import { describe, it, expect } from 'vitest';
import type { AccountMicrositeData, MemoMicrositeSection } from '../../../src/lib/microsites/schema';

describe('AccountMicrositeData schema — Phase-1 extensions', () => {
  it('allows titleEmphasis as optional string', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      titleEmphasis: 'network constraint',
    };
    expect(data.titleEmphasis).toBe('network constraint');
  });

  it('allows coverHeadline as optional string override', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      coverHeadline: 'A custom cover line for this account',
    };
    expect(data.coverHeadline).toBe('A custom cover line for this account');
  });
});

describe('Artifact section type', () => {
  it('allows artifact section with image + caption + source', () => {
    const section: MemoMicrositeSection = {
      type: 'artifact',
      sectionId: 'dannon-yard-redacted',
      headline: 'Redacted yard layout',
      artifact: {
        imageSrc: '/artifacts/dannon-yard-redacted.png',
        imageAlt: 'Yard layout with carrier names and plant codes redacted',
        caption: 'Western depot reorganization — Q4 2024',
        source: 'YardFlow Module Inspector, redacted',
      },
    };
    expect(section.type).toBe('artifact');
    expect(section.artifact.imageSrc).toMatch(/\.png$/);
  });
});
