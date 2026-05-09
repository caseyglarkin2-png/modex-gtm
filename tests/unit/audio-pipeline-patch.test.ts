import { describe, expect, it } from 'vitest';
import { patchAccountFile } from '@/scripts/audio-pipeline/stages/patch';
import type { AccountAudioBrief } from '@/lib/microsites/schema';

const ACCOUNT_WITHOUT_AUDIO = `
import type { AccountMicrositeData } from '../schema';

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'CPG / yogurt',
};
`.trim();

const ACCOUNT_WITH_AUDIO = `
import type { AccountMicrositeData } from '../schema';

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'CPG / yogurt',
  audioBrief: {
    src: '/audio/dannon-old.mp3',
    chapters: [{ id: 'old', label: 'Old', start: 0 }],
    generatedAt: '2026-04-01T00:00:00Z',
  },
};
`.trim();

const newBrief: AccountAudioBrief = {
  src: '/audio/dannon.mp3',
  chapters: [
    { id: 'thesis', label: 'The thesis', start: 0 },
    { id: 'beats', label: 'Cold-chain beats', start: 75 },
  ],
  generatedAt: '2026-05-10T14:00:00Z',
};

// Reusable single-chapter brief for formatting tests.
const singleChapterBrief: AccountAudioBrief = {
  src: '/audio/dannon.mp3',
  chapters: [{ id: 'thesis', label: 'The thesis', start: 0 }],
  generatedAt: '2026-05-09T00:00:00Z',
};

describe('patchAccountFile', () => {
  it('inserts an audioBrief property when none is present', () => {
    const out = patchAccountFile({ source: ACCOUNT_WITHOUT_AUDIO, brief: newBrief });
    expect(out).toContain("audioBrief:");
    expect(out).toContain("src: '/audio/dannon.mp3'");
    expect(out).toContain("'2026-05-10T14:00:00Z'");
    // Existing fields preserved
    expect(out).toContain("accountName: 'Dannon'");
    expect(out).toContain("vertical: 'CPG / yogurt'");
  });

  it('replaces an existing audioBrief in place', () => {
    const out = patchAccountFile({ source: ACCOUNT_WITH_AUDIO, brief: newBrief });
    expect(out).not.toContain("'/audio/dannon-old.mp3'");
    expect(out).toContain("'/audio/dannon.mp3'");
    expect(out).toContain("'2026-05-10T14:00:00Z'");
    // Old chapter id should be gone
    expect(out).not.toContain("id: 'old'");
  });

  it('throws when the source has no exported account constant', () => {
    expect(() =>
      patchAccountFile({ source: 'export const wrong = 1;', brief: newBrief }),
    ).toThrow(/no exported AccountMicrositeData constant/i);
  });
});

describe('patchAccountFile — preserves source formatting', () => {
  it('preserves 2-space indentation of existing properties on insert', () => {
    const source = [
      "import type { AccountMicrositeData } from '../schema';",
      '',
      "export const dannon: AccountMicrositeData = {",
      "  slug: 'dannon',",
      "  accountName: 'Dannon',",
      "  vertical: 'CPG / yogurt',",
      '};',
      '',
    ].join('\n');
    const out = patchAccountFile({ source, brief: singleChapterBrief });
    // Existing lines must appear EXACTLY as-is (modulo possible trailing-comma adjustment).
    expect(out).toContain("  slug: 'dannon',");
    expect(out).toContain("  accountName: 'Dannon',");
    expect(out).toContain("  vertical: 'CPG / yogurt',");
    // No 4-space indentation introduced for existing fields.
    expect(out).not.toMatch(/^    slug:/m);
  });

  it('preserves comments and helpers above the export', () => {
    const source = [
      '/**',
      ' * Dannon — top doc comment.',
      ' */',
      "import type { AccountMicrositeData } from '../schema';",
      '',
      'const HELPER = 1;',
      '',
      "export const dannon: AccountMicrositeData = {",
      "  slug: 'dannon',",
      '};',
      '',
    ].join('\n');
    const out = patchAccountFile({ source, brief: singleChapterBrief });
    expect(out).toContain('/**');
    expect(out).toContain(' * Dannon — top doc comment.');
    expect(out).toContain('const HELPER = 1;');
    expect(out).toContain("  slug: 'dannon',");
  });

  it('uses 2-space indent for the inserted audioBrief block', () => {
    const source = [
      "import type { AccountMicrositeData } from '../schema';",
      '',
      "export const dannon: AccountMicrositeData = {",
      "  slug: 'dannon',",
      '};',
      '',
    ].join('\n');
    const out = patchAccountFile({ source, brief: singleChapterBrief });
    expect(out).toMatch(/^  audioBrief: \{$/m);
    expect(out).toMatch(/^    src: '\/audio\/dannon\.mp3',$/m);
    expect(out).toMatch(/^    chapters: \[$/m);
  });
});
