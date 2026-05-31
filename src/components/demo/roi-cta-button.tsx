'use client';

import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * D8.1 — ROI Calculator CTA that pre-fills the V2 calculator with the
 * prospect's actual audited data via shared localStorage.
 *
 * The trick: `/demo/<slug>` is rewritten through yardflow.ai (so the
 * browser origin is `yardflow.ai`), and `/roi/` lives natively on
 * yardflow.ai. Same origin → same `localStorage`. The V2 calculator's
 * state initializer reads `localStorage['roi-v2-state']` on mount, so
 * if we write that key before navigating, the calculator boots with
 * the prospect's bucketed counts already filled in.
 *
 * Shape pinned to the snapshot captured by `scripts/inspect-roi-state.mjs`
 * (see tmp/roi-v2-state.snapshot.json). Keep that script in CI / monthly
 * regression checks; if the shape drifts, this component breaks silently
 * (the prospect sees the calculator defaults instead of pre-fill).
 */

const ROI_STATE_KEY = 'roi-v2-state';
const ROI_URL = 'https://yardflow.ai/roi/';

/**
 * Shape of the V2 calculator's localStorage state. Captured from the
 * live RoiCalculatorV2 component on 2026-05-22.
 */
interface RoiV2State {
  asks: {
    totalFacilities: number;
    facilitiesWithYms: number;
    facilitiesWithDropTrailers: number;
    averageMarginPerShipment: number;
  };
  assumptions: {
    withYms: ArchetypeAssumptions;
    dropsNoYms: ArchetypeAssumptions;
    withoutDrops: ArchetypeAssumptions;
  };
}

interface ArchetypeAssumptions {
  dcFtesPerShift: number;
  dcShifts: number;
  spotterFtesPerShift: number;
  spotterShifts: number;
  shipmentsPerDay: number;
  avgCycleTimeMinutes: number;
  annualFteCost: number;
}

/**
 * Vertical-based heuristic for legacy-YMS adoption — used as a fallback
 * when the pack's `coverageNote.legacyYmsFacilityCount` is null. These
 * are reasonable industry estimates for what fraction of an account's
 * facilities currently run on SOME legacy YMS (CHEP, SAP, Manhattan,
 * in-house). NOT a YardFlow deployment count — that's always 0 on a
 * demo. Override per-account in the pack via the patch script when
 * better data exists.
 */
const LEGACY_YMS_ADOPTION_BY_VERTICAL: Record<string, number> = {
  cpg: 0.35,
  'grocer-distributor': 0.45,
  '3pl': 0.55,
  retailer: 0.4,
  manufacturer: 0.3,
  'oem-automotive': 0.4,
  beverage: 0.4,
  'logistics-carrier': 0.5,
};

/**
 * Map a DemoPack to the V2 calculator's input shape. Keeps the
 * `assumptions` block at its industry-prior defaults (matching what the
 * calculator ships with) and only overrides `asks` — the inputs we can
 * derive honestly from the audit.
 */
function buildRoiV2State(pack: DemoPack): RoiV2State {
  const cov = pack.account.coverageNote;

  // Prefer total footprint (global where available) over just the
  // audited count, so the ROI we model is the prospect's full network,
  // not just the slice we mapped.
  const total =
    cov?.totalGlobalFootprint ??
    cov?.estimatedFootprint ??
    pack.account.siteCount;

  // Drop-yard ratio from the AUDIT sample; assume it's representative
  // of the prospect's full network (the audit is a deliberate sample of
  // their core facilities, so this is a defensible extrapolation).
  const auditedSites = pack.network.sites.length;
  const auditedDrops = pack.network.sites.filter((s) => s.classification.dropYard).length;
  const dropRatio = auditedSites > 0 ? auditedDrops / auditedSites : 0;
  const facilitiesWithDropTrailers = Math.round(total * dropRatio);

  // Legacy-YMS count — prefer manually-curated value, fall back to a
  // vertical-based heuristic. Mondelez et al. have a meaningful chunk
  // of facilities on legacy YMS today; defaulting to 0 understates the
  // ROI of REPLACING those systems with YardFlow.
  let facilitiesWithYms: number;
  if (typeof cov?.legacyYmsFacilityCount === 'number') {
    facilitiesWithYms = cov.legacyYmsFacilityCount;
  } else {
    const rate = LEGACY_YMS_ADOPTION_BY_VERTICAL[pack.account.archetype] ?? 0.3;
    facilitiesWithYms = Math.round(total * rate);
  }
  // Clamp: cannot exceed total, and the V2 calculator's
  // facilitiesWithYms can include sites that also have drops, but
  // shouldn't exceed the drop-yard count + a small fudge (the
  // calculator treats them as the "with YMS" tier exclusively).
  facilitiesWithYms = Math.max(0, Math.min(facilitiesWithYms, total));

  return {
    asks: {
      totalFacilities: total,
      facilitiesWithYms,
      facilitiesWithDropTrailers,
      // D.T5 — seed from the per-industry margin default (lockstep with
      // src/app/demo/page.tsx buildRoiV2State); fall back to 1000.
      averageMarginPerShipment: pack.account.roiDefaults?.averageMarginPerShipment ?? 1000,
    },
    assumptions: {
      withYms: {
        dcFtesPerShift: 2,
        dcShifts: 3,
        spotterFtesPerShift: 2,
        spotterShifts: 3,
        shipmentsPerDay: 200,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
      dropsNoYms: {
        dcFtesPerShift: 1,
        dcShifts: 2,
        spotterFtesPerShift: 2,
        spotterShifts: 2,
        shipmentsPerDay: 125,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
      withoutDrops: {
        dcFtesPerShift: 1,
        dcShifts: 1,
        spotterFtesPerShift: 0,
        spotterShifts: 0,
        shipmentsPerDay: 40,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
    },
  };
}

interface Props {
  pack: DemoPack;
  /** Click-tracking id picked up by the existing MicrositeTracker. */
  ctaId: string;
  /** Surface label that goes into utm_medium. */
  utmMedium: string;
  /** Button class — varies by surface (primary on sim, secondary in header). */
  className: string;
  children: React.ReactNode;
  /** L.T5 — optional `source` param appended to the ROI URL (e.g.
   *  "microsite") so the calculator + funnel can attribute the hand-off. */
  source?: string;
}

export function RoiCtaButton({ pack, ctaId, utmMedium, className, children, source }: Props) {
  // Always carry pack so the ROI page's PackPrefillBanner brands correctly;
  // add source when provided (L.T5).
  const url =
    `${ROI_URL}?utm_source=demo&utm_medium=${utmMedium}&utm_campaign=${pack.account.slug}` +
    `&pack=${encodeURIComponent(pack.account.slug)}` +
    (source ? `&source=${encodeURIComponent(source)}` : '');

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Same-origin localStorage hand-off only works when the prospect
    // is on yardflow.ai (rewrite). If they're on modex-gtm.vercel.app
    // directly, the write goes to that origin's storage instead — the
    // calculator on yardflow.ai won't see it. We canonicalize email
    // links to yardflow.ai/demo so this is the common path. Worst case:
    // the calculator boots with its own defaults — no broken state.
    try {
      const state = buildRoiV2State(pack);
      window.localStorage.setItem(ROI_STATE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private mode, disabled, etc.) — silently
      // fall through to a normal link navigation. Calculator uses defaults.
    }
    // Don't preventDefault; let the anchor navigate normally so middle-
    // click / cmd-click / new-tab behavior is preserved.
    void e;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-ms-cta-id={ctaId}
      className={className}
    >
      {children}
    </a>
  );
}
