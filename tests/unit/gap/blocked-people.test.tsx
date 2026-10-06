/** UX-04: the do-not-contact names are one line with a count and ONE disclosure, not a link per person. */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { BlockedPeople } from '@/components/gap/blocked-people';

const people = ['Douglas Spamer', 'Jake Pyke', 'Ray Hatton', 'Jose A. Touzon', 'Scott Temple'].map((name, i) => ({ name, title: null, personaId: 100 + i }));

describe('BlockedPeople', () => {
  it('five flagged people are one line and one Review 5 flags disclosure; the per-person controls appear only when opened', () => {
    render(<BlockedPeople accountName="FedEx" people={people} />);
    expect(screen.getByTestId('now-blocked').textContent).toMatch(/Not contacted \(do not contact\): 5 people\./);
    const toggle = screen.getByTestId('now-review-flags');
    expect(toggle.textContent).toBe('Review 5 flags');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByTestId('now-review-suppression')).toHaveLength(0);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('now-review-suppression')).toHaveLength(5);
    expect(screen.getAllByTestId('now-review-suppression')[2].textContent).toBe('Ray Hatton');
  });
  it('one flagged person is named on the line with Review the flag', () => {
    render(<BlockedPeople accountName="PepsiCo" people={[{ name: 'Dr. Isaac Scott', title: 'Sr Director', personaId: 7 }]} />);
    expect(screen.getByTestId('now-blocked').textContent).toMatch(/Not contacted \(do not contact\): Dr\. Isaac Scott\./);
    expect(screen.getByTestId('now-review-flags').textContent).toBe('Review the flag');
  });
});
