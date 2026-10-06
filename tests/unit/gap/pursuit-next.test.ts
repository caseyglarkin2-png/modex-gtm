/** UX-03: NEXT and the chosen person agree by construction (the pack is built for the person the state names). */
import { describe, expect, it } from 'vitest';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { nextFromPursuit } from '@/lib/gap/pursuit/next';

const NOW = new Date('2026-10-05T15:00:00Z');
const opts = { hypothesisId: 'h1', accountSlugHref: (v: 'brief' | 'sources') => `/gap/accounts/acme?view=${v}`, replyThreadHref: null, captureHref: '/gap/capture?account=Acme' };
const base = (over: Partial<Parameters<typeof projectPursuitState>[0]> = {}) =>
  projectPursuitState({ accountName: 'Acme', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [{ key: 'gap:1', personaId: 1, name: 'Karen Darling', title: 'Sr Director PBNA Transportation' }], ...over });

describe('nextFromPursuit', () => {
  it('READY with a GAP contact opens the pack for THAT person', () => {
    const n = nextFromPursuit(base(), opts);
    expect(n.text).toMatch(/Prepare the first touch to Karen Darling/);
    expect(n.control).toEqual({ href: '/gap/preview/h1?personaId=1', label: 'Prepare the email to Karen' });
  });
  it('READY with a HubSpot-only person says add them first and points at the people, never at a pack', () => {
    const n = nextFromPursuit(base({ eligible: [{ key: 'hubspot:9', personaId: null, hubspotContactId: '9', name: 'Karen Darling', title: 'Sr Director' }] }), opts);
    expect(n.text).toMatch(/Add Karen Darling/);
    expect(n.control).toEqual({ href: '#people-stack-heading', label: 'Add Karen from the people below' });
    expect(n.control?.href).not.toMatch(/preview/);
  });
  it('CHOOSE PERSON points at the stack, never at a hypothesis preview', () => {
    const n = nextFromPursuit(base({ eligible: [{ key: 'gap:1', personaId: 1, name: 'A', title: null }, { key: 'gap:2', personaId: 2, name: 'B', title: null }] }), opts);
    expect(n.text).toMatch(/Choose who hears this first/);
    expect(n.control?.href).toBe('#people-stack-heading');
  });
  it('OPTED OUT asks to record the opt-out; REPLIED asks to read and record; neither prepares a touch', () => {
    const o = nextFromPursuit(base({ replies: [{ from: 'tim@acme.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }] }), opts);
    expect(o.text).toMatch(/Record tim@acme.com's opt-out/);
    expect(o.control?.label).toBe('Record the opt-out');
    const r = nextFromPursuit(base({ replies: [{ from: 'tim@acme.com', name: 'Tim Cooper', at: '2026-10-05T13:58:00Z', subject: null, snippet: 'Call me Tuesday', triaged: false }] }), opts);
    expect(r.text).toMatch(/Read Tim Cooper's reply of Oct 5 and record what they said/);
    expect(r.control?.label).toBe('Open the reply');
  });
  it('IN A DEAL opens the deal brief; RESEARCH opens the research plan', () => {
    expect(nextFromPursuit(base({ motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Kroger', stage: 'Discovery' }] } }), opts).control?.label).toBe('Open the deal brief');
    expect(nextFromPursuit(base({ eligible: [] }), opts).control?.label).toBe('Open the research plan');
  });
});

describe('pursuitListenText: Listen speaks the page\'s state, never the old one', () => {
  it('an opt-out page reads Opted out and the next step, not Ready for a first touch', async () => {
    const { pursuitListenText } = await import('@/lib/gap/pursuit/next');
    const s = base({ replies: [{ from: 'tim@acme.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }] });
    const text = pursuitListenText({ name: 'Acme', stateLine: 'retailer · Direct buyer · Ready for a first touch · Owner: Casey', unit: null, listen: 'Acme. retailer · Direct buyer · Ready for a first touch · Owner: Casey. Next: Review the thesis. Who: Karen Darling. Why now: a new DC. Our read: handoffs constrain capacity. Ask: how do trailers get found?' }, s, 'Record the opt-out.');
    expect(text).toMatch(/^Acme\. retailer\. Direct buyer\. Opted out: tim@acme.com, Oct 5\. Opted out: tim@acme.com\. Next: Record the opt-out\./);
    expect(text).not.toMatch(/Ready for a first touch|Karen Darling/);
    expect(text).toMatch(/Why now: a new DC/);
  });
});
