/**
 * The middleware matcher decides which routes get the session wrapper, and it
 * is the reason an API route can hold a perfectly good token check that never
 * runs.
 *
 * MEASURED 2026-08-16. `/api/suppression/personas` shipped with its own
 * `x-pounce-token` check and was still answering
 * `401 {"error":"Authentication required"}` in production - the session
 * wrapper's message, not the route's `{"ok":false,"error":"Unauthorized"}`.
 * The route was never reached. Every clawd suppression lookup would have read
 * UNREADABLE, which the contract maps to UNKNOWN, which refuses the send. The
 * gate would have held Monday's entire wave at 100% while looking exactly like
 * a working fail-closed gate.
 *
 * That distinction is the whole point of this file: a fail-closed leg with no
 * reachable authority is an OUTAGE WEARING A GATE'S CLOTHES. A test that only
 * asserts "unauthenticated requests are refused" cannot tell the two apart,
 * because both refuse. So these assert REACHABILITY - that the wrapper does
 * not capture the paths that carry their own auth - and pair every exemption
 * with a control path that MUST still be captured. Without the controls this
 * file would pass against a matcher that exempts everything.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The matcher is READ FROM SOURCE rather than imported, because importing
 * middleware.ts drags in next-auth and fails to resolve under vitest - which
 * collects 0 tests and reports as a failed suite, not as a passing one. A test
 * that cannot load its subject proves nothing either way, so it reads the one
 * string it needs out of the real file. A copy of the regex here would be a
 * mirrored constant, and mirrored constants rot.
 */
const SOURCE = readFileSync(resolve(__dirname, '../../middleware.ts'), 'utf8');
const MATCHER_LINE = SOURCE.match(/^\s*'(\/\(\(\?!.*)',\s*$/m);

const matcher = new RegExp(`^${MATCHER_LINE?.[1].replace(/\\\\/g, '\\')}$`);
const isWrapped = (path: string) => matcher.test(path);

/** Routes that authenticate themselves and MUST bypass the session wrapper. */
const SELF_AUTHENTICATING = [
  ['/api/suppression/personas', 'x-pounce-token — the cross-plane suppression leg'],
  ['/api/suppression/personas/', 'same, trailing slash (next.config trailingSlash: true)'],
  ['/api/pounce/ingest', 'x-pounce-token'],
  ['/api/intel/export', 'x-queue-secret'],
  ['/api/geocode', 'QUEUE_AGENT_SECRET'],
  ['/api/cron/queue/due', 'CRON_SECRET'],
  ['/api/webhooks/hubspot', 'inbound provider webhook'],
  ['/api/unsubscribe', 'public by law, not by oversight'],
] as const;

/** The control. If these stop being wrapped, the matcher has been widened. */
const MUST_STAY_PROTECTED = [
  '/api/accounts/acme',
  '/api/contacts',
  '/contacts',
  '/dashboard',
] as const;

describe('middleware matcher', () => {
  it.each(SELF_AUTHENTICATING)('does not wrap %s (%s)', (path) => {
    expect(isWrapped(path)).toBe(false);
  });

  it.each(MUST_STAY_PROTECTED)('still wraps %s', (path) => {
    expect(isWrapped(path)).toBe(true);
  });

  it('exempts the suppression leg under BOTH slash forms, because one is a 308 to the other', () => {
    // modex runs trailingSlash: true to match yardflow.ai. A caller posting to
    // the bare path gets a 308, and Python's urllib does not follow 308 for a
    // POST - it raises. An exemption that covers only one form leaves the leg
    // unreadable for whichever caller guesses wrong.
    expect(isWrapped('/api/suppression/personas')).toBe(false);
    expect(isWrapped('/api/suppression/personas/')).toBe(false);
  });
});

describe('the matcher was actually found', () => {
  it('extracted a matcher from middleware.ts rather than silently matching nothing', () => {
    // Without this, a regex that failed to extract would make every isWrapped()
    // return false and the exemption assertions would all pass vacuously.
    expect(MATCHER_LINE).not.toBeNull();
    expect(matcher.source.length).toBeGreaterThan(100);
  });
});
