import type {
  AccountMicrositeData,
  AccountROIModel,
  MicrositeSection,
  ROIArchetypeAssumptions,
  ROIArchetypeBreakdown,
  ROIFacilityArchetype,
  ROIHeadlineStat,
  ROISection,
  ROISourceNote,
  ROITotalValueComparison,
  ROIValueBreakdownLine,
} from './schema';

type ROIArchetypeId = 'withYms' | 'dropsNoYms' | 'withoutDrops';

interface ROIEngineArchetypeInputs {
  label: string;
  facilityCount: number;
  shipmentsPerDay: number;
  operatingDaysPerYear: number;
  marginPerShipment: number;
  costPerShipment: number;
  dockOfficeHeadcountPerShift: number;
  dockOfficeShiftsPerDay: number;
  dockOfficeTimeOnDriverProcessShare: number;
  dockOfficeTimeSavingsShare: number;
  dockOfficeFteAnnualCost: number;
  spotterHeadcountPerShift: number;
  spotterShiftsPerDay: number;
  spotterEfficiencyGainShare: number;
  spotterFteAnnualCost: number;
  dropEligibleShipmentsPerDay: number;
  dropEligibleOperatingDaysPerYear: number;
  transitionToDropsShare: number;
  baselineCycleMinutes: number;
  improvedCycleMinutes: number;
  baseLevelCycleMinutes: number;
  carrierBenchmarkThroughputShare: number;
  facilityBenchmarkThroughputShare: number;
  optimizedCycleMinutes: number;
  baselineCheckinMinutes: number;
  baselineCheckoutMinutes: number;
  ymsCheckinMinutes: number;
  ymsCheckoutMinutes: number;
  frCheckinMinutes: number;
  frCheckoutMinutes: number;
  detentionClaimsPerDay: number;
  detentionCostPerClaim: number;
  detentionReductionShare: number;
  annualSubscriptionPerFacility: number;
}

interface ROIEngineGlobalInputs {
  pagesPerShipment: number;
  costPerPage: number;
  phase1DigitizedShare: number;
  detentionClaimsPerShipmentShare: number;
  realizedShareOfTheoreticalThroughputGain: number;
  trailerPoolOptimizationDropGainShare: number;
  liveShipmentPremiumToDropShare: number;
  panicShipmentsShare: number;
  panicShipmentPremiumShare: number;
  driverFamiliarityThroughputShare: number;
  implementationPerFacility: number;
  yearOneRampShare: number;
}

export interface ROIEngineInputs {
  archetypes: Record<ROIArchetypeId, ROIEngineArchetypeInputs>;
  global: ROIEngineGlobalInputs;
}

interface ROIArchetypeComputation {
  annualShipments: number;
  dropEligibleAnnualShipments: number;
  dockLaborSavingsAnnual: number;
  spotterLaborSavingsAnnual: number;
  throughputProfitImpactAnnual: number;
  transitionToDropsSavingsAnnual: number;
  trailerPoolSavingsAnnual: number;
  panicShipmentSavingsAnnual: number;
  driverFamiliaritySavingsAnnual: number;
  detentionSavingsAnnual: number;
}

interface ROIModelComputation {
  archetypeBreakdown: Record<ROIArchetypeId, ROIArchetypeComputation>;
  totalFacilities: number;
  annualShipments: number;
  paperSavingsAnnual: number;
  dcLaborSavingsAnnual: number;
  spotterLaborSavingsAnnual: number;
  laborSavingsAnnual: number;
  detentionSavingsAnnual: number;
  throughputProfitImpactAnnual: number;
  standardizationSavingsAnnual: number;
  transitionToDropsSavingsAnnual: number;
  trailerPoolSavingsAnnual: number;
  panicShipmentSavingsAnnual: number;
  driverFamiliaritySavingsAnnual: number;
  baseSavingsAnnual: number;
  totalValueAnnual: number;
  annualSubscription: number;
  implementationOneTime: number;
  year1GrossSavings: number;
  year1NetGain: number;
  roiPercentYear1: number | null;
  paybackMonths: number | null;
  fiveYearValue: number;
  paperCoversSubscription: boolean;
  paperToSubscriptionRatio: number;
  weightedMarginPerShipment: number;
  weightedBaselineCycleMinutes: number;
  weightedOptimizedCycleMinutes: number;
  realizedThroughputGainShare: number;
  modelVersion: string;
}

interface ROIHighLevelStats {
  paybackHardSavingsMonths: number | null;
  paybackAllSavingsMonths: number | null;
  netYear1Gain: number;
  costOfInactionPerMonth: number;
  year1Roi: number | null;
}

interface ROIDashboardArchetype {
  id: ROIArchetypeId;
  label: string;
  facilityCount: number;
  annualShipments: number;
  hardSavings: {
    paper: number;
    spotterEfficiency: number;
    dcLaborEfficiency: number;
    detention: number;
    dropTrailerOpportunity: number;
    total: number;
  };
  tieredThroughput: {
    ymsBaseline: number;
    driverJourney: number;
    systemwideOptimization: number;
    total: number;
  };
  legacyYms: {
    spotterSavings: number;
    detentionSavings: number;
    hardSavingsTotal: number;
    throughput: number;
    costPerYear: number;
  };
  yfCostPerYear: number;
  assumptions: {
    dcFtesPerShift: number;
    dcShifts: number;
    spotterFtesPerShift: number;
    spotterShifts: number;
    shipmentsPerDay: number;
    avgCycleTimeMinutes: number;
    annualFteCost: number;
  };
}

export interface ROIDashboard {
  highLevelStats: ROIHighLevelStats;
  archetypes: Record<ROIArchetypeId, ROIDashboardArchetype>;
  totalSavings: {
    hardSavings: number;
    throughput: number;
    standardization: number;
    total: number;
  };
  comparison: {
    existingYms: {
      hardSavings: number;
      standardization: number;
      throughput: number;
      total: number;
    };
    yardFlow: {
      hardSavings: number;
      standardization: number;
      throughput: number;
      total: number;
    };
    multiplier: number;
  };
  totalFacilities: number;
  annualShipments: number;
  annualSubscription: number;
  implementationOneTime: number;
  fiveYearValue: number;
  inputs: ROIEngineInputs;
  modelVersion: string;
}

