import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  builtSequences,
  eligibleForEnroll,
  identityLoad,
  parseExclusionsCsv,
  parseManifest,
  parseMonitor,
  parseRoster,
  readExclusions,
  readManifest,
  readMonitor,
  readRoster,
  type Top100RosterPerson,
} from '@/lib/gap/top100/reader';
import manifestFixture from '../../fixtures/gap/top100-manifest.json';
import rosterFixture from '../../fixtures/gap/top100-roster.json';
import monitorFixture from '../../fixtures/gap/top100-monitor.json';

const FIXTURES = join(__dirname, '../../fixtures/gap');
const exclusionsCsv = readFileSync(join(FIXTURES, 'top100-exclusions.csv'), 'utf8');

const LANE = 'C:/Users/casey/yardflow-hubspot/top100';
const laneDescribe = existsSync(join(LANE, 'run_manifest.json')) ? describe : describe.skip;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

describe('parseManifest', () => {
  const m = parseManifest(manifestFixture);

  it('parses an ENROLLED account with a sequence to the exact shape', () => {
    expect(m.runId).toBe('top100-2026-09-12');
    expect(m.portal).toBe('3819073');
    const dell = m.accounts['dell-com'];
    expect(dell).toEqual({
      key: 'dell-com',
      name: 'Dell',
      domain: 'dell.com',
      hubspotCompanyId: '54406388074',
      tier: 'B',
      segment: 'wholesale_distribution',
      rank: 10,
      score: 82,
      preferredSender: 'casey@freightroll.com',
      selected: true,
      sequence: {
        hubspotSequenceId: '311519882',
        name: 'YF | Top100 | Dell',
        templateIds: { '1': '129819537', '2': '129819651', '3': '129818738', '4': '129819695' },
        delaysBusinessDays: [0, 4, 5, 6],
        builtAt: '2026-09-14T16:07:47.811Z',
        enrolled: 5,
        state: 'ENROLLED',
        enrolledCheckedAt: '2026-09-17T19:16:19.184Z',
      },
      branches: manifestFixture.accounts['dell-com'].branches,
    });
  });

  it('parses a BUILT_NOT_ENROLLED account with enrolled 0', () => {
    const jb = m.accounts['jbhunt-com'];
    expect(jb.name).toBe('J.B. Hunt');
    expect(jb.rank).toBe(63);
    expect(jb.sequence?.state).toBe('BUILT_NOT_ENROLLED');
    expect(jb.sequence?.enrolled).toBe(0);
    expect(jb.sequence?.hubspotSequenceId).toBe('311861043');
  });

  it('an account without a sequence block parses sequence as null', () => {
    const raw = clone(manifestFixture) as { accounts: Record<string, Record<string, unknown>> };
    delete raw.accounts['jbhunt-com'].sequence;
    const parsed = parseManifest(raw);
    expect(parsed.accounts['jbhunt-com'].sequence).toBeNull();
    expect(parsed.warnings).toEqual([]);
  });

  it('carries selectedKeys and reserve keys', () => {
    expect(m.selectedKeys).toEqual(['dell-com', 'jbhunt-com']);
    expect(m.reserveKeys).toEqual(['monsterenergy-com', 'perdue-com', 'glanbia-com']);
    expect(m.reserve[0]).toEqual({ key: 'monsterenergy-com', score: 46, confidence: 'medium' });
  });

  it('throws bad_manifest when accounts is not an object', () => {
    expect(() => parseManifest({ run_id: 'x', accounts: [] })).toThrow('bad_manifest');
    expect(() => parseManifest({ run_id: 'x' })).toThrow('bad_manifest');
    expect(() => parseManifest(null)).toThrow('bad_manifest');
    expect(() => parseManifest('nope')).toThrow('bad_manifest');
  });

  it('a missing sequence.templates produces a warning, not a throw', () => {
    const raw = clone(manifestFixture) as {
      accounts: Record<string, { sequence: Record<string, unknown> }>;
    };
    delete raw.accounts['dell-com'].sequence.templates;
    const parsed = parseManifest(raw);
    expect(parsed.accounts['dell-com'].sequence?.templateIds).toEqual({});
    expect(parsed.warnings).toContain('dell-com: sequence.templates missing');
  });

  it('a missing name warns and parses as an empty string', () => {
    const raw = clone(manifestFixture) as { accounts: Record<string, Record<string, unknown>> };
    delete raw.accounts['jbhunt-com'].name;
    const parsed = parseManifest(raw);
    expect(parsed.accounts['jbhunt-com'].name).toBe('');
    expect(parsed.warnings).toContain('jbhunt-com: name missing');
  });

  it('a sequence block with a state but no id is not a built sequence', () => {
    const raw = clone(manifestFixture) as { accounts: Record<string, Record<string, unknown>> };
    raw.accounts['jbhunt-com'].sequence = { state: 'PARKED' };
    const parsed = parseManifest(raw);
    expect(parsed.accounts['jbhunt-com'].sequence).toBeNull();
    expect(parsed.warnings).toContain('jbhunt-com: sequence.state PARKED without hubspot_sequence_id');
  });

  it('readManifest parses JSON text', () => {
    expect(readManifest(JSON.stringify(manifestFixture)).runId).toBe('top100-2026-09-12');
  });
});

