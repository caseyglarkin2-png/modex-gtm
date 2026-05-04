import { COVERAGE_GATE_THRESHOLDS_V1, type CoverageGateThresholds } from '@/lib/revops/sprint11-contracts';

export type CoverageCounts = {
  tamCompanies: number;
  tamContacts: number;
  importedCompanies: number;
  linkedContacts: number;
  enrichedContacts: number;
  sendReadyContacts: number;
  attributableContacts: number;
  unresolvedConflicts: number;
  staleContacts: number;
};

export type CoverageRatios = {
  companiesImportedPct: number;
  contactsLinkedPct: number;
  contactsEnrichedPct: number;
  sendReadyPct: number;
  attributablePct: number;
  unresolvedConflictPct: number;
  staleContactPct: number;
};

export type CoverageGateResult = {
  pass: boolean;
  ratios: CoverageRatios;
  failedRules: string[];
};

function safeDiv(top: number, bottom: number): number {
  if (bottom <= 0) return 0;
  return top / bottom;
}

export function computeCoverageRatios(counts: CoverageCounts): CoverageRatios {
  return {
    companiesImportedPct: safeDiv(counts.importedCompanies, counts.tamCompanies),
    contactsLinkedPct: safeDiv(counts.linkedContacts, counts.tamContacts),
    contactsEnrichedPct: safeDiv(counts.enrichedContacts, counts.tamContacts),
    sendReadyPct: safeDiv(counts.sendReadyContacts, counts.tamContacts),
    attributablePct: safeDiv(counts.attributableContacts, counts.tamContacts),
    unresolvedConflictPct: safeDiv(counts.unresolvedConflicts, counts.tamContacts),
    staleContactPct: safeDiv(counts.staleContacts, counts.tamContacts),
  };
}

export function evaluateCoverageGate(
  counts: CoverageCounts,
  thresholds: CoverageGateThresholds = COVERAGE_GATE_THRESHOLDS_V1,
): CoverageGateResult {
  const ratios = computeCoverageRatios(counts);
  const failedRules: string[] = [];
  if (ratios.companiesImportedPct < thresholds.minCompaniesImportedPct) failedRules.push('companies_imported_below_min');
  if (ratios.contactsLinkedPct < thresholds.minContactsLinkedPct) failedRules.push('contacts_linked_below_min');
  if (ratios.contactsEnrichedPct < thresholds.minContactsEnrichedPct) failedRules.push('contacts_enriched_below_min');
  if (ratios.sendReadyPct < thresholds.minSendReadyPct) failedRules.push('send_ready_below_min');
  if (ratios.attributablePct < thresholds.minAttributablePct) failedRules.push('attributable_below_min');
  if (ratios.unresolvedConflictPct > thresholds.maxUnresolvedConflictPct) failedRules.push('conflicts_above_max');
  if (ratios.staleContactPct > thresholds.maxStaleContactPct) failedRules.push('stale_above_max');
  return {
    pass: failedRules.length === 0,
    ratios,
    failedRules,
  };
}
