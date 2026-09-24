import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/**
 * S2-T1 structural guards (no database).
 *
 * 1. `InboundMessage` carries the additive Sprint 2 columns that let HubSpot
 *    replies share the inbox table with Gmail replies: a `source` discriminator
 *    that defaults to gmail (so every pre-existing row keeps its meaning) and a
 *    nullable `hubspot_engagement_id`, each backed by an index the reply poller
 *    and the inbox readers query on.
 * 2. `KNOWN_CRONS` lists the three GAP cron routes as unregistered. A cron the
 *    monitor does not know about cannot be reported dead, and a schedule label
 *    other than "unregistered" would be a fiction on the operator's screen.
 */

// cron-monitor imports the Prisma client at module scope; this test never
// touches a database, so the client is replaced with an inert stub.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const SCHEMA_PATH = path.resolve(__dirname, '../../../prisma/schema.prisma');

function inboundMessageBlock(): string {
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  const start = schema.indexOf('model InboundMessage {');
  expect(start, 'model InboundMessage is declared in prisma/schema.prisma').toBeGreaterThan(-1);
  const end = schema.indexOf('\n}\n', start);
  expect(end, 'model InboundMessage block is closed').toBeGreaterThan(start);
  return schema.slice(start, end + 3);
}

describe('S2-T1: InboundMessage schema (structural)', () => {
  it('declares source with the gmail default so existing rows keep their meaning', () => {
    const block = inboundMessageBlock();
    expect(block).toMatch(/^\s*source\s+String\s+@default\("gmail"\)\s*$/m);
  });

  it('declares hubspot_engagement_id as an optional String', () => {
    const block = inboundMessageBlock();
    expect(block).toMatch(/^\s*hubspot_engagement_id\s+String\?\s*$/m);
  });

  it('indexes (source, received_at) and hubspot_engagement_id', () => {
    const block = inboundMessageBlock();
    expect(block).toContain('@@index([source, received_at])');
    expect(block).toContain('@@index([hubspot_engagement_id])');
  });

  it('documents the two sources and the hs:<engagementId> id convention', () => {
    const block = inboundMessageBlock();
    const sourceDoc = block.match(/\/\/\/(.*)\n\s*source\s+String/);
    expect(sourceDoc, 'a /// doc comment sits directly above source').not.toBeNull();
    expect(sourceDoc?.[1]).toContain('gmail');
    expect(sourceDoc?.[1]).toContain('hubspot');
    expect(sourceDoc?.[1]).toContain('hs:<engagementId>');
  });

  it('still maps to inbound_messages and keeps the Gmail id as the primary key', () => {
    const block = inboundMessageBlock();
    expect(block).toContain('@@map("inbound_messages")');
    expect(block).toMatch(/^\s*id\s+String\s+@id/m);
  });
});

describe('SF15 (Opus adversarial review, 2026-09-24): the rollback reverts inbound_messages too', () => {
  const ROLLBACK_PATH = path.resolve(__dirname, '../../../prisma/sql/2026-09-23-gap-os-rollback.sql');

  function rollback(): string {
    return readFileSync(ROLLBACK_PATH, 'utf8');
  }

  it('drops both S2-T1 columns on inbound_messages', () => {
    const sql = rollback();
    expect(sql).toMatch(/ALTER TABLE IF EXISTS inbound_messages DROP COLUMN IF EXISTS source;/);
    expect(sql).toMatch(/ALTER TABLE IF EXISTS inbound_messages DROP COLUMN IF EXISTS hubspot_engagement_id;/);
  });

  it('drops both S2-T1 indexes, by name, before the column drops that would also remove them', () => {
    const sql = rollback();
    const sourceIdxAt = sql.indexOf('DROP INDEX IF EXISTS inbound_messages_source_received_at_idx;');
    const engagementIdxAt = sql.indexOf('DROP INDEX IF EXISTS inbound_messages_hubspot_engagement_id_idx;');
    const sourceColAt = sql.indexOf('DROP COLUMN IF EXISTS source;');
    expect(sourceIdxAt).toBeGreaterThan(-1);
    expect(engagementIdxAt).toBeGreaterThan(-1);
    expect(sourceIdxAt).toBeLessThan(sourceColAt);
  });

  it('never touches the pre-existing inbound_messages columns (id, thread_id, from_email, ...)', () => {
    const sql = rollback();
    for (const col of ['id', 'thread_id', 'from_email', 'received_at', 'read']) {
      expect(sql).not.toMatch(new RegExp(`DROP COLUMN IF EXISTS ${col};`));
    }
  });
});

describe('S2-T1: KNOWN_CRONS registry rows for the GAP crons', () => {
  const GAP_CRONS = ['gap-hypothesize', 'gap-enrollment-sync', 'gap-hubspot-replies'] as const;

  it('lists each GAP cron exactly once, on its /api/cron route, as unregistered', async () => {
    const { KNOWN_CRONS } = await import('@/lib/cron-monitor');
    for (const name of GAP_CRONS) {
      const rows = KNOWN_CRONS.filter((c) => c.name === name);
      expect(rows, `${name} is registered exactly once`).toHaveLength(1);
      const row = rows[0];
      expect(row.path, `${name} path`).toBe(`/api/cron/${name}`);
      expect(row.schedule, `${name} must not claim a schedule nothing runs`).toBe(
        'unregistered (manual only)',
      );
      expect(row.label.trim().length, `${name} has a label`).toBeGreaterThan(0);
    }
  });

  it('did not disturb the Vercel-scheduled fleet', async () => {
    const { KNOWN_CRONS } = await import('@/lib/cron-monitor');
    const scheduled = KNOWN_CRONS.filter((c) => !c.schedule.startsWith('unregistered'));
    expect(scheduled.map((c) => c.name)).toEqual([
      'check-inbox',
      'dispatch-daily',
      'qualification',
      'warm-dispatch',
      'daily-digest',
      'drip-sequence',
      'pounce-scan',
      'refresh-intel',
      'sync-hubspot',
      'reenrich-contacts',
    ]);
    const names = KNOWN_CRONS.map((c) => c.name);
    expect(new Set(names).size, 'cron names are unique').toBe(names.length);
  });
});
