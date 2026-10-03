/**
 * BRIEF "View details" lands on a SOURCES section (a closed <details>); the hash must open it.
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpenHashDetails } from '@/components/gap/open-hash-details';

describe('OpenHashDetails', () => {
  it('opens the <details> the hash names, and only that one', () => {
    window.location.hash = '#brief-section-footprint';
    const { container } = render(
      <div>
        <details id="brief-section-footprint"><summary>Footprint</summary>x</details>
        <details id="brief-section-freight"><summary>Freight</summary>y</details>
        <OpenHashDetails />
      </div>,
    );
    expect((container.querySelector('#brief-section-footprint') as HTMLDetailsElement).open).toBe(true);
    expect((container.querySelector('#brief-section-freight') as HTMLDetailsElement).open).toBe(false);
  });
});
