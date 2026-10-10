// @vitest-environment node
/**
 * Evidence groups in the reader (the Google Workspace and Gemini extension, 2026-10-10). Pinned: records in the
 * reports group that share an evidence group key collapse into one item that keeps the first record's passage and
 * lists every other copy (and the vault's matching conversation) as provenance with its key, producer, date,
 * label and link; items without a key pass through; the knowledge group is read, never changed; the vault's own
 * item carries the same deterministic key; the ranks are reassigned in order.
 */
import { describe, expect, it } from 'vitest';
import { knowledgeItemOf } from '@/lib/gap/knowledge/knowledge-intel';
import { alsoHeldLine, collapseEvidenceGroups } from '@/lib/gap/work/evidence-group';
import type { IntelItem, IntelSubstance } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-09T18:00:00Z');
const substance = (over: Partial<IntelSubstance>): IntelSubstance => ({
  producer: 'gemini_notes', producerLabel: 'Gemini meeting notes', producerRunId: 'run', producerItemId: 'g1', recordKind: 'engagement', text: 'Craig Morrison assumed the asset leader role.', sources: [{ url: 'https://docs.google.com/document/d/g1/edit', publisher: 'Google Drive', label: 'Kenco x YardFlow - Discovery (Notes by Gemini)' }], sourceRecordIds: [], eventDate: '2026-07-16', reportedOn: '2026-07-16', reportedOnBasis: 'stated', importedAt: '2026-10-10T03:00:00.000Z', producerStatus: null, uncertainty: null, interpretation: null, personHints: [], suggestions: 0, revisions: 0, evidenceGroup: 'kenco|2026-07-16|discovery', ...over,
});
const item = (id: string, s: IntelSubstance | undefined, over: Partial<IntelItem> = {}): IntelItem => ({ kind: 'signal', id, key: `signal:${id}`, title: s?.producerItemId ?? id, source: s?.producerLabel ?? null, url: s?.sources[0]?.url ?? null, publishedAt: '2026-07-16T00:00:00.000Z', observedAt: '2026-10-10T03:00:00.000Z', truth: 'historical_observation', line: `${id} line.`, accountName: 'Kenco', accountHint: null, relevance: null, categories: [], person: null, decisions: [], rank: 0, ...(s ? { substance: s } : {}), ...over });

const CAPTURE = `---
type: raw
captured: 2026-07-16
source: fireflies
call_title: Kenco x YardFlow - Discovery
participants: craig.morrison@kencogroup.com, casey@freightroll.com
---

## Call summary (Fireflies)

- **Yard Operations Modernization:** Integrating digital check-in across 140+ locations.

## Action items

**Dave Kiesling**
Coordinate the project phase completion by late August (00:24)

## Transcript (verbatim)

**Casey Larkin:** Craig, can you hear me?
`;

