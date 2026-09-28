/**
 * Evidence continuity through the REAL research path (runEvidenceResearch):
 * the PepsiCo / Gatik chain with the real sentences. The June primary plus
 * the August corroboration mints a continuation row that carries the primary
 * sentence and the corroborated clock; June alone seeks corroboration (one
 * focused web call) and is never called fresh on its own wording; a newer
 * "ended" source supersedes. Only research tables are written.
 */
import { describe, expect, it, vi } from 'vitest';
import { runEvidenceResearch } from '@/lib/gap/research/run';
import { datelineDate, hostBelongsToAccount, type Candidate } from '@/lib/gap/research/providers';
import { signalCandidates } from '@/lib/gap/signals/research';
import { outreachFactRefusal } from '@/lib/gap/research/evidence-gate';

const PRIMARY = 'June 8, 2026 PepsiCo and Gatik announced a multi-year strategic partnership to bring autonomous freight into PepsiCo’s North America food and beverage supply chain, marking the largest commercial autonomous freight deployment to date.';
const AUG = 'Gatik moves freight for PepsiCo across roughly 250 retail locations in Texas, Arizona and Arkansas.';
const PEPSI_URL = 'https://www.pepsico.com/en/newsroom/press-releases/2026/pepsico-and-gatik-announce-multi-year-agreement-to-deploy-autonomous-freight-in-north-america';
const FW_AUG = 'https://www.freightwaves.com/news/gatik-driverless-freight-series-d';
const PAGES: Record<string, string> = {
  [PEPSI_URL]: `Newsroom Menu Search ${PRIMARY} Today, Gatik is already operating for PepsiCo across Texas, Arizona, and Arkansas.`,
  [FW_AUG]: `FreightWaves Gatik raises Series D. ${AUG} PepsiCo announced the multi-year agreement in June, FreightWaves reported.`,
};
const NOW = new Date('2026-09-28T15:00:00Z');

function db() {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  const t: Record<string, any[]> = { runs: [], records: [], signals: [], audit: [] };
  const writes: string[] = [];
  const w = (k: string, f: any) => vi.fn(async (a: any) => { writes.push(k); return f(a); });
  const prisma: any = {
    researchRun: { create: w('researchRun.create', ({ data }: any) => { const r = { id: id('run'), ...data }; t.runs.push(r); return { id: r.id }; }), update: w('researchRun.update', ({ where, data }: any) => Object.assign(t.runs.find((r) => r.id === where.id), data)) },
    evidenceRecord: {
      upsert: w('evidenceRecord.upsert', ({ where, create }: any) => { const k = where.account_name_claim_hash_source_url_observed_at; let r = t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url); if (!r) { r = { id: id('ev'), ...create }; t.records.push(r); } return r; }),
      findUnique: vi.fn(async ({ where }: any) => { const k = where.account_name_claim_hash_source_url_observed_at; return t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url) ?? null; }),
    },
    prospectingSignal: {
      findUnique: vi.fn(async ({ where }: any) => t.signals.find((s) => s.source_kind === where.source_kind_source_id.source_kind && s.source_id === where.source_kind_source_id.source_id) ?? null),
      create: w('prospectingSignal.create', ({ data }: any) => { const s = { id: id('sig'), ...data }; t.signals.push(s); return s; }),
      findMany: vi.fn(async ({ where }: any) => t.signals.filter((s) => s.account_name === where.account_name && s.source_kind === where.source_kind)),
      // Only metadata may move on a stored signal (GAP_SIGNAL_FROZEN); the fake enforces it.
      update: w('prospectingSignal.update', ({ where, data }: any) => { if (Object.keys(data).some((k) => k !== 'metadata')) throw new Error('GAP_SIGNAL_FROZEN'); return Object.assign(t.signals.find((s) => s.id === where.id), data); }),
    },
    gapAuditEvent: { create: w('gapAuditEvent.create', ({ data }: any) => { t.audit.push(data); return { id: id('a') }; }) },
  };
  return { prisma, t, writes };
}

