import { describe, expect, it } from 'vitest';
import { computeMappingContractChecksum, getMappingContracts } from '@/lib/enrichment/mapping-contracts';

describe('enrichment connector mapping contracts', () => {
  it('exposes stable connector mappings with checksums', () => {
    const contracts = getMappingContracts();
    expect(contracts).toHaveLength(2);
    const checksums = contracts.map((contract) => computeMappingContractChecksum(contract));
    expect(checksums[0]).toHaveLength(64);
    expect(checksums[1]).toHaveLength(64);
    expect(checksums[0]).not.toBe(checksums[1]);
    expect(contracts.map((c) => c.system).sort()).toEqual(['apollo', 'hubspot']);
  });
});
