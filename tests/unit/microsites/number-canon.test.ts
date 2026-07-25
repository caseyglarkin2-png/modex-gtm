/**
 * Number-canon guard for the modex prospect-facing surfaces (2026-07-24).
 *
 * This app serves the /demo microsites, /for packs, and the ROI section under
 * yardflow.ai. Those surfaces must speak the SAME YardFlow OWN-proof numbers
 * as the native site (Flow-State- config/brand.ts BRAND.proof). This test pins
 * the canon values here (YARDFLOW_PROOF / YARDFLOW_BRAND are this repo's SSOT
 * for the numbers generated copy inherits), cross-checks that the OWN-proof
 * copy locations most likely to drift still track them, and asserts no retired
 * vocabulary renders in this repo's buyer-copy surfaces.
 *
 * Modeled on Flow-State- flow-state-site/config/__tests__/number-canon.test.ts.
 *
 * Canon (single source = Flow-State- BRAND.proof; mirrored in modex CLAUDE.md):
 *   24 sites live | 260 committed (Primo) | 48->24 min measured (50%) |
 *   $1M+/site MODELED (never "measured"/"proved"/"CEO-verified") | ~5% measured
 *
 * DISAMBIGUATION: account-specific numbers (a demo pack saying "41 sites",
 * "$48.6M/yr", "~40% reduction" for THAT company's own published case) are
 * legitimate and out of scope. This guard only pins YardFlow's OWN live proof.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { YARDFLOW_BRAND, YARDFLOW_PROOF, YARDFLOW_PRODUCT, YARDFLOW_MESSAGING } from '@/lib/ai/yardflow-context';
import { YNS_THESIS } from '@/lib/microsites/yns-thesis';

const SRC = path.resolve(__dirname, '../../../src');
const EM_DASH = '—';

function statValue(label: string): string {
  const stat = YARDFLOW_PROOF.stats.find((s) => s.label === label);
  if (!stat) throw new Error(`YARDFLOW_PROOF.stats has no "${label}" entry`);
  return stat.value;
}

describe('Number canon: YARDFLOW_PROOF is the own-proof source of truth', () => {
  it('24 sites live', () => {
    expect(YARDFLOW_PROOF.facilitiesLive).toBe('24');
    expect(statValue('Facilities Live')).toBe('24');
  });

  it('260 sites committed (Primo anchor network)', () => {
    expect(YARDFLOW_PROOF.contractedNetwork).toBe('260');
    expect(statValue('Sites Committed (100% of network)')).toBe('260');
  });

  it('48->24 min drop and hook (50% reduction), measured', () => {
    expect(YARDFLOW_PROOF.avgDropHook).toBe('48→24'); // "48→24"
    expect(statValue('Avg. Drop & Hook (min)')).toBe('48→24');
  });

  it('$1M+ incremental profit per site (modeled floor)', () => {
    expect(YARDFLOW_PROOF.perSiteProfit).toBe('$1M+');
    expect(statValue('Per-site Profit Lift')).toBe('$1M+');
  });
});

describe('Own-proof copy tracks the canon (no hardcoded drift)', () => {
  it('brand positioning states 24 sites, 48->24, $1M+ MODELED, 260 committed', () => {
    const p = YARDFLOW_BRAND.positioning;
    expect(p).toContain('24 Primo Brands sites');
    expect(p).toContain('48 to 24 minutes');
    // $1M+/site must render as modeled, never measured/proved. This pins the
    // fix that removed the "CEO-verified from operational data" mislabel.
    expect(p).toMatch(/\$1M\+ per site modeled/);
    expect(p).toContain('260-site');
  });

  it('yardflow-context never labels the $1M+/site figure as proven/CEO-verified', () => {
    const ctx = fs.readFileSync(path.join(SRC, 'lib', 'ai', 'yardflow-context.ts'), 'utf-8');
    expect(ctx).not.toContain('CEO-verified');
    expect(ctx).not.toMatch(/\$1M\+[^\n]*proven floor/);
    // The one place $1M+ carries a provenance label must say "modeled".
    expect(ctx).toContain('$1M+ per-site incremental profit (modeled, conservative floor)');
  });

  it('rendered ROI comparison labels use "Capacity value", not retired "Throughput"', () => {
    const roi = fs.readFileSync(path.join(SRC, 'lib', 'microsites', 'roi.ts'), 'utf-8');
    // roiLines[].label renders in the buyer ROI table (roi-section.tsx). No
    // rendered label may use the retired metric word.
    expect(roi).not.toMatch(/label:\s*'Throughput/);
    expect(roi).toContain("label: 'Capacity value'");
  });
});

describe('No retired vocabulary in buyer-rendered copy', () => {
  // Serialize the exported copy objects so we assert over the strings the
  // surfaces actually emit, not the source comments. These carry the universal
  // buyer copy: brand block, live-proof stats/outcomes, the YNS thesis rendered
  // on every memo microsite, and PRODUCT + MESSAGING which seed
  // getYardFlowPromptContext() (every AI-generated buyer email/pack inherits
  // them, so retired vocab there leaks into generated copy the same way).
  const rendered = [
    JSON.stringify(YARDFLOW_BRAND),
    JSON.stringify(YARDFLOW_PROOF),
    JSON.stringify(YARDFLOW_PRODUCT),
    JSON.stringify(YARDFLOW_MESSAGING),
    JSON.stringify(YNS_THESIS),
  ].join('\n');

  it('no "throughput"', () => {
    expect(rendered.toLowerCase()).not.toContain('throughput');
  });

  it('no em dashes', () => {
    expect(rendered).not.toContain(EM_DASH);
  });

  it('no "Variance Tax" / "Volatility Tax"', () => {
    expect(rendered).not.toMatch(/Variance (Is a )?Tax/i);
    expect(rendered).not.toMatch(/Volatility Tax/i);
  });

  it('no "viscosity" / "Industrial Fluidity"', () => {
    expect(rendered).not.toMatch(/viscosity/i);
    expect(rendered).not.toMatch(/Industrial Fluidity/i);
  });

  it('YNS thesis uses "production capacity" and no em dash', () => {
    const thesis = JSON.stringify(YNS_THESIS);
    expect(thesis).toContain('Production capacity');
    expect(thesis).not.toContain(EM_DASH);
    expect(thesis.toLowerCase()).not.toContain('throughput');
  });
});
