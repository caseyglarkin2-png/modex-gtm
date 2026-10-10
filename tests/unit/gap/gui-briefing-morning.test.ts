// @vitest-environment node
/**
 * The adversarial audit of the October 10 morning (the seller's briefing), the defects in the briefing's own files:
 *   1. a source whose label is a classifier's field (fit_rationale, relevance, score, a snake_case token) prints as
 *      "the producer's own claim" WHATEVER the publisher, the link kept (the Oct 10 briefing printed "Sources:
 *      fit_rationale https://celestica.com/" because a Clawd row always carries a publisher, its URL's host);
 *   2. a pursued angle the correspondence has moved past (Kenco: the angle for Dave Kiesling was decided Oct 8, we wrote
 *      Dave Oct 9 and he replied) prints as one line that says so, never the angle text or the Ask; the briefing's
 *      intelligence reader marks it from the writer's relationship (soft: a failed read is not superseded);
 *   4. a lowercase writer name ("nicholas schwartz") prints proper-cased in the pursued section.
 */
import { describe, expect, it, vi } from 'vitest';
import { properCaseName, renderBriefing, type BriefingIntel } from '@/lib/gap/work/briefing';
import { properCase } from '@/lib/gap/people/contact-packet';
import { markSupersededPursued } from '@/lib/gap/work/briefing-send';
import type { IntelItem, PursuedItem } from '@/lib/gap/work/intel';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { RelationshipQuery, RelationshipState } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T11:30:00Z');
const links = {
  start: 'https://x/start',
  work: 'https://x/work',
  item: (it: PlanItem) => `https://x/item/${it.token}`,
  decide: () => null,
  account: (name: string) => `https://x/accounts/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
};
const plan: DayPlan = { day: '2026-10-10', plannedAt: '2026-10-10T11:00:00.000Z', fresh: true, counts: { needsYou: 0, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items: [] };
const substance = (over: Partial<NonNullable<IntelItem['substance']>> = {}): NonNullable<IntelItem['substance']> => ({ producer: 'clawd_signal_hunter', producerLabel: 'Clawd signal hunter', producerRunId: 'run-1', producerItemId: 'x', recordKind: 'observation', text: 'Celestica: a new campus with a shipper yard.', sources: [], sourceRecordIds: [], eventDate: null, reportedOn: '2026-10-10', reportedOnBasis: 'captured', importedAt: '2026-10-10T05:00:00.000Z', producerStatus: null, uncertainty: null, interpretation: null, personHints: [], suggestions: 0, revisions: 0, ...over });
const record = (id: string, title: string, sources: NonNullable<IntelItem['substance']>['sources']): IntelItem => ({ kind: 'signal', id, key: `signal:${id}`, title, source: 'clawd', url: null, publishedAt: null, observedAt: '2026-10-10T05:00:00.000Z', truth: 'historical_observation', line: 'Clawd signal hunter reported it Oct 10, 2026.', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: ['pursue', 'skip', 'dismiss', 'more'], rank: 0, substance: substance({ producerItemId: id, sources }) });
const intelWith = (over: Partial<BriefingIntel>): BriefingIntel => ({ signals: [], triggers: [], people: [], totals: { signals: 0, triggers: 0, people: 0 }, angles: {}, ...over });
const render = (intel: BriefingIntel) => renderBriefing({ plan, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, NOW);

const DAVE = 'dave.kiesling@kencogroup.com';
const angle = (over: Partial<NonNullable<PursuedItem['angle']>> = {}): NonNullable<PursuedItem['angle']> => ({ whyItMatters: 'The undated note from Dave Kiesling suggests Kenco Group might have previously expressed interest in optimizing their yards.', starters: ['How do your yards handle the gate today?'], roles: [], accounts: ['Kenco'], peopleNamed: [], proposedAction: 'email', caveat: null, sourceLine: 'the vault', ...over });
const pursued = (over: Partial<PursuedItem> & { key: string }): PursuedItem => ({ taskId: `at_${over.key}`, writer: null, kind: 'person', title: 'An item', accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-08T15:00:00.000Z', status: 'ready', error: null, angle: angle(), ...over });

describe('1. a classifier label is the producer\'s own claim whatever the publisher, the link kept', () => {
  it('a Clawd row (publisher = its URL\'s host, label fit_rationale) never prints the token; the link stays; a real source is unchanged', () => {
    const out = render(intelWith({
      signals: [
        record('c1', 'Celestica: a new campus', [{ url: 'https://celestica.com/', publisher: 'celestica.com', label: 'fit_rationale' }]),
        record('c2', 'Acme: a second DC', [{ url: 'https://acme.example/', publisher: 'acme.example', label: 'relevance' }, { url: 'https://acme.example/', publisher: 'acme.example', label: 'score' }, { url: 'https://www.trucknews.com/x', publisher: 'trucknews.com', label: 'Truck News' }]),
      ],
      totals: { signals: 2, triggers: 0, people: 0 },
    }));
    for (const body of [out.text, out.html]) {
      expect(body).not.toContain('fit_rationale');
      expect(body).not.toMatch(/Sources: (relevance|score)\b/);
    }
    expect(out.text).toContain("Sources: the producer's own claim https://celestica.com/.");
    expect(out.html).toContain('<a href="https://celestica.com/">the producer\'s own claim</a>');
    // Two classifier fields over one link are one claim, said once; a publication keeps its own name.
    expect(out.text).toContain("Sources: the producer's own claim https://acme.example/; Truck News https://www.trucknews.com/x.");
  });
  it('a classifier label with no link still says there is no source link', () => {
    const out = render(intelWith({ signals: [record('c3', 'Beta: a new yard', [{ url: null, publisher: 'beta.example', label: 'urgency_score' }])], totals: { signals: 1, triggers: 0, people: 0 } }));
    expect(out.text).toContain("Sources: the producer's own claim (no source link).");
    expect(out.text).not.toContain('urgency_score');
  });
});

describe('2. a superseded pursued angle prints one line, never the angle or the Ask', () => {
  it('Kenco: the angle for Dave Kiesling, decided Oct 8, superseded by our Oct 9 email: one line, the account page linked', () => {
    const out = render(intelWith({ pursued: [pursued({ key: `person:${DAVE}`, writer: { email: DAVE, name: 'dave kiesling' }, title: 'dave kiesling wrote to us', superseded: { since: 'we wrote Oct 9, 2026' } })] }));
    expect(out.text).toContain('- Kenco: the angle for Dave Kiesling (prepared Oct 8, 2026) is superseded by later correspondence (we wrote Oct 9, 2026); it is kept on the account page.\n   Open Kenco: https://x/accounts/kenco/');
    for (const body of [out.text, out.html]) {
      expect(body).not.toContain('The undated note');
      expect(body).not.toContain('Ask:');
      expect(body).not.toContain('The angle:');
      expect(body).not.toContain('How do your yards handle the gate today?');
    }
    expect(out.html).toContain('Kenco: the angle for Dave Kiesling (prepared Oct 8, 2026) is superseded by later correspondence (we wrote Oct 9, 2026); it is kept on the account page.');
  });
  it('a writer with no name is named from the address, never by the address', () => {
    const out = render(intelWith({ pursued: [pursued({ key: `person:${DAVE}`, writer: { email: DAVE, name: null }, superseded: { since: 'they wrote Oct 10, 2026' } })] }));
    expect(out.text).toContain('- Kenco: the angle for Dave Kiesling (prepared Oct 8, 2026) is superseded by later correspondence (they wrote Oct 10, 2026); it is kept on the account page.');
    expect(out.text).not.toContain(`the angle for ${DAVE}`);
  });
  it('an item that is not superseded renders as before: the angle, the Ask, the proposal', () => {
    const out = render(intelWith({ pursued: [pursued({ key: `person:${DAVE}`, writer: { email: DAVE, name: 'Dave Kiesling' }, title: 'Dave Kiesling wrote to us', superseded: null })] }));
    expect(out.text).toContain('- Kenco: Dave Kiesling wrote to us. The angle: The undated note from Dave Kiesling suggests Kenco Group might have previously expressed interest in optimizing their yards. Ask: How do your yards handle the gate today? Proposed: an email.');
    expect(out.text).not.toContain('superseded');
  });
});

describe('4. a lowercase name in the pursued section is proper-cased', () => {
  it('Hormel: "Who: nicholas schwartz" prints as Nicholas Schwartz; a lowercase writer name in the title too; a mixed-case name is left alone', () => {
    const out = render(intelWith({
      pursued: [
        pursued({ key: 'signal:hormel', kind: 'signal', title: 'Hormel Plans $150M Expansion Project at Iowa Plant', accountName: 'Hormel Foods', angle: angle({ whyItMatters: 'The 2018 expansion may mean more trucks through the yards.', peopleNamed: [{ personaId: 7, name: 'nicholas schwartz', title: 'supply chain planning coe & strategy lead' }, { personaId: 8, name: 'Tim McWhitson', title: null }] }) }),
        pursued({ key: 'person:a@b.example', writer: { email: 'a@b.example', name: 'ann o\'neil-smith' }, title: 'ann o\'neil-smith wrote to us', accountName: 'Beta' }),
      ],
    }));
    expect(out.text).toContain('Who: Nicholas Schwartz (supply chain planning coe & strategy lead); Tim McWhitson.');
    expect(out.text).toContain("- Beta: Ann O'Neil-Smith wrote to us. The angle:");
    expect(out.text).not.toContain('nicholas schwartz');
    expect(out.html).not.toContain('nicholas schwartz');
  });
  it('the renderer\'s copy is the contact packet\'s rule exactly (copied, not imported: the renderer is client-reachable)', () => {
    for (const s of ['nicholas schwartz', "ann o'neil-smith", 'jean de la fontaine', 'Tim McWhitson', 'Kiesling, Dave', 'supply chain planning coe & strategy lead', '  dave  ', '', null, undefined, 'mary-kate van der berg']) {
      expect(properCaseName(s), String(s)).toBe(properCase(s));
    }
  });
});

describe('2. the briefing reader marks a pursued angle superseded from the writer\'s relationship', () => {
  const rel = (over: { out?: string | null; in?: string | null }): RelationshipState => ({ lastOutbound: over.out ? { at: over.out, subject: 'Re: 48-minute turns', threadId: null, source: 'HubSpot (logged email)' } : null, lastInbound: over.in ? { at: over.in, subject: 'Re: 48-minute turns', purpose: null, excerpt: null, threadId: null } : null }) as unknown as RelationshipState;
  const items = (): PursuedItem[] => [
    pursued({ key: `person:${DAVE}`, writer: { email: DAVE, name: 'Dave Kiesling' } }),
    pursued({ key: 'person:craig@kencogroup.com', writer: { email: 'craig@kencogroup.com', name: 'Craig Morrison' } }),
    pursued({ key: 'signal:lab', writer: null, kind: 'signal' }),
    pursued({ key: 'person:late@x.example', writer: { email: 'late@x.example', name: null }, accountName: null, accountHint: 'x.example' }),
  ];

  it('our later email (or theirs) supersedes; an earlier exchange does not; the query is the account, the writer and now', async () => {
    const reader = vi.fn(async (_p: unknown, q: RelationshipQuery) => (q.email === DAVE ? rel({ out: '2026-10-09T14:00:00.000Z', in: '2026-10-09T18:30:00.000Z' }) : q.email === 'late@x.example' ? rel({ in: '2026-10-09T12:00:00.000Z' }) : rel({ out: '2026-10-01T14:00:00.000Z', in: '2026-09-30T12:00:00.000Z' })));
    const out = await markSupersededPursued({}, items(), NOW, { relationship: reader });
    expect(out[0].superseded).toEqual({ since: 'we wrote Oct 9, 2026; they wrote Oct 9, 2026' });
    expect(out[1].superseded).toBeNull();
    expect(out[2].superseded, 'a signal has no writer: not read').toBeUndefined();
    expect(out[3].superseded, 'the fourth is not shown: not read').toBeUndefined();
    expect(reader).toHaveBeenCalledTimes(2);
    expect(reader.mock.calls[0][1]).toEqual({ accountName: 'Kenco', email: DAVE, name: 'Dave Kiesling', now: NOW });
  });

  it('only a READY angle is read; a failed read is not superseded; the bound is the three shown', async () => {
    const reader = vi.fn(async (_p: unknown, q: RelationshipQuery) => {
      if (q.email === DAVE) throw new Error('Gmail 503');
      return rel({ in: '2026-10-09T12:00:00.000Z' });
    });
    const list = items();
    list[1] = { ...list[1], status: 'in_progress', angle: null };
    list.splice(2, 1);
    const out = await markSupersededPursued({}, list, NOW, { relationship: reader });
    expect(out[0].superseded, 'a read that throws is not superseded').toBeNull();
    expect(out[1].superseded, 'an angle not ready is not read').toBeUndefined();
    expect(out[2].superseded, 'an unplaced writer is read under its hint').toEqual({ since: 'they wrote Oct 9, 2026' });
    expect(reader).toHaveBeenCalledTimes(2);
    expect(reader.mock.calls[1][1]).toEqual({ accountName: 'x.example', email: 'late@x.example', name: null, now: NOW });
  });
});
