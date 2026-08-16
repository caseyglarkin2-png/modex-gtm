/**
 * modex's `do_not_contact` leg, made READABLE to the other sending planes.
 *
 * WHY THIS EXISTS (2026-08-16). 242 of 1,936 modex personas carry
 * `do_not_contact = TRUE`. 204 of them are absent from clawd's suppression, and
 * 146 of those are targetable by clawd TODAY. One was already mailed at that
 * exact address. The column had ZERO readers on any send path in any repo:
 * modex's own send routes select `{id, name, email, account_name}` and stop, so
 * the decision was recorded in a place nothing sending could see.
 *
 * THIS IS A READ, NOT A SYNC. Backfilling these 242 rows into clawd's
 * `do_not_send` would fix today and break again tomorrow: modex keeps writing
 * `do_not_contact`, clawd keeps not seeing the new writes, and the two drift
 * apart again the day after the backfill. The authority stays here and is
 * consulted at send time — the same shape as `src/lib/email/autonomy-gate.ts`,
 * where clawd owns the kill-switch and modex reads it rather than mirroring it.
 *
 * THE 503 IS LOad-BEARING. If this leg cannot answer, it MUST fail rather than
 * return an empty suppression list. An empty list is indistinguishable from
 * "nobody here is suppressed", which is exactly how an unreadable authority
 * becomes permission. Callers treat non-200 as UNKNOWN and refuse; a 200
 * carrying `[]` would be read as CLEAR. This mirrors clawd's own convention,
 * which answers 503 when its state store is unreadable rather than a cheerful
 * 200 (see `autonomy-gate.ts`, which honours exactly that).
 *
 * MATCHING IS BY COARSE `blockKey`, BOTH SIDES. Keying only the candidate would
 * still miss `john.drake@homedepot.com` (suppressed here) versus
 * `john_d_drake@homedepot.com` (mailed by clawd), which is one of the two
 * confirmed fires this work exists to stop.
 */
import { blockKey } from '@/lib/identity/person-key';
import { prisma } from '@/lib/prisma';

export interface ModexSuppressionResult {
  /** The subset of the requested addresses that modex says DO NOT CONTACT. */
  suppressed: string[];
  /** How many of the requested addresses could actually be keyed. */
  keyed: number;
  /** Addresses `blockKey` refused. Reported, never silently treated as clear. */
  unkeyable: string[];
}

/**
 * Hard ceiling on one request. Chosen to match clawd's own batch limit on
 * `/api/suppression/check` (500) so the two cannot disagree about what a legal
 * batch is — a caller that chunks for one and not the other would get a 400 on
 * the tail chunk, and a 400 is UNKNOWN, which halts a send.
 */
export const MAX_BATCH = 500;

/**
 * Which addresses in `emails` are suppressed by modex.
 *
 * THROWS on a store failure. It deliberately does not catch and return an empty
 * result: swallowing here would hand the caller a confident "nothing is
 * suppressed", and the caller has no way to tell that apart from a real answer.
 * The route turns a throw into a 503.
 */
export async function findSuppressedPersonas(
  emails: string[],
): Promise<ModexSuppressionResult> {
  const unkeyable: string[] = [];
  // candidate blockKey -> the original addresses that produced it. Several
  // requested addresses can share one key (that is the entire point of the
  // coarse key), and the caller needs each of its OWN strings back, not ours.
  const byKey = new Map<string, string[]>();

  for (const raw of emails) {
    const key = blockKey(raw);
    if (!key) {
      unkeyable.push(raw);
      continue;
    }
    const bucket = byKey.get(key);
    if (bucket) bucket.push(raw);
    else byKey.set(key, [raw]);
  }

  if (byKey.size === 0) {
    return { suppressed: [], keyed: 0, unkeyable };
  }

  // Query by DOMAIN, not by address. We cannot ask Postgres for "rows whose
  // blockKey equals X" without materializing the key in the schema, and the
  // schema is LEAD's to change. Domain is indexed-adjacent, the candidate set
  // per domain is tiny (242 suppressed personas estate-wide), and this keeps
  // the leg working against the bare boolean column as it exists today.
  const domains = [...new Set([...byKey.keys()].map((k) => k.slice(k.lastIndexOf('@') + 1)))];

  const rows = await prisma.persona.findMany({
    where: {
      do_not_contact: true,
      OR: domains.map((d) => ({ email: { endsWith: `@${d}`, mode: 'insensitive' as const } })),
    },
    select: { email: true },
  });

  const suppressedKeys = new Set<string>();
  for (const row of rows) {
    const k = blockKey(row.email ?? '');
    if (k) suppressedKeys.add(k);
  }

  const suppressed: string[] = [];
  for (const [key, originals] of byKey) {
    if (suppressedKeys.has(key)) suppressed.push(...originals);
  }

  return { suppressed, keyed: byKey.size, unkeyable };
}
