import { describe, expect, it } from 'vitest';
import { defaultKnowledgeReader } from '@/lib/gap/work/load-day';
import { conversationEvents } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-09T15:00:00Z');
const rows = [
  { id: 'n1', path: '05_Meetings/2026-09-16 Kenco Logistics.md', kind: 'meeting', title: 'Kenco x YardFlow - Next Steps', note_date: new Date('2026-09-16T17:00:00Z'), source: 'calendar-prep', people: ['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com', 'casey@freightroll.com'], account_name: 'Kenco', frontmatter: {}, text: '' },
  { id: 'n2', path: '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', kind: 'raw', title: 'Kenco x YardFlow - Discovery', note_date: new Date('2026-07-16T15:00:00Z'), source: 'fireflies', people: ['craig.morrison@kencogroup.com', 'casey@freightroll.com'], account_name: 'Kenco', frontmatter: {}, text: '' },
  { id: 'n3', path: '00_Inbox/raw/2026-07-15-call-sales-standup.md', kind: 'raw', title: 'Sales Standup', note_date: new Date('2026-07-15T15:00:00Z'), source: null, people: ['craig.morrison@kencogroup.com'], account_name: null, frontmatter: {}, text: '' },
  { id: 'n4', path: '02_Accounts/Kenco Logistics.md', kind: 'account', title: 'Kenco Logistics', note_date: null, source: 'librarian', people: [], account_name: 'Kenco', frontmatter: { next_action: 'Regroup with Craig', next_action_due: '2026-10-15' }, text: '' },
];
const stubPrisma = (table: typeof rows | null) => ({
  gapKnowledgeNote: table
    ? {
        findMany: async (q: { where?: { kind?: { in: string[] }; people?: { hasSome: string[] }; account_name?: unknown } }) =>
          table.filter((r) => (!q.where?.kind || q.where.kind.in.includes(r.kind)) && (!q.where?.people || r.people.some((p) => q.where!.people!.hasSome.includes(p)))),
      }
    : undefined,
});

describe('the lead wiring of the knowledge table (knowledge program, 2026-10-09)', () => {
  it('conversationEvents: a meeting note and a Fireflies call with the person among the participants are conversations; an untagged raw capture is not; no table reads none', async () => {
    const ev = await conversationEvents(stubPrisma(rows) as never, ['craig.morrison@kencogroup.com'], NOW);
    expect(ev.map((e) => `${e.conversation?.kind}:${e.at.slice(0, 10)}:${e.from}`), 'the meeting and the Fireflies call, never the standup').toEqual(['meeting:2026-09-16:craig.morrison@kencogroup.com', 'call:2026-07-16:craig.morrison@kencogroup.com']);
    expect(ev[0]).toMatchObject({ direction: 'inbound', type: 'conversation', purpose: 'buyer_conversation', conversation: { kind: 'meeting', title: 'Kenco x YardFlow - Next Steps', source: 'calendar-prep' } });
    expect(await conversationEvents(stubPrisma(null) as never, ['craig.morrison@kencogroup.com'], NOW)).toEqual([]);
    expect(await conversationEvents(stubPrisma(rows) as never, [], NOW)).toEqual([]);
  });

  it('defaultKnowledgeReader: a client without the table reads no knowledge (soft), never throws', async () => {
    expect(await defaultKnowledgeReader(stubPrisma(null) as never, 'Kenco', { limit: 10 })).toEqual([]);
    expect(await defaultKnowledgeReader({} as never, 'Kenco', { limit: 10 })).toEqual([]);
  });
});
