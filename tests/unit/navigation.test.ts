import { describe, expect, it } from 'vitest';
import { canonicalNavModules, commandRoutes, getPageLabelForPath, isActiveNavModule } from '@/lib/navigation';

describe('canonical navigation', () => {
  it('declares ten unique top-level modules', () => {
    expect(canonicalNavModules.map((module) => module.label)).toEqual([
      'Accounts',
      'Content Studio',
      'Work Queue',
      'Engagement',
      'Analytics',
      'Home',
      'Campaigns',
      'Contacts',
      'Pipeline',
      'Ops',
    ]);

    expect(new Set(canonicalNavModules.map((module) => module.href)).size).toBe(10);
    expect(new Set(canonicalNavModules.map((module) => module.label)).size).toBe(10);
  });

  it('maps legacy routes to their canonical owners', () => {
    const cases = [
      ['/personas', 'Contacts'],
      ['/waves/campaign', 'Campaigns'],
      ['/queue/generations', 'Work Queue'],
      ['/generated-content', 'Content Studio'],
      ['/admin/crons', 'Ops'],
      ['/admin/generation-metrics', 'Ops'],
      ['/analytics/quarterly', 'Analytics'],
    ] as const;

    for (const [path, owner] of cases) {
      expect(getPageLabelForPath(path)).toBe(owner);
    }
  });

  it('keeps command search aliases for old product names', () => {
    const labels = commandRoutes.map((route) => route.label);
    expect(labels).toContain('Quick Capture');
    expect(labels).toContain('Personas');
    expect(labels).toContain('Campaign HQ');
    expect(labels).toContain('Generation Queue');
    expect(labels).toContain('Generated Content');
  });

  it('routes legacy command aliases to canonical workspaces', () => {
    const byLabel = new Map(commandRoutes.map((route) => [route.label, route.href]));
    expect(byLabel.get('Activities')).toBe('/pipeline?tab=activities');
    expect(byLabel.get('Meetings')).toBe('/pipeline?tab=meetings');
    expect(byLabel.get('Quarterly Review')).toBe('/analytics?tab=quarterly');
    expect(byLabel.get('Cron Health')).toBe('/ops?tab=cron-health');
    expect(byLabel.get('Generation Metrics')).toBe('/ops?tab=generation-metrics');
    expect(byLabel.get('Generation Queue')).toBe('/queue?tab=system-jobs');
  });

  it('matches nested canonical paths', () => {
    const campaigns = canonicalNavModules.find((module) => module.label === 'Campaigns');
    expect(campaigns).toBeDefined();
    expect(isActiveNavModule('/campaigns/modex-2026', campaigns!)).toBe(true);
  });
});
