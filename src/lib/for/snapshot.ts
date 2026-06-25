import { buildAccountRoiModel } from '@/lib/demo/roi-model';
import { buildROIDashboard, buildROIEngineInputs, computeROIModel } from '@/lib/microsites/roi';
import type { AccountROIModel } from '@/lib/microsites/schema';

export interface ForSnapshot {
  slug: string;
  annualValue: number;
  annualValueLabel: string;
  perSiteImpliedLabel: string;
  paybackAllSavingsMonths: number | null;
  paybackLabel: string | null;
  paybackHardSavingsMonths?: number | null;
  paybackPaperSavingsMonths?: number | null;
  irrScenarios?: { scenario: string; paybackLabel: string; monthlyIrrPct: number; effectiveAnnualIrrPct: number; effectiveAnnualIrrLabel?: string }[];
  totalFacilities: number;
  averageMarginPerShipment?: number;
  facilityMix: { archetype: string; facilityCount: number }[];
  siloTax: { auditedCount: number; dropReady: number; gated: number; longDrive: number; fastLane: number; multiCampus: number };
}

const compactUsd = (v: number): string => {
  if (!Number.isFinite(v)) return '$0';
  const abs = Math.abs(v), sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${parseFloat((abs / 1e9).toFixed(1))}B`;
  if (abs >= 1e6) return `${sign}$${parseFloat((abs / 1e6).toFixed(1))}M`;
  if (abs >= 1e3) return `${sign}$${parseFloat((abs / 1e3).toFixed(1))}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

function buildCashflow(annualSavings: number, annualSub: number, implOneTime: number, horizon: number): number[] {
  const upfront = 0.5 * annualSub + implOneTime, monthlyFull = annualSavings / 12, cf: number[] = [];
  for (let m = 1; m <= horizon; m++) {
    let s = 0;
    if (m > 3 && m <= 12) s = (monthlyFull * (m - 3)) / 9; else if (m > 12) s = monthlyFull;
    let c = s; if (m === 1) c -= upfront; if (m >= 13 && (m - 1) % 12 === 0) c -= annualSub;
    cf.push(c);
  }
  return cf;
}
function computePayback(annualSavings: number, annualSub: number, impl: number): number | null {
  if (annualSavings <= 0) return null;
  const cf = buildCashflow(annualSavings, annualSub, impl, 120); let cum = 0;
  for (let i = 0; i < cf.length; i++) { const prev = cum; cum += cf[i]; if (cum >= 0 && prev < 0) return i + -prev / cf[i]; }
  return null;
}
function computeMonthlyIrr(annualSavings: number, annualSub: number, impl: number): number | null {
  if (annualSavings <= 0) return null;
  const cf = buildCashflow(annualSavings, annualSub, impl, 24);
  const npv = (r: number) => cf.reduce((v, c, t) => v + c / Math.pow(1 + r, t), 0);
  if (npv(0) <= 0) return null;
  let lo = 0, hi = 100;
  for (let i = 0; i < 300; i++) { const mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; if (hi - lo < 1e-9) break; }
  return (lo + hi) / 2;
}
const fmtPayback = (m: number | null) => (m == null ? 'N/A' : `${m.toFixed(1)} mo`);
const fmtAnnualIrr = (d: number) => { const p = d * 100; if (p >= 1e6) return `${Math.round(p / 1000).toLocaleString('en-US')}K%`; if (p >= 1e3) return `${Math.round(p).toLocaleString('en-US')}%`; return `${p.toFixed(1)}%`; };

/** Build a ForSnapshot from an already-constructed AccountROIModel + a precomputed siloTax.
 *  This is the shared label/engine path used by both the audited pack path (buildSnapshot)
 *  and the research-tier path (which builds the model directly, without a pack). */
export function snapshotFromModel(
  slug: string,
  model: AccountROIModel,
  siloTax: ForSnapshot['siloTax'],
): ForSnapshot {
  const inputs = buildROIEngineInputs(model);
  const computation = computeROIModel(inputs);
  const dash = buildROIDashboard(model);

  const annualValue: number = dash.comparison.yardFlow.total;
  const totalFacilities: number = dash.totalFacilities;
  const payback: number | null = dash.highLevelStats.paybackAllSavingsMonths ?? null;
  const annualSub = computation.annualSubscription, impl = computation.implementationOneTime;
  const paperAnnual = computation.paperSavingsAnnual;
  const hardAnnual = (dash.highLevelStats.costOfInactionPerMonth ?? 0) * 12;
  const allAnnual = computation.totalValueAnnual;
  const paybackPaper = computePayback(paperAnnual, annualSub, impl);

  const irrRow = (scenario: string, annual: number, pm: number | null) => {
    const mr = computeMonthlyIrr(annual, annualSub, impl); if (mr == null || pm == null) return null;
    const annualDecimal = Math.pow(1 + mr, 12) - 1;
    return { scenario, paybackLabel: fmtPayback(pm), monthlyIrrPct: parseFloat((mr * 100).toFixed(2)), effectiveAnnualIrrPct: parseFloat((annualDecimal * 100).toFixed(1)), effectiveAnnualIrrLabel: fmtAnnualIrr(annualDecimal) };
  };
  const irrRows = [
    irrRow('Paper-only savings', paperAnnual, paybackPaper),
    irrRow('Hard savings', hardAnnual, dash.highLevelStats.paybackHardSavingsMonths ?? null),
    irrRow('Full modeled value', allAnnual, payback),
  ].filter(Boolean) as ForSnapshot['irrScenarios'];

  return {
    slug,
    annualValue,
    annualValueLabel: `${compactUsd(annualValue)}/yr`,
    perSiteImpliedLabel: `${compactUsd(annualValue / totalFacilities)}/yr`,
    paybackAllSavingsMonths: payback,
    paybackLabel: payback != null ? `${payback.toFixed(1)} mo` : null,
    paybackHardSavingsMonths: dash.highLevelStats.paybackHardSavingsMonths ?? null,
    paybackPaperSavingsMonths: paybackPaper,
    irrScenarios: irrRows && irrRows.length > 0 ? irrRows : undefined,
    totalFacilities,
    averageMarginPerShipment: model.averageMarginPerShipment,
    facilityMix: model.facilityMix,
    siloTax,
  };
}

/** Same engine + math as /demo/<slug> and gen-for-prize.ts, returned as data. */
export function buildSnapshot(pack: any): ForSnapshot {
  const model = buildAccountRoiModel(pack);

  const cls = (pack.network.sites ?? []).map((s: any) => s.classification).filter(Boolean);
  const cnt = (p: (c: any) => boolean) => cls.filter(p).length;
  const siloTax: ForSnapshot['siloTax'] = {
    auditedCount: cls.length,
    dropReady: cnt((c) => c.dropYard === true),
    gated: cnt((c) => c.truckGate === true),
    longDrive: cnt((c) => c.drivewayLong === true),
    fastLane: cnt((c) => c.fastLaneOpportunity === true),
    multiCampus: cnt((c) => c.multipleFacilities === true),
  };

  return snapshotFromModel(pack.account.slug, model, siloTax);
}
