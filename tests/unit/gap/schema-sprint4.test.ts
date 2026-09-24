/**
 * S4-T3 structural guards (no database).
 *
 * 1. `ConversationDisposition` carries the additive `metadata Json?` column
 *    (Sprint 2 named debt: resumeAt and referral had nowhere to live but
 *    `ai_suggested`). `ai_suggested` keeps only the AI suggestion.
 * 2. The hand SQL's GAP_DISPOSITION_FROZEN guard freezes `metadata` with
 *    the classes once human_confirmed (a confirmed row's resumeAt is a
 *    fact), and the verifier script exercises exactly that.
 * 3. The AI-row invariant, structurally: the disposition service computes
 *    effects through `dispositionEffects` with the row's real
 *    `humanConfirmed`, and only a human actor can produce a confirmed row.
 * 4. The Sprint 4 audit kinds exist on the union.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { dispositionEffects, NO_EFFECTS } from '@/lib/gap/disposition/model';
import { RESPONSE_CLASSES } from '@/lib/gap/taxonomy';

const ROOT = path.resolve(__dirname, '../../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

function modelBlock(schema: string, name: string): string {
  const start = schema.indexOf(`model ${name} {`);
  expect(start, `model ${name} is declared`).toBeGreaterThan(-1);
  const end = schema.indexOf('\n}\n', start);
  return schema.slice(start, end + 3);
}

describe('S4-T3: ConversationDisposition.metadata (schema)', () => {
  const block = modelBlock(read('prisma/schema.prisma'), 'ConversationDisposition');

  it('declares metadata as an optional Json column and keeps the table map', () => {
    expect(block).toMatch(/^\s*metadata\s+Json\?\s*$/m);
    expect(block).toContain('@@map("conversation_dispositions")');
    expect(block).toContain('@@unique([source_kind, source_id])');
  });

  it('documents what metadata holds and that ai_suggested is the suggestion only', () => {
    const doc = block.match(/\/\/\/(.*)\n\s*metadata\s+Json\?/);
    expect(doc, 'a /// doc comment sits directly above metadata').not.toBeNull();
    expect(doc?.[1]).toContain('resumeAt');
    expect(doc?.[1]).toContain('referral');
    expect(block).toMatch(/ai_suggested\s+Json\?\s*\/\/.*AI suggestion only/);
  });
});

describe('S4-T3: GAP_DISPOSITION_FROZEN freezes metadata (hand SQL + verifier)', () => {
  it('the guard function compares metadata and names it in the refusal list', () => {
    const sql = read('prisma/sql/2026-09-23-gap-os.sql');
    const fn = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION gap_disposition_guard()'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    expect(body).toMatch(/IF NEW\.metadata IS DISTINCT FROM OLD\.metadata THEN changed := array_append\(changed, 'metadata'\); END IF;/);
    // Still after the unconfirmed early return, so an unconfirmed row's metadata stays editable.
    expect(body.indexOf('IF NOT OLD.human_confirmed THEN')).toBeLessThan(body.indexOf("array_append(changed, 'metadata')"));
  });

  it('the verifier asserts metadata is accepted before confirm and refused after', () => {
    const script = read('scripts/gap/verify-triggers.ts');
    expect(script).toContain("'unconfirmed: metadata'");
    expect(script).toContain("'metadata after confirm'");
    expect(script).toContain("'metadata cleared after confirm'");
  });

  it('the rollback notes the column goes with the table', () => {
    expect(read('prisma/sql/2026-09-23-gap-os-rollback.sql')).toMatch(/conversation_dispositions\.metadata/);
  });
});

describe('S4-T3: the AI-row invariant', () => {
  it('behavioral: an unconfirmed row of ANY class has NO_EFFECTS', () => {
    for (const responseClass of RESPONSE_CLASSES) {
      expect(dispositionEffects({ responseClass, humanConfirmed: false })).toBe(NO_EFFECTS);
    }
  });

  it('structural: the service derives effects from the row\'s real humanConfirmed and only a human actor confirms', () => {
    const src = read('src/lib/gap/disposition/service.ts');
    expect(src).toMatch(/const humanConfirmed = input\.actorKind === 'human';/);
    expect(src).toMatch(/dispositionEffects\(\{ responseClass: valid\.responseClass, humanConfirmed \}\)/);
    expect(src).not.toMatch(/humanConfirmed:\s*true/);
    // do_not_contact goes through the one consent writer; the service never spells the column.
    expect(src).toContain("recordUnsubscribe as defaultRecordUnsubscribe } from '@/lib/email/unsubscribe'");
    expect(src).not.toMatch(/do_not_contact\s*:/);
  });

  it('structural: the suggestion writer creates the AI row unconfirmed with created_by ai', () => {
    const src = read('src/lib/gap/replies/suggest.ts');
    expect(src).toMatch(/human_confirmed:\s*false/);
    expect(src).toMatch(/created_by:\s*AI_ACTOR/);
    expect(src).toMatch(/export const AI_ACTOR = 'ai' as const;/);
  });
});

describe('S4-T3: audit kinds', () => {
  it('the union carries the Sprint 4 kinds', () => {
    const src = read('src/lib/gap/audit.ts');
    for (const kind of ['disposition.recorded', 'disposition.effects', 'disposition.referral', 'disposition.retarget', 'bid.captured', 'bid.confirmed', 'reply.suggested', 'reply.suggest_rejected']) {
      expect(src, kind).toContain(`'${kind}'`);
    }
  });
});
