/**
 * USE THIS PERSON (owner resolution, 2026-10-05): one governed action, each step audited on its own, failing closed
 * at the first refusal; approval never rolls back; the client's choice is re-checked against the same owner
 * resolution the UI showed; routing is targeted and shadow; nothing drafts, sends or enrolls.
 */
import { describe, expect, it, vi } from 'vitest';
import { applyOwnerToHypothesis } from '@/lib/gap/people/owner-action';

const NOW = new Date('2026-10-05T16:00:00Z');
const hyp = (over: Record<string, unknown> = {}) => ({ id: 'h1', account_name: 'FedEx', status: 'approved', primary_persona_id: null, ...over });
const prismaWith = (row: Record<string, unknown> | null) => ({ prospectingHypothesis: { findUnique: vi.fn(async () => row) } });
const eligible = (key: string, name: string) => ({ key, name, hubspotContactId: key.startsWith('hubspot:') ? key.slice(8) : null, reasons: ['Primary operator: runs the network.'] });
const resolution = (els: Array<ReturnType<typeof eligible>>, excluded: Array<{ key: string; code: string; reason: string }> = []) => async () => ({ ok: true as const, resolution: { eligible: els, excluded: excluded.map((e) => ({ candidate: { key: e.key }, code: e.code, reason: e.reason })) } }) as never;
const deps = (over: Record<string, unknown> = {}) => ({
  import: vi.fn(async () => ({ ok: true, status: 'created', personaId: 7000, accountName: 'FedEx', name: 'Jeffrey Tallman', title: 'VP', hasEmail: true, auditId: 'a', notes: [] })),
  resolve: vi.fn(resolution([eligible('gap:7000', 'Jeffrey Tallman')])),
  assign: vi.fn(async () => ({ ok: true, hypothesisId: 'h1', status: 'approved', priorPersonaId: null, personaId: 7000, eventId: 'e' })),
  transition: vi.fn(async () => ({ ok: true, from: 'approved', to: 'active', effects: [] })),
  route: vi.fn(async () => ({ ok: true, runId: 'run-1', people: [{ personaId: 7000, name: 'Jeffrey Tallman', lane: 'research', decisionId: 'd1' }], counts: { research: 1 }, failures: [] })),
  ...over,
}) as never;

describe('applyOwnerToHypothesis', () => {
  it('HubSpot-only: import, check, assign, activate, targeted route, in that order, each reported', async () => {
    const d = deps();
    const r = await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: { hubspotContactId: '219922589799' }, activate: true, actor: 'casey', now: NOW }, d);
    expect(r.ok).toBe(true);
    expect(r.steps.map((s) => [s.step, s.ok, s.status ?? s.reason ?? ''])).toEqual([['import', true, 'created'], ['check', true, ''], ['assign', true, 'approved'], ['activate', true, 'active'], ['route', true, '']]);
    expect(r).toMatchObject({ hypothesisStatus: 'active', personaId: 7000, personaName: 'Jeffrey Tallman' });
    expect(r.steps[4].detail).toBe('Jeffrey Tallman: research');
    const importCall = (d as any).import.mock.calls[0][1];
    expect(importCall).toMatchObject({ accountName: 'FedEx', hubspotContactId: '219922589799', actor: 'casey' });
    expect((d as any).route.mock.calls[0][1]).toMatchObject({ people: [{ personaId: 7000, name: 'Jeffrey Tallman' }] });
    expect((d as any).transition.mock.calls[0].slice(1, 3)).toEqual(['h1', 'activate']);
  });
  it('a person the resolution set aside (departed, conflicted, other region, divested) is refused at the check, whatever the client sent; nothing assigned', async () => {
    const d = deps({ resolve: vi.fn(resolution([], [{ key: 'gap:1306', code: 'left_company', reason: 'Historical contact. Current-employer evidence points to ADUSA.' }])) });
    const r = await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: { personaId: 1306 }, activate: true, actor: 'casey', now: NOW }, d);
    expect(r.ok).toBe(false);
    expect(r.steps).toEqual([{ step: 'check', ok: false, reason: 'candidate_not_eligible:left_company', detail: 'Historical contact. Current-employer evidence points to ADUSA.' }]);
    expect((d as any).assign).not.toHaveBeenCalled();
    expect((d as any).transition).not.toHaveBeenCalled();
    expect((d as any).route).not.toHaveBeenCalled();
    expect(r.hypothesisStatus).toBe('approved');
  });
  it('activation refused by the machine leaves the person attached and the approval intact; routing never runs', async () => {
    const d = deps({ transition: vi.fn(async () => ({ ok: false, reason: 'evidence_insufficient' })) });
    const r = await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: { personaId: 7000 }, activate: true, actor: 'casey', now: NOW }, d);
    expect(r.ok).toBe(false);
    expect(r.steps.map((s) => [s.step, s.ok, s.status ?? s.reason])).toEqual([['check', true, undefined], ['assign', true, 'approved'], ['activate', false, 'evidence_insufficient']]);
    expect(r.hypothesisStatus).toBe('approved');
    expect((d as any).route).not.toHaveBeenCalled();
  });
  it('attach only (activate: false) assigns and stops; an import failure stops everything', async () => {
    const d = deps();
    const r = await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: { personaId: 7000 }, activate: false, actor: 'casey', now: NOW }, d);
    expect(r.ok).toBe(true);
    expect(r.steps.map((s) => [s.step, s.status])).toEqual([['check', undefined], ['assign', 'approved'], ['activate', 'skipped'], ['route', 'skipped']]);
    const bad = deps({ import: vi.fn(async () => ({ ok: false, reason: 'contact_not_associated', detail: 'x' })) });
    const r2 = await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: { hubspotContactId: '1' }, activate: true, actor: 'casey', now: NOW }, bad);
    expect(r2.steps).toEqual([{ step: 'import', ok: false, reason: 'contact_not_associated', detail: 'x' }]);
    expect((bad as any).assign).not.toHaveBeenCalled();
  });
  it('an unknown hypothesis, or no candidate, stops at the check', async () => {
    expect((await applyOwnerToHypothesis(prismaWith(null), { hypothesisId: 'h1', candidate: { personaId: 1 }, activate: true, actor: 'c', now: NOW }, deps())).steps).toEqual([{ step: 'check', ok: false, reason: 'not_found' }]);
    expect((await applyOwnerToHypothesis(prismaWith(hyp()), { hypothesisId: 'h1', candidate: {}, activate: true, actor: 'c', now: NOW }, deps())).steps[0]).toMatchObject({ step: 'check', ok: false, reason: 'no_candidate' });
  });
  it('an already active hypothesis routes the attached person without a second activation', async () => {
    const d = deps();
    const r = await applyOwnerToHypothesis(prismaWith(hyp({ status: 'active', primary_persona_id: 7000 })), { hypothesisId: 'h1', candidate: { personaId: 7000 }, activate: true, actor: 'casey', now: NOW }, d);
    expect(r.steps.map((s) => [s.step, s.ok, s.status ?? s.reason])).toEqual([['check', true, undefined], ['assign', true, 'already'], ['activate', false, 'already_active'], ['route', true, undefined]]);
    expect((d as any).transition).not.toHaveBeenCalled();
    expect(r.ok).toBe(true);
  });
});
