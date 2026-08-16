/**
 * Person identity keys for suppression and claim collision.
 *
 * WHY TWO KEYS (2026-08-16). One strictness cannot serve both jobs, because
 * their errors run in OPPOSITE directions:
 *
 *   Too coarse suppresses a send.  Too fine sends twice.
 *
 * A key that wrongly MERGES two people blocks a legitimate email: recoverable,
 * and the buyer never sees it. A key that wrongly SPLITS one person permits a
 * second touch: not recoverable, and the buyer does see it. So the blocking key
 * is deliberately the coarsest one we can defend, and the authorizing key is
 * anchored on a resolved CRM identity.
 *
 * THE PAIRS BELOW ARE REAL, measured 2026-08-16 across modex `personas` and
 * clawd `contacts`. 242 modex personas carry do_not_contact=TRUE; 204 are
 * absent from clawd's suppression; 146 of those are targetable by clawd today.
 * Seven of them are reachable at a SIBLING address, and the alias patterns are
 * per-domain mailbox conventions rather than noise:
 *
 *   homedepot.com  dot <-> underscore      john.drake / john_d_drake
 *   heb.com        token order reversed    troy.shaw  / shaw.troy
 *   pepsico.com    middle initial inserted david.chambers / david.j.chambers
 *
 * Because they are conventions, they recur at every new employer we touch,
 * which is why this is a key and not a patch list.
 *
 * THE CONTROLS MATTER AS MUCH AS THE PAIRS. A first pass keyed on ANY shared
 * name token reported 88 "sibling" pairs; at a large employer a single shared
 * token is just a common first or last name (brian.watson vs brian.guinn are
 * different people). Requiring the full name leaves 7, all of which survive
 * inspection. A test with only positive cases would pass with `() => 'x'`.
 */
import { describe, it, expect } from 'vitest';
import { blockKey, authorizeKey } from '@/lib/identity/person-key';

/** Same human, different address. Measured, not invented. */
const SIBLINGS: [string, string][] = [
  ['john.drake@homedepot.com', 'john_d_drake@homedepot.com'],
  ['john.deaton@homedepot.com', 'john_deaton@homedepot.com'],
  ['amit.kalra@homedepot.com', 'amit_kalra@homedepot.com'],
  ['dakota.socha@heb.com', 'socha.dakota@heb.com'],
  ['troy.shaw@heb.com', 'shaw.troy@heb.com'],
  ['troy.retzloff@heb.com', 'retzloff.troy@heb.com'],
  ['david.chambers@pepsico.com', 'david.j.chambers@pepsico.com'],
];

/** Different humans who share ONE name token. Must stay apart. */
const DIFFERENT_PEOPLE: [string, string][] = [
  ['brian.watson@pepsico.com', 'brian.guinn@pepsico.com'],
  ['isaac.scott@pepsico.com', 'karen.scott@pepsico.com'],
  ['david.chambers@pepsico.com', 'david.stein@pepsico.com'],
  ['john.drake@homedepot.com', 'john.deaton@homedepot.com'],
];

describe('blockKey — the COARSE key, used to refuse', () => {
  it.each(SIBLINGS)('merges the same human: %s == %s', (a, b) => {
    expect(blockKey(a)).toBe(blockKey(b));
  });

  it.each(DIFFERENT_PEOPLE)('keeps different humans apart: %s != %s', (a, b) => {
    expect(blockKey(a)).not.toBe(blockKey(b));
  });

  it('is case and whitespace insensitive', () => {
    expect(blockKey('  John.Drake@HomeDepot.COM ')).toBe(blockKey('john.drake@homedepot.com'));
  });

  it('strips plus-tags, which are the same mailbox by RFC', () => {
    expect(blockKey('john.drake+yardflow@homedepot.com')).toBe(blockKey('john.drake@homedepot.com'));
  });

  it('folds dots ONLY for providers where dots are insignificant', () => {
    // Gmail genuinely ignores dots, so these are one mailbox.
    expect(blockKey('john.smith@gmail.com')).toBe(blockKey('johnsmith@gmail.com'));
    // At a corporate domain dots ARE significant. Folding them here would
    // merge genuinely different people, which is the one merge we cannot
    // excuse as "safely coarse" because it would silently suppress a stranger.
    expect(blockKey('john.smith@pepsico.com')).not.toBe(blockKey('johnsmith@pepsico.com'));
  });

  it('returns null for input it cannot key, rather than a guessable constant', () => {
    // A constant fallback would collapse every unkeyable address into ONE
    // bucket, so a single suppression would block all of them.
    expect(blockKey('')).toBeNull();
    expect(blockKey('not-an-email')).toBeNull();
    expect(blockKey('@nolocal.com')).toBeNull();
    expect(blockKey('nodomain@')).toBeNull();
  });

  it('does not collapse an all-initials local part to an empty key', () => {
    // Dropping single-char tokens must not leave nothing; a key of "@domain"
    // would merge every initials-only address at that employer.
    const k = blockKey('a.b.c@pepsico.com');
    expect(k === null || k.startsWith('@')).toBe(false);
  });

  it('is stable across calls, since two planes must compute the same key', () => {
    expect(blockKey('Troy.Shaw@heb.com')).toBe(blockKey('shaw.troy@HEB.com'));
  });
});

describe('authorizeKey — the STRICT key, used to permit a send', () => {
  it('prefers the HubSpot contact id, the only store with cross-plane visibility', () => {
    const r = authorizeKey({ hubspotContactId: '12345', canonicalKey: 'ck-9', canonicalStatus: 'resolved' });
    expect(r).toEqual({ key: 'hs:12345', tier: 1, source: 'hubspot_contact_id' });
  });

  it('falls back to a RESOLVED canonical key', () => {
    const r = authorizeKey({ hubspotContactId: null, canonicalKey: 'ck-9', canonicalStatus: 'resolved' });
    expect(r).toEqual({ key: 'ck:ck-9', tier: 2, source: 'canonical_key' });
  });

  it('REFUSES a canonical key in conflict status', () => {
    // 396 of 1,909 canonical contacts are status=conflict. Those are precisely
    // the ambiguous identities, so they must not authorize a send.
    expect(authorizeKey({ hubspotContactId: null, canonicalKey: 'ck-9', canonicalStatus: 'conflict' })).toBeNull();
  });

  it('REFUSES when there is no resolved anchor, and never falls back to email', () => {
    // Email is tier 3. It is strong enough to refuse a send and too weak to
    // justify one, so it must not appear here at all.
    expect(authorizeKey({ hubspotContactId: null, canonicalKey: null, canonicalStatus: null })).toBeNull();
    expect(authorizeKey({ hubspotContactId: '', canonicalKey: '', canonicalStatus: 'resolved' })).toBeNull();
  });
});