const SCHEMA_TO_ENGINE_ARCHETYPE: Record<ROIFacilityArchetype, ROIArchetypeId> = {
  'with-yms': 'withYms',
  'drops-no-yms': 'dropsNoYms',
  'without-drops': 'withoutDrops',
};

const ENGINE_TO_SCHEMA_ARCHETYPE: Record<ROIArchetypeId, ROIFacilityArchetype> = {
  withYms: 'with-yms',
  dropsNoYms: 'drops-no-yms',
  withoutDrops: 'without-drops',
};

const ARCHETYPE_TITLE: Record<ROIArchetypeId, string> = {
  withYms: 'Facilities with a YMS',
  dropsNoYms: 'Facilities with drops, no YMS',
  withoutDrops: 'Facilities without drops',
};

const PUBLIC_ROI_DEFAULTS: ROIEngineInputs = {
  archetypes: {
    withYms: {
      label: 'Facilities with a YMS',
      facilityCount: 25,
      shipmentsPerDay: 200,
      operatingDaysPerYear: 300,
      marginPerShipment: 1000,
      costPerShipment: 1000,
      dockOfficeHeadcountPerShift: 2,
      dockOfficeShiftsPerDay: 3,
      dockOfficeTimeOnDriverProcessShare: 0.35,
      dockOfficeTimeSavingsShare: 0.5,
      dockOfficeFteAnnualCost: 60000,
      spotterHeadcountPerShift: 2,
      spotterShiftsPerDay: 3,
      spotterEfficiencyGainShare: 0.2,
      spotterFteAnnualCost: 60000,
      dropEligibleShipmentsPerDay: 200,
      dropEligibleOperatingDaysPerYear: 250,
      transitionToDropsShare: 0,
      baselineCycleMinutes: 60,
      improvedCycleMinutes: 59,
      baseLevelCycleMinutes: 54,
      carrierBenchmarkThroughputShare: 0.025,
      facilityBenchmarkThroughputShare: 0.025,
      optimizedCycleMinutes: 51,
      baselineCheckinMinutes: 4,
      baselineCheckoutMinutes: 5,
      ymsCheckinMinutes: 3,
      ymsCheckoutMinutes: 5,
      frCheckinMinutes: 1,
      frCheckoutMinutes: 2,
      detentionClaimsPerDay: 5,
      detentionCostPerClaim: 75,
      detentionReductionShare: 0.25,
      annualSubscriptionPerFacility: 15000,
    },
    dropsNoYms: {
      label: 'Facilities w/ drops no YMS',
      facilityCount: 10,
      shipmentsPerDay: 125,
      operatingDaysPerYear: 300,
      marginPerShipment: 1000,
      costPerShipment: 1000,
      dockOfficeHeadcountPerShift: 1,
      dockOfficeShiftsPerDay: 2,
      dockOfficeTimeOnDriverProcessShare: 0.35,
      dockOfficeTimeSavingsShare: 0.5,
      dockOfficeFteAnnualCost: 60000,
      spotterHeadcountPerShift: 2,
      spotterShiftsPerDay: 2,
      spotterEfficiencyGainShare: 0.2,
      spotterFteAnnualCost: 60000,
      dropEligibleShipmentsPerDay: 125,
      dropEligibleOperatingDaysPerYear: 250,
      transitionToDropsShare: 0,
      baselineCycleMinutes: 60,
      improvedCycleMinutes: 59,
      baseLevelCycleMinutes: 54,
      carrierBenchmarkThroughputShare: 0.025,
      facilityBenchmarkThroughputShare: 0.025,
      optimizedCycleMinutes: 51,
      baselineCheckinMinutes: 4,
      baselineCheckoutMinutes: 5,
      ymsCheckinMinutes: 3,
      ymsCheckoutMinutes: 5,
      frCheckinMinutes: 1,
      frCheckoutMinutes: 2,
      detentionClaimsPerDay: 3.125,
      detentionCostPerClaim: 75,
      detentionReductionShare: 0.25,
      annualSubscriptionPerFacility: 10000,
    },
    withoutDrops: {
      label: 'Facilities w/o drops',
      facilityCount: 15,
      shipmentsPerDay: 40,
      operatingDaysPerYear: 300,
      marginPerShipment: 1000,
      costPerShipment: 1000,
      dockOfficeHeadcountPerShift: 1,
      dockOfficeShiftsPerDay: 1,
      dockOfficeTimeOnDriverProcessShare: 0.35,
      dockOfficeTimeSavingsShare: 0.5,
      dockOfficeFteAnnualCost: 60000,
      spotterHeadcountPerShift: 0,
      spotterShiftsPerDay: 0,
      spotterEfficiencyGainShare: 0.2,
      spotterFteAnnualCost: 60000,
      dropEligibleShipmentsPerDay: 40,
      dropEligibleOperatingDaysPerYear: 250,
      transitionToDropsShare: 0.33,
      baselineCycleMinutes: 60,
      improvedCycleMinutes: 59,
      baseLevelCycleMinutes: 54,
      carrierBenchmarkThroughputShare: 0.025,
      facilityBenchmarkThroughputShare: 0.025,
      optimizedCycleMinutes: 51,
      baselineCheckinMinutes: 4,
      baselineCheckoutMinutes: 5,
      ymsCheckinMinutes: 3,
      ymsCheckoutMinutes: 5,
      frCheckinMinutes: 1,
      frCheckoutMinutes: 2,
      detentionClaimsPerDay: 1,
      detentionCostPerClaim: 75,
      detentionReductionShare: 0.25,
      annualSubscriptionPerFacility: 5000,
    },
  },
  global: {
    pagesPerShipment: 4,
    costPerPage: 0.1,
    phase1DigitizedShare: 1,
    detentionClaimsPerShipmentShare: 0.025,
    realizedShareOfTheoreticalThroughputGain: 0.2,
    trailerPoolOptimizationDropGainShare: 0.01,
    liveShipmentPremiumToDropShare: 0.15,
    panicShipmentsShare: 0.01,
    panicShipmentPremiumShare: 0.33,
    driverFamiliarityThroughputShare: 0.01,
    implementationPerFacility: 2500,
    yearOneRampShare: 0.65,
  },
};

