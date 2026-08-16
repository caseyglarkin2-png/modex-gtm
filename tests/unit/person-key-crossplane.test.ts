/**
 * The TWO-LANGUAGE half of the person key.
 *
 * `tests/unit/person-key.test.ts` proves the TypeScript key is correct on its
 * own. That is not enough. clawd asks modex "is this person suppressed?" over
 * HTTP, and if the two sides key differently, modex answers "no match" with
 * complete confidence and clawd sends. A silent disagreement about who someone
 * is does not present as a bug; it presents as consent.
 *
 * So this file reads the SAME fixture as clawd's
 * `scripts/tests/test_person_key.py`, and pins the file's SHA-256. A copy that
 * drifts in either repo turns that repo RED rather than quietly disagreeing
 * with the other one. Updating the contract means updating the hash in both
 * places, on purpose: that friction is the mechanism.
 *
 * `expected_keys` pins literal outputs, not just pair equalities, because two
 * mirrors can agree with each other and both be wrong — a pure equality suite
 * passes if BOTH sides return a constant.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blockKey } from '@/lib/identity/person-key';

const FIXTURE_PATH = join(__dirname, '..', 'fixtures', 'suppression_vectors.json');
const RAW = readFileSync(FIXTURE_PATH);

/**
 * SHA-256 of the shared vector file. The IDENTICAL constant is asserted in
 * clawd (`scripts/tests/test_fixture_pin.py`) and war-room. Three copies, one
 * hash: change the contract and all three must be updated deliberately.
 */
const SHARED_FIXTURE_SHA256 =
  'a5df090bfc98cba1a677c06e8ff762235efacfb96e5506a83eace42a2522ece2';

const KV = JSON.parse(RAW.toString('utf-8')).key_vectors as {
  siblings: [string, string][];
  different_people: [string, string][];
  expected_keys: Record<string, string>;
  unkeyable: string[];
};

describe('cross-plane person key', () => {
  it('the shared fixture has not drifted from the other repos', () => {
    expect(createHash('sha256').update(RAW).digest('hex')).toBe(SHARED_FIXTURE_SHA256);
  });

  it.each(KV.siblings)('merges the same human: %s == %s', (a, b) => {
    expect(blockKey(a)).not.toBeNull();
    expect(blockKey(a)).toBe(blockKey(b));
  });

  it.each(KV.different_people)('keeps different humans apart: %s != %s', (a, b) => {
    expect(blockKey(a)).not.toBe(blockKey(b));
  });

  it.each(Object.entries(KV.expected_keys))(
    'produces the pinned literal key for %s',
    (email, expected) => {
      expect(blockKey(email)).toBe(expected);
    },
  );

  it.each(KV.unkeyable)('refuses to key %s', (bad) => {
    expect(blockKey(bad)).toBeNull();
  });
});
