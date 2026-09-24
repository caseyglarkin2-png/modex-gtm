/**
 * N9: GET /api/cron/gap-enrollment-sync mode convention.
 *
 * The route is dry-run unless `?mode=apply`, exactly like POST
 * /api/gap/routing/run. A Bearer call without the mode (a Vercel schedule, an
 * agent) rehearses; only an explicit `?mode=apply` claims the day and writes.
 * `?dryRun=1` wins over everything. The sync itself is mocked here; its
 * behavior is covered in external-sync.test.ts.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncReport } from '@/lib/gap/sequence/external-sync';

const mockedClaim = vi.fn<(...args: unknown[]) => Promise<{ claimed: boolean; reason?: string; key: string }>>();
const mockedRelease = vi.fn(async () => undefined);
const mockedStarted = vi.fn(async () => undefined);
const mockedSuccess = vi.fn(async () => undefined);
const mockedSkipped = vi.fn(async () => undefined);
const mockedFailure = vi.fn(async () => undefined);
const mockedSync = vi.fn<(...args: any[]) => Promise<SyncReport>>();

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-idempotency', () => ({ claimDailyRun: mockedClaim, releaseDailyRun: mockedRelease }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedStarted,
  markCronSuccess: mockedSuccess,
  markCronSkipped: mockedSkipped,
  markCronFailure: mockedFailure,
}));
vi.mock('@/lib/hubspot/client', () => ({
  getHubSpotClient: () => {
    throw new Error('route test reached the HubSpot client');
  },
  isHubSpotConfigured: () => true,
  withHubSpotRetry: async (fn: () => Promise<unknown>) => fn(),
}));
vi.mock('@/lib/gap/sequence/external-sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/sequence/external-sync')>();
  return { ...actual, runEnrollmentSync: mockedSync };
});

const { GET } = await import('@/app/api/cron/gap-enrollment-sync/route');

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'gap');

function report(dryRun: boolean): SyncReport {
  return {
    dryRun,
    families: { created: 0, existing: 2, skipped: [] },
    contactsRead: 7,
    enrollments: { created: 0, updated: 0, unchanged: 1, otherSequenceActive: 0, held: [], suppressedButEnrolled: [] },
    reported: { other_sequence: 1, not_enrolled: 5, no_email: 0, no_contact_id: 0 },
    rostersMissing: ['jbhunt-com'],
  };
}

function req(query = '', headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/cron/gap-enrollment-sync${query}`, { headers });
}

const BEARER = { authorization: 'Bearer cron-secret' };

describe('GET /api/cron/gap-enrollment-sync mode convention (N9)', () => {
  let lane: string;
  let savedEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // A lane checkout the route can read: run_manifest.json + data/roster/<key>.json.
    lane = mkdtempSync(join(tmpdir(), 'gap-lane-'));
    mkdirSync(join(lane, 'data', 'roster'), { recursive: true });
    writeFileSync(join(lane, 'run_manifest.json'), readFileSync(join(FIXTURES, 'top100-manifest.json')));
    writeFileSync(join(lane, 'data', 'roster', 'dell-com.json'), readFileSync(join(FIXTURES, 'top100-roster.json')));
  });

  afterAll(() => {
    rmSync(lane, { recursive: true, force: true });
  });

  beforeEach(() => {
    savedEnv = { ...process.env };
    process.env.CRON_SECRET = 'cron-secret';
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    process.env.GAP_TOP100_DIR = lane;
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    mockedClaim.mockReset();
    mockedClaim.mockResolvedValue({ claimed: true, key: 'k' });
    mockedSync.mockReset();
    mockedSync.mockImplementation(async (_prisma, opts) => report(opts.dryRun));
    mockedStarted.mockClear();
    mockedSkipped.mockClear();
    mockedSuccess.mockClear();
    mockedFailure.mockClear();
    mockedRelease.mockClear();
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    for (const [key, value] of Object.entries(savedEnv)) if (value !== undefined) process.env[key] = value;
  });

  it('a Bearer call WITHOUT ?mode is a dry run: no claim, dryRun true, mode dryrun', async () => {
    const res = await GET(req('', BEARER));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'dryrun', dryRun: true });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedSync).toHaveBeenCalledTimes(1);
    expect(mockedSync.mock.calls[0][1]).toMatchObject({ dryRun: true, actor: 'gap-enrollment-sync', program: 'top100-2026-09-12', portal: '3819073' });
  });

  it('a Bearer call with ?mode=apply claims the day and applies', async () => {
    const res = await GET(req('?mode=apply', BEARER));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'apply', dryRun: false });
    expect(mockedClaim).toHaveBeenCalledWith('gap-enrollment-sync', expect.any(Date));
    expect(mockedSync.mock.calls[0][1]).toMatchObject({ dryRun: false });
    expect(mockedSuccess).toHaveBeenCalledTimes(1);
  });

  it('a manual ?secret= call without ?mode is a dry run too', async () => {
    const res = await GET(req('?secret=cron-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ mode: 'dryrun', dryRun: true });
    expect(mockedClaim).not.toHaveBeenCalled();
  });

  it('?dryRun=1 forces a dry run even with ?mode=apply', async () => {
    const res = await GET(req('?mode=apply&dryRun=1', BEARER));
    expect(await res.json()).toMatchObject({ mode: 'dryrun', dryRun: true });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedSync.mock.calls[0][1]).toMatchObject({ dryRun: true });
  });

  it('a second ?mode=apply the same day is skipped by the claim with its reason', async () => {
    mockedClaim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const res = await GET(req('?mode=apply', BEARER));
    expect(await res.json()).toEqual({ skipped: true, reason: 'already-ran-today' });
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it('the roster on disk reaches the sync keyed by account, and a missing roster is left out', async () => {
    await GET(req('', BEARER));
    const opts = mockedSync.mock.calls[0][1];
    expect(Object.keys(opts.rosters)).toEqual(['dell-com']);
    expect(opts.rosters['dell-com']).toHaveLength(7);
  });

  it('releases the claim and answers 500 when the sync throws in apply mode', async () => {
    mockedSync.mockRejectedValueOnce(new Error('hubspot down'));
    const res = await GET(req('?mode=apply', BEARER));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'hubspot down' });
    expect(mockedRelease).toHaveBeenCalledWith('gap-enrollment-sync', expect.any(Date));
    expect(mockedFailure).toHaveBeenCalledTimes(1);
  });
});