describe('builtSequences', () => {
  it('returns accounts with a sequence id sorted by rank', () => {
    const built = builtSequences(parseManifest(manifestFixture));
    expect(built.map((a) => a.key)).toEqual(['dell-com', 'jbhunt-com']);
  });

  it('accounts with null rank sort last', () => {
    const raw = clone(manifestFixture) as { accounts: Record<string, Record<string, unknown>> };
    raw.accounts['dell-com'].rank = null;
    const built = builtSequences(parseManifest(raw));
    expect(built.map((a) => a.key)).toEqual(['jbhunt-com', 'dell-com']);
  });
});

describe('parseRoster', () => {
  const r = parseRoster(rosterFixture);

  it('people count equals the fixture selected_people', () => {
    expect(r.key).toBe('dell-com');
    expect(r.people).toHaveLength(rosterFixture.selected_people.length);
    expect(r.people).toHaveLength(7);
    expect(r.warnings).toEqual([]);
  });

  it('parses an ELIGIBLE person to the exact shape', () => {
    expect(r.people[0]).toEqual({
      key: 'dell-com',
      name: 'Mara Ellison',
      title: 'VP & CFO, Regional Operations, Business Partner to COO',
      functions: ['exec_sponsor'],
      hubspotContactId: '900000000001',
      email: 'mara.ellison@example.com',
      emailState: 'VERIFIED_DELIVERABLE',
      emailSource: 'hubspot',
      eligibility: 'ELIGIBLE',
      eligibilityKnown: true,
      sequenceBlock: null,
      suppression: 'CLEAR',
      suppressionDetail: null,
      lastTouch: null,
      touchLane: null,
      replyAuditVerdict: null,
      priority: 1,
      selected: true,
      crmStatus: 'EXISTING',
    });
  });

  it('a HOLD_RECENT_TOUCH person keeps lastTouch and touchLane', () => {
    const held = r.people.find((p) => p.name === 'Rafael Quintero');
    expect(held?.eligibility).toBe('HOLD_RECENT_TOUCH');
    expect(held?.lastTouch).toBe('2026-09-08');
    expect(held?.touchLane).toBe('warroom_series');
  });

  it('an unknown eligibility value is preserved with eligibilityKnown false and a warning', () => {
    const raw = clone(rosterFixture) as { selected_people: Array<Record<string, unknown>> };
    raw.selected_people[1].eligibility = 'HOLD_MYSTERY';
    const parsed = parseRoster(raw);
    expect(parsed.people[1].eligibility).toBe('HOLD_MYSTERY');
    expect(parsed.people[1].eligibilityKnown).toBe(false);
    expect(parsed.warnings).toEqual(['dell-com: Devin Okafor: unknown eligibility HOLD_MYSTERY']);
  });

  it('throws bad_roster when selected_people is not an array', () => {
    expect(() => parseRoster({ key: 'x', selected_people: {} })).toThrow('bad_roster');
    expect(() => parseRoster(null)).toThrow('bad_roster');
  });

  it('readRoster parses JSON text', () => {
    expect(readRoster(JSON.stringify(rosterFixture)).people).toHaveLength(7);
  });
});