export function createDefaultROIEngineInputs(): ROIEngineInputs {
  return structuredClone(PUBLIC_ROI_DEFAULTS);
}

function clampShare(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampPositive(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function safeDivide(value: number, divisor: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor === 0) return 0;
  return value / divisor;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) return '$0';

  const absolute = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absolute >= 1_000_000) {
    return `${sign}$${parseFloat((absolute / 1_000_000).toFixed(1))}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}$${parseFloat((absolute / 1_000).toFixed(1))}K`;
  }

  if (absolute === 0) {
    return '$0';
  }

  return `${sign}$${Math.round(absolute).toLocaleString()}`;
}

function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  return value > 0 ? `+${formatCurrencyCompact(value)}` : formatCurrencyCompact(value);
}

function formatRatio(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(1)}x`;
}

function formatMonths(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(1)} mo`;
}

function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'N/A';
  return `${Math.trunc(value)}%`;
}

function buildAssumptionNoteValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  }

  return unit ? `${value} ${unit}` : value;
}

function applyArchetypeAssumption(
  archetype: ROIEngineArchetypeInputs,
  override: ROIArchetypeAssumptions,
): ROIEngineArchetypeInputs {
  const next = { ...archetype };

  if (override.dcFteCount != null) {
    next.dockOfficeHeadcountPerShift = clampPositive(override.dcFteCount);
  }

  if (override.dcShifts != null) {
    next.dockOfficeShiftsPerDay = clampPositive(override.dcShifts);
  }

  if (override.spotterFteCount != null) {
    next.spotterHeadcountPerShift = clampPositive(override.spotterFteCount);
  }

  if (override.spotterShifts != null) {
    next.spotterShiftsPerDay = clampPositive(override.spotterShifts);
  }

  if (override.shipmentsPerDay != null) {
    const shipmentsPerDay = clampPositive(override.shipmentsPerDay);
    next.shipmentsPerDay = shipmentsPerDay;
    next.dropEligibleShipmentsPerDay = shipmentsPerDay;
  }

  if (override.avgCycleTimeMinutes != null) {
    next.baselineCycleMinutes = clampPositive(override.avgCycleTimeMinutes);
  }

  if (override.annualFteCost != null) {
    const annualFteCost = clampPositive(override.annualFteCost);
    next.dockOfficeFteAnnualCost = annualFteCost;
    next.spotterFteAnnualCost = annualFteCost;
  }

  return next;
}

export function buildROIEngineInputs(model?: AccountROIModel): ROIEngineInputs {
  const inputs = createDefaultROIEngineInputs();

  if (!model) {
    return inputs;
  }

  if (model.averageMarginPerShipment != null) {
    for (const archetypeId of Object.keys(inputs.archetypes) as ROIArchetypeId[]) {
      inputs.archetypes[archetypeId].marginPerShipment = clampPositive(model.averageMarginPerShipment);
      inputs.archetypes[archetypeId].costPerShipment = clampPositive(model.averageMarginPerShipment);
    }
  }

  if (model.facilityMix.length > 0) {
    for (const archetypeId of Object.keys(inputs.archetypes) as ROIArchetypeId[]) {
      inputs.archetypes[archetypeId].facilityCount = 0;
    }

    for (const facilityMix of model.facilityMix) {
      const archetypeId = SCHEMA_TO_ENGINE_ARCHETYPE[facilityMix.archetype];
      inputs.archetypes[archetypeId].facilityCount = Math.max(0, Math.round(facilityMix.facilityCount));
    }
  }

  for (const override of model.archetypeAssumptions ?? []) {
    const archetypeId = SCHEMA_TO_ENGINE_ARCHETYPE[override.archetype];
    inputs.archetypes[archetypeId] = applyArchetypeAssumption(inputs.archetypes[archetypeId], override);
  }

  return inputs;
}

