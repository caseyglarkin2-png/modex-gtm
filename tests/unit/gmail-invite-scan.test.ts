import { describe, expect, it } from 'vitest';
import {
  classifyDomain,
  matchMessageToDomain,
  scanInviteTruthWith,
  type GmailMessageFetcher,
} from '@/lib/campaigns/gmail-invite-scan';

const SELF = 'casey@freightroll.com';
const T0 = Date.parse('2026-06-01T12:00:00Z');
const DAY = 86_400_000;

/** A Gmail metadata message fixture (headers only). */
function meta(over: {
  id: string;
  from: string;
  to?: string;
  cc?: string;
  subject?: string;
  at: number;
}) {
  const headers = [
    { name: 'From', value: over.from },
    ...(over.to ? [{ name: 'To', value: over.to }] : []),
    ...(over.cc ? [{ name: 'Cc', value: over.cc }] : []),
    { name: 'Subject', value: over.subject ?? '' },
  ];
  return { id: over.id, internalDate: String(over.at), payload: { headers } };
}

/* ─── matchMessageToDomain ───────────────────────────────────────────────── */

describe('matchMessageToDomain', () => {
  it('an inbound from the domain is direction in', () => {
    const m = matchMessageToDomain(
      meta({ id: '1', from: 'Pat Ops <pat@unfi.com>', to: SELF, subject: 'Re: tour', at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m).not.toBeNull();
    expect(m!.direction).toBe('in');
    expect(m!.email).toBe('pat@unfi.com');
    expect(m!.name).toBe('Pat Ops');
  });

  it('an outbound from Casey to the domain is direction out', () => {
    const m = matchMessageToDomain(
      meta({ id: '2', from: SELF, to: 'Pat Ops <pat@unfi.com>', subject: 'Allentown tour', at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m).not.toBeNull();
    expect(m!.direction).toBe('out');
    expect(m!.email).toBe('pat@unfi.com');
  });

  it('matches a recipient at the domain hiding in Cc', () => {
    const m = matchMessageToDomain(
      meta({ id: '3', from: SELF, to: 'someone@else.com', cc: 'buyer@unfi.com', at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m?.direction).toBe('out');
    expect(m?.email).toBe('buyer@unfi.com');
  });

  it('matches a subdomain address (mail.unfi.com)', () => {
    const m = matchMessageToDomain(
      meta({ id: '4', from: 'noreply@mail.unfi.com', to: SELF, at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m?.direction).toBe('in');
  });

  it('does not match a message that only mentions the domain in an unrelated header', () => {
    const m = matchMessageToDomain(
      meta({ id: '5', from: 'someone@other.com', to: SELF, subject: 'unfi.com is great', at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m).toBeNull();
  });

  it('a Casey-sent message with no recipient at the domain does not match', () => {
    const m = matchMessageToDomain(
      meta({ id: '6', from: SELF, to: 'other@elsewhere.com', at: T0 }),
      'unfi.com',
      SELF,
    );
    expect(m).toBeNull();
  });
});

/* ─── classifyDomain (replied beats invited beats none) ──────────────────── */

describe('classifyDomain', () => {
  it('no matches -> not invited, empty contacts', () => {
    const t = classifyDomain('unfi.com', []);
    expect(t.invited).toBe(false);
    expect(t.invitedAt).toBeUndefined();
    expect(t.repliedAt).toBeUndefined();
    expect(t.contacts).toHaveLength(0);
    expect(t.source).toBe('gmail');
  });

  it('outbound only -> invited (invitedAt set, no repliedAt)', () => {
    const t = classifyDomain('unfi.com', [
      { direction: 'out', email: 'pat@unfi.com', subject: 'tour', at: T0 },
    ]);
    expect(t.invited).toBe(true);
    expect(t.invitedAt).toBe(new Date(T0).toISOString());
    expect(t.repliedAt).toBeUndefined();
    expect(t.contacts[0].lastDirection).toBe('out');
  });

  it('inbound present -> replied (repliedAt set), replied beats invited', () => {
    const t = classifyDomain('unfi.com', [
      { direction: 'out', email: 'pat@unfi.com', subject: 'tour', at: T0 },
      { direction: 'in', email: 'pat@unfi.com', subject: 'Re: tour', at: T0 + DAY },
    ]);
    expect(t.invited).toBe(true);
    expect(t.invitedAt).toBe(new Date(T0).toISOString());
    expect(t.repliedAt).toBe(new Date(T0 + DAY).toISOString());
    // the most recent matched message is the inbound reply
    expect(t.lastSubject).toBe('Re: tour');
  });

  it('invitedAt is the FIRST outbound, repliedAt is the NEWEST inbound', () => {
    const t = classifyDomain('unfi.com', [
      { direction: 'out', email: 'a@unfi.com', subject: 's1', at: T0 + 2 * DAY },
      { direction: 'out', email: 'b@unfi.com', subject: 's2', at: T0 }, // earlier -> the invite
      { direction: 'in', email: 'a@unfi.com', subject: 'r1', at: T0 + 3 * DAY },
      { direction: 'in', email: 'a@unfi.com', subject: 'r2', at: T0 + 5 * DAY }, // newest reply
    ]);
    expect(t.invitedAt).toBe(new Date(T0).toISOString());
    expect(t.repliedAt).toBe(new Date(T0 + 5 * DAY).toISOString());
  });

  it('dedups contacts to the newest message per address, newest-first', () => {
    const t = classifyDomain('unfi.com', [
      { direction: 'out', email: 'pat@unfi.com', subject: 's', at: T0 },
      { direction: 'in', email: 'pat@unfi.com', subject: 'r', at: T0 + DAY },
      { direction: 'out', email: 'lee@unfi.com', subject: 's', at: T0 + 2 * DAY },
    ]);
    expect(t.contacts).toHaveLength(2);
    // lee is newer than pat -> first; pat's latest direction is the inbound reply
    expect(t.contacts[0].email).toBe('lee@unfi.com');
    expect(t.contacts[1].email).toBe('pat@unfi.com');
    expect(t.contacts[1].lastDirection).toBe('in');
  });
});

/* ─── scanInviteTruthWith (fail-soft, domain matching) ───────────────────── */

function fetcherFrom(byDomain: Record<string, ReturnType<typeof meta>[]>): GmailMessageFetcher {
  const byId = new Map<string, ReturnType<typeof meta>>();
  for (const msgs of Object.values(byDomain)) for (const m of msgs) byId.set(m.id, m);
  return {
    async listForDomain(domain: string) {
      return (byDomain[domain] ?? []).map((m) => ({ id: m.id, threadId: m.id }));
    },
    async getMetadata(id: string) {
      const m = byId.get(id);
      if (!m) throw new Error('missing');
      return m;
    },
  };
}

describe('scanInviteTruthWith', () => {
  it('classifies each watched domain independently', async () => {
    const fetcher = fetcherFrom({
      'unfi.com': [
        meta({ id: 'u1', from: SELF, to: 'pat@unfi.com', subject: 'tour', at: T0 }),
        meta({ id: 'u2', from: 'pat@unfi.com', to: SELF, subject: 'Re: tour', at: T0 + DAY }),
      ],
      'homedepot.com': [meta({ id: 'h1', from: SELF, to: 'ops@homedepot.com', subject: 'tour', at: T0 })],
      'walgreens.com': [], // never invited
    });
    const out = await scanInviteTruthWith(['unfi.com', 'homedepot.com', 'walgreens.com'], fetcher, SELF);
    expect(out.get('unfi.com')!.repliedAt).toBeDefined(); // replied
    expect(out.get('homedepot.com')!.invited).toBe(true);
    expect(out.get('homedepot.com')!.repliedAt).toBeUndefined(); // invited only
    expect(out.get('walgreens.com')!.invited).toBe(false); // not invited
  });

  it('lowercases + dedups the requested domains', async () => {
    const fetcher = fetcherFrom({ 'unfi.com': [] });
    const out = await scanInviteTruthWith(['UNFI.com', 'unfi.com'], fetcher, SELF);
    expect([...out.keys()]).toEqual(['unfi.com']);
  });

  it('is fail-soft: a per-domain list error yields that domain empty, others still resolve', async () => {
    const fetcher: GmailMessageFetcher = {
      async listForDomain(domain: string) {
        if (domain === 'unfi.com') throw new Error('boom');
        return [{ id: 'h1', threadId: 'h1' }];
      },
      async getMetadata() {
        return meta({ id: 'h1', from: SELF, to: 'ops@homedepot.com', at: T0 });
      },
    };
    const out = await scanInviteTruthWith(['unfi.com', 'homedepot.com'], fetcher, SELF);
    expect(out.get('unfi.com')).toEqual({ domain: 'unfi.com', invited: false, contacts: [], source: 'gmail' });
    expect(out.get('homedepot.com')!.invited).toBe(true);
  });

  it('over-matched messages (domain only in subject) are filtered out', async () => {
    const fetcher = fetcherFrom({
      'unfi.com': [meta({ id: 'x', from: 'noise@other.com', to: SELF, subject: 'unfi.com newsletter', at: T0 })],
    });
    const out = await scanInviteTruthWith(['unfi.com'], fetcher, SELF);
    expect(out.get('unfi.com')!.invited).toBe(false);
  });
});
