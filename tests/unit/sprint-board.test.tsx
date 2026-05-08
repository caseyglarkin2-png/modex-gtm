import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SprintBoard } from '@/components/sprint-board';

describe('SprintBoard', () => {
  it('renders title and items', () => {
    render(
      <SprintBoard
        title="Top Targets"
        items={[{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }]}
        renderItem={(item) => <span>{item.name}</span>}
        itemKey={(item) => item.id}
      />,
    );
    expect(screen.getByText('Top Targets')).toBeDefined();
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('shows empty message when items is empty', () => {
    render(
      <SprintBoard
        title="Empty"
        items={[]}
        renderItem={() => null}
        emptyMessage="No items yet"
      />,
    );
    expect(screen.getByText('No items yet')).toBeDefined();
  });

  it('caps the rendered list to maxItems', () => {
    render(
      <SprintBoard
        title="Capped"
        items={[1, 2, 3, 4, 5]}
        renderItem={(n) => <span data-testid="item">item-{n}</span>}
        maxItems={3}
      />,
    );
    expect(screen.getAllByTestId('item')).toHaveLength(3);
  });

  it('renders header action when provided', () => {
    render(
      <SprintBoard
        title="Has Action"
        items={[]}
        renderItem={() => null}
        headerAction={<button>Open</button>}
      />,
    );
    expect(screen.getByText('Open')).toBeDefined();
  });
});
