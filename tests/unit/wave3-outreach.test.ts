import { describe, expect, it } from 'vitest';
import { buildWave3Outreach, WAVE3_FRAMING_COUNT } from '@/lib/discovery/wave3-outreach';

const noDash = (s: string) => {
  expect(s).not.toContain('—');
  expect(s).not.toContain('–');
};

describe('buildWave3Outreach', () => {
  it('leads (index 0) with the prospect\'s real Tier-A facility footprint', () => {
    const o = buildWave3Outreach({ company: 'PepsiCo', firstName: 'Gregg', title: 'COO', facilities: 63 }, 0);
    expect(o.subject).toContain('63');
    expect(o.body).toContain('63 Tier-A yards');
    expect(o.body).toContain('Hi Gregg,');
  });

  it('falls back to a generic footprint when the facility count is missing, never prints undefined', () => {
    const o = buildWave3Outreach({ company: 'Acme', firstName: 'Dana' }, 0);
    expect(o.subject).not.toContain('undefined');
    expect(o.body).not.toContain('undefined');
    expect(o.body.length).toBeGreaterThan(0);
  });

  it('rotates through distinct framings so a committee gets non-duplicate copy', () => {
    const c = { company: 'PepsiCo', firstName: 'A', facilities: 10 };
    const subjects = Array.from({ length: WAVE3_FRAMING_COUNT }, (_, i) => buildWave3Outreach(c, i).subject);
    expect(new Set(subjects).size).toBe(WAVE3_FRAMING_COUNT);
  });

  it('wraps the rotation past the framing count', () => {
    const c = { company: 'PepsiCo', firstName: 'A', facilities: 10 };
    expect(buildWave3Outreach(c, WAVE3_FRAMING_COUNT).subject).toBe(buildWave3Outreach(c, 0).subject);
  });

  it('scopes the CTA by title: ops titles say "yard ops", supply-chain titles say "network"', () => {
    const ops = buildWave3Outreach({ company: 'X', firstName: 'A', title: 'Chief Operations Officer' }, 1);
    expect(ops.body).toContain('your yard ops');
    const net = buildWave3Outreach({ company: 'X', firstName: 'A', title: 'Chief Supply Chain Officer' }, 1);
    expect(net.body).toContain('your network');
  });

  it('falls back to a neutral greeting without a first name', () => {
    expect(buildWave3Outreach({ company: 'X', firstName: '' }, 0).body).toContain('Hi there,');
  });

  it('never uses em or en dashes', () => {
    for (let i = 0; i < WAVE3_FRAMING_COUNT; i++) {
      const o = buildWave3Outreach({ company: 'PepsiCo', firstName: 'Gregg', title: 'COO', facilities: 63 }, i);
      noDash(o.subject);
      noDash(o.body);
    }
  });
});