const input = (now = NOW) => ({ accountName: 'PepsiCo', personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 'gap-research', now });
const cand = (url: string, excerpt: string, publishedAt: string, sourceType: Candidate['sourceType']): Candidate => ({ provider: 'signal', url, title: url.includes('pepsico.com') ? 'PepsiCo and Gatik announce multi-year agreement to deploy autonomous freight in North America' : 'Gatik driverless freight Series D', publishedAt: new Date(publishedAt), excerpt, sourceType });
const noProviders = { edgar: async () => ({ candidates: [], note: 'off' }), fetchText: async (u: string) => PAGES[u] ?? '' };

describe('G: June primary + August corroboration, through research', () => {
  it('mints ONE continuation row: the primary sentence, URL and date, with the clock from the August corroboration', async () => {
    const { prisma, t, writes } = db();
    const web = vi.fn(async () => ({ candidates: [], note: 'off' }));
    const r = await runEvidenceResearch(prisma, input(), {
      ...noProviders,
      web,
      extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary'), cand(FW_AUG, AUG, '2026-08-25T17:56:46Z', 'public_secondary')], note: 'pages' }),
    });
    const cont = t.signals.filter((s) => s.source_id.startsWith('continuity:'));
    expect(cont).toHaveLength(1);
    const c = cont[0];
    expect(c).toMatchObject({ evidence_text: PRIMARY, evidence_url: PEPSI_URL, source_type: 'public_primary', account_name: 'PepsiCo' });
    expect(c.observed_at.toISOString().slice(0, 10)).toBe('2026-06-08'); // the ORIGINAL event date is kept
    expect(c.freshness_expires_at.getTime()).toBeGreaterThan(new Date('2026-12-01').getTime()); // currentness from Aug 25
    expect(c.metadata).toMatchObject({ verified: 'excerpt_found_at_source', continuity: { kind: 'ongoing_state', primary: { url: PEPSI_URL }, currentness: { url: FW_AUG, excerpt: AUG } } });
    // the original June row is untouched: its own clock still ends October 6
    const orig = t.signals.find((s) => s.evidence_url === PEPSI_URL && !s.source_id.startsWith('continuity:'));
    expect(orig.freshness_expires_at.toISOString().slice(0, 10)).toBe('2026-10-06');
    expect(r.continuity?.corroborated).toHaveLength(1);
    expect(t.audit.map((a) => a.kind)).toContain('research.continuity_established');
    // it passes the unchanged outreach gate; no corroboration search was needed
    expect(outreachFactRefusal(c, 'PepsiCo')).toBeNull();
    expect(web).toHaveBeenCalledTimes(1); // the ordinary web provider only
    expect(writes.every((k) => /^(researchRun|evidenceRecord|prospectingSignal|gapAuditEvent)\./.test(k))).toBe(true);
  });

  it('idempotent: a second run over the same facts registers no second continuation row', async () => {
    const { prisma, t } = db();
    const deps = { ...noProviders, web: async () => ({ candidates: [], note: 'off' }), extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary'), cand(FW_AUG, AUG, '2026-08-25T17:56:46Z', 'public_secondary')], note: 'pages' }) };
    await runEvidenceResearch(prisma, input(), deps);
    await runEvidenceResearch(prisma, input(new Date('2026-09-29T15:00:00Z')), deps);
    expect(t.signals.filter((s) => s.source_id.startsWith('continuity:'))).toHaveLength(1);
  });
});

describe('only VERIFIED facts take part', () => {
  it('a corroboration that later failed its recheck never extends a clock', async () => {
    const { prisma, t } = db();
    const deps = { ...noProviders, web: async () => ({ candidates: [], note: 'off' }), seekCurrentness: false };
    await runEvidenceResearch(prisma, { ...input(), seekCurrentness: false }, { ...deps, extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary'), cand(FW_AUG, AUG, '2026-08-25', 'public_secondary')], note: 'pages' }) });
    // simulate the recheck script: the August row is no longer found at its source
    const aug = t.signals.find((s) => s.evidence_text === AUG);
    aug.metadata = { ...aug.metadata, verified: 'failed_recheck' };
    const minted = t.signals.find((s) => s.source_id.startsWith('continuity:'));
    expect(outreachFactRefusal(minted, 'PepsiCo')).toBeNull();
    await runEvidenceResearch(prisma, { ...input(new Date('2026-09-29T00:00:00Z')), seekCurrentness: false }, { ...deps, extra: async () => ({ candidates: [], note: 'none' }) });
    // the existing continuation is withdrawn (refused by the gate), and no new one is minted
    expect(minted.metadata.verified).toBe('source_failed_recheck');
    expect(outreachFactRefusal(minted, 'PepsiCo')).toBe('not_verified');
    expect(t.signals.filter((s) => s.source_id.startsWith('continuity:'))).toHaveLength(1);
  });
});

describe('H: June alone, near its own clock', () => {
  it('seeks corroboration with ONE focused web call naming the program, and mints nothing when none verifies', async () => {
    const { prisma, t } = db();
    const web = vi.fn(async () => ({ candidates: [], note: '0 web proposals' }));
    const r = await runEvidenceResearch(prisma, input(), { ...noProviders, web, extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary')], note: 'pages' }) });
    expect(web).toHaveBeenCalledTimes(2);
    const focus = (web.mock.calls[1] as unknown as [string, string])[1];
    expect(focus).toMatch(/CURRENTNESS CHECK/);
    expect(focus).toMatch(/Gatik/);
    expect(r.continuity?.seeking.map((s) => s.programKeys)).toEqual([['gatik']]);
    expect(t.signals.filter((s) => s.source_id.startsWith('continuity:'))).toHaveLength(0);
  });

  it('when the currentness search finds the August report, it is verified at its source and the chain is established', async () => {
    const { prisma, t } = db();
    const web = vi.fn(async (_a: string, focus: string) => ({ candidates: /CURRENTNESS/.test(focus) ? [{ ...cand(FW_AUG, AUG, '2026-08-25', 'public_secondary'), provider: 'web' as const }] : [], note: 'w' }));
    await runEvidenceResearch(prisma, input(), { ...noProviders, web, extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary')], note: 'pages' }) });
    const cont = t.signals.filter((s) => s.source_id.startsWith('continuity:'));
    expect(cont).toHaveLength(1);
    expect(cont[0].metadata.continuity.currentness.url).toBe(FW_AUG);
  });

  it('a far-from-expiry ongoing fact is not re-searched (no extra call)', async () => {
    const { prisma } = db();
    const web = vi.fn(async () => ({ candidates: [], note: 'off' }));
    await runEvidenceResearch(prisma, input(new Date('2026-06-20T00:00:00Z')), { ...noProviders, web, extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary')], note: 'pages' }) });
    expect(web).toHaveBeenCalledTimes(1);
  });
});

describe('C: a newer source says the program ended', () => {
  it('the older fact is marked ended in metadata only, the gate refuses it as superseded, and no continuation is minted', async () => {
    const { prisma, t } = db();
    const ENDED = 'PepsiCo ended its autonomous freight deployment with Gatik in Texas, Arizona and Arkansas.';
    const END_URL = 'https://news.example/pepsico-gatik-ends';
    PAGES[END_URL] = `News. ${ENDED}`;
    await runEvidenceResearch(prisma, input(), {
      ...noProviders,
      web: async () => ({ candidates: [], note: 'off' }),
      extra: async () => ({ candidates: [cand(PEPSI_URL, PRIMARY, '2026-06-08', 'public_primary'), cand(FW_AUG, AUG, '2026-08-25', 'public_secondary'), cand(END_URL, ENDED, '2026-09-20', 'public_secondary')], note: 'pages' }),
    });
    const orig = t.signals.find((s) => s.evidence_text === PRIMARY && !s.source_id.startsWith('continuity:'));
    expect(orig.metadata.continuity).toMatchObject({ kind: 'ended', endedBy: { url: END_URL } });
    expect(outreachFactRefusal(orig, 'PepsiCo')).toBe('superseded');
    expect(t.signals.filter((s) => s.source_id.startsWith('continuity:'))).toHaveLength(0);
    delete PAGES[END_URL];
  });
});

describe('source dating and the company primary source', () => {
  it('a press-release dateline naming the account dates an undated page; a sidebar date does not', () => {
    expect(datelineDate(`Menu Search ${PRIMARY}`, 'PepsiCo', NOW)?.toISOString().slice(0, 10)).toBe('2026-06-08');
    expect(datelineDate('Latest: September 1, 2026 Weather update. PepsiCo news below.', 'PepsiCo', NOW)).toBeNull();
    expect(datelineDate('December 1, 2026 PepsiCo will open', 'PepsiCo', NOW)).toBeNull(); // future
  });

  it("the account's own domain is its primary source (no hardcoded names)", () => {
    expect(hostBelongsToAccount(PEPSI_URL, 'PepsiCo')).toBe(true);
    expect(hostBelongsToAccount('https://www.generalmills.com/news/x', 'General Mills')).toBe(true);
    expect(hostBelongsToAccount(FW_AUG, 'PepsiCo')).toBe(false);
    expect(hostBelongsToAccount('https://pepsicofans.example/x', 'PepsiCo')).toBe(false);
  });

  it('signalCandidates dates an undated signal page from its dateline and marks the company page primary', async () => {
    const html = `<html><head><title>PepsiCo and Gatik</title></head><body><p>${PRIMARY}</p></body></html>`;
    const r = await signalCandidates([{ id: 's', url: PEPSI_URL, title: 'PepsiCo and Gatik', published_at: null, source_class: 'news', resolution_basis: 'human', event_id: null }], { fetchHtml: async () => html, accountName: 'PepsiCo' });
    expect(r.candidates[0]).toMatchObject({ sourceType: 'public_primary', excerpt: expect.stringContaining(PRIMARY) });
    expect(r.candidates[0].publishedAt?.toISOString().slice(0, 10)).toBe('2026-06-08');
  });
});

describe('evidence integrity review findings (2026-09-28)', () => {
  it('a transport-network deployment is labelled as what it is, never a site opening', async () => {
    const { classifyFact } = await import('@/lib/gap/research/facts');
    expect(classifyFact('This agreement builds on PepsiCo’s experience running one of North America’s largest private fleets and brings Gatik’s autonomous freight capabilities into real, day-to-day supply chain operations.')).toEqual({ type: 'automation_program', change: 'automation' });
    expect(classifyFact(AUG)).toEqual({ type: 'site_expansion', change: 'investment' });
    // a site change in the same sentence still wins
    expect(classifyFact('Acme will open a new distribution center in Reno operating driverless trucks.').change).toBe('opening');
  });

  it('the evidence clock runs from an event date the sentence states, not from a later filing date', async () => {
    const { statedEventDate } = await import('@/lib/gap/research/facts');
    const q = new Date('2026-09-18T00:00:00Z');
    expect(statedEventDate('On July 1, 2026, we announced that we had entered into an agreement and plan of merger to acquire Giant Eagle.', q)?.toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(statedEventDate(PRIMARY, new Date('2026-06-08T00:00:00Z'))).toBeNull(); // the dateline is the publication itself
    expect(statedEventDate('Acme will open a distribution center on December 1, 2026.', q)).toBeNull(); // a future date is not the event's past
    expect(statedEventDate('On July 1, 2026, Acme said it will open the distribution center on December 1, 2026.', q)?.toISOString().slice(0, 10)).toBe('2026-07-01');
  });

  it('stored: a September filing restating a July 1 event is current only from July 1', async () => {
    const { prisma, t } = db();
    const KR = 'On July 1, 2026, PepsiCo announced it will acquire a regional distribution company with five distribution centers in Ohio.';
    const url = 'https://www.sec.gov/pep-10q.htm';
    PAGES[url] = `10-Q ${KR}`;
    await runEvidenceResearch(prisma, input(), { ...noProviders, web: async () => ({ candidates: [], note: 'off' }), extra: async () => ({ candidates: [cand(url, KR, '2026-09-18', 'public_primary')], note: 'p' }) });
    const s = t.signals.find((x) => x.evidence_text === KR);
    expect(s.observed_at.toISOString().slice(0, 10)).toBe('2026-09-18'); // the source's own date is kept
    expect(s.freshness_expires_at.toISOString().slice(0, 10)).toBe('2026-12-28'); // acquisition window from July 1
    expect(s.metadata.eventDate).toBe('2026-07-01');
    delete PAGES[url];
  });
});
