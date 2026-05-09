import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MicrositeRoiPanel } from '@/components/microsites/roi-section';
import { generalMills } from '@/lib/microsites/accounts/general-mills';
import { buildROIDashboard, buildROISectionFromModel, createDefaultROIEngineInputs } from '@/lib/microsites/roi';
import type { ROISection } from '@/lib/microsites/schema';

const ROI_STUB: ROISection = {
  type: 'roi',
  sectionLabel: 'The Business Case',
  headline: 'The business case',
  narrative:
    'Engine-backed ROI from the live calculator using the account\'s archetype mix and operating assumptions.',
  roiLines: [],
};

describe('microsite ROI engine', () => {
  it('matches the public ROI benchmark scenario closely', () => {
    const dashboard = buildROIDashboard();

    expect(dashboard.totalFacilities).toBe(50);
    expect(dashboard.annualSubscription).toBe(550000);
    expect(dashboard.implementationOneTime).toBe(125000);
    expect(dashboard.comparison.yardFlow.total / 1_000_000).toBeCloseTo(87.4, 1);
    expect(dashboard.comparison.existingYms.total / 1_000_000).toBeCloseTo(7.6, 1);
    expect(dashboard.comparison.multiplier).toBeCloseTo(11.5, 1);
    expect(dashboard.highLevelStats.paybackHardSavingsMonths).toBeCloseTo(7.5, 1);
    expect(dashboard.highLevelStats.paybackAllSavingsMonths).toBeCloseTo(3.5, 1);
    expect(dashboard.highLevelStats.netYear1Gain).toBeCloseTo(1060273.44, 1);
    expect(dashboard.highLevelStats.costOfInactionPerMonth).toBeCloseTo(292054.69, 1);
    expect(Math.trunc(dashboard.highLevelStats.year1Roi ?? 0)).toBe(165);
  });

  it('renders engine-backed ROI sections with benchmark stats and source notes', () => {
    const roiSection = buildROISectionFromModel(ROI_STUB, generalMills.accountName, generalMills.roiModel!);

    render(<MicrositeRoiPanel section={roiSection} accentColor="#003DA5" />);

    expect(screen.getByText(/modeled annual value/i)).toBeInTheDocument();
    expect(screen.getAllByText(/payback \(all savings\)/i)).toHaveLength(2);
    expect(screen.getByText(/facilities with a yms/i)).toBeInTheDocument();
    expect(screen.getByText(/scenario assumptions/i)).toBeInTheDocument();
    expect(screen.getByText(/source notes/i)).toBeInTheDocument();
    expect(screen.getByText(/general mills public network footprint/i)).toBeInTheDocument();
  });

  it('preserves the public benchmark defaults when no account model is supplied', () => {
    const inputs = createDefaultROIEngineInputs();

    expect(inputs.archetypes.withYms.facilityCount).toBe(25);
    expect(inputs.archetypes.dropsNoYms.shipmentsPerDay).toBe(125);
    expect(inputs.archetypes.withoutDrops.annualSubscriptionPerFacility).toBe(5000);
    expect(inputs.global.implementationPerFacility).toBe(2500);
  });
});