describe('evidence groups in the reader', () => {
  it('the vault item carries the deterministic key', () => {
    const k = knowledgeItemOf({ id: 'kn1', path: '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', kind: 'raw', title: 'Kenco x YardFlow - Discovery', note_date: new Date('2026-07-16T14:00:00Z'), source: 'fireflies', people: ['craig.morrison@kencogroup.com', 'casey@freightroll.com'], account_name: 'Kenco', text: CAPTURE, synced_at: new Date('2026-10-01T00:00:00Z'), git_sha: null }, NOW);
    expect(k?.substance?.evidenceGroup).toBe('kenco|2026-07-16|discovery');
    const unplaced = knowledgeItemOf({ id: 'kn2', path: 'x.md', kind: 'raw', title: 'Kenco x YardFlow - Discovery', note_date: new Date('2026-07-16T14:00:00Z'), source: 'fireflies', people: ['craig.morrison@kencogroup.com'], account_name: null, text: CAPTURE, synced_at: new Date('2026-10-01T00:00:00Z'), git_sha: null }, NOW);
    expect(unplaced?.substance?.evidenceGroup, 'no account, no key: never guessed').toBeNull();
  });

  it('records sharing a key collapse into one item with every copy as provenance; the vault copy is linked; nothing else moves', () => {
    const gemini = item('g1', substance({}));
    const report = item('r1', substance({ producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerItemId: '2026-07-17#3', text: 'The brief says Kenco held a discovery call.', sources: [{ url: 'https://brief.example/kenco', publisher: 'brief.example', label: 'Yards First Daily' }], reportedOn: '2026-07-17' }));
    const transcript = item('g1t', substance({ producerItemId: 'g1#transcript', text: 'Casey Larkin: can you hear me?', sources: [{ url: 'https://docs.google.com/document/d/g1/edit', publisher: 'Google Drive', label: 'Kenco x YardFlow - Discovery (Notes by Gemini)' }] }));
    const other = item('o1', substance({ producerItemId: 'o1', evidenceGroup: 'crowley|2026-09-20|dossier', text: 'Crowley dossier.' }));
    const keyless = item('k1', substance({ producerItemId: 'k1', evidenceGroup: null, text: 'No key.' }));
    const vault = knowledgeItemOf({ id: 'kn1', path: '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', kind: 'raw', title: 'Kenco x YardFlow - Discovery', note_date: new Date('2026-07-16T14:00:00Z'), source: 'fireflies', people: ['craig.morrison@kencogroup.com', 'casey@freightroll.com'], account_name: 'Kenco', text: CAPTURE, synced_at: new Date('2026-10-01T00:00:00Z'), git_sha: null }, NOW)!;
    const knowledge = [vault];
    const out = collapseEvidenceGroups([gemini, report, other, transcript, keyless], knowledge);
    expect(out.map((x) => x.id)).toEqual(['g1', 'o1', 'k1']);
    expect(out.map((x) => x.rank)).toEqual([0, 1, 2]);
    const head = out[0];
    expect(head.substance?.text, 'the first record keeps its own passage').toBe('Craig Morrison assumed the asset leader role.');
    expect(head.alsoHeldAs).toEqual([
      { key: 'knowledge:kn1', producer: 'vault', producerLabel: 'the vault', date: '2026-07-16', label: '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', url: null },
      // The event date (the call) stands for the copy, not the brief's own report date.
      { key: 'signal:r1', producer: 'yards_first_brief', producerLabel: 'Yards First Brief', date: '2026-07-16', label: 'Yards First Daily', url: 'https://brief.example/kenco' },
      { key: 'signal:g1t', producer: 'gemini_notes', producerLabel: 'Gemini meeting notes', date: '2026-07-16', label: 'Kenco x YardFlow - Discovery (Notes by Gemini)', url: 'https://docs.google.com/document/d/g1/edit' },
    ]);
    expect(head.line).toBe('g1 line. Also held as: the vault (Jul 16, 2026): 00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md; Yards First Brief (Jul 16, 2026): Yards First Daily; Gemini meeting notes (Jul 16, 2026): Kenco x YardFlow - Discovery (Notes by Gemini).');
    expect(out[1].alsoHeldAs).toEqual([]);
    expect(out[1].line).toBe('o1 line.');
    expect(out[2].alsoHeldAs).toBeUndefined();
    expect(knowledge, 'the knowledge group is untouched').toEqual([vault]);
    expect(gemini.alsoHeldAs, 'the input item is not mutated').toBeUndefined();
    expect(alsoHeldLine([{ key: 'k', producer: 'p', producerLabel: 'A producer', date: null, label: null, url: null }])).toBe('Also held as: A producer.');
  });

  it('an empty reports group and a reports group without keys pass through unchanged', () => {
    expect(collapseEvidenceGroups([], [])).toEqual([]);
    const plain = item('p1', undefined);
    expect(collapseEvidenceGroups([plain], [])).toEqual([{ ...plain, rank: 0 }]);
  });
});
