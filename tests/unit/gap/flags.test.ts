import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GAP_FLAGS,
  assertGapEnabled,
  gapFlag,
  gapSkipPayload,
  isGapOsEnabled,
} from '@/lib/gap/flags';

const FLAG_NAMES = [
  'GAP_OS_ENABLED',
  'GAP_HYPOTHESIS_ENABLED',
  'GAP_ROUTING_ENABLED',
  'GAP_MESSAGE_COMPILER_ENABLED',
  'GAP_REPLY_CLASSIFICATION_ENABLED',
  'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED',
  'GAP_AUTO_ENROLL_ENABLED',
  'GAP_AUTO_ENROLL_SHADOW',
] as const;

let savedEnv: NodeJS.ProcessEnv;

function clearGapEnv(): void {
  for (const name of FLAG_NAMES) delete process.env[name];
}

beforeEach(() => {
  savedEnv = { ...process.env };
  clearGapEnv();
});

afterEach(() => {
  clearGapEnv();
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value !== undefined) process.env[key] = value;
  }
});

describe('GAP_FLAGS', () => {
  it('has exactly eight entries in the documented order', () => {
    expect(GAP_FLAGS).toHaveLength(8);
    expect([...GAP_FLAGS]).toEqual([...FLAG_NAMES]);
  });
});

describe('gapFlag', () => {
  it('reads the env at call time, not module load', () => {
    expect(gapFlag('GAP_OS_ENABLED')).toBe(false);
    process.env.GAP_OS_ENABLED = 'true';
    expect(gapFlag('GAP_OS_ENABLED')).toBe(true);
    process.env.GAP_OS_ENABLED = 'false';
    expect(gapFlag('GAP_OS_ENABLED')).toBe(false);
    delete process.env.GAP_OS_ENABLED;
    expect(gapFlag('GAP_OS_ENABLED')).toBe(false);
  });

  it.each(['1', 'true', 'TRUE', 'yes', 'on', ' on '])(
    'treats %j as on',
    (spelling) => {
      process.env.GAP_ROUTING_ENABLED = spelling;
      expect(gapFlag('GAP_ROUTING_ENABLED')).toBe(true);
    },
  );

  it.each(['', '0', 'false', 'off', 'maybe'])(
    'treats %j as off',
    (spelling) => {
      process.env.GAP_ROUTING_ENABLED = spelling;
      expect(gapFlag('GAP_ROUTING_ENABLED')).toBe(false);
    },
  );

  it('treats unset as off', () => {
    delete process.env.GAP_ROUTING_ENABLED;
    expect(process.env.GAP_ROUTING_ENABLED).toBeUndefined();
    expect(gapFlag('GAP_ROUTING_ENABLED')).toBe(false);
  });

  it('reads each flag by its own name, not a shared switch', () => {
    process.env.GAP_AUTO_ENROLL_SHADOW = '1';
    expect(gapFlag('GAP_AUTO_ENROLL_SHADOW')).toBe(true);
    expect(gapFlag('GAP_AUTO_ENROLL_ENABLED')).toBe(false);
  });
});

describe('isGapOsEnabled', () => {
  it('mirrors GAP_OS_ENABLED at call time', () => {
    expect(isGapOsEnabled()).toBe(false);
    process.env.GAP_OS_ENABLED = 'yes';
    expect(isGapOsEnabled()).toBe(true);
    process.env.GAP_OS_ENABLED = '0';
    expect(isGapOsEnabled()).toBe(false);
  });
});

describe('gapSkipPayload', () => {
  it('names the flag in the reason', () => {
    expect(gapSkipPayload('GAP_MESSAGE_COMPILER_ENABLED')).toEqual({
      skipped: true,
      reason: 'GAP_MESSAGE_COMPILER_ENABLED=false',
    });
  });
});

describe('assertGapEnabled', () => {
  it('blames GAP_OS_ENABLED first when only the listed flag is on', () => {
    process.env.GAP_ROUTING_ENABLED = 'true';
    expect(assertGapEnabled('GAP_ROUTING_ENABLED')).toEqual({
      skipped: true,
      reason: 'GAP_OS_ENABLED=false',
    });
  });

  it('blames the listed flag when only the OS flag is on', () => {
    process.env.GAP_OS_ENABLED = 'true';
    expect(assertGapEnabled('GAP_ROUTING_ENABLED')).toEqual({
      skipped: true,
      reason: 'GAP_ROUTING_ENABLED=false',
    });
  });

  it('returns null when the OS flag and the listed flag are both on', () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    expect(assertGapEnabled('GAP_ROUTING_ENABLED')).toBeNull();
  });

  it('with no listed flags, only GAP_OS_ENABLED decides', () => {
    expect(assertGapEnabled()).toEqual({
      skipped: true,
      reason: 'GAP_OS_ENABLED=false',
    });
    process.env.GAP_OS_ENABLED = 'on';
    expect(assertGapEnabled()).toBeNull();
  });

  it('names the FIRST off flag in the listed order', () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_HYPOTHESIS_ENABLED = 'true';
    expect(
      assertGapEnabled(
        'GAP_HYPOTHESIS_ENABLED',
        'GAP_MESSAGE_COMPILER_ENABLED',
        'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED',
      ),
    ).toEqual({
      skipped: true,
      reason: 'GAP_MESSAGE_COMPILER_ENABLED=false',
    });
  });

  it('halts on the next call after the OS flag is flipped off', () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_AUTO_ENROLL_ENABLED = 'true';
    expect(assertGapEnabled('GAP_AUTO_ENROLL_ENABLED')).toBeNull();
    process.env.GAP_OS_ENABLED = 'false';
    expect(assertGapEnabled('GAP_AUTO_ENROLL_ENABLED')).toEqual({
      skipped: true,
      reason: 'GAP_OS_ENABLED=false',
    });
  });
});
