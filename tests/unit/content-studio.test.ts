import { describe, expect, it } from 'vitest';
import {
  buildContentStudioSummary,
  contentAssetTypes,
  contentStudioTabs,
  getContentAssetTypeForLegacyRoute,
  getContentStudioTabForLegacyRoute,
} from '@/lib/content-studio';

describe('content studio contract', () => {
  it('declares the canonical Content Studio tabs', () => {
    expect(contentStudioTabs.map((tab) => tab.label)).toEqual([
      'Generate',
      'Library',
      'Queue',
      'Send Readiness',
      'Asset Types',
    ]);
  });

  it('assigns every asset type to Content Studio with route and status behavior', () => {
    expect(contentAssetTypes.map((asset) => asset.id)).toEqual([
      'generated-content',
      'generation-job',
      'brief',
      'search-string',
      'intel',
      'audit-route',
      'qr',
      'microsite',
      'proposal',
    ]);

    for (const asset of contentAssetTypes) {
      expect(asset.owner).toBe('Content Studio');
      expect(asset.legacyRoutes.length).toBeGreaterThan(0);
      expect(asset.routeBehavior.length).toBeGreaterThan(10);
      expect(asset.statusBehavior.length).toBeGreaterThan(10);
    }
  });

  it('maps legacy content routes into canonical Studio views', () => {
    expect(getContentStudioTabForLegacyRoute('/generated-content')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/queue/generations')?.label).toBe('Queue');
    expect(getContentStudioTabForLegacyRoute('/briefs/general-mills')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/search')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/intel')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/audit-routes')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/qr')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/for/general-mills')?.label).toBe('Library');
    expect(getContentStudioTabForLegacyRoute('/proposal/general-mills')?.label).toBe('Library');

    expect(getContentAssetTypeForLegacyRoute('/proposal/general-mills')?.label).toBe('Proposals');
  });

  it('builds deterministic asset and readiness summary counts', () => {
    const summary = buildContentStudioSummary(
      {
        generated: 2,
        generationJobs: 3,
        briefs: 4,
        searchStrings: 5,
        intel: 6,
        auditRoutes: 7,
        qrAssets: 8,
        microsites: 9,
        proposals: 10,
      },
      [
        { is_published: true, external_send_count: 0 },
        { is_published: false, external_send_count: 0 },
      ],
      [{ status: 'failed' }, { status: 'completed' }, { status: 'failed' }],
    );

    expect(summary.totalAssets).toBe(54);
    expect(summary.sendReadyGenerated).toBe(1);
    expect(summary.reviewRequiredGenerated).toBe(1);
    expect(summary.failedJobs).toBe(2);
  });
});
