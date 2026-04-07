import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import {
  buildAccountMicrositeFixture,
  buildHeroSection,
  buildProblemSection,
  buildProofSection,
} from '../../fixtures/microsites';

describe('microsite fixtures', () => {
  it('builds a complete account microsite fixture', () => {
    const account = buildAccountMicrositeFixture();

    expect(account.slug).toBe('fixture-foods');
    expect(account.sections).toHaveLength(4);
    expect(account.personVariants[0]?.person.name).toBe('Jordan Avery');
  });

  it('renders a hero section fixture', () => {
    render(
      <MicrositeSectionRenderer section={buildHeroSection()} accentColor="#06B6D4" />,
    );

    expect(
      screen.getByRole('heading', { name: /your yards were not built for this volume/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book a network audit/i })).toBeInTheDocument();
  });

  it('renders a problem section fixture', () => {
    render(
      <MicrositeSectionRenderer section={buildProblemSection()} accentColor="#06B6D4" />,
    );

    expect(screen.getByText(/the yard is where consolidation breaks down/i)).toBeInTheDocument();
    expect(screen.getByText(/dock contention compounds fast/i)).toBeInTheDocument();
  });

  it('renders proof primitives without breaking legacy proof blocks', () => {
    render(
      <MicrositeSectionRenderer
        section={buildProofSection({
          proofVisual: {
            type: 'before-after',
            headline: 'What changes operationally',
            beforeAfter: {
              before: {
                label: 'Today',
                description: 'Manual dispatch hides dock contention until the queue is already formed.',
              },
              after: {
                label: 'With YardFlow',
                description: 'One protocol keeps the yard synchronized to the dock schedule.',
              },
            },
          },
          liveDeployment: {
            headline: 'Running live now',
            summary: 'The deployment pattern is already proven in production.',
            badges: ['24 facilities live'],
          },
          methodology: 'Measured in live CPG yards using observed turn-time deltas.',
        })}
        accentColor="#06B6D4"
      />,
    );

    expect(screen.getByText(/what changes operationally/i)).toBeInTheDocument();
    expect(screen.getByText(/running live now/i)).toBeInTheDocument();
    expect(screen.getByText(/measured in live cpg yards/i)).toBeInTheDocument();
    expect(screen.getByText(/^24 facilities live$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/facilities live/i)).toHaveLength(2);
  });
});