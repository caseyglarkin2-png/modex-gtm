import { describe, expect, it } from 'vitest';
import { composeResearchPrompt } from '@/scripts/audio-pipeline/stages/compose';
import type { AccountMicrositeData } from '@/lib/microsites/schema';

const dannon: Partial<AccountMicrositeData> = {
  slug: 'dannon',
  accountName: 'Dannon',
  vertical: 'cpg',
  network: {
    facilityCount: '13',
    facilityTypes: ['plant', 'dc'],
    geographicSpread: 'North America',
    dailyTrailerMoves: '500+',
  } as AccountMicrositeData['network'],
};

describe('composeResearchPrompt', () => {
  it('returns a prompt that names the account, vertical, and facility footprint', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt).toContain('Dannon');
    expect(prompt).toContain('cpg');
    expect(prompt).toContain('13');
  });

  it('embeds dossier bodies under a clearly-marked section when present', () => {
    const prompt = composeResearchPrompt({
      account: dannon as AccountMicrositeData,
      dossiers: [
        { path: '/x', filename: 'a.md', body: 'DOSSIER ONE BODY' },
        { path: '/y', filename: 'b.md', body: 'DOSSIER TWO BODY' },
      ],
    });
    expect(prompt).toContain('DOSSIER ONE BODY');
    expect(prompt).toContain('DOSSIER TWO BODY');
    expect(prompt.toLowerCase()).toContain('research dossier');
  });

  it('flags missing-dossier fallback explicitly so the LLM knows it is doing its own discovery', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt.toLowerCase()).toContain('no internal dossier');
  });

  it('asks for a 7-minute spoken-form output (matches NotebookLM target length)', () => {
    const prompt = composeResearchPrompt({ account: dannon as AccountMicrositeData, dossiers: [] });
    expect(prompt).toMatch(/7[ -]minute|seven[ -]minute/i);
  });
});
