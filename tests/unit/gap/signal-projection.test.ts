import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  fromEvidenceRecord,
  fromOperatorKnowledge,
  fromPicCitation,
  fromPounceTrigger,
  fromTop100Evidence,
  type EvidenceRecordRow,
  type PicCitationRow,
  type PounceTriggerRow,
  type Top100EvidenceRow,
} from '@/lib/gap/signals/projection';
import { SIGNAL_TTL_DAYS } from '@/lib/gap/signals/freshness';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-23T12:00:00.000Z');
const CTX = { registeredBy: 'test-suite', now: NOW };

function expectOk<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got refusal: ${JSON.stringify(r)}`);
  return r as Extract<T, { ok: true }>;
}

// ---------------------------------------------------------------------------
// Pounce triggers
// ---------------------------------------------------------------------------

function pounce(overrides: Partial<PounceTriggerRow> = {}): PounceTriggerRow {
  return {
    id: 42,
    url_hash: 'abc',
    account_slug: 'acme',
    account_name: 'Acme Logistics',
    title: '  Acme opens robotic yard in Ohio  ',
    url: 'https://news.example.com/acme',
    source: 'news',
    score: 9,
    categories: ['autonomy', 'expansion'],
    published_at: new Date('2026-09-10T00:00:00.000Z'),
    first_seen_at: new Date('2026-09-12T00:00:00.000Z'),
    hubspot_company_id: '123456',
    dismissed: false,
    ...overrides,
  };
}

describe('fromPounceTrigger', () => {
  it('maps the field set', () => {
    const { signal } = expectOk(fromPounceTrigger(pounce(), CTX));
    expect(signal.sourceKind).toBe('pounce_trigger');
    expect(signal.sourceId).toBe('42');
    expect(signal.accountName).toBe('Acme Logistics');
    expect(signal.hubspotCompanyId).toBe('123456');
    expect(signal.title).toBe('Acme opens robotic yard in Ohio');
    expect(signal.evidenceUrl).toBe('https://news.example.com/acme');
    expect(signal.sourceType).toBe('public_secondary');
    expect(signal.type).toBe('automation_program');
    expect(signal.observedAt.toISOString()).toBe('2026-09-10T00:00:00.000Z');
    expect(signal.confidence).toBe(90);
    expect(signal.registeredBy).toBe('test-suite');
    expect(signal.freshnessExpiresAt?.getTime()).toBe(
      signal.observedAt.getTime() + SIGNAL_TTL_DAYS.automation_program * DAY_MS,
    );
    expect(signal.metadata).toMatchObject({ categories: ['autonomy', 'expansion'], source: 'news' });
  });

  it('falls back to first_seen_at when published_at is null', () => {
    const { signal } = expectOk(fromPounceTrigger(pounce({ published_at: null }), CTX));
    expect(signal.observedAt.toISOString()).toBe('2026-09-12T00:00:00.000Z');
  });

  it('refuses a dismissed trigger with reason dismissed_trigger', () => {
    expect(fromPounceTrigger(pounce({ dismissed: true }), CTX)).toEqual({
      ok: false,
      reason: 'dismissed_trigger',
    });
  });

  it('refuses a trigger without a url with reason no_url', () => {
    expect(fromPounceTrigger(pounce({ url: '   ' }), CTX)).toEqual({ ok: false, reason: 'no_url' });
  });

  it('maps a 0-10 pounce score onto 0-100 (score 9 -> 90)', () => {
    expect(expectOk(fromPounceTrigger(pounce({ score: 9 }), CTX)).signal.confidence).toBe(90);
  });

  it('treats a score above 10 as already on the 0-100 scale (65 -> 65) and clamps', () => {
    expect(expectOk(fromPounceTrigger(pounce({ score: 65 }), CTX)).signal.confidence).toBe(65);
    expect(expectOk(fromPounceTrigger(pounce({ score: 140 }), CTX)).signal.confidence).toBe(100);
    expect(expectOk(fromPounceTrigger(pounce({ score: -3 }), CTX)).signal.confidence).toBe(0);
  });

  it.each([
    ['autonomy', 'automation_program'],
    ['yard_direct', 'technology_signal'],
    ['network_capex', 'site_expansion'],
    ['expansion', 'new_site'],
    ['cost_restructure', 'news'],
    ['leadership', 'news'],
    ['digital_ops', 'technology_signal'],
    ['freight', 'news'],
    ['SOMETHING_ELSE', 'news'],
  ])('category %s -> type %s', (category, type) => {
    expect(expectOk(fromPounceTrigger(pounce({ categories: [category] }), CTX)).signal.type).toBe(type);
  });

  it('an empty categories array falls to news', () => {
    expect(expectOk(fromPounceTrigger(pounce({ categories: [] }), CTX)).signal.type).toBe('news');
  });
});

// ---------------------------------------------------------------------------
// Evidence records
// ---------------------------------------------------------------------------

function evidence(overrides: Partial<EvidenceRecordRow> = {}): EvidenceRecordRow {
  return {
    id: 'ev_1',
    account_name: 'Acme Logistics',
    persona_id: 7,
    claim: 'Acme runs 14 distribution centers in the Midwest, three of which added a second shift in 2026.',
    source_url: 'https://acme.example.com/about',
    source_title: 'About Acme',
    source_type: 'proof',
    provider: 'tavily',
    observed_at: new Date('2026-08-01T00:00:00.000Z'),
    freshness_status: 'fresh',
    fresh_until: null,
    is_superseded: false,
    ...overrides,
  };
}

describe('fromEvidenceRecord', () => {
  it('maps the field set', () => {
    const { signal } = expectOk(fromEvidenceRecord(evidence(), CTX));
    expect(signal.sourceKind).toBe('evidence_record');
    expect(signal.sourceId).toBe('ev_1');
    expect(signal.personaId).toBe(7);
    expect(signal.title).toBe('About Acme');
    expect(signal.summary).toBe(evidence().claim);
    expect(signal.evidenceUrl).toBe('https://acme.example.com/about');
    expect(signal.sourceType).toBe('first_party');
    expect(signal.type).toBe('manual_research');
    expect(signal.confidence).toBe(70);
    expect(signal.observedAt.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(signal.freshnessExpiresAt?.getTime()).toBe(
      signal.observedAt.getTime() + SIGNAL_TTL_DAYS.manual_research * DAY_MS,
    );
  });

  it('uses the first 120 chars of the claim as title when source_title is null', () => {
    const long = 'x'.repeat(300);
    const { signal } = expectOk(fromEvidenceRecord(evidence({ source_title: null, claim: long }), CTX));
    expect(signal.title).toHaveLength(120);
  });

  it.each([
    ['proof', 'first_party'],
    ['signal', 'public_secondary'],
    ['contact', 'crm'],
    ['manual', 'manual'],
    ['local', 'first_party'],
    ['whatever', 'public_secondary'],
  ])('source_type %s -> %s', (st, expected) => {
    expect(expectOk(fromEvidenceRecord(evidence({ source_type: st }), CTX)).signal.sourceType).toBe(expected);
  });

  it('refuses superseded evidence with reason superseded_evidence', () => {
    expect(fromEvidenceRecord(evidence({ is_superseded: true }), CTX)).toEqual({
      ok: false,
      reason: 'superseded_evidence',
    });
  });

  it('refuses stale evidence with reason stale_evidence', () => {
    expect(fromEvidenceRecord(evidence({ freshness_status: 'stale' }), CTX)).toEqual({
      ok: false,
      reason: 'stale_evidence',
    });
  });

  it('fresh_until wins over the TTL', () => {
    const until = new Date('2026-12-25T00:00:00.000Z');
    const { signal } = expectOk(fromEvidenceRecord(evidence({ fresh_until: until }), CTX));
    expect(signal.freshnessExpiresAt?.getTime()).toBe(until.getTime());
  });
});

// ---------------------------------------------------------------------------
// Top100 research evidence
// ---------------------------------------------------------------------------

function top100(overrides: Partial<Top100EvidenceRow> = {}): Top100EvidenceRow {
  return {
    run_id: 'run-2026-09-20',
    key: 'acme',
    account: 'Acme Logistics',
    evidence_id: 'E3',
    claim: 'Acme announced the acquisition of Beta Freight, adding 6 cross-dock facilities.',
    source_url: 'https://ir.acme.example.com/press/beta',
    source_type: 'newsroom',
    published: '2026-09-15',
    event_date: '2026-09-14',
    retrieved: '2026-09-20',
    excerpt: 'Acme today announced it has completed the acquisition of Beta Freight.',
    confidence: 'high',
    class: 'FACT',
    external_ok: true,
    ...overrides,
  };
}

describe('fromTop100Evidence', () => {
  it('maps the field set', () => {
    const { signal } = expectOk(fromTop100Evidence(top100(), CTX));
    expect(signal.sourceKind).toBe('top100_evidence');
    expect(signal.sourceId).toBe('run-2026-09-20:acme:E3');
    expect(signal.accountName).toBe('Acme Logistics');
    expect(signal.title).toBe(top100().claim);
    expect(signal.summary).toBe(top100().claim);
    expect(signal.evidenceUrl).toBe('https://ir.acme.example.com/press/beta');
    expect(signal.evidenceText).toBe(top100().excerpt);
    expect(signal.claimClass).toBe('FACT');
    expect(signal.externalOk).toBe(true);
    expect(signal.sourceType).toBe('public_primary');
    expect(signal.type).toBe('acquisition');
    expect(signal.confidence).toBe(80);
    expect(signal.observedAt.toISOString()).toBe('2026-09-14T00:00:00.000Z');
    expect(signal.metadata).toMatchObject({ observedAtSource: 'event_date' });
    expect(signal.metadata).not.toHaveProperty('contradiction');
  });

  it('refuses anything that is not a FACT with reason not_a_fact', () => {
    expect(fromTop100Evidence(top100({ class: 'INFERENCE' }), CTX)).toEqual({
      ok: false,
      reason: 'not_a_fact',
    });
    expect(fromTop100Evidence(top100({ class: 'UNKNOWN' }), CTX)).toEqual({
      ok: false,
      reason: 'not_a_fact',
    });
  });

  it('a literal unknown event_date and published fall through to retrieved', () => {
    const { signal } = expectOk(
      fromTop100Evidence(top100({ event_date: 'unknown', published: 'unknown' }), CTX),
    );
    expect(signal.observedAt.toISOString()).toBe('2026-09-20T00:00:00.000Z');
    expect(signal.metadata).toMatchObject({ observedAtSource: 'retrieved' });
  });

  it('an unparseable event_date falls through to published', () => {
    const { signal } = expectOk(fromTop100Evidence(top100({ event_date: 'Q3-ish' }), CTX));
    expect(signal.observedAt.toISOString()).toBe('2026-09-15T00:00:00.000Z');
    expect(signal.metadata).toMatchObject({ observedAtSource: 'published' });
  });

  it('refuses when no date field parses with reason bad_date', () => {
    expect(
      fromTop100Evidence(top100({ event_date: 'unknown', published: 'unknown', retrieved: 'unknown' }), CTX),
    ).toEqual({ ok: false, reason: 'bad_date' });
  });

  it.each([
    ['filing', 'public_primary'],
    ['earnings', 'public_primary'],
    ['investor_deck', 'public_primary'],
    ['leadership_page', 'public_primary'],
    ['newsroom', 'public_primary'],
    ['trade_press', 'public_secondary'],
    ['other', 'public_secondary'],
    ['crm', 'crm'],
    ['vault', 'manual'],
    ['job_posting', 'public_secondary'],
  ])('source_type %s -> %s', (st, expected) => {
    expect(expectOk(fromTop100Evidence(top100({ source_type: st }), CTX)).signal.sourceType).toBe(expected);
  });

  it('an unobserved source_type falls to public_secondary', () => {
    expect(expectOk(fromTop100Evidence(top100({ source_type: 'podcast' }), CTX)).signal.sourceType).toBe(
      'public_secondary',
    );
  });

  it('preserves external_ok false', () => {
    expect(expectOk(fromTop100Evidence(top100({ external_ok: false }), CTX)).signal.externalOk).toBe(false);
  });

  it.each([
    ['high', 80],
    ['medium', 55],
    ['low', 30],
  ] as const)('confidence %s -> %i', (conf, expected) => {
    expect(expectOk(fromTop100Evidence(top100({ confidence: conf }), CTX)).signal.confidence).toBe(expected);
  });

  it.each([
    ['job_posting', 'Hiring a yard automation engineer', 'job_posting'],
    ['crm', 'Contact replied asking for the ROI model', 'intent'],
    ['newsroom', 'Acme will acquire Beta Freight in Q4', 'acquisition'],
    ['newsroom', 'Acme opens a new facility in Reno', 'new_site'],
    ['newsroom', 'Acme plans a $40M capex expansion at its Dallas DC', 'site_expansion'],
    ['newsroom', 'Acme deploys autonomous yard trucks at three sites', 'automation_program'],
    ['newsroom', 'Acme names a new CFO', 'news'],
  ])('source_type %s with claim "%s" -> type %s', (st, claim, type) => {
    expect(expectOk(fromTop100Evidence(top100({ source_type: st, claim }), CTX)).signal.type).toBe(type);
  });

  it('carries a non-empty contradiction into metadata', () => {
    const { signal } = expectOk(fromTop100Evidence(top100({ contradiction: 'Filing says 5 sites' }), CTX));
    expect(signal.metadata).toMatchObject({ contradiction: 'Filing says 5 sites' });
    const blank = expectOk(fromTop100Evidence(top100({ contradiction: '   ' }), CTX));
    expect(blank.signal.metadata).not.toHaveProperty('contradiction');
  });

  it('refuses an externally quotable fact without a source url (no_source_url)', () => {
    expect(fromTop100Evidence(top100({ source_url: '', external_ok: true }), CTX)).toEqual({
      ok: false,
      reason: 'no_source_url',
    });
  });

  it('allows a missing source url when the fact is internal-only', () => {
    const { signal } = expectOk(fromTop100Evidence(top100({ source_url: '', external_ok: false }), CTX));
    expect(signal.evidenceUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PIC citations
// ---------------------------------------------------------------------------

function pic(overrides: Partial<PicCitationRow> = {}): PicCitationRow {
  return {
    slug: 'acme',
    rowIndex: 3,
    ref: 'transcript:2026-09-01-acme-discovery#t=1210',
    at: '2026-09-01',
    speaker: 'VP Ops',
    verbatim: 'We lose about an hour a shift just finding trailers.',
    confidence: 'BUYER_CONFIRMED',
    problem: 'Trailer search time eats production capacity at the Ohio yards.',
    accountName: 'Acme Logistics',
    ...overrides,
  };
}

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

describe('fromPicCitation', () => {
  it('maps the field set', () => {
    const row = pic();
    const { signal } = expectOk(fromPicCitation(row, CTX));
    expect(signal.sourceKind).toBe('pic_citation');
    expect(signal.sourceId).toBe(`acme:${sha1(row.ref)}`);
    expect(signal.title).toBe(row.problem);
    expect(signal.evidenceText).toBe(row.verbatim);
    expect(signal.evidenceUrl).toBeNull();
    expect(signal.sourceType).toBe('first_party');
    expect(signal.type).toBe('manual_research');
    expect(signal.confidence).toBe(90);
    expect(signal.observedAt.toISOString()).toBe(new Date('2026-09-01').toISOString());
    expect(signal.metadata).toMatchObject({ ref: row.ref, speaker: 'VP Ops', rowIndex: 3 });
  });

  it.each(['for-pack:acme', 'dossier:acme', 'transcript:x', 'call-intel:x', 'vault:x', 'http://a', 'https://a'])(
    'accepts ref prefix %s',
    (ref) => {
      expect(fromPicCitation(pic({ ref }), CTX).ok).toBe(true);
    },
  );

  it('refuses an unknown ref prefix with reason unresolvable_ref', () => {
    expect(fromPicCitation(pic({ ref: 'slack:C123' }), CTX)).toEqual({
      ok: false,
      reason: 'unresolvable_ref',
    });
  });

  it('an http ref becomes evidenceUrl and public_secondary', () => {
    const { signal } = expectOk(fromPicCitation(pic({ ref: 'https://x.example.com/p' }), CTX));
    expect(signal.evidenceUrl).toBe('https://x.example.com/p');
    expect(signal.sourceType).toBe('public_secondary');
  });

  it.each([
    ['for-pack:acme', 'manual'],
    ['dossier:acme', 'manual'],
    ['call-intel:acme', 'manual'],
    ['vault:acme', 'first_party'],
    ['transcript:acme', 'first_party'],
  ])('ref %s -> sourceType %s', (ref, st) => {
    expect(expectOk(fromPicCitation(pic({ ref }), CTX)).signal.sourceType).toBe(st);
  });

  it('a missing verbatim leaves evidenceText null', () => {
    expect(expectOk(fromPicCitation(pic({ verbatim: undefined }), CTX)).signal.evidenceText).toBeNull();
  });

  it.each(['transcript:2026-09-01-acme-discovery#t=1210', 'call-intel:acme-2026-09-01', 'https://x.example.com/p'])(
    'a buyer-sourced ref (%s) carries the verbatim as evidenceText and leaves summary null',
    (ref) => {
      const row = pic({ ref });
      const { signal } = expectOk(fromPicCitation(row, CTX));
      expect(signal.evidenceText).toBe(row.verbatim);
      expect(signal.summary).toBeNull();
    },
  );

  it.each(['dossier:acme', 'for-pack:acme', 'vault:acme'])(
    'a seller-document ref (%s) puts the verbatim in summary and leaves evidenceText null, so it cannot satisfy the evidence guard',
    (ref) => {
      const row = pic({ ref });
      const { signal } = expectOk(fromPicCitation(row, CTX));
      expect(signal.evidenceText).toBeNull();
      expect(signal.summary).toBe(row.verbatim);
    },
  );

  it('a seller-document ref with no verbatim leaves both summary and evidenceText null', () => {
    const { signal } = expectOk(fromPicCitation(pic({ ref: 'dossier:acme', verbatim: '   ' }), CTX));
    expect(signal.evidenceText).toBeNull();
    expect(signal.summary).toBeNull();
  });

  it.each([
    ['BUYER_CONFIRMED', 90],
    ['STRONG', 75],
    ['MODERATE', 50],
    ['SPECULATIVE', 25],
  ] as const)('confidence %s -> %i', (conf, expected) => {
    expect(expectOk(fromPicCitation(pic({ confidence: conf }), CTX)).signal.confidence).toBe(expected);
  });

  it('refuses an invalid date with reason bad_date', () => {
    expect(fromPicCitation(pic({ at: 'sometime last spring' }), CTX)).toEqual({
      ok: false,
      reason: 'bad_date',
    });
  });
});

// ---------------------------------------------------------------------------
// Operator knowledge
// ---------------------------------------------------------------------------

describe('fromOperatorKnowledge', () => {
  const base = {
    accountName: 'Acme Logistics',
    hubspotCompanyId: '123456',
    personaId: 7,
    text: '  Casey heard on the 9/10 call that Acme is standing up a second shift at Columbus.  ',
    at: new Date('2026-09-10T15:00:00.000Z'),
    sourceId: 'note-2026-09-10-acme',
    by: 'casey',
  };

  it('maps the field set and marks the fact as not externally quotable', () => {
    const { signal } = expectOk(fromOperatorKnowledge(base, CTX));
    expect(signal.sourceKind).toBe('operator_knowledge');
    expect(signal.sourceId).toBe('note-2026-09-10-acme');
    expect(signal.sourceType).toBe('first_party');
    expect(signal.type).toBe('manual_research');
    expect(signal.evidenceText).toBe(base.text.trim());
    expect(signal.title).toBe(base.text.trim());
    expect(signal.confidence).toBe(85);
    expect(signal.externalOk).toBe(false);
    expect(signal.hubspotCompanyId).toBe('123456');
    expect(signal.personaId).toBe(7);
    expect(signal.observedAt.getTime()).toBe(base.at.getTime());
    expect(signal.metadata).toMatchObject({ by: 'casey' });
    expect(signal.registeredBy).toBe('test-suite');
  });

  it('uses an explicit title when given', () => {
    expect(expectOk(fromOperatorKnowledge({ ...base, title: 'Second shift' }, CTX)).signal.title).toBe(
      'Second shift',
    );
  });

  it('clips a long text to 120 chars for the title', () => {
    expect(expectOk(fromOperatorKnowledge({ ...base, text: 'y'.repeat(500) }, CTX)).signal.title).toHaveLength(
      120,
    );
  });

  it('refuses blank text with reason no_evidence_text', () => {
    expect(fromOperatorKnowledge({ ...base, text: '   ' }, CTX)).toEqual({
      ok: false,
      reason: 'no_evidence_text',
    });
  });
});