export function computeROIModel(inputs: ROIEngineInputs): ROIModelComputation {
  const normalized: ROIEngineInputs = {
    archetypes: {
      withYms: normalizeArchetype(inputs.archetypes.withYms),
      dropsNoYms: normalizeArchetype(inputs.archetypes.dropsNoYms),
      withoutDrops: normalizeArchetype(inputs.archetypes.withoutDrops),
    },
    global: {
      pagesPerShipment: clampPositive(inputs.global.pagesPerShipment),
      costPerPage: clampPositive(inputs.global.costPerPage),
      phase1DigitizedShare: clampShare(inputs.global.phase1DigitizedShare),
      detentionClaimsPerShipmentShare: clampShare(inputs.global.detentionClaimsPerShipmentShare),
      realizedShareOfTheoreticalThroughputGain: clampShare(inputs.global.realizedShareOfTheoreticalThroughputGain),
      trailerPoolOptimizationDropGainShare: clampShare(inputs.global.trailerPoolOptimizationDropGainShare),
      liveShipmentPremiumToDropShare: clampShare(inputs.global.liveShipmentPremiumToDropShare),
      panicShipmentsShare: clampShare(inputs.global.panicShipmentsShare),
      panicShipmentPremiumShare: clampShare(inputs.global.panicShipmentPremiumShare),
      driverFamiliarityThroughputShare: clampShare(inputs.global.driverFamiliarityThroughputShare),
      implementationPerFacility: clampPositive(inputs.global.implementationPerFacility),
      yearOneRampShare: clampShare(inputs.global.yearOneRampShare),
    },
  };

  const archetypeBreakdown = {
    withYms: buildArchetypeComputation(normalized, 'withYms'),
    dropsNoYms: buildArchetypeComputation(normalized, 'dropsNoYms'),
    withoutDrops: buildArchetypeComputation(normalized, 'withoutDrops'),
  } satisfies Record<ROIArchetypeId, ROIArchetypeComputation>;

  const totalFacilities = sum(
    (Object.keys(normalized.archetypes) as ROIArchetypeId[]).map(
      (archetypeId) => normalized.archetypes[archetypeId].facilityCount,
    ),
  );
  const annualShipments = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].annualShipments,
    ),
  );
  const weightedMarginNumerator = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) =>
        archetypeBreakdown[archetypeId].annualShipments * normalized.archetypes[archetypeId].marginPerShipment,
    ),
  );
  const weightedBaselineNumerator = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) =>
        archetypeBreakdown[archetypeId].annualShipments * normalized.archetypes[archetypeId].baselineCycleMinutes,
    ),
  );
  const weightedOptimizedNumerator = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) =>
        archetypeBreakdown[archetypeId].annualShipments * normalized.archetypes[archetypeId].optimizedCycleMinutes,
    ),
  );

  const paperSavingsAnnual =
    annualShipments * normalized.global.pagesPerShipment * normalized.global.costPerPage * normalized.global.phase1DigitizedShare;
  const dcLaborSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].dockLaborSavingsAnnual,
    ),
  );
  const spotterLaborSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].spotterLaborSavingsAnnual,
    ),
  );
  const laborSavingsAnnual = dcLaborSavingsAnnual + spotterLaborSavingsAnnual;
  const detentionSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].detentionSavingsAnnual,
    ),
  );
  const throughputProfitImpactAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].throughputProfitImpactAnnual,
    ),
  );
  const transitionToDropsSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].transitionToDropsSavingsAnnual,
    ),
  );
  const trailerPoolSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].trailerPoolSavingsAnnual,
    ),
  );
  const panicShipmentSavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].panicShipmentSavingsAnnual,
    ),
  );
  const driverFamiliaritySavingsAnnual = sum(
    (Object.keys(archetypeBreakdown) as ROIArchetypeId[]).map(
      (archetypeId) => archetypeBreakdown[archetypeId].driverFamiliaritySavingsAnnual,
    ),
  );
  const standardizationSavingsAnnual = trailerPoolSavingsAnnual + panicShipmentSavingsAnnual;
  const baseSavingsAnnual = paperSavingsAnnual + laborSavingsAnnual + detentionSavingsAnnual + standardizationSavingsAnnual;
  const totalValueAnnual = baseSavingsAnnual + throughputProfitImpactAnnual;
  const annualSubscription = sum(
    (Object.keys(normalized.archetypes) as ROIArchetypeId[]).map(
      (archetypeId) =>
        normalized.archetypes[archetypeId].facilityCount * normalized.archetypes[archetypeId].annualSubscriptionPerFacility,
    ),
  );
  const implementationOneTime = totalFacilities * normalized.global.implementationPerFacility;
  const year1GrossSavings = totalValueAnnual * normalized.global.yearOneRampShare;
  const year1NetGain = year1GrossSavings - annualSubscription - implementationOneTime;
  const paybackBaseMonthlyValue = (baseSavingsAnnual - annualSubscription) / 12;
  const paybackMonths =
    paybackBaseMonthlyValue > 0
      ? Math.max(0.1, safeDivide(implementationOneTime, paybackBaseMonthlyValue))
      : null;
  const fiveYearValue =
    year1GrossSavings - annualSubscription - implementationOneTime +
    sum(Array.from({ length: 4 }, (_, index) => totalValueAnnual * Math.pow(1.02, index + 1) - annualSubscription));
  const weightedMarginPerShipment = safeDivide(weightedMarginNumerator, annualShipments);
  const weightedBaselineCycleMinutes = safeDivide(weightedBaselineNumerator, annualShipments);
  const weightedOptimizedCycleMinutes = safeDivide(weightedOptimizedNumerator, annualShipments);
  const realizedThroughputGainShare =
    weightedBaselineCycleMinutes > 0 && weightedOptimizedCycleMinutes > 0
      ? (safeDivide(weightedBaselineCycleMinutes, weightedOptimizedCycleMinutes) - 1) *
        normalized.global.realizedShareOfTheoreticalThroughputGain
      : 0;

  return {
    archetypeBreakdown,
    totalFacilities,
    annualShipments,
    paperSavingsAnnual,
    dcLaborSavingsAnnual,
    spotterLaborSavingsAnnual,
    laborSavingsAnnual,
    detentionSavingsAnnual,
    throughputProfitImpactAnnual,
    standardizationSavingsAnnual,
    transitionToDropsSavingsAnnual,
    trailerPoolSavingsAnnual,
    panicShipmentSavingsAnnual,
    driverFamiliaritySavingsAnnual,
    baseSavingsAnnual,
    totalValueAnnual,
    annualSubscription,
    implementationOneTime,
    year1GrossSavings,
    year1NetGain,
    roiPercentYear1:
      annualSubscription + implementationOneTime > 0
        ? (year1NetGain / (annualSubscription + implementationOneTime)) * 100
        : null,
    paybackMonths,
    fiveYearValue,
    paperCoversSubscription: paperSavingsAnnual >= annualSubscription,
    paperToSubscriptionRatio: annualSubscription > 0 ? paperSavingsAnnual / annualSubscription : 0,
    weightedMarginPerShipment,
    weightedBaselineCycleMinutes,
    weightedOptimizedCycleMinutes,
    realizedThroughputGainShare,
    modelVersion: 'ROI Calculator V2 public contract',
  };
}

