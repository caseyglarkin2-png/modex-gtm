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

    // 12 canonical sidebar modules (src/lib/navigation.ts): Home, Accounts,
    // Content Studio, Pipeline, Campaigns, Contacts, Engagement, Work Queue,
    // Analytics, Discovery (10 -> 11, 2026-06-04), GAP OS (11 -> 12, added
    // deliberately in 47c81cb3, 2026-09-24), Ops. A change here should be an
    // intentional information-architecture decision, named in this comment.
    expect(report.scorecard).toEqual({
      keepTopLevel: 12,
      hiddenCore: 0,
      duplicate: 0,
      shouldBeTab: 0,
      legacyArtifact: 0,
    });
  });
});
