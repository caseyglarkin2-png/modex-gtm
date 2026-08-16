/**
 * Person identity keys for suppression and claim collision.
 *
 * TWO KEYS, ASYMMETRIC ON PURPOSE. The one-line rule:
 *
 *   A key too weak to justify SENDING is still strong enough to justify REFUSING.
 *
 * The two jobs have errors that run in OPPOSITE directions. A key that wrongly
 * MERGES two people blocks a legitimate email: recoverable, invisible to the
 * buyer. A key that wrongly SPLITS one person permits a second touch: not
 * recoverable, and the buyer sees it. So `blockKey` is the coarsest key we can
 * defend and `authorizeKey` is anchored on a resolved CRM identity, and neither
 * may be substituted for the other.
 *
 * WHY A KEY AND NOT A PATCH LIST. The sibling families measured on 2026-08-16
 * are per-domain MAILBOX CONVENTIONS, not noise:
 *
 *   homedepot.com  dot <-> underscore       john.drake / john_d_drake
 *   heb.com        token order reversed     troy.shaw  / shaw.troy
 *   pepsico.com    middle initial inserted  david.chambers / david.j.chambers
 *
 * Conventions recur at every new employer we touch. A list of seven pairs would
 * be stale at the eighth account.
 *
 * WHY THE CONTROLS ARE HALF THE DESIGN. A first pass keyed on ANY shared name
 * token reported 88 "sibling" pairs. At a large employer one shared token is
 * just a common first or last name: brian.watson and brian.guinn are two people.
 * Requiring the FULL surviving token set leaves 7 pairs, all of which survive
 * inspection. The seven pairs are BLOCK-ONLY evidence and must never be promoted
 * into a general theory of corporate email identity — in particular, nothing may
 * permit a send merely because this coarse transform says two addresses differ.
 *
 * NEVER DOT-FOLD A CORPORATE DOMAIN. Dots are insignificant at Gmail and
 * significant nearly everywhere else. Folding them at an employer merges
 * different humans, and that is the one merge we cannot excuse as "safely
 * coarse": it would silently suppress a stranger we never decided anything
 * about, and a suppression nobody can explain is one an operator will delete.
 *
 * CROSS-PLANE CONTRACT. `blockKey` is mirrored in clawd as
 * `scripts/person_key.py:block_key`, and both are pinned to the SAME shared
 * fixture file so the two planes cannot silently disagree about who a person is.
 * A suppression key that differs between the asking plane and the answering
 * plane is worse than no key: it reports CLEAR with total confidence.
 */

/**
 * Mailbox providers where the local part genuinely ignores dots, so
 * `john.smith` and `johnsmith` are one mailbox by the provider's own rules.
 *
 * Deliberately a tiny allow-list of providers whose documented behaviour we can
 * point at, NOT a heuristic like "free webmail". Every domain absent from this
 * list is treated as dot-SIGNIFICANT, which is the fail-safe direction: it can
 * only ever split a person into two keys (over-send risk on the authorize side,
 * where email cannot authorize anything anyway) rather than merge two people
 * into one (silent suppression of a stranger).
 */
const DOT_INSENSITIVE_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

/** Local-part separators that encode a name boundary in every convention we measured. */
const TOKEN_SEPARATORS = /[._-]+/;

interface SplitAddress {
  local: string;
  domain: string;
}

/**
 * Split and validate, or refuse. Returns null rather than a best guess: a
 * partially parsed address is exactly the input a suppression check must not
 * pretend to understand.
 */
function splitAddress(raw: string): SplitAddress | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // Exactly one '@'. Zero means it is not an address; more than one means we
  // cannot tell which is the delimiter, and guessing picks a domain.
  const parts = trimmed.split('@');
  if (parts.length !== 2) return null;

  const [rawLocal, domain] = parts;
  if (!rawLocal || !domain) return null;
  // A domain with no dot is not a routable mail domain in this estate, and
  // accepting one would let a typo key against a whole namespace.
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return null;

  // Plus-tagging is the same mailbox by RFC 5233, and it is the cheapest
  // possible evasion of an exact-match suppression list.
  const local = rawLocal.split('+')[0];
  if (!local) return null;

  return { local, domain };
}

