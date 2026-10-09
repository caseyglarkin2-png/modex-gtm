// @vitest-environment node
/**
 * C44 (the commercial-context audit, 2026-10-08): every visible action ends in one of six states with a source, a
 * seller line and a next path. Accepted, queued and prepared from a 2xx; refused from a 4xx with the originals
 * standing (retry only on a transient read); failed from a 5xx with the same click as the retry; unknown when the
 * request did not complete (it may have applied: reload, then retry). An unknown handler, an invalid revision and a
 * CRM outage each produce an actionable result that consumes no retry.
 */
import { describe, expect, it } from 'vitest';
import { actionRole, failedAction, postAction, readAction, runAction, unknownAction } from '@/lib/gap/ui/action-result';

const ctx = { verb: 'Decided', source: 'signal:s-1' };
const ok = (status = 200) => ({ ok: true, status });
const no = (status: number) => ({ ok: false, status });

describe('C44: the six states', () => {
  it('accepted, queued and prepared from a 2xx; the route line wins, else the caller line, else the verb', () => {
    expect(readAction(ok(), { line: 'Pursuing the signal.' }, ctx)).toMatchObject({ state: 'accepted', line: 'Pursuing the signal.', source: 'signal:s-1', retry: false, error: null, next: null });
    expect(readAction(ok(), { state: 'queued', line: 'GAP is developing the angle.' }, ctx)).toMatchObject({ state: 'queued', line: 'GAP is developing the angle.' });
    expect(readAction(ok(201), { taskId: 'at_1' }, ctx)).toMatchObject({ state: 'queued', line: 'Decided. GAP is working on it in the background; it comes back on the item.' });
    expect(readAction(ok(), { prepared: true }, ctx)).toMatchObject({ state: 'prepared', line: 'Decided. Prepared; nothing is sent until you send it.' });
    expect(readAction(ok(), {}, { verb: 'Saved', accepted: () => 'Placed at Kenco.' })).toMatchObject({ state: 'accepted', line: 'Placed at Kenco.' });
    expect(readAction(ok(), {}, { verb: 'Saved' })).toMatchObject({ state: 'accepted', line: 'Saved.' });
    expect(readAction(ok(), { href: '/gap/accounts/kenco', key: 'person:dave' }, { verb: 'Decided' })).toMatchObject({ source: 'person:dave', next: { kind: 'open', href: '/gap/accounts/kenco' } });
    // A route may not claim a failure state on a 2xx.
    expect(readAction(ok(), { state: 'failed' }, ctx).state).toBe('accepted');
    expect(actionRole(readAction(ok(), {}, ctx))).toBe('status');
  });

  it('refused from a 4xx: an unknown handler, a bad field, a stale revision, signed out, GAP off; the originals stand and no retry is consumed', () => {
    const badDecision = readAction(no(400), { error: 'invalid_body', field: 'decision' }, ctx);
    expect(badDecision).toMatchObject({ state: 'refused', line: 'Not decided: the decision is not valid; fix it and try again.', retry: false, error: 'invalid_body', next: null });
    expect(actionRole(badDecision)).toBe('alert');
    expect(readAction(no(404), { error: 'not_found' }, ctx)).toMatchObject({ state: 'refused', line: 'Not decided: not found.', retry: false, next: { kind: 'reload' } });
    const revision = readAction(no(409), { error: 'revision_stale', existingRevision: 'rev-7', href: '/gap/research/r1' }, { verb: 'Approved', source: 'rev-6' });
    expect(revision).toMatchObject({ state: 'refused', line: 'Not approved: a newer revision exists (rev-7); open it and decide on that one.', retry: false, next: { kind: 'open', label: 'Open the current revision', href: '/gap/research/r1' } });
    expect(readAction(no(401), { error: 'unauthenticated' }, ctx)).toMatchObject({ state: 'refused', line: 'Not decided: you are signed out; sign in and try again.' });
    expect(readAction(no(404), { skipped: true, reason: 'GAP_ROUTING_ENABLED is off' }, ctx)).toMatchObject({ state: 'refused', line: 'Not decided: GAP is turned off here.', error: 'GAP_ROUTING_ENABLED is off', next: null });
    expect(readAction(no(409), { error: 'origin_closed', detail: 'the deal closed on 2026-10-01' }, { verb: 'Approved' })).toMatchObject({ state: 'refused', line: 'Not approved: origin closed (the deal closed on 2026-10-01).', retry: false });
    // A surface keeps its own wording through refusedLine; the state and the code still come back.
    expect(readAction(no(404), { error: 'account_not_found' }, { verb: 'Recorded', refusedLine: (code) => `Could not record it (${code}). Nothing changed.` })).toMatchObject({ state: 'refused', line: 'Could not record it (account_not_found). Nothing changed.', error: 'account_not_found' });
    expect(readAction(no(400), { error: 'proof_required' }, { verb: 'Recorded', refusal: (code) => (code === 'proof_required' ? 'say what shows it is done' : null) }).line).toBe('Not recorded: say what shows it is done.');
  });

  it('a CRM outage is a transient refusal: nothing changed and the same click retries', () => {
    const r = readAction(no(409), { error: 'deal_unverified', detail: 'HubSpot could not confirm the open deals just now. Nothing was recorded; try again.' }, { verb: 'Recorded', source: 'c-1' });
    expect(r).toMatchObject({ state: 'refused', retry: true, next: { kind: 'retry' }, error: 'deal_unverified' });
    expect(r.line).toBe('Not recorded: deal unverified (HubSpot could not confirm the open deals just now. Nothing was recorded; try again.). Nothing changed; the same click tries again.');
    expect(readAction(no(409), { error: 'in_progress' }, { verb: 'Approved' })).toMatchObject({ state: 'refused', retry: true });
    expect(readAction(no(503), { error: 'activity_unreadable', reason: 'Could not read what is live.' }, { verb: 'Recorded' })).toMatchObject({ state: 'failed', retry: true, next: { kind: 'retry' } });
  });

  it('failed from a 5xx with the same click as the retry; unknown from a timeout, a 504 or a thrown fetch, with reload then retry', () => {
    expect(readAction(no(500), { error: 'internal' }, ctx)).toMatchObject({ state: 'failed', line: 'Not decided: the server failed (internal). Nothing is assumed written; try again.', retry: true, next: { kind: 'retry' }, error: 'internal' });
    expect(readAction(no(502), {}, ctx)).toMatchObject({ state: 'failed', error: 'http_502' });
    expect(readAction(no(504), {}, ctx)).toMatchObject({ state: 'unknown', line: 'Decided? The request did not complete (the server took too long; it may have partly run). It may have applied. Reload to see; if it did not, try again.', retry: true, next: { kind: 'reload' }, error: 'request_incomplete', status: 504 });
    expect(failedAction(new TypeError('Failed to fetch'), ctx)).toMatchObject({ state: 'unknown', line: 'Decided? The request did not complete (no connection). It may have applied. Reload to see; if it did not, try again.', next: { kind: 'reload' }, retry: true });
    expect(failedAction(Object.assign(new Error('aborted'), { name: 'AbortError' }), ctx).line).toContain('(timed out)');
    expect(unknownAction({ verb: 'Saved' }, 'no answer').source).toBeNull();
    expect(actionRole(failedAction(new Error('x'), ctx))).toBe('alert');
  });

  it('runAction and postAction never throw: a thrown fetch is unknown, a bad body is read as empty, a non-ok answer is read', async () => {
    const thrown = await runAction('/api/gap/decide', { method: 'POST' }, ctx, async () => { throw new TypeError('Failed to fetch'); });
    expect(thrown.state).toBe('unknown');
    const badJson = await postAction('/api/gap/decide', { key: 'k' }, ctx, async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } }));
    expect(badJson).toMatchObject({ state: 'accepted', line: 'Decided.' });
    const calls: Array<[string, RequestInit | undefined]> = [];
    const refused = await postAction('/api/gap/decide', { key: 'k', decision: 'nope' }, ctx, async (url, init) => { calls.push([url, init]); return { ok: false, status: 400, json: async () => ({ error: 'invalid_body', field: 'decision' }) }; });
    expect(refused).toMatchObject({ state: 'refused', error: 'invalid_body' });
    expect(calls[0][0]).toBe('/api/gap/decide');
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ key: 'k', decision: 'nope' });
    expect((await runAction('/x', {}, ctx, undefined as never)).state === 'unknown' || typeof fetch === 'function').toBe(true);
  });
});
