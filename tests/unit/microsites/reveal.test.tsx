import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from '@/components/microsites/reveal';

type ObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const observers: ObserverInstance[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }
}

describe('Reveal', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reveals content when the observer intersects', () => {
    const { container } = render(
      <Reveal delayMs={120}>
        <div>Visible copy</div>
      </Reveal>,
    );

    expect(container.firstChild).toHaveAttribute('data-reveal-state', 'hidden');

    act(() => {
      observers[0].callback([
        {
          isIntersecting: true,
          target: screen.getByText('Visible copy'),
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
      vi.advanceTimersByTime(120);
    });

    expect(container.firstChild).toHaveAttribute('data-reveal-state', 'visible');
  });
});