export function buildROIDashboard(model?: AccountROIModel): ROIDashboard {
  const inputs = buildROIEngineInputs(model);
  const computation = computeROIModel(inputs);
  const archetypeIds = Object.keys(inputs.archetypes) as ROIArchetypeId[];

  const archetypes = archetypeIds.reduce<Record<ROIArchetypeId, ROIDashboardArchetype>>((accumulator, archetypeId) => {
    const archetypeInput = inputs.archetypes[archetypeId];
    const computationForArchetype = computation.archetypeBreakdown[archetypeId];
    const annualShipmentsShare = computation.annualShipments > 0
      ? computationForArchetype.annualShipments / computation.annualShipments
      : 0;

    const hardSavings = {
      paper: computation.paperSavingsAnnual * annualShipmentsShare,
      spotterEfficiency: computationForArchetype.spotterLaborSavingsAnnual,
      dcLaborEfficiency: computationForArchetype.dockLaborSavingsAnnual,
      detention: computationForArchetype.detentionSavingsAnnual,
      dropTrailerOpportunity: computationForArchetype.transitionToDropsSavingsAnnual,
      total:
        computation.paperSavingsAnnual * annualShipmentsShare +
        computationForArchetype.spotterLaborSavingsAnnual +
        computationForArchetype.dockLaborSavingsAnnual +
        computationForArchetype.detentionSavingsAnnual +
        computationForArchetype.transitionToDropsSavingsAnnual,
    };

    const tieredThroughput = buildTieredThroughput(archetypeId, inputs, computation);
    const legacyYms = buildLegacyYms(archetypeId, inputs, computation);

    accumulator[archetypeId] = {
      id: archetypeId,
      label: archetypeInput.label,
      facilityCount: archetypeInput.facilityCount,
      annualShipments: computationForArchetype.annualShipments,
      hardSavings,
      tieredThroughput,
      legacyYms,
      yfCostPerYear: archetypeInput.facilityCount * archetypeInput.annualSubscriptionPerFacility,
      assumptions: {
        dcFtesPerShift: archetypeInput.dockOfficeHeadcountPerShift,
        dcShifts: archetypeInput.dockOfficeShiftsPerDay,
        spotterFtesPerShift: archetypeInput.spotterHeadcountPerShift,
        spotterShifts: archetypeInput.spotterShiftsPerDay,
        shipmentsPerDay: archetypeInput.shipmentsPerDay,
        avgCycleTimeMinutes: archetypeInput.baselineCycleMinutes,
        annualFteCost: archetypeInput.dockOfficeFteAnnualCost,
      },
    };

    return accumulator;
  }, {} as Record<ROIArchetypeId, ROIDashboardArchetype>);

  const totalSavings = {
    hardSavings: computation.paperSavingsAnnual + computation.laborSavingsAnnual + computation.detentionSavingsAnnual,
    throughput: computation.throughputProfitImpactAnnual,
    standardization: computation.standardizationSavingsAnnual,
    total:
      computation.paperSavingsAnnual +
      computation.laborSavingsAnnual +
      computation.detentionSavingsAnnual +
      computation.throughputProfitImpactAnnual +
      computation.standardizationSavingsAnnual,
  };

  const highLevelStats = buildHighLevelStats(computation);
  const existingYms = {
    hardSavings: archetypes.withYms.legacyYms.hardSavingsTotal,
    standardization: 0,
    throughput: archetypes.withYms.legacyYms.throughput,
    total: archetypes.withYms.legacyYms.hardSavingsTotal + archetypes.withYms.legacyYms.throughput,
  };
  const yardFlow = {
    hardSavings: archetypeIds.reduce(
      (total, archetypeId) => total + (archetypes[archetypeId].hardSavings.total - archetypes[archetypeId].hardSavings.paper),
      0,
    ),
    standardization: totalSavings.standardization,
    throughput: archetypeIds.reduce((total, archetypeId) => total + archetypes[archetypeId].tieredThroughput.total, 0),
    total: 0,
  };
  yardFlow.total = yardFlow.hardSavings + yardFlow.standardization + yardFlow.throughput;

  return {
    highLevelStats,
    archetypes,
    totalSavings,
    comparison: {
      existingYms,
      yardFlow,
      multiplier: existingYms.total > 0 ? yardFlow.total / existingYms.total : 0,
    },
    totalFacilities: computation.totalFacilities,
    annualShipments: computation.annualShipments,
    annualSubscription: computation.annualSubscription,
    implementationOneTime: computation.implementationOneTime,
    fiveYearValue: computation.fiveYearValue,
    inputs,
    modelVersion: computation.modelVersion,
  };
}

export function buildROISectionFromModel(
  section: ROISection,
  accountName: string,
  model: AccountROIModel,
): ROISection {
  const dashboard = buildROIDashboard(model);
  const methodologyParts = [
    section.methodology,
    `Calculator: ${dashboard.modelVersion}.`,
    model.scenarioLabel ? `Scenario: ${model.scenarioLabel}.` : null,
    'Modeled estimates vary by facility mix and operating assumptions.',
  ].filter(Boolean);

  return {
    ...section,
    modelingMode: 'engine',
    roiLines: [
      {
        label: 'Legacy YMS annual value',
        before: formatCurrencyCompact(dashboard.comparison.existingYms.total),
        after: formatCurrencyCompact(dashboard.comparison.yardFlow.total),
        delta: formatDelta(dashboard.comparison.yardFlow.total - dashboard.comparison.existingYms.total),
        unit: 'annual value',
      },
      {
        label: 'Hard savings opportunity',
        before: formatCurrencyCompact(dashboard.comparison.existingYms.hardSavings),
        after: formatCurrencyCompact(dashboard.comparison.yardFlow.hardSavings),
        delta: formatDelta(dashboard.comparison.yardFlow.hardSavings - dashboard.comparison.existingYms.hardSavings),
        unit: 'annual',
      },
      {
        label: 'Throughput value',
        before: formatCurrencyCompact(dashboard.comparison.existingYms.throughput),
        after: formatCurrencyCompact(dashboard.comparison.yardFlow.throughput),
        delta: formatDelta(dashboard.comparison.yardFlow.throughput - dashboard.comparison.existingYms.throughput),
        unit: 'annual',
      },
      {
        label: 'Standardization opportunity',
        before: '$0',
        after: formatCurrencyCompact(dashboard.comparison.yardFlow.standardization),
        delta: formatDelta(dashboard.comparison.yardFlow.standardization),
        unit: 'annual',
      },
    ],
    headlineStats: buildHeadlineStats(dashboard),
    archetypeBreakdowns: buildArchetypeBreakdowns(dashboard),
    totalValueComparison: buildTotalValueComparison(dashboard),
    assumptionNotes: buildAssumptionNotes(model),
    sourceNotes: model.sourceNotes,
    totalAnnualSavings: formatCurrencyCompact(dashboard.comparison.yardFlow.total),
    paybackPeriod: formatMonths(dashboard.highLevelStats.paybackAllSavingsMonths),
    methodology: methodologyParts.join(' '),
    narrative: model.scenarioLabel ? `${section.narrative} ${model.scenarioLabel}.` : section.narrative,
  };
}

