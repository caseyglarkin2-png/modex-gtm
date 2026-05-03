import { describe, expect, it } from 'vitest';
import {
  canonicalModules,
  currentSidebarItems,
  getDuplicateModuleRows,
  getDuplicateModuleScorecard,
  hiddenCoreRoutes,
} from '@/lib/revops-ia/current-state';

describe('RevOps OS current-state IA inventory', () => {
  it('declares the ten canonical modules with explicit primary routes', () => {
    expect(canonicalModules.map((module) => module.label)).toEqual([
      'Home',
      'Accounts',
      'Contacts',
      'Campaigns',
      'Engagement',
      'Work Queue',
      'Content Studio',
      'Pipeline',
      'Analytics',
      'Ops',
    ]);

    expect(canonicalModules.map((module) => module.href)).toEqual([
      '/',
      '/accounts',
      '/contacts',
      '/campaigns',
      '/engagement',
      '/queue',
      '/studio',
      '/pipeline',
      '/analytics',
      '/ops',
    ]);
  });

  it('captures the current sidebar groups and duplicate-module problem', () => {
    expect(new Set(currentSidebarItems.map((item) => item.section))).toEqual(new Set([
      'Core',
      'Outreach',
      'Field',
      'Pipeline',
      'Creative',
    ]));

    expect(currentSidebarItems).toHaveLength(22);
    expect(currentSidebarItems.find((item) => item.label === 'Campaign HQ')).toMatchObject({
      canonicalOwner: 'Campaigns',
      classification: 'legacy-artifact',
    });
    expect(currentSidebarItems.find((item) => item.label === 'Generated Content')).toMatchObject({
      canonicalOwner: 'Content Studio',
      classification: 'duplicate',
    });
    expect(currentSidebarItems.find((item) => item.label === 'Jake Queue')).toMatchObject({
      canonicalOwner: 'Work Queue',
      classification: 'duplicate',
    });
  });

  it('flags core routes that exist or need to exist outside the current sidebar', () => {
    expect(hiddenCoreRoutes).toEqual([
      { href: '/contacts', canonicalOwner: 'Contacts', disposition: 'Promote to top-level navigation.' },
      { href: '/engagement', canonicalOwner: 'Engagement', disposition: 'Create as first-class buyer-response workspace.' },
      { href: '/ops', canonicalOwner: 'Ops', disposition: 'Create as first-class system/proof workspace.' },
    ]);
  });

  it('builds a duplicate-module scorecard for before/after proof', () => {
    expect(getDuplicateModuleScorecard()).toEqual({
      'keep-top-level': 6,
      'hidden-core': 3,
      duplicate: 4,
      'should-be-tab': 11,
      'legacy-artifact': 1,
    });
  });

  it('requires every current sidebar item to have a canonical owner and disposition', () => {
    for (const row of getDuplicateModuleRows()) {
      expect(row.canonicalOwner, row.label).toBeTruthy();
      expect(row.disposition, row.label).toBeTruthy();
    }
  });
});
