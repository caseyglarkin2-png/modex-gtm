/**
 * R63-A N3: names where names belong. Done today said "Recorded person1@...'s answer" and the deal brief "confirmed by
 * casey@freightroll.com". Now the person on record by name (else the address's own name, never the address for a
 * GAP user). R63-A S5 on the same surface: the deal brief never quotes what the seller noted they said.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { loadCompletedToday } from '@/lib/gap/work/day-load';
import { actorName, buildDealBrief } from '@/lib/gap/deals/deal-brief';
import { DealBriefView } from '@/components/gap/deal-brief';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-07T18:00:00Z');
const NFI = 'Nfi Scratch Co r63';

describe('R63-A N3: names, not addresses', () => {
  it('Done today names the person whose answer was recorded and the person a touch went to', async () => {
    const db = ledgerDb({ accounts: [NFI], personas: [{ id: 1, account_name: NFI, name: 'Person1 Scratch', email: 'Person1@nfi-scratch.example.com' }] }, NOW);
    const c = db.client();
    await c.gapAuditEvent.create({ data: { kind: 'disposition.recorded', subject_type: 'disposition', subject_id: 'd1', payload: { humanConfirmed: true, contactEmail: 'person1@nfi-scratch.example.com', responseClass: 'meeting_accepted', accountName: NFI } } });
    await c.gapAuditEvent.create({ data: { kind: 'disposition.recorded', subject_type: 'disposition', subject_id: 'd2', payload: { humanConfirmed: true, contactEmail: 'stranger@nfi-scratch.example.com', responseClass: 'not_now', accountName: NFI } } });
    const lines = (await loadCompletedToday(c, new Date(NOW.getTime() + 60_000))).map((d) => d.line);
    expect(lines).toContain("Recorded Person1 Scratch's answer (meeting accepted).");
    // Nobody on record: the address stays (never an invented name for a buyer).
    expect(lines).toContain("Recorded stranger@nfi-scratch.example.com's answer (not now).");
  });

  it('the deal brief says who confirmed by name, and a noted statement without quotation marks', () => {
    expect(actorName('casey@freightroll.com')).toBe('Casey');
    expect(actorName('ann.scratch@kroger.example.com', new Map([['ann.scratch@kroger.example.com', { name: 'Ann Scratch' }]]))).toBe('Ann Scratch');
    const brief = buildDealBrief({
      accountName: 'Kroger Scratch Co r63',
      bids: [
        { id: 'b1', type: 'current_state', raw_buyer_language: 'He said the gate still checks trailers in on paper.', normalized_summary: null, contact_email: 'ben@kroger.example.com', source: 'call', human_confirmed: true, confirmed_by: 'casey@freightroll.com', confirmed_at: NOW, supersedes_id: null, captured_at: NOW, metadata: { wording: 'noted' } },
      ],
      dispositions: [],
      evidenceConflicts: [],
      people: [{ email: 'ben@kroger.example.com', name: 'Ben Scratch', title: 'Director, Columbus DC' }],
      dealContacts: 1,
      objective: null,
      meetingObjective: null,
    });
    const entry = Object.values(brief.sections).flat()[0];
    expect(entry).toMatchObject({ confirmedBy: 'Casey', noted: true, who: 'Ben Scratch' });
    render(<DealBriefView brief={brief} deals={[]} />);
    expect(screen.getByTestId('deal-brief-noted')).toHaveTextContent('You noted they said: He said the gate still checks trailers in on paper.');
    expect(document.querySelector('q')).toBeNull();
    expect(document.body).not.toHaveTextContent('casey@freightroll.com');
  });
});