/**
 * The COARSE key. Used ONLY to REFUSE: suppression, do-not-contact, claim
 * collision. Never used to authorize a send.
 *
 * Token-set normalization: lowercase, split the local part on `.` `_` `-`, DROP
 * single-character tokens, sort, rejoin. Dropping single-char tokens is what
 * absorbs an inserted middle initial; sorting is what absorbs a reversed
 * given/family order. Both were measured, not assumed.
 *
 * Returns null for anything it cannot key. It deliberately does NOT fall back to
 * a constant: a constant would collapse every unkeyable address into ONE bucket,
 * so a single suppression entry would block all of them, and the resulting mass
 * refusal would look like a bug and get removed.
 */
export function blockKey(email: string): string | null {
  const split = splitAddress(email);
  if (!split) return null;
  const { local, domain } = split;

  // Providers that ignore dots: fold them and stop. Do NOT also run the token
  // set here — at these providers a dot is not a name boundary at all, so
  // sorting or dropping around it would be reading structure that isn't there.
  if (DOT_INSENSITIVE_DOMAINS.has(domain)) {
    const folded = local.replace(/\./g, '');
    return folded ? `${folded}@${domain}` : null;
  }

  const tokens = local.split(TOKEN_SEPARATORS).filter(Boolean);
  if (tokens.length === 0) return null;

  const multiChar = tokens.filter((t) => t.length > 1);

  // If dropping single-character tokens would leave NOTHING, keep them all. An
  // initials-only address (`a.b.c@`) must not normalize to an empty local part:
  // `@employer.com` as a key would merge every initials-only mailbox at that
  // employer into one, which is the mass-suppression failure again in miniature.
  const kept = multiChar.length > 0 ? multiChar : tokens;

  return `${[...kept].sort().join('.')}@${domain}`;
}

/** Which identity anchored an authorization, and how strong it was. */
export type AuthorizeSource = 'hubspot_contact_id' | 'canonical_key';

export interface AuthorizeIdentity {
  key: string;
  /** 1 is strongest. Recorded so a decision can be audited against the tier that made it. */
  tier: 1 | 2;
  source: AuthorizeSource;
}

export interface AuthorizeInput {
  hubspotContactId?: string | null;
  canonicalKey?: string | null;
  canonicalStatus?: string | null;
}

/**
 * The STRICT key. Used ONLY to AUTHORIZE. A false merge here lets one person's
 * resolution license a send to a DIFFERENT person, which is the failure that has
 * no recovery, so this key refuses far more often than it resolves.
 *
 * Order, strongest first:
 *   1. HubSpot contact id — the only store with cross-plane visibility.
 *   2. `canonical_key` where `status='resolved'`.
 *
 * Tier 3 (exact validated email identity) is deliberately NOT reachable here.
 * Email is strong enough to refuse a send and too weak to justify one, so it
 * must not appear in the authorizing path at all; a fallback to it would quietly
 * restore the coarse key's error rate on the side where errors are unrecoverable.
 *
 * `status='conflict'` NEVER authorizes. 396 of 1,909 canonical contacts (20.7%)
 * are in conflict, and those are PRECISELY the identities the resolver could not
 * settle. Treating "we could not decide" as "decided yes" inverts the record.
 *
 * Coverage is why two keys exist at all: only 942 of 1,936 personas (48.7%)
 * carry a `hubspot_contact_id`, so this key alone would leave half the estate
 * unauthorizable — and therefore, correctly, unsendable.
 */
export function authorizeKey(input: AuthorizeInput): AuthorizeIdentity | null {
  const hs = typeof input?.hubspotContactId === 'string' ? input.hubspotContactId.trim() : '';
  if (hs) {
    return { key: `hs:${hs}`, tier: 1, source: 'hubspot_contact_id' };
  }

  const ck = typeof input?.canonicalKey === 'string' ? input.canonicalKey.trim() : '';
  // Compared exactly. A case-insensitive or prefix match would let a future
  // status like 'resolved_pending' authorize by accident.
  if (ck && input?.canonicalStatus === 'resolved') {
    return { key: `ck:${ck}`, tier: 2, source: 'canonical_key' };
  }

  return null;
}
