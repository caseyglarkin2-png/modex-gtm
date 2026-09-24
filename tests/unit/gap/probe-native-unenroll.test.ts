/**
 * S4-T6: the PREPARED-ONLY native unenroll-on-reply probe.
 *
 * No test here reaches the network: the dry and refused paths never touch
 * fetch by construction, and the one live-read test injects a fake fetch
 * that records every request. The ambient HUBSPOT_ACCESS_TOKEN is never
 * read: every run gets its own env object.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  checkOwnerGo,
  emailAssociationsUrl,
  enrollmentsUrl,
  evaluate,
  recordedOwnerGoDates,
  runProbe,
  sequenceUrl,
} from '@/scripts/gap/probe-native-unenroll';

const SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'gap', 'probe-native-unenroll.ts');
const SPEC_PATH = path.join(process.cwd(), 'docs', 'GAP_PROSPECTING_OS.md');
const FAKE_TOKEN = 'pat-na1-0000-fake-token-never-printed';

const SPEC_NO_GO = ['## 15. Owner decisions', '- GO for Sprint 1.', '', '## 16. Provenance', 'text'].join('\n');
const SPEC_WITH_GO = [
  '## 15. Owner decisions',
  '- GO for Sprint 1.',
  '- OWNER GO native unenroll 2026-09-30: read-only probe on one Top100 sequence with an internal contact.',
  '',
  '## 16. Provenance',
  'OWNER GO native unenroll 2099-01-01 (outside section 15, must not count)',
].join('\n');

function neverFetch(): typeof fetch {
  return vi.fn(async () => {
    throw new Error('fetch must not be called');
  }) as unknown as typeof fetch;
}

describe('owner go parsing', () => {
  it('reads dates only from OWNER GO native unenroll lines inside section 15', () => {
    expect(recordedOwnerGoDates(SPEC_NO_GO)).toEqual([]);
    expect(recordedOwnerGoDates(SPEC_WITH_GO)).toEqual(['2026-09-30']);
  });

  it('refuses owner_go_not_recorded, then owner_go_env_missing, then owner_go_mismatch, then passes', () => {
    expect(checkOwnerGo('2026-09-30', SPEC_NO_GO)).toMatchObject({ ok: false, reason: 'owner_go_not_recorded' });
    expect(checkOwnerGo(undefined, SPEC_WITH_GO)).toMatchObject({ ok: false, reason: 'owner_go_env_missing' });
    expect(checkOwnerGo('2026-09-29', SPEC_WITH_GO)).toMatchObject({ ok: false, reason: 'owner_go_mismatch' });
    expect(checkOwnerGo('2026-09-30', SPEC_WITH_GO)).toEqual({ ok: true, date: '2026-09-30' });
  });
});

describe('dry run', () => {
  it('prints the three read request shapes and the criterion, makes no network call, and drops the token', async () => {
    const env: Record<string, string | undefined> = { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN };
    const fetchImpl = neverFetch();
    const outcome = await runProbe({ argv: [], env, specText: SPEC_WITH_GO, fetchImpl });
    const text = outcome.lines.join('\n');

    expect(outcome.code).toBe(0);
    expect(text).toContain('DRY RUN. No network call is made in this mode.');
    expect(text).toContain(`GET ${enrollmentsUrl('<contact-id>')}`);
    expect(text).toContain(`GET ${sequenceUrl('<sequence-id>')}`);
    expect(text).toContain(`GET ${emailAssociationsUrl('<contact-id>')}`);
    expect(text).toContain('GET https://api.hubapi.com/crm/v3/objects/emails/<email-id>?properties=hs_timestamp,hs_email_direction,hs_email_from_email,hs_email_subject');
    expect(text).toContain('Criterion BEFORE: the enrollment for the sequence is present and reads active.');
    expect(text).toContain('Criterion AFTER (both required):');
    expect(text).toContain('hs_timestamp is after the enrollment\'s enrolledAt');
    expect(text).toContain('no longer reads active');
    expect(text).toContain('VERDICT PASS');
    expect(text).toContain('VERDICT FAIL');
    expect(text).toContain('REFUSED: owner_go_not_recorded');

    expect(text).not.toContain(FAKE_TOKEN);
    expect(env.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('echoes the given ids into the plan without holding the token', async () => {
    const env: Record<string, string | undefined> = { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN, OWNER_GO_NATIVE_UNENROLL: '2026-09-30' };
    const outcome = await runProbe({
      argv: ['--sequence-id', '777', '--contact-id', '4242', '--contact-email', 'probe@yardflow.ai'],
      env,
      specText: SPEC_WITH_GO,
      fetchImpl: neverFetch(),
    });
    const text = outcome.lines.join('\n');
    expect(outcome.code).toBe(0);
    expect(text).toContain(enrollmentsUrl('4242'));
    expect(text).toContain(sequenceUrl('777'));
    expect(text).toContain('probe@yardflow.ai');
    expect(text).not.toContain(FAKE_TOKEN);
    // A matching owner go without --confirm is still a dry run and still drops the token.
    expect(env.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
  });
});

describe('--confirm gates (refused before any network call)', () => {
  it('refuses owner_go_not_recorded when section 15 has no OWNER GO native unenroll line, and drops the token', async () => {
    const env: Record<string, string | undefined> = { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN, OWNER_GO_NATIVE_UNENROLL: '2026-09-30' };
    const fetchImpl = neverFetch();
    const outcome = await runProbe({
      argv: ['--confirm', '--phase', 'before', '--sequence-id', '777', '--contact-id', '4242', '--contact-email', 'probe@yardflow.ai'],
      env,
      specText: SPEC_NO_GO,
      fetchImpl,
    });
    expect(outcome.code).toBe(2);
    expect(outcome.lines.join('\n')).toMatch(/^REFUSED: owner_go_not_recorded/m);
    expect(outcome.lines.join('\n')).not.toContain(FAKE_TOKEN);
    expect(env.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses owner_go_env_missing and owner_go_mismatch when the line exists but the env does not match', async () => {
    const missing = await runProbe({
      argv: ['--confirm', '--phase', 'before'],
      env: { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN },
      specText: SPEC_WITH_GO,
      fetchImpl: neverFetch(),
    });
    expect(missing.code).toBe(2);
    expect(missing.lines.join('\n')).toMatch(/^REFUSED: owner_go_env_missing/m);

    const env: Record<string, string | undefined> = { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN, OWNER_GO_NATIVE_UNENROLL: '2026-01-01' };
    const mismatch = await runProbe({ argv: ['--confirm', '--phase', 'before'], env, specText: SPEC_WITH_GO, fetchImpl: neverFetch() });
    expect(mismatch.code).toBe(2);
    expect(mismatch.lines.join('\n')).toMatch(/^REFUSED: owner_go_mismatch/m);
    expect(env.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
  });

  it('with the owner go held, still refuses on a missing phase, ids, an external contact email, or no token', async () => {
    const base = { specText: SPEC_WITH_GO, fetchImpl: neverFetch() };
    const go = { OWNER_GO_NATIVE_UNENROLL: '2026-09-30' };
    const all = ['--confirm', '--phase', 'after', '--sequence-id', '777', '--contact-id', '4242', '--contact-email'];

    const noPhase = await runProbe({ ...base, argv: ['--confirm'], env: { ...go, HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN } });
    expect(noPhase.lines.at(-1)).toBe('REFUSED: --phase before|after is required');

    const badPhase = await runProbe({ ...base, argv: ['--confirm', '--phase', 'during'], env: { ...go } });
    expect(badPhase.lines.at(-1)).toBe('REFUSED: unknown or malformed argument --phase during');

    const external = await runProbe({ ...base, argv: [...all, 'buyer@acme.com'], env: { ...go, HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN } });
    expect(external.lines.at(-1)).toBe('REFUSED: contact email buyer@acme.com is not on an internal domain (freightroll.com, yardflow.ai)');

    const noToken = await runProbe({ ...base, argv: [...all, 'probe@freightroll.com'], env: { ...go } });
    expect(noToken.lines.at(-1)).toBe('REFUSED: HUBSPOT_ACCESS_TOKEN is not set');

    for (const o of [noPhase, badPhase, external, noToken]) expect(o.code).toBe(2);
    expect(base.fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses against the committed spec with the env unset, so nothing can run today', async () => {
    const env: Record<string, string | undefined> = { HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN };
    const fetchImpl = neverFetch();
    const outcome = await runProbe({ argv: ['--confirm', '--phase', 'before'], env, fetchImpl });
    expect(outcome.code).toBe(2);
    expect(outcome.lines.join('\n')).toMatch(/^REFUSED: owner_go_(not_recorded|env_missing)/m);
    expect(env.HUBSPOT_ACCESS_TOKEN).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fs.existsSync(SPEC_PATH)).toBe(true);
  });
});

describe('live reads (fake fetch): only GET, and the criterion', () => {
  function fakeHubSpot(state: { enrollmentStatus: string | null; replyAt: string | null }) {
    const calls: Array<{ url: string; method: string | undefined }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, method: init?.method });
      let body: unknown = {};
      if (url.includes('/automation/v4/sequences/enrollments/contact/4242')) {
        body = {
          results: state.enrollmentStatus
            ? [{ id: 'enr_1', sequenceId: '777', status: state.enrollmentStatus, enrolledAt: '2026-09-30T14:00:00Z' }]
            : [],
        };
      } else if (url.includes('/automation/v4/sequences/777')) {
        body = { id: '777', name: 'YF | Top100 | Acme', settings: { unenrollOnReply: true, sendWindowStartsAtMinute: 480 } };
      } else if (url.includes('/crm/v4/objects/contacts/4242/associations/emails')) {
        body = { results: state.replyAt ? [{ toObjectId: 9001 }, { toObjectId: 9002 }] : [] };
      } else if (url.includes('/crm/v3/objects/emails/9001')) {
        body = { id: '9001', properties: { hs_email_direction: 'EMAIL', hs_email_from_email: 'casey@freightroll.com', hs_timestamp: '2026-09-30T14:00:05Z', hs_email_subject: 'step 1' } };
      } else if (url.includes('/crm/v3/objects/emails/9002')) {
        body = { id: '9002', properties: { hs_email_direction: 'INCOMING_EMAIL', hs_email_from_email: 'probe@yardflow.ai', hs_timestamp: state.replyAt, hs_email_subject: 'Re: step 1' } };
      }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    return { fetchImpl, calls };
  }

  const argv = (phase: string) => ['--confirm', '--phase', phase, '--sequence-id', '777', '--contact-id', '4242', '--contact-email', 'probe@yardflow.ai'];
  const env = () => ({ HUBSPOT_ACCESS_TOKEN: FAKE_TOKEN, OWNER_GO_NATIVE_UNENROLL: '2026-09-30' });

  it('BEFORE: an active enrollment reads READY; every request is a GET with the bearer header and none is printed', async () => {
    const { fetchImpl, calls } = fakeHubSpot({ enrollmentStatus: 'ACTIVE', replyAt: null });
    const outcome = await runProbe({ argv: argv('before'), env: env(), specText: SPEC_WITH_GO, fetchImpl });
    const text = outcome.lines.join('\n');
    expect(outcome.code).toBe(0);
    expect(text).toContain('VERDICT (before): READY. enrollment enr_1 reads ACTIVE');
    expect(text).toContain('reply/unenroll keys {"unenrollOnReply":true}');
    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const c of calls) expect(c.method).toBe('GET');
    expect(text).not.toContain(FAKE_TOKEN);
  });

  it('AFTER: reply seen and enrollment no longer active reads PASS', async () => {
    const { fetchImpl, calls } = fakeHubSpot({ enrollmentStatus: 'UNENROLLED', replyAt: '2026-09-30T15:10:00Z' });
    const outcome = await runProbe({ argv: argv('after'), env: env(), specText: SPEC_WITH_GO, fetchImpl });
    expect(outcome.code).toBe(0);
    expect(outcome.lines.join('\n')).toContain('VERDICT (after): PASS. reply 9002 at 2026-09-30T15:10:00.000Z seen and the enrollment reads UNENROLLED');
    for (const c of calls) expect(c.method).toBe('GET');
  });

  it('AFTER: reply seen but enrollment still active reads FAIL; no reply reads INCONCLUSIVE', async () => {
    const stillActive = await runProbe({
      argv: argv('after'),
      env: env(),
      specText: SPEC_WITH_GO,
      fetchImpl: fakeHubSpot({ enrollmentStatus: 'ACTIVE', replyAt: '2026-09-30T15:10:00Z' }).fetchImpl,
    });
    expect(stillActive.code).toBe(1);
    expect(stillActive.lines.join('\n')).toContain('VERDICT (after): FAIL. reply 9002 at 2026-09-30T15:10:00.000Z seen but enrollment enr_1 still reads ACTIVE');

    const noReply = await runProbe({
      argv: argv('after'),
      env: env(),
      specText: SPEC_WITH_GO,
      fetchImpl: fakeHubSpot({ enrollmentStatus: 'ACTIVE', replyAt: null }).fetchImpl,
    });
    expect(noReply.code).toBe(1);
    expect(noReply.lines.join('\n')).toContain('VERDICT (after): INCONCLUSIVE. no INCOMING_EMAIL from the contact after the enrollment');
  });

  it('evaluate ignores a reply that predates the enrollment', () => {
    const enrollments = [{ id: 'enr_1', status: 'ACTIVE', enrolledAt: new Date('2026-09-30T14:00:00Z'), raw: {} }];
    const stale = [{ id: '9000', from: 'probe@yardflow.ai', timestamp: new Date('2026-09-29T09:00:00Z'), subject: 'old' }];
    expect(evaluate('after', enrollments, stale).verdict).toBe('INCONCLUSIVE');
    expect(evaluate('before', [], []).verdict).toBe('NOT_ENROLLED');
  });
});

describe('structural: the probe file cannot write', () => {
  const source = fs.readFileSync(SCRIPT_PATH, 'utf8');

  it('contains no POST, PATCH, PUT or DELETE token anywhere, and every method is GET', () => {
    expect(source).not.toMatch(/\b(POST|PATCH|PUT|DELETE)\b/);
    const methods = [...source.matchAll(/method:\s*'([A-Z]+)'/g)].map((m) => m[1]);
    expect(methods.length).toBeGreaterThan(0);
    expect(new Set(methods)).toEqual(new Set(['GET']));
  });

  it('never imports a HubSpot writer or the SDK client', () => {
    expect(source).not.toMatch(/@\/lib\/hubspot|@hubspot\/api-client|hubspot-mirror/);
  });

  it('carries no em dash', () => {
    expect(source).not.toContain('—');
  });
});
