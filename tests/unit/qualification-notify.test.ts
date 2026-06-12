import { describe, it, expect } from 'vitest';
import { buildSqlAlert } from '../../src/lib/revops/qualification/notify';
import type { VerdictDiff } from '../../src/lib/revops/qualification/types';

const base: VerdictDiff = {
  contactId: 'c1',
  name: 'Jane Doe',
  email: 'jane@acme.com',
  companyId: 'co1',
  companyName: 'Acme',
  icpScore: 90,
  tamTier: '1',
  hasPulse: false,
  seniority: 'director',
  role: 'operations',
  jobtitle: 'Director of Operations',
  currentLifecycle: 'lead',
  currentVerdict: 'mql',
  newVerdict: 'sql',
  changed: true,
  reason: 'tam=in tier=1 icp=90 seniority=director role=operations -> sql',
};

const mk = (over: Partial<VerdictDiff>): VerdictDiff => ({ ...base, ...over });

describe('buildSqlAlert', () => {
  it('returns null when no rows are new SQLs', () => {
    // Already was sql — not a promotion
    expect(buildSqlAlert([mk({ currentVerdict: 'sql', newVerdict: 'sql' })])).toBeNull();
  });

  it('returns null for an empty diff', () => {
    expect(buildSqlAlert([])).toBeNull();
  });

  it('returns null when newVerdict is not sql', () => {
    expect(buildSqlAlert([mk({ currentVerdict: 'none', newVerdict: 'mql' })])).toBeNull();
  });

  it('builds a message with the correct count header', () => {
    const msg = buildSqlAlert([mk({ contactId: 'c1' }), mk({ contactId: 'c2', name: 'Bob Smith', email: 'bob@acme.com' })]);
    expect(msg).not.toBeNull();
    expect(msg).toContain('2 new SQL(s)');
  });

  it('includes name, companyName, and tamTier in each line', () => {
    const msg = buildSqlAlert([mk({})]);
    expect(msg).not.toBeNull();
    expect(msg).toContain('Jane Doe');
    expect(msg).toContain('Acme');
    expect(msg).toContain('Tier 1');
  });

  it('falls back to email when name is blank', () => {
    const msg = buildSqlAlert([mk({ name: '', email: 'anon@acme.com' })]);
    expect(msg).not.toBeNull();
    expect(msg).toContain('anon@acme.com');
  });

  it('truncates to 15 lines and appends "more" overflow message', () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      mk({ contactId: `c${i}`, name: `Person ${i}`, email: `p${i}@acme.com` }),
    );
    const msg = buildSqlAlert(rows);
    expect(msg).not.toBeNull();
    // 15 bullet lines + header + overflow = 17 lines total
    const lines = msg!.split('\n');
    const bulletLines = lines.filter((l) => l.startsWith('•'));
    expect(bulletLines).toHaveLength(15);
    expect(msg).toContain('…and 5 more');
  });

  it('does not include overflow line when exactly 15 promotions', () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      mk({ contactId: `c${i}`, name: `Person ${i}` }),
    );
    const msg = buildSqlAlert(rows);
    expect(msg).not.toBeNull();
    expect(msg).not.toContain('more');
  });

  it('excludes rows where currentVerdict is already sql', () => {
    const rows = [
      mk({ contactId: 'already', currentVerdict: 'sql', newVerdict: 'sql' }),
      mk({ contactId: 'promoted', currentVerdict: 'mql', newVerdict: 'sql' }),
    ];
    const msg = buildSqlAlert(rows);
    expect(msg).not.toBeNull();
    expect(msg).toContain('1 new SQL(s)');
  });
});
