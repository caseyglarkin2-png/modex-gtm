import { describe, expect, it } from 'vitest';
import { computeCoverageRatios, evaluateCoverageGate } from '@/lib/revops/coverage-gate';

describe('coverage gate rules', () => {
  it('computes ratios against TAM denominators', () => {
    const ratios = computeCoverageRatios({
      tamCompanies: 1000,
      tamContacts: 13000,
      importedCompanies: 700,
      linkedContacts: 9100,
      enrichedContacts: 8450,
      sendReadyContacts: 6500,
      attributableContacts: 7000,
      unresolvedConflicts: 300,
      staleContacts: 2100,
    });

    expect(ratios.companiesImportedPct).toBeCloseTo(0.7);
    expect(ratios.contactsLinkedPct).toBeCloseTo(0.7);
    expect(ratios.unresolvedConflictPct).toBeCloseTo(300 / 13000);
  });

  it('fails close when required thresholds are not met', () => {
    const result = evaluateCoverageGate({
      tamCompanies: 1000,
      tamContacts: 13000,
      importedCompanies: 200,
      linkedContacts: 1000,
      enrichedContacts: 800,
      sendReadyContacts: 600,
      attributableContacts: 700,
      unresolvedConflicts: 2000,
      staleContacts: 4000,
    });

    expect(result.pass).toBe(false);
    expect(result.failedRules).toContain('companies_imported_below_min');
    expect(result.failedRules).toContain('contacts_linked_below_min');
    expect(result.failedRules).toContain('conflicts_above_max');
    expect(result.failedRules).toContain('stale_above_max');
  });
});
