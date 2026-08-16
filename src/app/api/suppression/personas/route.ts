import { NextRequest, NextResponse } from 'next/server';
import { findSuppressedPersonas, MAX_BATCH } from '@/lib/suppression/modex-leg';

export const dynamic = 'force-dynamic';

/**
 * modex's do-not-contact leg of the cross-plane suppression contract.
 *
 * POST { emails: string[] }  ->  200 { ok, suppressed[], keyed, unkeyable[] }
 *                            ->  503 { ok: false, error }  when the store is unreadable
 *
 * Read-only. It never sends and never writes; it only answers "has modex been
 * told not to contact these people?".
 *
 * WHY 503 AND NOT 200-WITH-EMPTY. This is the single most important line in the
 * file. An empty `suppressed[]` means "we checked, nobody is suppressed". A
 * failure must NOT produce that shape, because the caller cannot tell the two
 * apart, and treating an unreadable authority as a clear one is precisely the
 * defect this contract exists to close. Callers map non-200 to UNKNOWN and
 * refuse the send. Same convention as clawd's autonomy endpoint, which answers
 * 503 rather than a cheerful 200 when its own store is down.
 *
 * Auth reuses POUNCE_INGEST_TOKEN, the existing clawd<->modex shared secret, so
 * this introduces no new credential to distribute or rotate. An ABSENT token is
 * a 401, never an open door: absent config is not permission, and an
 * unauthenticated 401 is UNKNOWN to the caller, which refuses.
 */
export async function POST(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }

  const emails = (body as { emails?: unknown })?.emails;
  if (!Array.isArray(emails) || emails.some((e) => typeof e !== 'string')) {
    return NextResponse.json({ ok: false, error: 'emails must be string[]' }, { status: 400 });
  }
  if (emails.length > MAX_BATCH) {
    return NextResponse.json(
      { ok: false, error: `batch too large (max ${MAX_BATCH})` },
      { status: 400 },
    );
  }

  try {
    const result = await findSuppressedPersonas(emails as string[]);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Deliberately NOT a 200 with an empty list. See the header.
    return NextResponse.json(
      {
        ok: false,
        error: `modex suppression store unreadable: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      },
      { status: 503 },
    );
  }
}
