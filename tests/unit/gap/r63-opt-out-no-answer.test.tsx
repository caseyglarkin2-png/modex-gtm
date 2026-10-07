/**
 * R63-B S2: the opt-out reply card offered "Answer in Gmail" (no reply goes back to an opt-out), and Walmart's story
 * said "Last email to doug, Oct 7: ... No answer on record." for an email that went out after Doug's "stop", with no
 * word of the opt-out beside it. An opt-out or a failed address offers no Gmail answer; the email history keeps the
 * send and says it went after they opted out.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ReplyPrepPanel } from '@/components/gap/reply-prep';
import { prepareReply } from '@/lib/gap/replies/prepare';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import type { StoryTouch } from '@/lib/gap/story/touches';

const NOW = new Date('2026-10-07T22:30:00Z');
const DOUG = 'doug@walmart-scratch-co-r63.example.com';
const prep = (snippet: string, subject: string | null = 'Re: trailer turns at your sites') => prepareReply({ id: 'm1', from: DOUG, fromName: 'Doug Scratch', subject, snippet, receivedAt: '2026-10-05T14:00:00Z', threadId: 'thr-1', accountName: 'Walmart Scratch Co r63' }, { mailbox: 'casey@yardflow.ai', now: NOW });

describe('R63-B S2: no reply goes back to an opt-out', () => {
  it('an opt-out and a failed address offer no "Answer in Gmail"; a person\'s reply still does', () => {
    const { unmount } = render(<ReplyPrepPanel prep={prep('stop')} />);
    expect(screen.queryByText('Answer in Gmail')).toBeNull();
    expect(screen.queryByTestId('reply-prep-thread')).toBeNull();
    expect(screen.getByTestId('reply-prep-no-answer')).toHaveTextContent('An opt-out: no reply goes back');
    unmount();
    const bounce = render(<ReplyPrepPanel prep={prep('Delivery to the following recipient failed permanently.', 'Delivery Status Notification (Failure)')} />);
    expect(screen.getByTestId('reply-prep')).toHaveAttribute('data-reply-kind', 'bounce');
    expect(screen.queryByText('Answer in Gmail')).toBeNull();
    bounce.unmount();
    render(<ReplyPrepPanel prep={prep('Can you send the case study by Friday?')} />);
    expect(screen.getByText('Answer in Gmail')).toBeTruthy();
  });

  it('the last email, sent after their opt-out, carries the opt-out beside it (never "No answer on record")', () => {
    const inputs = {
      account: { name: 'Walmart Scratch Co r63', tier: 'Tier 1', priorityBand: 'A', vertical: 'retail', parentBrand: null, hubspotCompanyId: '1' },
      aliases: [], domains: ['walmart-scratch-co-r63.example.com'], siblings: [], watched: true, watchReasons: [],
      facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
      personas: [{ id: 1, name: 'Doug Scratch', title: 'Senior Director, Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
      candidates: [], memberships: [], firstTouches: [], conversation: null,
      opportunity: { status: 'CLEAR', detail: '', deals: [] },
      pack: null, microsite: null, facilityFact: null, roi: null,
    } as unknown as AccountInputs;
    const ctx: AccountContext = { relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null };
    const brief = buildAccountBrief(inputs, NOW);
    const state = projectPursuitState({ accountName: 'Walmart Scratch Co r63', now: NOW, motionType: 'NO_GOOD_MOTION', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
    const v = projectNow(brief, ctx, inputs, NOW);
    const touches: StoryTouch[] = [
      { kind: 'send', at: '2026-10-07T22:01:15.000Z', name: 'doug', title: null, address: DOUG, what: 'r63-B test: opted-out send attempt double', source: 'account history' },
      { kind: 'reply', at: '2026-10-05T14:00:00.000Z', name: 'Doug Scratch', title: 'Senior Director, Transportation', address: null, what: 'stop', source: 'GAP ledger', replyKind: 'opt_out', replyLabel: 'Opted out' },
    ];
    const story = projectStory({ accountName: 'Walmart Scratch Co r63', now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
    const between = story.rows.find((r) => r.key === 'between_us')!.sentences;
    expect(between[0]).toMatchObject({ text: 'Last email to doug, Oct 7: "r63-B test: opted-out send attempt double". Sent after they opted out on Oct 5: nothing else goes to them.', tag: 'Checked' });
    expect(between.map((s) => s.text).join(' ')).not.toMatch(/No answer on record/);
  });
});
