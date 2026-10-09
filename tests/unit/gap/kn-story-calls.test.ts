import { describe, expect, it } from 'vitest';
import { parseFirefliesCapture } from '@/lib/gap/knowledge/fireflies-summary';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectStory } from '@/lib/gap/story/story';
import { mergeTouches } from '@/lib/gap/story/touches';
import type { PursuitState } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-09T13:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const DAVE = 'dave.kiesling@kencogroup.com';

const CAPTURE = `---
type: raw
captured: 2026-07-16
source: fireflies
call_title: Kenco x YardFlow - Discovery
participants: craig.morrison@kencogroup.com, dave.kiesling@kencogroup.com, casey@freightroll.com
---

## Call summary (Fireflies)

- **Yard Operations Modernization:** Integrating digital check-in and yard management systems across 140+ locations to enhance efficiency and reduce manual work

- **Pilot Results:** Nestlé's digital driver check-in increased water bottle shipments by 5% across 24 plants without adding staff.

- **Next Steps:** Complete usage analysis by early September; follow-up meeting scheduled for the week of August 29th to review progress.

## Action items

**Casey Larkin**
Prepare and share detailed case studies and deployment assets, including the demo recording for Ron, prior to next meeting (00:22)
Send meeting summary and follow-up materials to Craig and Dave soon after call (00:30)

**Dave Kiesling**
Coordinate internal yard management project phase completion by late August/early September, feeding into 2027 budget planning (00:24)

## Keywords

yard management, digital driver check-in, distribution centers

## Transcript (verbatim)

**Casey Larkin:** Craig, can you hear me?
`;

const state = { accountName: 'Kenco', state: 'in_deal', stateLine: 'In a deal', person: null, blocker: null, unlock: null, coldTouchAllowed: false, chooseAllowed: false, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: '55608495412' },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [
      { id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 2, name: 'Dave Kiesling', title: 'Director', email: DAVE, doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    ],
    candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;

const knowledge: NonNullable<AccountInputs['knowledge']> = {
  read: true,
  detail: null,
  calls: [{ id: 'r1', path: '00_Inbox/raw/2026-07-16-call-kenco-x-yardflow-discovery.md', title: 'Kenco x YardFlow - Discovery', at: '2026-07-16T15:00:00.000Z', people: [CRAIG, DAVE, 'casey@freightroll.com'], ...(() => { const f = parseFirefliesCapture(CAPTURE); return { summary: f.summary, actions: f.actions }; })() }],
  meetings: [
    { id: 'm1', path: '05_Meetings/2026-09-16 Kenco Logistics.md', title: 'Kenco x YardFlow - Next Steps', at: '2026-09-16T17:00:00.000Z', people: [CRAIG, DAVE, 'casey@freightroll.com'] },
    { id: 'm2', path: '05_Meetings/2026-10-14 Kenco Logistics.md', title: 'Kenco x YardFlow - Pilot scope', at: '2026-10-14T17:00:00.000Z', people: [CRAIG] },
  ],
};

describe('the vault\'s calls on the story (knowledge program, 2026-10-09)', () => {
  it('parseFirefliesCapture reads the summary bullets, the action items under their names (timestamps cut) and the keywords, never the transcript', () => {
    const f = parseFirefliesCapture(CAPTURE);
    expect(f.summary, 'the summary bullets with their heads, bold cut').toEqual([
      'Yard Operations Modernization: Integrating digital check-in and yard management systems across 140+ locations to enhance efficiency and reduce manual work',
      "Pilot Results: Nestlé's digital driver check-in increased water bottle shipments by 5% across 24 plants without adding staff.",
      'Next Steps: Complete usage analysis by early September; follow-up meeting scheduled for the week of August 29th to review progress.',
    ]);
    expect(f.actions).toEqual([
      { who: 'Casey Larkin', text: 'Prepare and share detailed case studies and deployment assets, including the demo recording for Ron, prior to next meeting' },
      { who: 'Casey Larkin', text: 'Send meeting summary and follow-up materials to Craig and Dave soon after call' },
      { who: 'Dave Kiesling', text: 'Coordinate internal yard management project phase completion by late August/early September, feeding into 2027 budget planning' },
    ]);
    expect(f.keywords).toEqual(['yard management', 'digital driver check-in', 'distribution centers']);
    expect(JSON.stringify(f), 'the transcript is never read').not.toContain('can you hear me');
    expect(parseFirefliesCapture('')).toEqual({ summary: [], actions: [], keywords: [] });
  });

  it('mergeTouches: a Fireflies call and a held meeting are touches of source vault with the buyers named from the record; a meeting still ahead is not', () => {
    const inputs = inputsWith({ knowledge });
    const touches = mergeTouches({ history: [], firstTouches: inputs.firstTouches, clawd: { read: 'ok', sends: [] }, replies: [], people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), knowledge: inputs.knowledge ?? null, now: NOW });
    const vault = touches.filter((t) => t.source === 'vault');
    expect(vault.map((t) => [t.kind, t.at.slice(0, 10), t.name, t.what])).toEqual([
      ['meeting', '2026-09-16', 'Craig Morrison and Dave Kiesling', 'Kenco x YardFlow - Next Steps'],
      ['call', '2026-07-16', 'Craig Morrison and Dave Kiesling', 'Kenco x YardFlow - Discovery'],
    ]);
    expect(vault[1].excerpt, 'the excerpt is two summary bullets and the first action item').toContain('Yard Operations Modernization: Integrating digital check-in');
    expect(vault[1].excerpt).toContain('Action item (Casey Larkin): Prepare and share detailed case studies');
    expect(vault[1].engagementId).toBe('vault:r1');
  });

  it('the between-us row says the call with its Fireflies summary and the held meeting, tagged Checked with the vault as the basis and the summary said as advisory', () => {
    const inputs = inputsWith({ knowledge });
    const touches = mergeTouches({ history: [], firstTouches: inputs.firstTouches, clawd: { read: 'ok', sends: [] }, replies: [], people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), knowledge: inputs.knowledge ?? null, now: NOW });
    const brief = buildAccountBrief(inputs, NOW);
    const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief, inputs, whyNow: [], know: [], touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
    const row = story.rows.find((r) => r.key === 'between_us')!;
    const texts = row.sentences.map((s) => s.text);
    const call = row.sentences.find((s) => /^Call Jul 16 with Craig Morrison and Dave Kiesling \(Fireflies\): Kenco x YardFlow - Discovery\./.test(s.text));
    expect(call, texts.join(' | ')).toBeTruthy();
    expect(call!.text).toContain('Yard Operations Modernization: Integrating digital check-in');
    expect(call!.tag).toBe('Checked');
    expect(call!.basis).toBe("the vault's Fireflies capture, Jul 16; the summary is advisory, the verbatim is on the note");
    expect(texts.some((t) => /^Meeting Sep 16 with Craig Morrison and Dave Kiesling: Kenco x YardFlow - Next Steps \(on the calendar; the vault's prep note\)\.$/.test(t)), texts.join(' | ')).toBe(true);
    expect(texts.some((t) => /Oct 14/.test(t)), 'a meeting still ahead is not a held meeting').toBe(false);
  });
});
