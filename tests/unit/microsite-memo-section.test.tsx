import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoSectionList, collectFootnotes } from '@/components/microsites/memo-section';
import type {
  ObservationSection,
  ComparableSection,
  MethodologySection,
  AboutSection,
  YnsThesisSection,
} from '@/lib/microsites/schema';

const ynsThesis: YnsThesisSection = { type: 'yns-thesis' };

const observation: ObservationSection = {
  type: 'observation',
  headline: 'What we observed about your network',
  composition: [
    { label: 'Plants', value: '47' },
    { label: 'Distribution centers', value: '12' },
  ],
  hypothesis:
    'The bottleneck likely concentrates in your largest plants[^dot-public-data], where shift overlap is heaviest.',
  caveat: 'We may be wrong about parts of this — happy to be corrected.',
  footnotes: [
    {
      id: 'dot-public-data',
      source: 'DOT inspection registry',
      confidence: 'public',
      detail: 'Public freight movement data, 2024 vintage',
    },
  ],
};

const comparable: ComparableSection = {
  type: 'comparable',
  headline: 'What a similar network did',
  comparableName: 'Primo Brands',
  comparableProfile: 'nine plants, similar archetype mix',
  metrics: [
    { label: 'Detention', before: '$3.4M/yr', after: '$2.3M/yr', delta: '−31%' },
    { label: 'Spotter overtime', before: '$1.2M/yr', after: '$0.9M/yr', delta: '−22%' },
  ],
  timeline: '30 days to first measurable impact',
  referenceAvailable: true,
};

const methodology: MethodologySection = {
  type: 'methodology',
  headline: 'How this analysis was built',
  sources: [
    { id: 'ata-2024-yard-ops', source: 'ATA 2024 Yard Operations Survey', confidence: 'public' },
    { id: 'primo-q1', source: 'Primo Brands Q1 ops review', confidence: 'measured' },
  ],
  unknowns: [
    'Your actual detention costs without your TMS data',
    'Internal SLAs between plants and DCs',
  ],
};

const about: AboutSection = {
  type: 'about',
  authorBio: 'Casey Larkin builds YardFlow at FreightRoll.',
  authorEmail: 'casey@freightroll.com',
};

describe('collectFootnotes', () => {
  it('walks all sections and dedupes footnotes by id, in document order', () => {
    const numbered = collectFootnotes([ynsThesis, observation, comparable, methodology, about]);
    const ids = numbered.map((fn) => fn.id);
    // ata-2024-yard-ops appears in both the YNS thesis and methodology — should appear once.
    expect(ids.filter((id) => id === 'ata-2024-yard-ops')).toHaveLength(1);
    // Ordering is first-appearance: yns thesis first, then observation, then methodology unique entries.
    expect(ids[0]).toBe('ata-2024-yard-ops');
    expect(ids).toContain('dot-public-data');
    expect(ids).toContain('primo-q1');
  });
});

describe('MemoSectionList', () => {
  it('renders all 5 memo section types and the footnote list at the bottom', () => {
    render(<MemoSectionList sections={[ynsThesis, observation, comparable, methodology, about]} />);

    // YNS thesis
    expect(screen.getByText(/yard variance/i)).toBeDefined();
    // Observation — assert label/value pair via the unique label text.
    expect(screen.getByText('What we observed about your network')).toBeDefined();
    expect(screen.getByText('Plants')).toBeDefined();
    // Comparable
    expect(screen.getByText('Primo Brands')).toBeDefined();
    // Methodology
    expect(screen.getByText('How this analysis was built')).toBeDefined();
    // About
    expect(screen.getByText(/About this analysis/i)).toBeDefined();
    expect(screen.getByText('casey@freightroll.com')).toBeDefined();
    // Footnote list
    expect(screen.getByText(/^Sources$/i)).toBeDefined();
  });

  it('inlines a FootnoteMarker where [^id] tokens appear in body text', () => {
    render(<MemoSectionList sections={[observation]} />);
    // The [^dot-public-data] token in the hypothesis should resolve to a marker.
    const marker = screen.getByLabelText(/Footnote 1/i);
    expect(marker.getAttribute('href')).toBe('#fn-1');
  });

  it('omits the FootnoteList block when no sections carry footnotes', () => {
    render(<MemoSectionList sections={[about]} />);
    expect(screen.queryByText(/^Sources$/i)).toBeNull();
  });
});
