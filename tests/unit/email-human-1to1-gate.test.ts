import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { __resetAutonomyGate, assertAutonomyPermitsSend, assertHumanApprovedOneToOne } from '@/lib/email/autonomy-gate';

const STATE = (global: boolean, outreach: boolean) => ({ global, motions: { outreach, actuator: false, social: true, content: true }, updated_by: 'x', reason: 'r' });

function clawd(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => body })));
}

beforeEach(() => {
  __resetAutonomyGate();
  process.env.CLAWD_CONTROL_PLANE_URL = 'https://clawd.test';
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 't';
});
afterEach(() => vi.unstubAllGlobals());

describe('autonomy halt by purpose', () => {
  it('outreach motion halted: autonomous outreach refused, a human-approved 1:1 passes', async () => {
    clawd(STATE(true, false));
    await expect(assertAutonomyPermitsSend('PROSPECT_OUTREACH')).rejects.toThrow('outreach motion halted');
    await expect(assertAutonomyPermitsSend(undefined)).rejects.toThrow('outreach motion halted');
    __resetAutonomyGate();
    await expect(assertAutonomyPermitsSend('HUMAN_APPROVED_1TO1')).resolves.toBeUndefined();
  });

  it('GLOBAL halt still refuses the human 1:1 send', async () => {
    clawd(STATE(false, false));
    await expect(assertAutonomyPermitsSend('HUMAN_APPROVED_1TO1')).rejects.toThrow('global autonomy halted');
  });

  it('unreadable autonomy state refuses the human 1:1 send (fail closed)', async () => {
    clawd({}, false);
    await expect(assertAutonomyPermitsSend('HUMAN_APPROVED_1TO1')).rejects.toThrow('unreadable');
  });
});

describe('assertHumanApprovedOneToOne (wire, server side)', () => {
  const now = new Date('2026-09-25T23:00:00Z');
  const c = { actor: 'casey@freightroll.com', recipient: 'joey@kroger.com', contentHash: 'h', confirmedAt: new Date(now.getTime() - 5000) };
  it('one confirmed recipient passes', () => {
    expect(() => assertHumanApprovedOneToOne({ to: 'Joey@Kroger.com', humanConfirmation: c }, now)).not.toThrow();
  });
  it.each([
    [{ to: 'joey@kroger.com' }, 'no human confirmation'],
    [{ to: 'joey@kroger.com, x@y.com', humanConfirmation: c }, 'exactly one recipient'],
    [{ to: 'joey@kroger.com', cc: ['x@y.com'], humanConfirmation: c }, 'no cc or bcc'],
    [{ to: 'joey@kroger.com', bcc: 'x@y.com', humanConfirmation: c }, 'no cc or bcc'],
    [{ to: 'other@kroger.com', humanConfirmation: c }, 'recipient differs'],
    [{ to: 'joey@kroger.com', humanConfirmation: { ...c, actor: 'cron' } }, 'no authenticated actor'],
    [{ to: 'joey@kroger.com', humanConfirmation: { ...c, contentHash: '' } }, 'no confirmed content'],
    [{ to: 'joey@kroger.com', humanConfirmation: { ...c, confirmedAt: new Date(now.getTime() - 11 * 60_000) } }, 'stale'],
  ])('%j refused: %s', (payload, reason) => {
    expect(() => assertHumanApprovedOneToOne(payload as never, now)).toThrow(reason);
  });
});

describe('only the GAP seller send may declare HUMAN_APPROVED_1TO1', () => {
  it('no other source file names the purpose (no background job, cron, agent route or queue drain can use it)', () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f) && readFileSync(p, 'utf8').includes("'HUMAN_APPROVED_1TO1'")) hits.push(p.split(sep).join('/'));
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(hits.sort()).toEqual(['src/lib/email/autonomy-gate.ts', 'src/lib/email/gmail-sender.ts', 'src/lib/gap/execution/seller-send.ts'].map((x) => join(process.cwd(), x).split(sep).join('/')).sort());
  });
});
