import { describe, expect, it } from 'vitest';
import { buildAppRouteIndex, detectNavIntegrity } from '@/lib/nav-integrity';

describe('nav integrity detector', () => {
  it('proves canonical nav/command routes are covered and owned', async () => {
    const routeIndex = await buildAppRouteIndex();
    const report = detectNavIntegrity(routeIndex);

    expect(routeIndex.pageRoutes.length).toBeGreaterThan(0);
    expect(routeIndex.apiRoutes.length).toBeGreaterThan(0);

    expect(report.deadNavHrefs).toEqual([]);
    expect(report.ownerlessCommandRoutes).toEqual([]);
    expect(report.obsoleteTopLevelModules).toEqual([]);

    expect(report.scorecard).toEqual({
      keepTopLevel: 10,
      hiddenCore: 0,
      duplicate: 0,
      shouldBeTab: 0,
      legacyArtifact: 0,
    });
  });
});
