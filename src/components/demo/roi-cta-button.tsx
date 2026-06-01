'use client';

import type { DemoPack } from '@/lib/demo/pack-schema';
import { deriveNetworkCounts } from '@/lib/demo/roi-model';

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
 * Map a DemoPack to the V2 calculator's input shape. Keeps the
 * `assumptions` block at its industry-prior defaults (matching what the
 * calculator ships with) and only overrides `asks` — the inputs we can
 * derive honestly from the audit. The network counts come from the shared
 * `deriveNetworkCounts` so this hand-off and the inline ROI panel (#4) read
 * the prospect's network identically.
 */
function buildRoiV2State(pack: DemoPack): RoiV2State {
  const { total, facilitiesWithYms, facilitiesWithDropTrailers, averageMarginPerShipment } =
    deriveNetworkCounts(pack);

  return {
    asks: {
      totalFacilities: total,
      facilitiesWithYms,
      facilitiesWithDropTrailers,
      averageMarginPerShipment,
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
