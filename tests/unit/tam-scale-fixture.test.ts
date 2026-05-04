import { describe, expect, it } from 'vitest';
import { buildTamScaleFixture } from '../fixtures/tam-scale';

describe('tam scale fixture', () => {
  it('builds deterministic 1000 company and 13000 contact fixture', () => {
    const fixture = buildTamScaleFixture();
    expect(fixture.companies).toHaveLength(1000);
    expect(fixture.contacts).toHaveLength(13000);
    expect(fixture.companies[0]).toMatchObject({
      companyId: 'c-1',
      name: 'TAM Company 1',
      domain: 'tam-company-1.example.com',
    });
    expect(fixture.contacts[0].companyId).toBe('c-1');
    expect(fixture.contacts[1000].companyId).toBe('c-1');
  });
});
