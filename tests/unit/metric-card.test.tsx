import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from '@/components/metric-card';

describe('MetricCard', () => {
  it('renders label and value as a card by default', () => {
    const { container } = render(<MetricCard label="Total" value={42} />);
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(container.querySelector('.rounded-xl')).not.toBeNull();
  });

  it('applies the tone class to the value', () => {
    render(<MetricCard label="Hot" value={7} tone="text-emerald-600" />);
    const value = screen.getByText('7');
    expect(value.className).toContain('text-emerald-600');
  });

  it('uses 3xl when size is md', () => {
    render(<MetricCard label="Big" value={100} size="md" />);
    expect(screen.getByText('100').className).toContain('text-3xl');
  });

  it('renders without Card wrapper when variant is plain', () => {
    const { container } = render(<MetricCard label="Plain" value={9} variant="plain" />);
    expect(container.querySelector('.rounded-xl')).toBeNull();
    expect(container.querySelector('.rounded-lg.border')).not.toBeNull();
  });

  it('renders icon and right-side layout when icon is provided', () => {
    const { container } = render(
      <MetricCard label="With icon" value={3} icon={Activity} />,
    );
    expect(container.querySelector('.justify-between')).not.toBeNull();
  });

  it('wraps in a link when href is provided', () => {
    const { container } = render(
      <MetricCard label="Link" value={1} href="/somewhere" />,
    );
    expect(container.querySelector('a[href="/somewhere"]')).not.toBeNull();
  });

  it('renders the optional detail below the value', () => {
    render(
      <MetricCard label="Detail" value="12%" detail="vs last week" />,
    );
    expect(screen.getByText('vs last week')).toBeDefined();
  });
});
