import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DetentionClock } from '@/components/microsites/detention-clock';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DetentionClock', () => {
  it('renders the dollar figure starting at $0.00 and the source line citing ATA 2024', () => {
    render(<DetentionClock perSecond={0.132} />);
    expect(screen.getByText('$0.00')).toBeDefined();
    expect(screen.getByText(/rate · ATA 2024 yard ops/i)).toBeDefined();
  });

  it('renders the documentary label "modeled detention accrued while reading"', () => {
    render(<DetentionClock perSecond={0.132} />);
    expect(screen.getByText(/modeled detention accrued/i)).toBeDefined();
  });

  it('marks the chip aria-hidden so screen readers skip the decorative ticker', () => {
    const { container } = render(<DetentionClock perSecond={0.132} />);
    const root = container.querySelector('[data-detention-clock]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accumulates the dollar figure as fake time advances', () => {
    render(<DetentionClock perSecond={1} />);
    expect(screen.getByText('$0.00')).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('$5.00')).toBeDefined();
  });

  it('applies the accent color via inline CSS variable on the dot', () => {
    const { container } = render(
      <DetentionClock perSecond={0.132} accentColor="#0E7490" />,
    );
    const dot = container.querySelector('[data-detention-clock-dot]');
    expect(dot).not.toBeNull();
    // The component sets --memo-accent on the wrapper so descendants pick it up.
    const wrapper = container.querySelector('[data-detention-clock]') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--memo-accent')).toBe('#0E7490');
  });
});
