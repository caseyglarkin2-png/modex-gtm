// @vitest-environment node
/**
 * X03 (GAP OS sales execution engine, 2026-10-08): the seller settings live in the product (SystemConfig
 * `gap:seller:settings`), never in an env var: where the morning briefing goes, at what New York hour, which
 * addresses may command GAP by email, the operating mode and the daily targets. Pinned: the GAP mailbox itself is
 * refused as the briefing address and as a command sender (a reply to oneself lands in Sent and is never read: the
 * review's B6); `execute` is refused until its amendment is recorded (the review's B1); addresses are lowercased and
 * deduplicated; the hour is 0..23; targets are whole numbers of known kinds; absent settings read as the defaults
 * (nothing is sent to nobody); a save is one upsert plus one `seller.settings_changed` ledger row; the route is
 * session-only behind the flag.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';

const h = vi.hoisted(() => ({ client: null as unknown, email: 'casey@freightroll.com' as string | null }));
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return h.client;
  },
}));
vi.mock('@/lib/auth', () => ({ auth: async () => (h.email ? { user: { email: h.email } } : null) }));

import { DEFAULT_SELLER_SETTINGS, SELLER_SETTINGS_KEY, loadSellerSettings, saveSellerSettings, validateSellerSettings } from '@/lib/gap/work/settings';
import { GET, POST } from '@/app/api/gap/settings/route';

const GAP_MAILBOX = 'casey@yardflow.ai';
const good = { briefingTo: 'Casey@FreightRoll.com', briefingHourNy: 7, commandSenders: ['casey@freightroll.com', 'CASEY@freightroll.com', 'caseyglarkin2@gmail.com'], mode: 'review', targets: { first_touches: 5, calls: 10 } };

describe('X03: validateSellerSettings', () => {
  const v = (over: Record<string, unknown>) => validateSellerSettings({ ...good, ...over }, { gapMailbox: GAP_MAILBOX });

  it('accepts the seller\'s own addresses, lowercased and deduplicated, with the mode and targets', () => {
    const r = v({});
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.briefingTo).toBe('casey@freightroll.com');
    expect(r.value.commandSenders).toEqual(['casey@freightroll.com', 'caseyglarkin2@gmail.com']);
    expect(r.value.mode).toBe('review');
    expect(r.value.briefingHourNy).toBe(7);
    expect(r.value.targets).toEqual({ first_touches: 5, calls: 10 });
  });

  it('refuses the GAP mailbox as the briefing address (a reply to oneself is never read)', () => {
    expect(v({ briefingTo: 'Casey@YardFlow.ai' })).toEqual({ ok: false, field: 'briefingTo', reason: 'briefing_to_is_gap_mailbox' });
  });

  it('refuses the GAP mailbox among the command senders', () => {
    expect(v({ commandSenders: ['casey@freightroll.com', GAP_MAILBOX] })).toEqual({ ok: false, field: 'commandSenders', reason: 'command_sender_is_gap_mailbox' });
  });

  it('refuses execute until its amendment is recorded; prepare and review are the modes', () => {
    expect(v({ mode: 'execute' })).toEqual({ ok: false, field: 'mode', reason: 'execute_mode_not_amended' });
    expect(v({ mode: 'prepare' }).ok).toBe(true);
    expect(v({ mode: 'send' })).toEqual({ ok: false, field: 'mode', reason: 'unknown_mode' });
  });

  it('refuses a bad address, an hour outside 0..23, and a target that is not a whole number of a known kind', () => {
    expect(v({ briefingTo: 'not-an-address' })).toEqual({ ok: false, field: 'briefingTo', reason: 'invalid_email' });
    expect(v({ commandSenders: ['casey@freightroll.com', 'nope'] })).toEqual({ ok: false, field: 'commandSenders', reason: 'invalid_email' });
    expect(v({ briefingHourNy: 24 })).toEqual({ ok: false, field: 'briefingHourNy', reason: 'hour_out_of_range' });
    expect(v({ briefingHourNy: 6.5 })).toEqual({ ok: false, field: 'briefingHourNy', reason: 'hour_out_of_range' });
    expect(v({ targets: { first_touches: -1 } })).toEqual({ ok: false, field: 'targets', reason: 'target_not_a_count' });
    expect(v({ targets: { tweets: 3 } })).toEqual({ ok: false, field: 'targets', reason: 'unknown_target_kind' });
  });

  it('a briefing address may be empty (no briefing) and the senders may be empty (no email commands)', () => {
    const r = v({ briefingTo: null, commandSenders: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.briefingTo).toBeNull();
  });
});

describe('X03: the store', () => {
  let db: ReturnType<typeof ledgerDb>;
  beforeEach(() => {
    db = ledgerDb();
    h.client = db.client();
  });

  it('absent settings read as the defaults: no briefing address, no command senders, prepare, 7 am, no targets', async () => {
    const s = await loadSellerSettings(h.client);
    expect(s).toEqual(DEFAULT_SELLER_SETTINGS);
    expect(s.briefingTo).toBeNull();
    expect(s.commandSenders).toEqual([]);
    expect(s.mode).toBe('prepare');
  });

  it('a save is one upsert on the key plus one ledger row, and reads back on a fresh client', async () => {
    const r = validateSellerSettings(good, { gapMailbox: GAP_MAILBOX });
    if (!r.ok) throw new Error(r.reason);
    await saveSellerSettings(h.client, r.value, 'casey@freightroll.com');
    expect(db.store.systemConfig).toHaveLength(1);
    expect(db.store.systemConfig[0].key).toBe(SELLER_SETTINGS_KEY);
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === 'seller.settings_changed');
    expect(rows).toHaveLength(1);
    expect(rows[0].actor).toBe('casey@freightroll.com');
    expect(rows[0].payload.mode).toBe('review');
    const back = await loadSellerSettings(db.client());
    expect(back.briefingTo).toBe('casey@freightroll.com');
    expect(back.commandSenders).toEqual(['casey@freightroll.com', 'caseyglarkin2@gmail.com']);
    await saveSellerSettings(h.client, { ...r.value, mode: 'prepare' }, 'casey@freightroll.com');
    expect(db.store.systemConfig).toHaveLength(1);
    expect((await loadSellerSettings(db.client())).mode).toBe('prepare');
  });

  it('a corrupt row reads as the defaults, never throws', async () => {
    db.store.systemConfig.push({ key: SELLER_SETTINGS_KEY, value: '{not json' });
    expect(await loadSellerSettings(db.client())).toEqual(DEFAULT_SELLER_SETTINGS);
  });
});

describe('X03: GET/POST /api/gap/settings', () => {
  let db: ReturnType<typeof ledgerDb>;
  const post = (body: unknown) => new NextRequest('http://localhost/api/gap/settings', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    process.env.GAP_GMAIL_USER_EMAIL = GAP_MAILBOX;
    h.email = 'casey@freightroll.com';
    db = ledgerDb();
    h.client = db.client();
  });

  it('404 with the flag off; 401 without a session', async () => {
    process.env.GAP_ROUTING_ENABLED = 'false';
    expect((await GET()).status).toBe(404);
    process.env.GAP_ROUTING_ENABLED = 'true';
    h.email = null;
    expect((await GET()).status).toBe(401);
    expect((await POST(post(good))).status).toBe(401);
    expect(db.store.systemConfig).toHaveLength(0);
  });

  it('GET answers the current settings and the GAP mailbox it will refuse; POST validates, saves and answers what was saved', async () => {
    const before = await (await GET()).json();
    expect(before.settings).toEqual(DEFAULT_SELLER_SETTINGS);
    expect(before.gapMailbox).toBe(GAP_MAILBOX);
    const bad = await POST(post({ ...good, briefingTo: GAP_MAILBOX }));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'briefing_to_is_gap_mailbox', field: 'briefingTo' });
    expect(db.store.systemConfig).toHaveLength(0);
    const ok = await POST(post(good));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.settings.briefingTo).toBe('casey@freightroll.com');
    expect(body.settings.mode).toBe('review');
    expect(db.store.systemConfig).toHaveLength(1);
    expect((await (await GET()).json()).settings.mode).toBe('review');
  });
});
