import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MicrositeSectionRenderer } from '@/components/microsites/sections';
import { generalMills } from '@/lib/microsites/accounts/general-mills';
import { buildROIDashboard, createDefaultROIEngineInputs, materializeMicrositeSections } from '@/lib/microsites/roi';
import { resolveMicrositeBySlug } from '@/lib/microsites/rules';

function findRoiSection(sections: typeof generalMills.sections) {
  const section = sections.find((candidate) => candidate.type === 'roi');
  if (!section || section.type !== 'roi') {
    throw new Error('ROI section not found');
  }

  return section;
}

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

  it('materializes the same General Mills ROI math on overview and person routes', () => {
    const overviewSections = materializeMicrositeSections(generalMills, generalMills.sections);
    const overviewRoi = findRoiSection(overviewSections);

    const resolved = resolveMicrositeBySlug(generalMills, 'paul-gallagher');
    expect(resolved).not.toBeNull();

    const personRoi = findRoiSection(resolved!.sections);

    expect(overviewRoi.modelingMode).toBe('engine');
    expect(personRoi.modelingMode).toBe('engine');
    expect(overviewRoi.totalAnnualSavings).toBe(personRoi.totalAnnualSavings);
    expect(overviewRoi.paybackPeriod).toBe(personRoi.paybackPeriod);
    expect(overviewRoi.totalValueComparison?.yardflowAnnualValue).toBe(personRoi.totalValueComparison?.yardflowAnnualValue);
    expect(overviewRoi.headlineStats?.map((stat) => stat.value)).toEqual(personRoi.headlineStats?.map((stat) => stat.value));
  });

  it('renders engine-backed ROI sections with benchmark stats and source notes', () => {
    const overviewSections = materializeMicrositeSections(generalMills, generalMills.sections);
    const roiSection = findRoiSection(overviewSections);

    render(<MicrositeSectionRenderer section={roiSection} accentColor="#003DA5" />);

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