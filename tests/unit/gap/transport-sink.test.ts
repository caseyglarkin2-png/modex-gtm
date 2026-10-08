// @vitest-environment node
/**
 * R05: the transport sink is off unless GAP_SEND_TRANSPORT is exactly `sink`; with it on, a non-test recipient is
 * refused before any network call and the attempt is recorded; an allowed one is written, never sent.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { refusedRecipients, SINK_DEFAULT_DOMAINS, sinkAttempt, sinkConfig, SinkRefusal } from '@/lib/email/transport-sink';

describe('transport sink', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
    vi.restoreAllMocks();
  });
  const dir = () => {
    const d = mkdtempSync(join(tmpdir(), 'gap-sink-'));
    dirs.push(d);
    return d;
  };

  it('acceptance batch item 1: refused in production, whatever else is set; preview and development keep it', () => {
    expect(() => sinkConfig({ GAP_SEND_TRANSPORT: 'sink', GAP_SINK_DIR: 'x', VERCEL_ENV: 'production' })).toThrow('GAP_SEND_TRANSPORT=sink is refused in production (VERCEL_ENV=production): unset it; nothing was sent');
    expect(() => sinkConfig({ GAP_SEND_TRANSPORT: ' sink ', GAP_SINK_DIR: 'x', VERCEL_ENV: ' production ' })).toThrow(/refused in production/);
    expect(sinkConfig({ GAP_SEND_TRANSPORT: 'sink', GAP_SINK_DIR: 'x', VERCEL_ENV: 'preview' })).toEqual({ dir: 'x', allowedDomains: [...SINK_DEFAULT_DOMAINS] });
    // Production with the variable unset is the real transport, as before.
    expect(sinkConfig({ VERCEL_ENV: 'production' })).toBeNull();
  });

  it('is off by default and for any value other than exactly sink', () => {
    expect(sinkConfig({})).toBeNull();
    expect(sinkConfig({ GAP_SEND_TRANSPORT: 'true', GAP_SINK_DIR: 'x' })).toBeNull();
    expect(sinkConfig({ GAP_SEND_TRANSPORT: 'SINK', GAP_SINK_DIR: 'x' })).toBeNull();
    expect(() => sinkConfig({ GAP_SEND_TRANSPORT: 'sink' })).toThrow(/GAP_SINK_DIR/);
    expect(sinkConfig({ GAP_SEND_TRANSPORT: 'sink', GAP_SINK_DIR: 'x' })).toEqual({ dir: 'x', allowedDomains: [...SINK_DEFAULT_DOMAINS] });
    expect(sinkConfig({ GAP_SEND_TRANSPORT: 'sink', GAP_SINK_DIR: 'x', GAP_SINK_ALLOWED_DOMAINS: 'Example.com, test.local' })?.allowedDomains).toEqual(['example.com', 'test.local']);
  });

  it('refuses a real address in to, cc or bcc, before any network access, and records the refused attempt', () => {
    const d = dir();
    const cfg = { dir: d, allowedDomains: ['example.com'] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(refusedRecipients({ to: 'tom@example.com', cc: ['Karen <karen@pepsico.com>'] }, ['example.com'])).toEqual(['Karen <karen@pepsico.com>']);
    // A subdomain of an allowed domain is allowed; a look-alike is not.
    expect(refusedRecipients({ to: 'glen@fedex-scratch-co.example.com', cc: ['x@notexample.com'] }, ['example.com'])).toEqual(['x@notexample.com']);
    expect(() => sinkAttempt(cfg, 'send', { to: 'someone@pepsico.com', subject: 's', raw: 'x' })).toThrow(SinkRefusal);
    expect(() => sinkAttempt(cfg, 'send', { to: 'tom@example.com', bcc: 'me@gmail.com', subject: 's', raw: 'x' })).toThrow(/refused me@gmail.com/);
    expect(fetchSpy).not.toHaveBeenCalled();
    const files = readdirSync(d);
    expect(files).toHaveLength(2);
    const rec = JSON.parse(readFileSync(join(d, files[0]), 'utf8')) as { outcome: string; refused: string[]; raw: string | null };
    expect(rec.outcome).toBe('refused');
    expect(rec.refused.length).toBeGreaterThan(0);
    expect(rec.raw).toBeNull();
  });

  it('writes an allowed message with its exact raw payload and returns a receipt id', () => {
    const d = dir();
    const r = sinkAttempt({ dir: d, allowedDomains: ['example.com'] }, 'draft', { to: 'tom@example.com', subject: 'Trailer turns', purpose: 'HUMAN_APPROVED_1TO1', raw: 'AbC' }, new Date('2026-10-06T12:00:00Z'));
    expect(r.outcome).toBe('written');
    expect(r.id).toMatch(/^sink-/);
    const rec = JSON.parse(readFileSync(join(d, `${r.id}.json`), 'utf8')) as typeof r;
    expect(rec).toMatchObject({ kind: 'draft', to: 'tom@example.com', subject: 'Trailer turns', purpose: 'HUMAN_APPROVED_1TO1', raw: 'AbC', refused: [] });
  });
});
