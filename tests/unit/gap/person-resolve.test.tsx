/** B3 UI: the four answers for an ambiguous person, by name, each posting Casey's choice. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { PersonResolve } from '@/components/gap/person-resolve';

afterEach(() => vi.unstubAllGlobals());

describe('PersonResolve', () => {
  const member = { id: 'm1', name: 'Dana Ops', accountName: null, candidates: [{ personaId: 7, accountName: 'Harbor Foods', why: 'email', name: 'Dana Ops', title: 'VP Distribution' }, { personaId: null, accountName: 'Harbor Foods Group', why: 'stated company' }, { personaId: null, accountName: 'Acme (not in GAP)', why: 'stated company' }] };
  it('offers the existing person by name, a new person only at a real account, wrong company and leave', () => {
    render(<PersonResolve member={member} />);
    expect(screen.getByTestId('resolve-existing').textContent).toBe('This is Dana Ops, VP Distribution (Harbor Foods)');
    expect(screen.getAllByTestId('resolve-new').map((b) => b.textContent)).toEqual(['New person at Harbor Foods Group']);
    expect(screen.getByTestId('resolve-wrong')).toBeTruthy();
    expect(screen.getByTestId('resolve-leave')).toBeTruthy();
  });
  it('posts the existing-person choice with the Persona id', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal('fetch', f);
    render(<PersonResolve member={member} />);
    fireEvent.click(screen.getByTestId('resolve-existing'));
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toEqual({ resolve: 'existing', personaId: 7 });
  });
});