describe('eligibleForEnroll', () => {
  const base = parseRoster(rosterFixture).people[0];
  const withBlock = (): Top100RosterPerson => ({
    ...base,
    sequenceBlock: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE',
  });

  it('is true only for ELIGIBLE with an email and no sequence block', () => {
    expect(eligibleForEnroll(base)).toBe(true);
  });

  it('a person with a sequence_block is not eligible', () => {
    const raw = clone(rosterFixture) as { selected_people: Array<Record<string, unknown>> };
    raw.selected_people[0].sequence_block = 'HUBSPOT_CROSS_ACCOUNT_BOUNCE';
    raw.selected_people[0].sequence_block_seen = '2026-09-15';
    const parsed = parseRoster(raw);
    expect(parsed.people[0].sequenceBlock).toBe('HUBSPOT_CROSS_ACCOUNT_BOUNCE');
    expect(parsed.people[0].eligibility).toBe('ELIGIBLE');
    expect(eligibleForEnroll(parsed.people[0])).toBe(false);
    expect(eligibleForEnroll(withBlock())).toBe(false);
  });

  it('a non-ELIGIBLE person is not eligible even with email and no block', () => {
    expect(eligibleForEnroll({ ...base, eligibility: 'HOLD_RECENT_TOUCH' })).toBe(false);
    expect(eligibleForEnroll({ ...base, eligibility: 'EMAIL_UNVERIFIED' })).toBe(false);
  });

  it('an ELIGIBLE person without an email is not eligible', () => {
    expect(eligibleForEnroll({ ...base, email: null })).toBe(false);
  });

  it('matches the enroll-table filter across the whole dell roster', () => {
    const parsed = parseRoster(rosterFixture);
    const go = parsed.people.filter(eligibleForEnroll).map((p) => p.name);
    expect(go).toEqual([
      'Mara Ellison',
      'Devin Okafor',
      'Lin Tanaka',
      'Casimir Vale',
      'Odette Brannigan',
    ]);
  });
});

describe('parseExclusionsCsv', () => {
  const rows = parseExclusionsCsv(exclusionsCsv);

  it('parses 8 rows', () => {
    expect(rows).toHaveLength(8);
  });

  it('parses the first row to the exact shape', () => {
    expect(rows[0]).toEqual({
      entity: 'Nestlé',
      canonicalIdentity: 'nestle.com',
      hubspotCompanyId: '57209776044',
      reason: 'CLOSED_LOST_REVIEW "Nestle - POC" closed 2026-05-07',
      supportingSourceId: 'deal:9175122487',
      owner: '29906488',
      checkedAt: '2026-09-14T00:18:09.846Z',
      releaseRequirement: 'explicit playbook authorization for re-entry',
    });
  });

  it('a quoted field containing a comma and doubled quotes parses correctly', () => {
    const text = [
      'entity,canonical_identity,hubspot_company_id,reason,supporting_source_id,owner,checked_at,release_requirement',
      '"Acme, Inc.","acme.com","1","PARTNER ""Tech, Partner"" type","company:1","","2026-09-14T00:00:00.000Z","type changes"',
    ].join('\n');
    const [row] = parseExclusionsCsv(text);
    expect(row.entity).toBe('Acme, Inc.');
    expect(row.reason).toBe('PARTNER "Tech, Partner" type');
    expect(row.owner).toBe('');
    expect(row.releaseRequirement).toBe('type changes');
  });

  it('a quoted field containing a newline parses correctly', () => {
    const text = [
      'entity,canonical_identity,hubspot_company_id,reason,supporting_source_id,owner,checked_at,release_requirement',
      '"Acme","acme.com","1","line one',
      'line two","company:1","","2026-09-14T00:00:00.000Z","x"',
    ].join('\n');
    const rows2 = parseExclusionsCsv(text);
    expect(rows2).toHaveLength(1);
    expect(rows2[0].reason).toBe('line one\nline two');
  });

  it('tolerates CRLF line endings and a BOM', () => {
    const text = '\uFEFF' + exclusionsCsv.replace(/\n/g, '\r\n');
    expect(parseExclusionsCsv(text)).toHaveLength(8);
  });

  it('an empty hubspot_company_id parses as null', () => {
    const text = [
      'entity,canonical_identity,hubspot_company_id,reason,supporting_source_id,owner,checked_at,release_requirement',
      'Acme,acme.com,,PARTNER,company:1,,2026-09-14T00:00:00.000Z,x',
    ].join('\n');
    expect(parseExclusionsCsv(text)[0].hubspotCompanyId).toBeNull();
  });

  it('a wrong header throws bad_exclusions_header', () => {
    const text = 'entity,domain,reason\n"Acme","acme.com","x"\n';
    expect(() => parseExclusionsCsv(text)).toThrow('bad_exclusions_header');
    expect(() => parseExclusionsCsv('')).toThrow('bad_exclusions_header');
  });

  it('a row with the wrong column count throws bad_exclusions_row', () => {
    const text = [
      'entity,canonical_identity,hubspot_company_id,reason,supporting_source_id,owner,checked_at,release_requirement',
      'Acme,acme.com,1',
    ].join('\n');
    expect(() => parseExclusionsCsv(text)).toThrow('bad_exclusions_row:2');
  });

  it('readExclusions is the text alias', () => {
    expect(readExclusions(exclusionsCsv)).toHaveLength(8);
  });
});

