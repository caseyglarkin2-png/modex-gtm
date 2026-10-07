/**
 * R63-B N12: a citation link was named only "1"; its name now says which source it is. N1: an unlinked citation's
 * tooltip said the signal's storage kind ("evidence_record"); it now says what it is in words.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { citationName, FactBlock } from '@/components/gap/fact-hypothesis-blocks';

describe('R63-B N12: a citation says which source it is', () => {
  it('the link is named by its number, title and site; an unlinked one never shows the storage kind', () => {
    render(
      <FactBlock
        observation="Walmart Scratch Co r63 opened a new 1.1 million square foot distribution center in Texas [S:s1] [S:s2]."
        signals={[
          { id: 's1', title: 'Walmart Scratch Co r63 opens Texas DC', source_kind: 'evidence_record', evidence_url: 'https://www.news.example.com/texas-dc', evidence_text: 'opened a new DC' },
          { id: 's2', title: null, source_kind: 'evidence_record', evidence_url: null, evidence_text: null },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Source 1: Walmart Scratch Co r63 opens Texas DC (news.example.com)' })).toHaveAttribute('href', 'https://www.news.example.com/texas-dc');
    expect(document.body.innerHTML).not.toContain('evidence_record');
    expect(citationName(3, undefined)).toBe('Source 3');
  });
});
