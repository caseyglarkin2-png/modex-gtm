import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Checkpoint } from '@/scripts/audio-pipeline/lib/checkpoint';

let tmp: string;
beforeEach(async () => { tmp = await mkdtemp(resolve(tmpdir(), 'cp-')); });
afterEach(async () => { await rm(tmp, { recursive: true, force: true }); });

describe('Checkpoint', () => {
  it('write + read roundtrips a stage payload', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    await cp.write('compose', { prompt: 'hello' });
    const read = await cp.read<{ prompt: string }>('compose');
    expect(read).toEqual({ prompt: 'hello' });
  });

  it('returns null when a stage has not been written', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    expect(await cp.read('compose')).toBeNull();
  });

  it('isolates payloads by account slug', async () => {
    const a = new Checkpoint({ root: tmp, account: 'dannon' });
    const b = new Checkpoint({ root: tmp, account: 'general-mills' });
    await a.write('compose', { prompt: 'A' });
    await b.write('compose', { prompt: 'B' });
    expect(await a.read('compose')).toEqual({ prompt: 'A' });
    expect(await b.read('compose')).toEqual({ prompt: 'B' });
  });

  it('appendLog writes timestamped lines to runs/<account>/run.log', async () => {
    const cp = new Checkpoint({ root: tmp, account: 'dannon' });
    await cp.appendLog('starting');
    await cp.appendLog('done');
    const log = await cp.readLog();
    expect(log).toMatch(/starting/);
    expect(log).toMatch(/done/);
    // Each line prefixed with ISO timestamp
    expect(log.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g)?.length).toBe(2);
  });
});