const ROI_STUB_BASE: ROISection = {
  type: 'roi',
  sectionLabel: 'The Business Case',
  headline: 'Modeled annual value',
  narrative:
    'Engine-backed ROI from the live calculator using the account\'s archetype mix and operating assumptions.',
  roiLines: [],
};

export function materializeMicrositeSections(
  data: Pick<AccountMicrositeData, 'accountName' | 'roiModel'>,
  sections: MicrositeSection[],
): MicrositeSection[] {
  const roiModel = data.roiModel;

  if (!roiModel) {
    return sections;
  }

  const hasRoi = sections.some((section) => section.type === 'roi');

  if (!hasRoi) {
    return [
      ...sections,
      buildROISectionFromModel(ROI_STUB_BASE, data.accountName, roiModel),
    ];
  }

  return sections.map((section) =>
    section.type === 'roi'
      ? buildROISectionFromModel(section, data.accountName, roiModel)
      : section,
  );
}

function normalizeArchetype(archetype: ROIEngineArchetypeInputs): ROIEngineArchetypeInputs {
  return {
    ...archetype,
    facilityCount: Math.max(0, Math.round(archetype.facilityCount)),
    shipmentsPerDay: clampPositive(archetype.shipmentsPerDay),
    operatingDaysPerYear: Math.max(0, Math.round(archetype.operatingDaysPerYear)),
    marginPerShipment: clampPositive(archetype.marginPerShipment),
    costPerShipment: clampPositive(archetype.costPerShipment),
    dockOfficeHeadcountPerShift: clampPositive(archetype.dockOfficeHeadcountPerShift),
    dockOfficeShiftsPerDay: clampPositive(archetype.dockOfficeShiftsPerDay),
    dockOfficeTimeOnDriverProcessShare: clampShare(archetype.dockOfficeTimeOnDriverProcessShare),
    dockOfficeTimeSavingsShare: clampShare(archetype.dockOfficeTimeSavingsShare),
    dockOfficeFteAnnualCost: clampPositive(archetype.dockOfficeFteAnnualCost),
    spotterHeadcountPerShift: clampPositive(archetype.spotterHeadcountPerShift),
    spotterShiftsPerDay: clampPositive(archetype.spotterShiftsPerDay),
    spotterEfficiencyGainShare: clampShare(archetype.spotterEfficiencyGainShare),
    spotterFteAnnualCost: clampPositive(archetype.spotterFteAnnualCost),
    dropEligibleShipmentsPerDay: clampPositive(archetype.dropEligibleShipmentsPerDay),
    dropEligibleOperatingDaysPerYear: Math.max(0, Math.round(archetype.dropEligibleOperatingDaysPerYear)),
    transitionToDropsShare: clampShare(archetype.transitionToDropsShare),
    baselineCycleMinutes: clampPositive(archetype.baselineCycleMinutes),
    improvedCycleMinutes: clampPositive(archetype.improvedCycleMinutes),
    baseLevelCycleMinutes: clampPositive(archetype.baseLevelCycleMinutes),
    carrierBenchmarkThroughputShare: clampShare(archetype.carrierBenchmarkThroughputShare),
    facilityBenchmarkThroughputShare: clampShare(archetype.facilityBenchmarkThroughputShare),
    optimizedCycleMinutes: clampPositive(archetype.optimizedCycleMinutes),
    baselineCheckinMinutes: clampPositive(archetype.baselineCheckinMinutes),
    baselineCheckoutMinutes: clampPositive(archetype.baselineCheckoutMinutes),
    ymsCheckinMinutes: clampPositive(archetype.ymsCheckinMinutes),
    ymsCheckoutMinutes: clampPositive(archetype.ymsCheckoutMinutes),
    frCheckinMinutes: clampPositive(archetype.frCheckinMinutes),
    frCheckoutMinutes: clampPositive(archetype.frCheckoutMinutes),
    detentionClaimsPerDay: clampPositive(archetype.detentionClaimsPerDay),
    detentionCostPerClaim: clampPositive(archetype.detentionCostPerClaim),
    detentionReductionShare: clampShare(archetype.detentionReductionShare),
    annualSubscriptionPerFacility: clampPositive(archetype.annualSubscriptionPerFacility),
  };
}