describe('parseMonitor', () => {
  const mon = parseMonitor(monitorFixture);

  it('parses day, at and counts', () => {
    expect(mon.day).toBe('2026-09-17');
    expect(mon.at).toBe('2026-09-17T19:15:40.069Z');
    expect(mon.contactsWithCopy).toBe(554);
    expect(mon.enrolled).toBe(196);
    expect(mon.enrolledByAccount['dell-com']).toBe(5);
    expect(Object.keys(mon.enrolledByAccount)).toHaveLength(73);
  });

  it('parses sendsByIdentity for both identities', () => {
    expect(mon.sendsByIdentity).toEqual({
      'casey@yardflow.ai': { sent: 35, bounced: 0 },
      'casey@freightroll.com': { sent: 31, bounced: 0 },
    });
  });

  it('parses replies, bounced, optedOut and halts arrays', () => {
    expect(mon.replies).toEqual(['Jamie Taylor (keurigdrpepper-com) 2026-09-17T12:50:22Z']);
    expect(mon.bounced).toEqual(['sarah.horn@conagra.com']);
    expect(mon.optedOut).toEqual([]);
    expect(mon.halts).toEqual([]);
  });

  it('identityLoad returns the counts for a known identity and zeros for an unknown one', () => {
    expect(identityLoad(mon, 'casey@yardflow.ai')).toEqual({ sent: 35, bounced: 0 });
    expect(identityLoad(mon, 'nobody@yardflow.ai')).toEqual({ sent: 0, bounced: 0 });
  });

  it('throws bad_monitor when day is missing', () => {
    expect(() => parseMonitor({ at: 'x' })).toThrow('bad_monitor');
    expect(() => parseMonitor(null)).toThrow('bad_monitor');
  });

  it('readMonitor parses JSON text', () => {
    expect(readMonitor(JSON.stringify(monitorFixture)).enrolled).toBe(196);
  });
});

laneDescribe('real lane files at ' + LANE, () => {
  it('the manifest has at least 70 built sequences', () => {
    const m = readManifest(readFileSync(join(LANE, 'run_manifest.json'), 'utf8'));
    const built = builtSequences(m);
    expect(built.length).toBeGreaterThanOrEqual(70);
    for (const a of built) expect(a.sequence?.hubspotSequenceId).toMatch(/^\d+$/);
    expect(m.selectedKeys.length).toBe(100);
  });

  it('every data/roster/*.json parses and reports 0 unknown eligibility values', () => {
    const dir = join(LANE, 'data', 'roster');
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    let people = 0;
    const unknown: string[] = [];
    const parseErrors: string[] = [];
    for (const f of files) {
      try {
        const r = readRoster(readFileSync(join(dir, f), 'utf8'));
        people += r.people.length;
        for (const p of r.people) if (!p.eligibilityKnown) unknown.push(`${f}:${p.name}:${p.eligibility}`);
      } catch (e) {
        parseErrors.push(`${f}: ${(e as Error).message}`);
      }
    }
    expect(parseErrors).toEqual([]);
    expect(people).toBeGreaterThan(0);
    expect(unknown, `unknown eligibility values: ${unknown.length}`).toEqual([]);
  });

  it('EXCLUSIONS.csv and the latest monitor parse', () => {
    const rows = readExclusions(readFileSync(join(LANE, 'EXCLUSIONS.csv'), 'utf8'));
    expect(rows.length).toBeGreaterThan(100);
    const mon = readMonitor(readFileSync(join(LANE, 'data', 'monitor', '2026-09-17.json'), 'utf8'));
    expect(Object.keys(mon.sendsByIdentity)).toHaveLength(2);
  });
});
