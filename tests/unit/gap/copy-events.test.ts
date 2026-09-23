/**
 * S3-T3: copy events. Pure functions tested directly; recordCopyEvents against
 * a createMany spy.
 */
import { hash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  copyAt,
  copyPropertyName,
  detectCopyDrift,
  parsePropertyName,
  reconstructRenderedSteps,
  recordCopyEvents,
  renderedStepsHash,
  type CopyEvent,
} from '@/lib/gap/sequence/copy-events';
import { canonicalJson } from '@/lib/gap/sequence/steps';

const T = (iso: string) => new Date(iso);

type EvInput = Partial<Omit<CopyEvent, 'ts'>> & { stepIndex: number; field: 'subject' | 'body'; ts: string; newValue: string };

function ev(partial: EvInput): CopyEvent {
  return {
    id: partial.id,
    hubspotContactId: partial.hubspotContactId ?? 'c1',
    accountKey: partial.accountKey ?? 'acme',
    property: partial.property ?? copyPropertyName(partial.stepIndex, partial.field),
    stepIndex: partial.stepIndex,
    field: partial.field,
    oldValue: partial.oldValue ?? null,
    newValue: partial.newValue,
    ts: T(partial.ts),
    source: partial.source ?? 'journal_import',
  };
}

describe('parsePropertyName', () => {
  it('maps yf_top100_step3_body to zero-based step 2, field body', () => {
    expect(parsePropertyName('yf_top100_step3_body')).toEqual({ ok: true, stepIndex: 2, field: 'body' });
    expect(parsePropertyName('yf_top100_step1_subject')).toEqual({ ok: true, stepIndex: 0, field: 'subject' });
  });

  it('refuses bad_property for anything else, including step 0 and unknown fields', () => {
    for (const p of ['yf_top100_step0_body', 'yf_top100_step2_title', 'firstname', 'yf_top100_stepx_body', '']) {
      expect(parsePropertyName(p)).toEqual({ ok: false, reason: 'bad_property' });
    }
  });

  it('round-trips with copyPropertyName', () => {
    expect(copyPropertyName(2, 'body')).toBe('yf_top100_step3_body');
  });
});

describe('copyAt', () => {
  const events = [
    ev({ id: 'e1', stepIndex: 1, field: 'body', ts: '2026-09-12T10:00:00Z', newValue: 'first' }),
    ev({ id: 'e2', stepIndex: 1, field: 'body', ts: '2026-09-14T10:00:00Z', newValue: 'second' }),
    ev({ id: 'e3', stepIndex: 1, field: 'body', ts: '2026-09-18T10:00:00Z', newValue: 'third' }),
    ev({ id: 'e4', stepIndex: 1, field: 'subject', ts: '2026-09-13T10:00:00Z', newValue: 'subj' }),
    ev({ id: 'e5', stepIndex: 2, field: 'body', ts: '2026-09-13T10:00:00Z', newValue: 'other step' }),
  ];

  it('picks the newest event at or before the moment for that step and field', () => {
    expect(copyAt(events, 1, 'body', T('2026-09-15T00:00:00Z'))?.id).toBe('e2');
    expect(copyAt(events, 1, 'body', T('2026-09-19T00:00:00Z'))?.id).toBe('e3');
    expect(copyAt(events, 1, 'subject', T('2026-09-19T00:00:00Z'))?.id).toBe('e4');
  });

  it('an equal timestamp counts; one millisecond earlier does not', () => {
    expect(copyAt(events, 1, 'body', T('2026-09-14T10:00:00.000Z'))?.id).toBe('e2');
    expect(copyAt(events, 1, 'body', T('2026-09-14T09:59:59.999Z'))?.id).toBe('e1');
  });

  it('returns null before the first push and filters by contact when asked', () => {
    expect(copyAt(events, 1, 'body', T('2026-09-01T00:00:00Z'))).toBeNull();
    const mixed = [...events, ev({ id: 'x', hubspotContactId: 'c2', stepIndex: 1, field: 'body', ts: '2026-09-20T00:00:00Z', newValue: 'c2 copy' })];
    expect(copyAt(mixed, 1, 'body', T('2026-09-21T00:00:00Z'), 'c1')?.id).toBe('e3');
    expect(copyAt(mixed, 1, 'body', T('2026-09-21T00:00:00Z'), 'c2')?.id).toBe('x');
  });
});

