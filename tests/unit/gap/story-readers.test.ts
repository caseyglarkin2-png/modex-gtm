/**
 * UX-05 story readers: clawd's outreach history and the vault note are soft, bounded reads. Not configured says so
 * (never a quiet zero), a failed read is 'unavailable' (the story then says it could not be read), a good read keeps
 * only sends with an address and a date; the local vault note prefers the YardFlow wedge paragraph; clawd's copy of
 * the vault wedge is read from the intel snapshot with its date.
 */
import { describe, expect, it, vi } from 'vitest';
import { fetchClawdOutreach, fetchClawdVaultNote, loadStoryReaders, readLocalVaultNote } from '@/lib/gap/story/load';

const env = { CLAWD_CONTROL_PLANE_URL: 'https://clawd.example/', CLAWD_CONTROL_PLANE_TOKEN: 'tok' };
const json = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as unknown as Response;

describe('fetchClawdOutreach', () => {
  it('says not_configured without the pair and never calls fetch', async () => {
    const fetchImpl = vi.fn();
    expect(await fetchClawdOutreach('fedex.com', { env: {}, fetchImpl })).toEqual({ read: 'not_configured', sends: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('reads sends by domain with the bearer token, keeping only dated sends with an address', async () => {
    const fetchImpl = vi.fn(async () => json({ items: [{ type: 'send', date: '2026-08-07T20:05:38+00:00', subject: 'Re: Network 2.0', status: 'sent', to: 'michael.jeannotte@fedex.com', company: '' }, { type: 'audit', date: '2026-08-07', subject: '', status: '', to: 'x@fedex.com' }, { type: 'send', date: '', subject: '', status: 'sent', to: 'y@fedex.com' }], count: 3 }));
    const r = await fetchClawdOutreach('fedex.com', { env, fetchImpl });
    expect(r.read).toBe('ok');
    expect(r.sends).toEqual([{ type: 'send', date: '2026-08-07T20:05:38+00:00', subject: 'Re: Network 2.0', status: 'sent', to: 'michael.jeannotte@fedex.com' }]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://clawd.example/api/outreach/history?domain=fedex.com');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
  it('a failed or malformed read is unavailable, never a quiet empty list', async () => {
    expect((await fetchClawdOutreach('fedex.com', { env, fetchImpl: vi.fn(async () => json({ error: 'boom' }, false, 500)) })).read).toBe('unavailable');
    expect((await fetchClawdOutreach('fedex.com', { env, fetchImpl: vi.fn(async () => json({ error: 'company or domain parameter required' })) })).read).toBe('unavailable');
    expect((await fetchClawdOutreach('fedex.com', { env, fetchImpl: vi.fn(async () => { throw new Error('ECONNRESET'); }) })).read).toBe('unavailable');
  });
  it('no domain means nothing to ask: an ok read with no sends', async () => {
    const fetchImpl = vi.fn();
    expect(await fetchClawdOutreach(null, { env, fetchImpl })).toEqual({ read: 'ok', sends: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('the vault note', () => {
  const file = `---\ntype: account\ncompany: FedEx\nnext_action: One consolidated hub, one pilot.\nlast_refreshed: 2026-10-05\n---\n<!-- seed:auto -->\n# FedEx\n\n## One-line read\nFedEx parcel and LTL hubs run the largest yards in the dataset.\n\n## YardFlow wedge\nConsolidation makes the yards the constraint. Orchestrate the gate-to-dock handoff across the surviving hubs.\n\nProof point: Primo Brands saw +5%.\n\n## Prize (modeled)\n$835M\n`;
  it('reads the local YardFlow wedge paragraph with the refresh date when GAP_VAULT_DIR is set', async () => {
    const readFile = vi.fn(async (p: string) => (p.endsWith('/02_Accounts/FedEx.md') ? file : null));
    const n = await readLocalVaultNote('FedEx', { env: { GAP_VAULT_DIR: 'C:/vault/' }, readFile });
    expect(n).toEqual({ text: 'Consolidation makes the yards the constraint. Orchestrate the gate-to-dock handoff across the surviving hubs.', at: '2026-10-05' });
    expect(readFile.mock.calls[0][0]).toBe('C:/vault/02_Accounts/FedEx.md');
  });
  it('falls back to next_action, then the first paragraph; null without a vault dir or a file', async () => {
    const noWedge = file.replace(/## YardFlow wedge[\s\S]*?(?=## Prize)/, '');
    expect((await readLocalVaultNote('FedEx', { env: { GAP_VAULT_DIR: '/v' }, readFile: async () => noWedge }))!.text).toBe('One consolidated hub, one pilot.');
    expect(await readLocalVaultNote('FedEx', { env: {}, readFile: async () => file })).toBeNull();
    expect(await readLocalVaultNote('FedEx', { env: { GAP_VAULT_DIR: '/v' }, readFile: async () => null })).toBeNull();
  });
  it("reads clawd's copy of the vault wedge from the intel snapshot, HTML stripped, dated", async () => {
    const fetchImpl = vi.fn(async () => json({ found: true, snapshot: { reasoning_notes: ['<strong>Vault wedge (2026-07-10):</strong> Consolidation makes the yards the constraint.', 'gr other note'] } }));
    expect(await fetchClawdVaultNote('fedex.com', { env, fetchImpl })).toEqual({ text: 'Consolidation makes the yards the constraint.', at: '2026-07-10' });
    expect(await fetchClawdVaultNote('fedex.com', { env, fetchImpl: vi.fn(async () => json({ found: false })) })).toBeNull();
    expect(await fetchClawdVaultNote('fedex.com', { env, fetchImpl: vi.fn(async () => { throw new Error('x'); }) })).toBeNull();
  });
  it('loadStoryReaders prefers the local note and only then asks clawd; a reader failure never throws', async () => {
    const fetchImpl = vi.fn(async (url: URL | RequestInfo) => (/outreach\/history/.test(String(url)) ? json({ items: [] }) : json({ found: true, snapshot: { reasoning_notes: ['<strong>Vault wedge (2026-07-10):</strong> from clawd'] } })));
    const local = await loadStoryReaders({ accountName: 'FedEx', domain: 'fedex.com' }, { env: { ...env, GAP_VAULT_DIR: '/v' }, fetchImpl, readFile: async () => file });
    expect(local.vaultNote!.text).toMatch(/^Consolidation/);
    expect(fetchImpl.mock.calls.map((c) => String(c[0]))).not.toContainEqual(expect.stringMatching(/intel\/account/));
    const remote = await loadStoryReaders({ accountName: 'FedEx', domain: 'fedex.com' }, { env, fetchImpl, readFile: async () => null });
    expect(remote.vaultNote).toEqual({ text: 'from clawd', at: '2026-07-10' });
    expect(remote.clawd.read).toBe('ok');
    const down = await loadStoryReaders({ accountName: 'FedEx', domain: 'fedex.com' }, { env, fetchImpl: vi.fn(async () => { throw new Error('down'); }), readFile: async () => null });
    expect(down).toEqual({ clawd: { read: 'unavailable', sends: [] }, vaultNote: null });
  });
});