function buildArchetypeComputation(inputs: ROIEngineInputs, archetypeId: ROIArchetypeId): ROIArchetypeComputation {
  const archetype = inputs.archetypes[archetypeId];
  const annualShipments = archetype.facilityCount * archetype.shipmentsPerDay * archetype.operatingDaysPerYear;
  const dropEligibleAnnualShipments =
    archetype.facilityCount * archetype.dropEligibleShipmentsPerDay * archetype.dropEligibleOperatingDaysPerYear;
  const dockLaborSavingsAnnual =
    archetype.facilityCount *
    archetype.dockOfficeHeadcountPerShift *
    archetype.dockOfficeShiftsPerDay *
    archetype.dockOfficeTimeOnDriverProcessShare *
    archetype.dockOfficeTimeSavingsShare *
    archetype.dockOfficeFteAnnualCost;
  const spotterLaborSavingsAnnual =
    archetype.facilityCount *
    archetype.spotterHeadcountPerShift *
    archetype.spotterShiftsPerDay *
    archetype.spotterEfficiencyGainShare *
    archetype.spotterFteAnnualCost;
  const optimizedCycleMinutes = Math.max(0.0001, archetype.optimizedCycleMinutes);
  const baseLevelCycleMinutes = Math.max(0.0001, archetype.baseLevelCycleMinutes);
  const throughputProfitImpactAnnual =
    annualShipments *
      Math.max(0, safeDivide(archetype.baselineCycleMinutes, baseLevelCycleMinutes) - 1) *
      inputs.global.realizedShareOfTheoreticalThroughputGain *
      archetype.marginPerShipment +
    annualShipments *
      Math.max(
        0,
        safeDivide(
          baseLevelCycleMinutes - archetype.baselineCheckinMinutes,
          Math.max(0.0001, optimizedCycleMinutes - archetype.baselineCheckinMinutes),
        ) - 1,
      ) *
      inputs.global.realizedShareOfTheoreticalThroughputGain *
      archetype.marginPerShipment;
  const transitionToDropsSavingsAnnual =
    dropEligibleAnnualShipments *
    archetype.transitionToDropsShare *
    archetype.costPerShipment *
    inputs.global.trailerPoolOptimizationDropGainShare;
  const trailerPoolSavingsAnnual =
    annualShipments *
    inputs.global.trailerPoolOptimizationDropGainShare *
    archetype.costPerShipment *
    inputs.global.liveShipmentPremiumToDropShare;
  const panicShipmentSavingsAnnual =
    annualShipments *
    inputs.global.panicShipmentsShare *
    archetype.costPerShipment *
    inputs.global.panicShipmentPremiumShare;
  const driverFamiliaritySavingsAnnual =
    annualShipments * inputs.global.driverFamiliarityThroughputShare * archetype.marginPerShipment;
  const detentionSavingsAnnual =
    archetype.facilityCount *
    archetype.detentionClaimsPerDay *
    archetype.operatingDaysPerYear *
    archetype.detentionCostPerClaim *
    archetype.detentionReductionShare;

  return {
    annualShipments,
    dropEligibleAnnualShipments,
    dockLaborSavingsAnnual,
    spotterLaborSavingsAnnual,
    throughputProfitImpactAnnual,
    transitionToDropsSavingsAnnual,
    trailerPoolSavingsAnnual,
    panicShipmentSavingsAnnual,
    driverFamiliaritySavingsAnnual,
    detentionSavingsAnnual,
  };
}

function buildTieredThroughput(
  archetypeId: ROIArchetypeId,
  inputs: ROIEngineInputs,
  computation: ROIModelComputation,
): ROIDashboardArchetype['tieredThroughput'] {
  const archetype = inputs.archetypes[archetypeId];
  const annualShipments = computation.archetypeBreakdown[archetypeId].annualShipments;
  const realizedShare = inputs.global.realizedShareOfTheoreticalThroughputGain;
  const marginPerShipment = archetype.marginPerShipment;

  function baselineTier(targetCycleMinutes: number): number {
    if (targetCycleMinutes <= 0 || archetype.baselineCycleMinutes <= 0) return 0;
    return (
      annualShipments *
      Math.max(0, safeDivide(archetype.baselineCycleMinutes, targetCycleMinutes) - 1) *
      realizedShare *
      marginPerShipment
    );
  }

  const ymsBaseline = archetypeId === 'withYms' ? baselineTier(archetype.improvedCycleMinutes) : 0;
  const driverJourney = Math.max(0, baselineTier(archetype.baseLevelCycleMinutes) - ymsBaseline);
  const systemwideOptimization =
    annualShipments *
    Math.max(
      0,
      safeDivide(
        archetype.baseLevelCycleMinutes - archetype.baselineCheckinMinutes,
        Math.max(0.0001, archetype.optimizedCycleMinutes - archetype.baselineCheckinMinutes),
      ) - 1,
    ) *
    realizedShare *
    marginPerShipment;

  return {
    ymsBaseline,
    driverJourney,
    systemwideOptimization,
    total: ymsBaseline + driverJourney + systemwideOptimization,
  };
}

function buildLegacyYms(
  archetypeId: ROIArchetypeId,
  inputs: ROIEngineInputs,
  computation: ROIModelComputation,
): ROIDashboardArchetype['legacyYms'] {
  const archetype = inputs.archetypes[archetypeId];
  const computationForArchetype = computation.archetypeBreakdown[archetypeId];
  const isWithYms = archetypeId === 'withYms';
  const spotterSavings = isWithYms ? computationForArchetype.spotterLaborSavingsAnnual : 0;
  const detentionSavings = isWithYms ? computationForArchetype.detentionSavingsAnnual : 0;

  let throughput = 0;
  if (isWithYms && archetype.improvedCycleMinutes > 0 && archetype.baselineCycleMinutes > 0) {
    const cycleImprovement = Math.max(0, safeDivide(archetype.baselineCycleMinutes, archetype.improvedCycleMinutes) - 1);
    throughput =
      computationForArchetype.annualShipments *
      cycleImprovement *
      inputs.global.realizedShareOfTheoreticalThroughputGain *
      archetype.marginPerShipment;
  }

  return {
    spotterSavings,
    detentionSavings,
    hardSavingsTotal: spotterSavings + detentionSavings,
    throughput,
    costPerYear: 30000 * archetype.facilityCount,
  };
}

function buildHighLevelStats(computation: ROIModelComputation): ROIHighLevelStats {
  const upfrontCost = 0.5 * computation.annualSubscription + computation.implementationOneTime;
  const yearOneIncrementalHardSavings =
    computation.paperSavingsAnnual + computation.laborSavingsAnnual + computation.detentionSavingsAnnual;
  const withYmsLegacyHardSavings =
    computation.archetypeBreakdown.withYms.spotterLaborSavingsAnnual +
    computation.archetypeBreakdown.withYms.detentionSavingsAnnual;
  const costOfInactionPerMonth = (yearOneIncrementalHardSavings - withYmsLegacyHardSavings) / 12;

  function interpolatePayback(monthlySavings: number): number | null {
    if (monthlySavings <= 0) return null;

    let cumulative = -upfrontCost;

    for (let month = 1; month <= 120; month += 1) {
      let inflow = 0;

      if (month > 3 && month <= 12) {
        inflow = (monthlySavings * (month - 3)) / 9;
      } else if (month > 12) {
        inflow = monthlySavings;
      }

      const nextCumulative = cumulative + inflow;
      if (nextCumulative >= 0 && cumulative < 0) {
        return month - 1 + Math.abs(cumulative) / (Math.abs(cumulative) + nextCumulative);
      }

      cumulative = nextCumulative;
    }

    return null;
  }

  const paybackHardSavingsMonths = interpolatePayback(costOfInactionPerMonth);
  const paybackAllSavingsMonths = interpolatePayback(computation.totalValueAnnual / 12);
  const yearOneHardSavingsCapture = 12 * costOfInactionPerMonth * (5 / 12);

  return {
    paybackHardSavingsMonths,
    paybackAllSavingsMonths,
    netYear1Gain: yearOneHardSavingsCapture - upfrontCost,
    costOfInactionPerMonth,
    year1Roi:
      computation.annualSubscription > 0
        ? ((yearOneHardSavingsCapture - computation.annualSubscription) / computation.annualSubscription) * 100
        : null,
  };
}