describe('reconstructRenderedSteps and renderedStepsHash', () => {
  const events = [
    ev({ id: 'e1', stepIndex: 0, field: 'subject', ts: '2026-09-12T10:00:00Z', newValue: 'S1 v1' }),
    ev({ id: 'e2', stepIndex: 0, field: 'body', ts: '2026-09-12T10:00:00Z', newValue: 'B1 v1' }),
    ev({ id: 'e3', stepIndex: 0, field: 'body', ts: '2026-09-16T10:00:00Z', newValue: 'B1 v2' }),
    ev({ id: 'e4', stepIndex: 1, field: 'body', ts: '2026-09-12T10:00:00Z', newValue: 'B2 v1' }),
  ];
  const enrolledAt = T('2026-09-15T12:00:00Z');

  it('renders each step as of enrolled_at with the event ids used', () => {
    const rendered = reconstructRenderedSteps(events, enrolledAt, 3);
    expect(rendered).toEqual([
      { stepIndex: 0, subject: 'S1 v1', body: 'B1 v1', copyEventIds: ['e1', 'e2'] },
      { stepIndex: 1, subject: null, body: 'B2 v1', copyEventIds: ['e4'] },
      { stepIndex: 2, subject: null, body: null, copyEventIds: [] },
    ]);
  });

  it('hashes the copy only, so event ids and a later push do not change it', () => {
    const rendered = reconstructRenderedSteps(events, enrolledAt, 2);
    const expected = hash(
      'sha256',
      canonicalJson([
        { stepIndex: 0, subject: 'S1 v1', body: 'B1 v1' },
        { stepIndex: 1, subject: null, body: 'B2 v1' },
      ]),
      'hex',
    );
    expect(renderedStepsHash(rendered)).toBe(expected);
    const withoutIds = rendered.map((r) => ({ ...r, copyEventIds: [] }));
    expect(renderedStepsHash(withoutIds)).toBe(expected);
    expect(renderedStepsHash(reconstructRenderedSteps(events, T('2026-09-17T00:00:00Z'), 2))).not.toBe(expected);
  });
});

describe('detectCopyDrift', () => {
  const enrolledAt = T('2026-09-15T12:00:00Z');
  const events = [
    ev({ id: 'before', stepIndex: 2, field: 'body', ts: '2026-09-14T00:00:00Z', newValue: 'a' }),
    ev({ id: 'at', stepIndex: 2, field: 'body', ts: '2026-09-15T12:00:00Z', newValue: 'b' }),
    ev({ id: 'sent_step', stepIndex: 0, field: 'body', ts: '2026-09-17T00:00:00Z', newValue: 'c' }),
    ev({ id: 'drift_late', stepIndex: 3, field: 'subject', ts: '2026-09-19T00:00:00Z', newValue: 'e' }),
    ev({ id: 'drift_early', stepIndex: 2, field: 'body', ts: '2026-09-16T00:00:00Z', newValue: 'd' }),
  ];

  it('reports only events after enrolled_at on steps not yet sent, oldest first', () => {
    expect(detectCopyDrift(events, enrolledAt, [0, 1])).toEqual([
      { stepIndex: 2, field: 'body', eventId: 'drift_early', ts: T('2026-09-16T00:00:00Z') },
      { stepIndex: 3, field: 'subject', eventId: 'drift_late', ts: T('2026-09-19T00:00:00Z') },
    ]);
  });

  it('is empty when every touched step was already sent, and when nothing changed after enrollment', () => {
    expect(detectCopyDrift(events, enrolledAt, [0, 1, 2, 3])).toEqual([]);
    expect(detectCopyDrift(events.slice(0, 2), enrolledAt, [])).toEqual([]);
  });
});

describe('recordCopyEvents', () => {
  function makePrisma(count: number) {
    return { sequenceCopyEvent: { createMany: vi.fn<(...args: any[]) => Promise<{ count: number }>>(async () => ({ count })) } };
  }
  const events = [
    ev({ stepIndex: 0, field: 'body', ts: '2026-09-12T10:00:00Z', newValue: 'a' }),
    ev({ stepIndex: 1, field: 'subject', ts: '2026-09-12T10:00:00Z', newValue: 'b' }),
  ];

  it('dry run creates nothing and reports the plan', async () => {
    const prisma = makePrisma(2);
    expect(await recordCopyEvents(prisma, events, { dryRun: true })).toEqual({ ok: true, created: 0, skipped: 0, planned: 2, dryRun: true });
    expect(prisma.sequenceCopyEvent.createMany).not.toHaveBeenCalled();
  });

  it('createMany with skipDuplicates and reports created versus skipped', async () => {
    const prisma = makePrisma(1);
    expect(await recordCopyEvents(prisma, events, { dryRun: false })).toEqual({ ok: true, created: 1, skipped: 1, planned: 2, dryRun: false });
    const args = prisma.sequenceCopyEvent.createMany.mock.calls[0][0];
    expect(args.skipDuplicates).toBe(true);
    expect(args.data[0]).toMatchObject({
      hubspot_contact_id: 'c1',
      account_key: 'acme',
      property: 'yf_top100_step1_body',
      step_index: 0,
      field: 'body',
      new_value: 'a',
      source: 'journal_import',
    });
  });

  it('refuses the whole batch on a bad event before any write', async () => {
    const prisma = makePrisma(0);
    const mismatched = [events[0], { ...events[1], property: 'yf_top100_step3_body' }];
    expect(await recordCopyEvents(prisma, mismatched, { dryRun: false })).toEqual({ ok: false, reason: 'bad_event:1:property_mismatch' });
    const badSource = [{ ...events[0], source: 'rig' as any }];
    expect(await recordCopyEvents(prisma, badSource, { dryRun: false })).toEqual({ ok: false, reason: 'bad_event:0:bad_source' });
    expect(prisma.sequenceCopyEvent.createMany).not.toHaveBeenCalled();
  });

  it('an empty batch makes no call', async () => {
    const prisma = makePrisma(0);
    expect(await recordCopyEvents(prisma, [], { dryRun: false })).toEqual({ ok: true, created: 0, skipped: 0, planned: 0, dryRun: false });
    expect(prisma.sequenceCopyEvent.createMany).not.toHaveBeenCalled();
  });
});
