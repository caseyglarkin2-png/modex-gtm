/**
 * V2 NOW + ACCOUNT CONTEXT. The five-reviewer contract:
 *   - one idea in one slot (NEXT > WHO > WHY NOW > KNOW > THINK)
 *   - seller tags with the basis on the line; a third party stays attributed; a system record never backs a fact
 *     about the buyer's operations; imagery is a site-on-a-date fact, never cited
 *   - the gap before the pitch: current state / impact say "not confirmed" / "unknown"; no dollars; WEDGE only after
 *     the buyer confirmed a problem or impact
 *   - private engagement: interest, never a reason, never in WHY NOW, never read aloud
 *   - ASK in discovery order, never stack or future before the current state, the variance question for a VP
 *   - drip "send a touch" tasks and email opens are not history
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectAssets, projectEngagement, projectHistory, projectRelationship, isRoute, type AccountContext } from '@/lib/gap/context/context';
import { projectNow, sellerLine } from '@/lib/gap/context/now';
import { restrictionForName } from '@/lib/gap/policy/restriction';
import { PRIVATE_INTENT_COPY_PATTERNS } from '@/lib/gap/routing/explain';
import { COPY_INTENT_PATTERNS } from '@/lib/gap/compiler/checks/c04-product';

const NOW = new Date('2026-10-02T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the gate.', rootCauses: ['Appointments are not tied to gate check-in'], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow without waiting. A no means the gate is not the constraint.', primarySignalId: 'f1' };
const person = { id: 1, name: 'Dana Trans', title: 'NA Transportation Operations Director', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [], personas: [person], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const emptyCtx = (over: Partial<AccountContext> = {}): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW),
  history: [],
  assets: [],
  legacyNote: null,
  ...over,
});
const now = (over: Partial<AccountInputs> = {}, ctx: AccountContext = emptyCtx()) => {
  const i = inputs(over);
  return projectNow(buildAccountBrief(i, NOW), ctx, i, NOW);
};

describe('NOW: the decision, once', () => {
  it('state line, NEXT from GAP motion, WHO from the person prior, one WHY NOW with its basis', () => {
    const v = now();
    expect(v.stateLine).toMatch(/Ready for a first touch · Owner: Casey$/);
    expect(v.next).toMatchObject({ source: 'motion' });
    expect(v.who).toMatchObject({ name: 'Dana Trans', title: 'NA Transportation Operations Director' });
    expect(v.who!.why).toMatch(/^Primary operator/);
    expect(v.whyNow[0]).toMatchObject({ tag: 'Checked', basis: 'reported by news.example, Sep 20, 2026', cite: 'OK to cite to the buyer' });
  });
  it('each idea appears once across WHY NOW and KNOW (the reno fact is both a catalyst and a footprint fact)', () => {
    const v = now();
    const ids = [...v.whyNow, ...v.know].map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...v.whyNow, ...v.know].filter((l) => /Reno/.test(l.text))).toHaveLength(1);
  });
  it('the gap before the pitch: nothing confirmed, impact unknown with no dollars, no WEDGE, THINK hedged with a short wrong-if and the ASK that tests it', () => {
    const v = now();
    expect(v.currentState).toBe('Current state: not confirmed by the buyer.');
    expect(v.gap).toEqual([{ element: 'Current state', state: 'Unknown' }, { element: 'Problem', state: 'Our read' }, { element: 'Impact', state: 'Unknown' }, { element: 'Root cause', state: 'Our read' }]);
    expect(v.impact).toMatch(/^Impact: unknown/);
    expect(v.impact).not.toMatch(/\$/);
    expect(v.wedge).toBeNull();
    expect(v.think).toMatchObject({ text: 'inbound arrivals pile up at the gate', wrongIf: 'Arrivals flow without waiting.' });
  });
  it('WEDGE appears only after the buyer confirmed a problem', () => {
    const v = now({ bids: [{ id: 'b1', type: 'business_problem', summary: 'Trucks wait at the gate every morning.', quote: 'x', who: 'dana@acmefoods.com', at: '2026-09-28T00:00:00Z', hypothesisId: 'h1' }] });
    expect(v.wedge).not.toBeNull();
    expect(v.gap[1]).toEqual({ element: 'Problem', state: 'Buyer said' });
  });
  it('ASK in discovery order: current process first; never stack or future before the current state; a VP gets the variance question', () => {
    const director = now();
    expect(director.ask).toMatch(/^How do trailers get checked in and found at/);
    const vpOff = now({ personas: [{ ...person, title: 'VP Transportation' }] });
    expect(vpOff.ask).toBe('Does every site check trailers in and find them the same way, or does each site run its own process?');
    for (const v of [now(), director]) expect(v.ask).not.toMatch(/what system|a year from now|have to clear/i);
  });
  it('never a stack or desired-future question while the current state is unknown, even when nothing else is left to ask', () => {
    const i = inputs();
    const b = buildAccountBrief(i, NOW);
    const onlyLate = { ...b, discovery: [{ type: 'CURRENT_STACK' as const, question: 'What system tracks trailers?', why: 'x' }, { type: 'DESIRED_FUTURE' as const, question: 'What would good look like?', why: 'x' }] };
    expect(projectNow(onlyLate, emptyCtx(), i, NOW).ask).toBeNull();
    const confirmed = { ...i, bids: [{ id: 'b0', type: 'current_state', summary: 'Paper check-in at every DC.', quote: 'x', who: 'dana', at: '2026-09-28T00:00:00Z', hypothesisId: null }] };
    expect(projectNow({ ...buildAccountBrief(confirmed, NOW), discovery: onlyLate.discovery }, emptyCtx(), confirmed, NOW).ask).toBe('What system tracks trailers?');
  });
  it('WHY NOW holds at most one unverified signal; an "Unassigned" owner is not shown', () => {
    const sig = (n: number) => ({ id: `s${n}`, title: `Headline ${n}`, url: `https://x.example/${n}`, publishedAt: `2026-09-2${n}T00:00:00Z`, researchStatus: 'pending' });
    const v = now({ facts: [], hypotheses: [], signals: [sig(1), sig(2), sig(3)] }, emptyCtx({ relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Unassigned' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }) }));
    expect(v.whyNow).toHaveLength(1);
    expect(v.whyNow[0]).toMatchObject({ tag: 'Unverified', text: 'Headline 3' });
    expect(v.whyNow[0].basis).toMatch(/^a third party's report, not checked; published /);
    expect(v.stateLine).not.toMatch(/Owner/);
  });
  it('a slot is kept for the newest signal when checked facts would fill WHY NOW; a titleless signal shows Casey\'s note, never a bare URL', () => {
    const f = (n: number) => ({ ...fact, id: `f${n}`, quote: `Acme Foods opens site number ${n} in 2027.`, url: `https://news.example/${n}`, publishedAt: `2026-09-1${n}T00:00:00Z` });
    const hire = { id: 'sh', title: null, url: 'https://careers.walmart.com/us/en/jobs/R-2545651', publishedAt: null, researchStatus: 'queued', note: 'Hiring signal: Transportation Engineering, yard modernization initiatives. Posting may be closed.', capturedAt: '2026-10-02T20:00:00Z' };
    const v = now({ facts: [f(1), f(2), f(3)], hypotheses: [], signals: [hire] });
    expect(v.whyNow).toHaveLength(3);
    expect(v.whyNow.filter((l) => l.tag === 'Checked')).toHaveLength(2);
    expect(v.whyNow[2]).toMatchObject({ tag: 'Unverified', text: 'Hiring signal: Transportation Engineering, yard modernization initiatives. (careers.walmart.com)' });
    expect(v.whyNow[2].basis).toMatch(/^a third party's report, not checked; shared Oct 2, 2026$/);
    expect(v.whyNow[2].text).not.toMatch(/https?:|not verified/);
  });
  it('an undated discovered signal is never WHY NOW; Casey\'s own share is dated by when he shared it', () => {
    const undated = { id: 'su', title: 'Executive interview', url: 'https://youtube.example/x', publishedAt: null, researchStatus: 'no_usable_fact', note: null, capturedAt: '2026-09-30T00:00:00Z' };
    expect(now({ facts: [], hypotheses: [], signals: [undated] }).whyNow).toHaveLength(0);
    expect(now({ facts: [], hypotheses: [], signals: [{ ...undated, note: 'Casey: worth a look.' }] }).whyNow).toHaveLength(1);
  });
  it('a duplicate or unsayable checked line never spends a WHY NOW slot', () => {
    const f = (n: number, q?: string) => ({ ...fact, id: `f${n}`, quote: q ?? `Acme Foods opens site number ${n} in 2027.`, url: `https://news.example/${n}`, publishedAt: `2026-09-1${n}T00:00:00Z` });
    const hire = { id: 'sh', title: 'Acme hiring a yard lead', url: 'https://careers.example/1', publishedAt: '2026-09-25T00:00:00Z', researchStatus: 'queued' };
    // f9 repeats f8's quote word for word: one line, and the other checked fact still gets the second slot.
    const v = now({ facts: [f(8, 'Acme Foods opens site number 8 in 2027.'), { ...f(9, 'Acme Foods opens site number 8 in 2027.'), url: 'https://other.example/9' }, f(7)], hypotheses: [], signals: [hire] });
    expect(v.whyNow.filter((l) => l.tag === 'Checked')).toHaveLength(2);
  });
  it('names stored all lower case read as names; anything with a capital is left alone', async () => {
    const { displayName } = await import('@/lib/gap/context/now');
    expect(displayName('adel ghanem')).toBe('Adel Ghanem');
    expect(displayName("mary o'neil-smith")).toBe("Mary O'Neil-Smith");
    expect(displayName('Chris McAndrew')).toBe('Chris McAndrew');
    expect(now({ personas: [{ ...person, name: 'dana trans' }] }).who?.name).toBe('Dana Trans');
  });
  it('NEXT is an upcoming meeting within 14 days', () => {
    const ctx = emptyCtx({ relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [{ meeting_status: 'Booked', meeting_date: '2026-10-06T15:00:00Z', objective: 'Yard walk-through', created_at: '2026-09-30' }], emails: [], now: NOW }) });
    expect(now({}, ctx).next).toEqual({ text: 'Prepare for the meeting on Oct 6, 2026: Yard walk-through. Read BRIEF before you go.', source: 'meeting' });
  });
});

describe('seller tags and bases', () => {
  const x = { domains: ['acmefoods.com'], accountName: 'Acme Foods', citable: new Set(['f9']) };
  it('their own publication vs a third party\'s report; only a live, non-sensitive fact is OK to cite', () => {
    expect(sellerLine({ text: 'a', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'f9', label: 'x', url: 'https://www.acmefoods.com/news', at: '2026-09-01' }] }, 'footprint', x)).toMatchObject({ tag: 'Checked', basis: 'their own publication, Sep 1, 2026', cite: 'OK to cite to the buyer' });
    expect(sellerLine({ text: 'b', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'f8', label: 'x', url: 'https://trade.example/a', at: '2026-09-01' }] }, 'footprint', x)).toMatchObject({ basis: 'reported by trade.example, Sep 1, 2026', cite: 'Checked, not for outreach' });
  });
  it('a system record never backs a fact about their operations; it may back our relationship', () => {
    const s = { text: 'c', truth: 'VERIFIED_PUBLIC' as const, sources: [{ kind: 'persona' as const, ref: '1', label: 'CRM', url: null, at: null }] };
    expect(sellerLine(s, 'footprint', x)).toBeNull();
    expect(sellerLine(s, 'relationships', x)).toMatchObject({ tag: 'Checked', basis: 'our own record' });
  });
  it('imagery is a site-on-a-date fact, never cited; buyer truth is "Buyer said"', () => {
    expect(sellerLine({ text: 'd', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'audit', ref: null, label: 'audit', url: 'https://maps.example', at: '2026-05-01' }], asOf: '2026-05-01' }, 'volume', x)).toMatchObject({ cite: 'Never cite (from imagery)', basis: expect.stringMatching(/never a problem$/) });
    expect(sellerLine({ text: 'e', truth: 'BUYER_CONFIRMED', sources: [{ kind: 'bid', ref: 'b1', label: 'Dana', url: null, at: '2026-09-28' }] }, 'yard', x)).toMatchObject({ tag: 'Buyer said' });
  });
});

describe('private engagement: interest, never a reason, never aloud, never copy', () => {
  const row = (at: string, over: Partial<Parameters<typeof projectEngagement>[0][number]> = {}) => ({ path: '/for/acme', sections_viewed: ['hero', 'network', 'roi-model'], cta_ids: [], scroll_depth_pct: 80, duration_seconds: 200, updated_at: at, human: true, ...over });
  it('material deep engagement is one labelled private line with a dated range; bots are not counted; no score', () => {
    const e = projectEngagement([row('2026-04-03'), row('2026-06-12', { cta_ids: ['book'] }), row('2026-06-01', { human: false })], NOW);
    expect(e).toMatchObject({ sessions: 2, ctaSessions: 1, roiReads: 2, material: true });
    expect(e.line).toBe('Private: interest signal, never mention to the buyer. 2 deep sessions on /for/acme (Apr to Jun; 1 with a CTA click, 2 read our ROI model); quiet since Jun 12.');
    expect(JSON.stringify(e)).not.toMatch(/score|high.intent|hot/i);
    expect(projectEngagement([row('2025-12-01')], NOW).material).toBe(false);
  });
  it('NOW shows it on its own line, never in WHY NOW, KNOW or THINK, and Listen never reads it', () => {
    const v = now({}, emptyCtx({ engagement: projectEngagement([row('2026-09-20', { cta_ids: ['book'] })], NOW) }));
    expect(v.private).toMatch(/^Private: interest signal, never mention to the buyer/);
    expect(JSON.stringify([v.whyNow, v.know, v.think, v.impact])).not.toMatch(/Private|session|ROI model/);
    expect(v.listen).not.toMatch(/Private|session/);
  });
  it('the private-intent tells a buyer must never read are rejected by the compiler patterns, including "you spent X minutes" and "what made you look"', () => {
    const all = [...COPY_INTENT_PATTERNS, ...PRIVATE_INTENT_COPY_PATTERNS];
    const caught = (s: string) => all.some((p) => p.pattern.test(s));
    for (const s of ['I saw you visited our page', 'noticed you viewed the ROI model', 'you spent 12 minutes on the yard page', 'you spent some time on our ROI model', 'you clicked the audit link', 'What made you look at yard visibility?', 'Saw that your team opened it']) expect([s, caught(s)]).toEqual([s, true]);
    // ...and nothing NOW asks or says carries one of them.
    const v = now({}, emptyCtx({ engagement: projectEngagement([row('2026-09-20', { cta_ids: ['book'] })], NOW) }));
    for (const s of [v.ask, v.next.text, v.listen, v.think?.text, v.think?.testedBy]) expect([s, s ? caught(s) : false]).toEqual([s, false]);
  });
});

describe('Dannon (warm intro only)', () => {
  it('NEXT is the intro ask, WHO is the introducer with the route; no ASK or relationship line repeats it (final seller review)', () => {
    const r = restrictionForName('Dannon');
    const i = inputs({ account: { name: 'Dannon', tier: 'Tier 1', priorityBand: 'A', vertical: 'dairy', parentBrand: 'Danone', hubspotCompanyId: '7' }, personas: [], facts: [] });
    const ctx = emptyCtx({ relationship: projectRelationship({ restriction: r, account: { best_intro_path: 'Mark Shaughnessy -> Danone CSCO intro', owner: 'Casey' }, personas: [{ name: 'Heiko Gerling', intro_route: 'Mark -> Heiko / CSCO office' }], memberships: [], meetings: [], emails: [], now: NOW }) });
    const v = projectNow(buildAccountBrief(i, NOW), ctx, i, NOW);
    expect(v.next.source).toBe('restriction');
    expect(v.next.text).toMatch(/^Ask Mark Shaughnessy for the introduction/);
    expect(v.who).toMatchObject({ name: 'Mark Shaughnessy', route: 'Mark -> Heiko / CSCO office' });
    expect(v.ask).toBeNull();
    expect([v.next.text, v.who?.why, v.relationship ?? ''].join(' ').match(/learn from/g)).toHaveLength(1);
    expect(v.relationship).toBeNull();
    expect(v.stateLine).toMatch(/Warm intro only/);
  });
});

describe('final review fixes (2026-10-02)', () => {
  it('P1: "their own publication" only on the account\'s own domain, never a name match', () => {
    const y = { domains: ['thehersheycompany.com'], accountName: 'The Hershey Company', citable: new Set<string>() };
    const at = (url: string) => sellerLine({ text: 't', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'f', label: 'x', url, at: '2026-09-01' }] }, 'footprint', y)!.basis;
    expect(at('https://www.thestreet.com/a')).toMatch(/^reported by thestreet\.com/);
    expect(at('https://www.thehersheycompany.com/news')).toMatch(/^their own publication/);
    expect(sellerLine({ text: 't', truth: 'VERIFIED_PUBLIC', sources: [{ kind: 'evidence', ref: 'f', label: 'x', url: 'https://www.foodbusinessnews.net/a', at: '2026-09-01' }] }, 'footprint', { domains: [], accountName: 'US Foods', citable: new Set() })!.basis).toMatch(/^reported by/);
  });
  it('a buyer metric is not an impact: no WEDGE, impact still unknown', () => {
    const v = now({ bids: [{ id: 'm', type: 'metric', summary: 'About 300 trucks a day at Dallas.', quote: 'x', who: 'dana', at: '2026-09-28T00:00:00Z', hypothesisId: null }] });
    expect(v.wedge).toBeNull();
    expect(v.impact).toMatch(/^Impact: unknown/);
  });
  it('THINK never leads on an ungrounded draft', () => {
    expect(now({ facts: [] }).think).toBeNull();
  });
  it('a relationship WHO keeps the prior\'s operator as the alternate; an adjacent pick says the operating owner is still missing', () => {
    const rel = now({ facts: [], memberships: [{ sourceName: 'Inland26', sourceType: 'conference', relationshipContext: 'Met at Inland26', personName: 'Ryan Rel' }] });
    expect(rel.who?.name).toBe('Ryan Rel');
    expect(rel.alternate?.name).toBe('Dana Trans');
    const adj = now({ personas: [{ ...person, name: 'Vic VP', title: 'VP Supply Chain' }] });
    expect(adj.who?.name).toBe('Vic VP');
    expect(adj.whoUnknown).toBe('No US / North America transportation operations owner on record yet: find them (BRIEF: buyer map).');
    expect(now().whoUnknown).toBeNull();
  });
  it('a raw HubSpot stage id never reaches the state line; internal stage names read as words', () => {
    expect(now({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'Pilot', stage: '1417384082' }] } }).stateLine).toMatch(/· In a deal$|· In a deal ·/);
    expect(now({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'Pilot', stage: 'appointmentscheduled' }] } }).stateLine).toMatch(/In a deal \(appointment scheduled\)/);
  });
  it('a vendor\'s own marketing is never WHY NOW', () => {
    const vendor = { ...fact, id: 'fv', quote: 'Gatik moves freight for Acme Foods across 250 stores.', url: 'https://gatik.ai/news' };
    expect(now({ facts: [vendor], hypotheses: [] }).whyNow.map((l) => l.text).join(' ')).not.toMatch(/Gatik/);
  });
});

describe('context projections', () => {
  it('a route names a person or an introduction; a channel or topic is not one', () => {
    expect(isRoute('Mark Shaughnessy -> Danone CSCO intro')).toBe(true);
    expect(isRoute('Direct email')).toBe(false);
    expect(isRoute('Supply chain + transportation')).toBe(false);
  });
  it('history: drip "send a touch" tasks and email opens are not history; a reply is; per-kind caps', () => {
    const h = projectHistory({
      activities: [
        { activity_type: 'Follow-up', outcome: null, notes: 'Campaign drip automation - touch 2 - c', next_step: 'Send touch 2 with angle: x', activity_date: '2026-09-01', created_at: '2026-09-01' },
        { activity_type: 'Call', outcome: 'Talked to the DC manager', notes: null, next_step: null, activity_date: '2026-09-02', created_at: '2026-09-02' },
      ],
      emails: [{ to_email: 'dana@acmefoods.com', subject: 'Yard question', sent_at: '2026-09-03', reply_count: 1 }],
      meetings: [], captures: [], outcomes: [], sends: [], now: NOW,
    });
    expect(h.map((x) => x.kind)).toEqual(['email_sent', 'reply', 'activity']);
    expect(JSON.stringify(h)).not.toMatch(/drip|Send touch|opened|High-intent/i);
    expect(h.every((x) => x.visibility === 'seller')).toBe(true);
  });
  it('assets: newest version per type with last sent; the legacy meeting brief is a dated legacy note', () => {
    const a = projectAssets({ generated: [{ id: 1, content_type: 'one_pager', version: 1, created_at: '2026-05-01' }, { id: 2, content_type: 'one_pager', version: 2, created_at: '2026-06-01' }], sends: [{ generated_content_id: 1, sent_at: '2026-05-03' }], micrositeSlug: 'acme', demoSlug: null, legacyMeetingBrief: '/briefs/acme', accountName: 'Acme Foods' });
    expect(a[0]).toMatchObject({ label: 'One-pager v2', lastSentAt: new Date('2026-05-03').toISOString(), href: '/studio?account=Acme%20Foods' });
    expect(a.find((x) => x.kind === 'legacy_meeting_brief')).toMatchObject({ legacy: true });
  });
});
