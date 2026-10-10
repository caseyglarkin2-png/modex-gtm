// @vitest-environment node
/**
 * The war-room adapter (2026-10-09): a dossier becomes one record carrying the why-now paragraphs and findings as
 * the passage, the named sources and the public links as sources, the file's git date as the report date, the intent
 * score and the views as context (never intent), the talk track left out; the example dossier is skipped; a second
 * import of the same dossier is a duplicate and a changed one a revision.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { importIntelligenceBatch } from '@/lib/gap/signals/intelligence-import';
import { mapWarRoomDossier } from '@/lib/gap/signals/warroom-export';

const dossier = {
  slug: 'ab-inbev', displayName: 'AB InBev', archetype: 'brewer', oneLiner: 'Fewer breweries, more trailers per yard.',
  status: { domain: 'ab-inbev.com', dealStage: null, tamTier: 'C', intentScore: 65, lastIntentAt: '2026-06-12T17:57:17Z' },
  whyNow: ['AB InBev put $300M into US manufacturing in 2025 and is closing Fairfield CA (Feb 2026) and Merrimack NH.', 'Ricardo Moreira took over as global Chief Supply Chain Officer.'],
  surprisingFindings: ['12 of the 18 audited AB InBev sites are rail-served.'],
  sources: ['HubSpot company AB InBev id 54407373877: intent_score 65', 'Deck engagement: zero ab-inbev.com viewers across 216 rows'],
  links: { for: 'https://yardflow.ai/for/ab-inbev', demo: 'https://yardflow.ai/demo/ab-inbev' },
  engagement: { deckViews: 0, forPageVisits: 0, topVisitors: [] },
  committee: [{ name: 'Ricardo Moreira', title: 'CSCO' }],
  talkTrack: { opener: 'Your yards are the cap.' },
};

describe('the war-room dossier as a record', () => {
  it('maps the evidence, labels the context, leaves the pitch out, skips the example', () => {
    const r = mapWarRoomDossier(dossier, { changedOn: '2026-06-25', runId: 'war-room:2026-10-09', commitSha: '669a855' })!;
    expect(r).toMatchObject({ producer: 'war_room_dossier', producerItemId: 'ab-inbev', kind: 'observation', reportedOn: '2026-06-25', eventDate: null, accountHint: 'AB InBev', personHints: ['Ricardo Moreira'], producerStatus: 'tam tier C' });
    expect(r.text).toContain('closing Fairfield CA (Feb 2026)');
    expect(r.text).toContain('Finding: 12 of the 18 audited AB InBev sites are rail-served.');
    expect(r.text).not.toContain('Your yards are the cap');
    expect(r.sources?.map((s) => s.url ?? s.label)).toEqual(['https://yardflow.ai/for/ab-inbev', 'https://yardflow.ai/demo/ab-inbev', 'HubSpot company AB InBev id 54407373877: intent_score 65', 'Deck engagement: zero ab-inbev.com viewers across 216 rows']);
    expect(r.uncertainty).toContain('intent score 65 (last 2026-06-12); 0 deck views, 0 page visits: engagement context, never buying intent');
    expect(r.archive).toEqual({ reportRef: 'war-room:data/accounts/ab-inbev.json@669a855', section: 'whyNow, surprisingFindings' });
    expect(mapWarRoomDossier({ slug: 'example', whyNow: ['x'] }, { changedOn: '2026-06-25', runId: 'r' })).toBeNull();
    expect(mapWarRoomDossier({ slug: 'empty' }, { changedOn: '2026-06-25', runId: 'r' })).toBeNull();
  });

  it('imports once; the same dossier again is a duplicate; a changed one is a revision', async () => {
    const prisma = ledgerDb({ accounts: ['AB InBev'], aliases: [] }).client();
    const r1 = mapWarRoomDossier(dossier, { changedOn: '2026-06-25', runId: 'r1' })!;
    const a = await importIntelligenceBatch(prisma, { records: [r1], actor: 't', now: new Date('2026-10-09T20:00:00Z') });
    expect(a).toMatchObject({ accepted: 1 });
    const row = (await prisma.gapSignal.findMany({}))[0];
    expect(row).toMatchObject({ account_name: 'AB InBev', resolution: 'resolved', origin: 'report_import' });
    const b = await importIntelligenceBatch(prisma, { records: [r1], actor: 't', now: new Date('2026-10-09T21:00:00Z') });
    expect(b).toMatchObject({ accepted: 0, duplicates: 1 });
    const r2 = mapWarRoomDossier({ ...dossier, whyNow: [...dossier.whyNow, 'A new paragraph.'] }, { changedOn: '2026-10-09', runId: 'r2' })!;
    const c = await importIntelligenceBatch(prisma, { records: [r2], actor: 't', now: new Date('2026-10-09T22:00:00Z') });
    expect(c).toMatchObject({ revised: 1 });
    expect(await prisma.gapSignal.count({})).toBe(1);
  });
});