function buildHeadlineStats(dashboard: ROIDashboard): ROIHeadlineStat[] {
  return [
    {
      id: 'payback-hard-savings',
      label: 'Payback (Hard Savings)',
      value: formatMonths(dashboard.highLevelStats.paybackHardSavingsMonths),
    },
    {
      id: 'payback-all-savings',
      label: 'Payback (All Savings)',
      value: formatMonths(dashboard.highLevelStats.paybackAllSavingsMonths),
    },
    {
      id: 'net-year-1-gain',
      label: 'Net Year 1 Gain',
      value: formatCurrencyCompact(dashboard.highLevelStats.netYear1Gain),
    },
    {
      id: 'cost-of-inaction',
      label: 'Cost Of Inaction',
      value: `${formatCurrencyCompact(dashboard.highLevelStats.costOfInactionPerMonth)}/mo`,
    },
    {
      id: 'year-one-roi',
      label: 'Year 1 ROI',
      value: formatPercent(dashboard.highLevelStats.year1Roi),
    },
    {
      id: 'value-multiple',
      label: 'Value Vs Legacy YMS',
      value: formatRatio(dashboard.comparison.multiplier),
    },
  ];
}

function buildArchetypeBreakdowns(dashboard: ROIDashboard): ROIArchetypeBreakdown[] {
  const archetypeIds = Object.keys(dashboard.archetypes) as ROIArchetypeId[];

  return archetypeIds.map((archetypeId) => {
    const archetype = dashboard.archetypes[archetypeId];

    return {
      archetype: ENGINE_TO_SCHEMA_ARCHETYPE[archetypeId],
      facilityCount: archetype.facilityCount,
      headline: ARCHETYPE_TITLE[archetypeId],
      yardflowCostPerYear: formatCurrencyCompact(archetype.yfCostPerYear),
      yardflowSavingsPerYear: formatCurrencyCompact(archetype.hardSavings.total),
      legacyYmsCostPerYear:
        archetype.legacyYms.costPerYear > 0 ? formatCurrencyCompact(archetype.legacyYms.costPerYear) : undefined,
      legacyYmsSavingsPerYear:
        archetype.legacyYms.hardSavingsTotal > 0
          ? formatCurrencyCompact(archetype.legacyYms.hardSavingsTotal)
          : undefined,
      returnMultiple:
        archetype.yfCostPerYear > 0 ? formatRatio(archetype.hardSavings.total / archetype.yfCostPerYear) : undefined,
      hardSavingsLines: buildHardSavingsLines(archetype),
      throughputLines: buildThroughputLines(archetype),
    };
  });
}

function buildHardSavingsLines(archetype: ROIDashboardArchetype): ROIValueBreakdownLine[] {
  const lines: Array<{ label: string; value: number; category: ROIValueBreakdownLine['category'] }> = [
    { label: 'Paper', value: archetype.hardSavings.paper, category: 'paper' },
    { label: 'Spotter Efficiency', value: archetype.hardSavings.spotterEfficiency, category: 'spotter' },
    { label: 'DC Labor Efficiency', value: archetype.hardSavings.dcLaborEfficiency, category: 'dc-labor' },
    { label: 'Detention', value: archetype.hardSavings.detention, category: 'detention' },
    { label: 'Drop Trailer Opportunity', value: archetype.hardSavings.dropTrailerOpportunity, category: 'drop-trailer' },
  ];

  return lines
    .filter((line) => line.value > 0)
    .map((line) => ({
      label: line.label,
      value: formatCurrencyCompact(line.value),
      category: line.category,
    }));
}

function buildThroughputLines(archetype: ROIDashboardArchetype): ROIValueBreakdownLine[] {
  const lines: Array<{ label: string; value: number; category: ROIValueBreakdownLine['category'] }> = [
    { label: 'Base Improvement', value: archetype.tieredThroughput.ymsBaseline, category: 'throughput' },
    { label: 'Driver Journey', value: archetype.tieredThroughput.driverJourney, category: 'driver-journey' },
    {
      label: 'Systemwide Optimization',
      value: archetype.tieredThroughput.systemwideOptimization,
      category: 'systemwide-optimization',
    },
  ];

  return lines
    .filter((line) => line.value > 0)
    .map((line) => ({
      label: line.label,
      value: formatCurrencyCompact(line.value),
      category: line.category,
    }));
}

function buildTotalValueComparison(dashboard: ROIDashboard): ROITotalValueComparison {
  return {
    legacyYmsAnnualValue: formatCurrencyCompact(dashboard.comparison.existingYms.total),
    yardflowAnnualValue: formatCurrencyCompact(dashboard.comparison.yardFlow.total),
    valueMultiple: formatRatio(dashboard.comparison.multiplier),
  };
}

function buildAssumptionNotes(model: AccountROIModel): ROISourceNote[] {
  return (model.accountAssumptions ?? []).map((assumption, index) => {
    const linkedSource = model.sourceNotes?.find((sourceNote) => sourceNote.id === assumption.sourceNoteId);

    return {
      id: `assumption-${index}`,
      label: assumption.label,
      detail: buildAssumptionNoteValue(assumption.value, assumption.unit),
      confidence: linkedSource?.confidence ?? 'estimated',
      citation: linkedSource?.citation,
    };
  });
}