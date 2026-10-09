// @vitest-environment node
/**
 * IW06 (intelligence wiring, 2026-10-09): the vault's recent calls and meetings are intelligence on their own, with
 * the Fireflies summary and action items as the passage (never the transcript), the buyers as hints, the note path as
 * the source, no decisions; a useful call passage surfaces with no quiet person and no action in play; the digest
 * reserves a slot for the vault and the email prints the item with an Open link, never a decide link.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { knowledgeItemOf, loadKnowledgeIntel } from '@/lib/gap/knowledge/knowledge-intel';
import { composeDigest, renderBriefing } from '@/lib/gap/work/briefing';
import { loadIntelligence, type IntelItem } from '@/lib/gap/work/intel';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';

const NOW = new Date('2026-10-09T18:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const CAPTURE = `---
type: raw
captured: 2026-10-01
source: fireflies
call_title: Kenco x YardFlow - Discovery
participants: craig.morrison@kencogroup.com, dave.kiesling@kencogroup.com, casey@freightroll.com
---

## Call summary (Fireflies)

- **Yard Operations Modernization:** Integrating digital check-in and yard management systems across 140+ locations to enhance efficiency and reduce manual work

- **Next Steps:** Complete usage analysis by early September; follow-up meeting scheduled for the week of August 29th to review progress.

## Action items

**Dave Kiesling**
Coordinate internal yard management project phase completion by late August/early September, feeding into 2027 budget planning (00:24)

## Transcript (verbatim)

**Casey Larkin:** Craig, can you hear me?
`;
const call = { id: 'kn1', path: '00_Inbox/raw/2026-10-01-call-kenco-x-yardflow-discovery.md', sha: 'x', kind: 'raw', title: 'Kenco x YardFlow - Discovery', note_date: days(8), source: 'fireflies', people: ['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com', 'casey@freightroll.com'], account_name: 'Kenco', text: CAPTURE, frontmatter: {}, synced_at: days(1), git_sha: null };
const meeting = { id: 'kn2', path: '05_Meetings/2026-10-06 Kraft Heinz.md', sha: 'y', kind: 'meeting', title: 'Kraft Heinz x YardFlow - Next steps', note_date: days(3), source: 'calendar-prep', people: ['john@kraftheinz.com', 'casey@freightroll.com'], account_name: 'Kraft Heinz', text: '# prep', frontmatter: {}, synced_at: days(1), git_sha: 'abc' };
const ahead = { ...meeting, id: 'kn3', path: '05_Meetings/2026-10-14 Kraft Heinz.md', note_date: new Date(NOW.getTime() + 5 * 86_400_000) };
const account = { id: 'kn4', path: '02_Accounts/Kenco.md', sha: 'z', kind: 'account', title: 'Kenco', note_date: days(2), source: 'librarian', people: [], account_name: 'Kenco', text: '# Kenco', frontmatter: { next_action: 'send the deck' }, synced_at: days(1), git_sha: null };

describe('IW06: the vault as intelligence', () => {
  it('knowledgeItemOf: a Fireflies call carries its summary and action items (never the transcript), the buyers, the path, no decisions; a meeting ahead and an account note are not items', () => {
    const it = knowledgeItemOf(call, NOW)!;
    expect(it).toMatchObject({ kind: 'knowledge', key: 'knowledge:kn1', accountName: 'Kenco', decisions: [], truth: 'unverified_status', title: 'Kenco x YardFlow - Discovery' });
    expect(it.line).toBe('A Fireflies call Oct 1, 2026 with craig.morrison@kencogroup.com, dave.kiesling@kencogroup.com, on the vault. Unverified present-day status. The summary is advisory; the verbatim is on the note.');
    expect(it.substance!.text).toContain('Yard Operations Modernization: Integrating digital check-in');
    expect(it.substance!.text).toContain('Action item (Dave Kiesling): Coordinate internal yard management project');
    expect(it.substance!.text).not.toContain('can you hear me');
    expect(it.substance!.sources).toEqual([{ url: null, publisher: 'the vault', label: call.path }]);
    expect(it.substance!.personHints).toEqual(['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com']);
    expect(it.substance!.uncertainty).toContain('advisory');
    expect(it.substance!.interpretation).toBeNull();
    expect(knowledgeItemOf(meeting, NOW)!.substance!.text).toBe("Kraft Heinz x YardFlow - Next steps (on the calendar; the vault's prep note).");
    expect(knowledgeItemOf(ahead, NOW)).toBeNull();
    expect(knowledgeItemOf(account, NOW)).toBeNull();
    // An internal meeting (nobody from the account on it) stays on the vault.
    expect(knowledgeItemOf({ ...meeting, id: 'kn5', path: '05_Meetings/2026-10-08 War Room.md', title: '2026-10-08 War Room Execution', people: ['casey@freightroll.com', 'jake@freightroll.com'] }, NOW)).toBeNull();
  });

  it('loadKnowledgeIntel reads the window newest first and counts; loadIntelligence carries the group with no person in play; a client without the table answers none', async () => {
    const prisma = ledgerDb({ knowledgeNotes: [call, meeting, ahead, account] }).client();
    const k = await loadKnowledgeIntel(prisma, { now: NOW });
    expect(k.items.map((i) => i.id)).toEqual(['kn2', 'kn1']);
    expect(k.total).toBe(2);
    const x = await loadIntelligence(prisma, { now: NOW });
    expect(x.knowledge!.map((i) => i.id)).toEqual(['kn2', 'kn1']);
    expect(x.totals.knowledge).toBe(2);
    expect(x.people).toEqual([]);
    expect((await loadKnowledgeIntel({}, { now: NOW })).items).toEqual([]);
  });

  it('the digest reserves one vault slot; the email prints the call with an Open link and never a decide link', () => {
    const mk = (kind: 'signal' | 'trigger', id: string): IntelItem => ({ kind, id, key: `${kind}:${id}`, title: `${kind} ${id}`, source: 's', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'line.', accountName: null, accountHint: kind === 'trigger' ? 'Some Co' : null, relevance: null, categories: [], person: null, decisions: ['pursue', 'explore', 'save', 'skip', 'dismiss', 'more'], rank: 0 });
    const vault = [knowledgeItemOf(call, NOW)!, knowledgeItemOf(meeting, NOW)!];
    const intel = { signals: Array.from({ length: 8 }, (_, k) => mk('signal', `s${k}`)), triggers: [mk('trigger', 't0'), mk('trigger', 't1')], knowledge: vault, people: [], totals: { signals: 8, triggers: 2, people: 0, knowledge: 2 }, angles: {} };
    const d = composeDigest(intel);
    // Reserved 2 found, 1 trigger, 1 vault; then the sections in turn (found, triggers) until six.
    expect(d.breakdown).toEqual({ reports: 0, found: 3, triggers: 2, vault: 1 });
    expect(d.worth.map((w) => w.id)).toEqual(['s0', 's1', 's2', 't0', 't1', 'kn1']);
    const plan: DayPlan = { day: '2026-10-09', plannedAt: NOW.toISOString(), items: [], counts: { waiting: 0, parked: 0, snoozed: 0 } } as unknown as DayPlan;
    const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token}`, decide: (key: string, dec: string) => `https://x/decide/${key}/${dec}`, account: (name: string) => `https://x/accounts/${name.toLowerCase()}/` };
    const out = renderBriefing({ plan, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, NOW);
    expect(out.text).toContain('3 found by GAP, 2 triggers, 1 from the vault; 6 more waiting.');
    expect(out.text).toContain('- Kenco: Kenco x YardFlow - Discovery. A Fireflies call Oct 1, 2026 with craig.morrison@kencogroup.com');
    expect(out.text).toContain('   What was reported: Yard Operations Modernization: Integrating digital check-in');
    expect(out.text).toContain('   Open Kenco: https://x/accounts/kenco/');
    expect(out.text).not.toContain('decide/knowledge:kn1');
    expect(out.html).toContain('<a href="https://x/accounts/kenco/">Open Kenco</a>');
    expect(out.subject).toBe('GAP today, Fri Oct 9: nothing to execute, 6 to decide [GAP#tok]');
  });
});
