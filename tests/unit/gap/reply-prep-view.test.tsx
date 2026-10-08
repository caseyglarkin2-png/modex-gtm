/**
 * R42 / R42b: the reply panel on the Work card and the account page shows the incoming message, the prepared notes, the
 * Gmail thread, the record form and, for a real reply, "Prepare the answer" (loaded on request; every external action
 * behind it is gated on the server). A referral and an opt-out say why no answer is prepared. No send link here.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ReplyPrepPanel } from '@/components/gap/reply-prep';
import { prepareReply } from '@/lib/gap/replies/prepare';

const NOW = new Date('2026-10-06T15:00:00Z');

describe('<ReplyPrepPanel>', () => {
  it('the message, the notes, the thread, the record link and the prepare control; nothing that sends from here', () => {
    const prep = prepareReply({ id: 'm1', from: 'ann@nfi.example.com', fromName: 'Ann Scratch', subject: 'Re: trailer turns', snippet: 'Can you send the two-site comparison? Thursday works.', receivedAt: '2026-10-06T13:00:00Z', threadId: 'thr-1', accountName: 'Nfi Scratch Co' }, { mailbox: 'casey@yardflow.ai', now: NOW });
    render(<ReplyPrepPanel prep={prep} />);
    expect(screen.getByTestId('reply-prep-label')).toHaveTextContent('Someone replied: Ann Scratch (ann@nfi.example.com)');
    expect(screen.getByTestId('reply-prep-message')).toHaveTextContent('Can you send the two-site comparison? Thursday works.');
    expect(screen.getByTestId('reply-prep-notes')).toHaveTextContent('They asked: "Can you send the two-site comparison?". Answer that first.');
    expect(screen.queryByTestId('reply-prep-no-answer')).toBeNull();
    expect(screen.getByTestId('reply-answer-prepare')).toHaveTextContent('Prepare the answer');
    expect(screen.getByTestId('reply-prep-thread')).toHaveAttribute('href', 'https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/thr-1');
    // R60: recorded on its own account, never the all-replies lane.
    expect(screen.getByTestId('reply-prep-record')).toHaveAttribute('href', '/gap/accounts/nfi-scratch-co#record-reply');
    const links = [...document.querySelectorAll('[data-testid="reply-prep"] a, [data-testid="reply-prep"] button')];
    expect(links.map((l) => l.textContent)).toEqual(['Prepare the answer', 'Answer in Gmail', 'Record what they said']);
    expect(links.some((l) => /send/i.test(l.textContent ?? '') || /\/send/.test(l.getAttribute('href') ?? ''))).toBe(false);
  });

  it('a referral and an opt-out say why no answer is prepared, and offer none', () => {
    const ref = prepareReply({ id: 'm2', from: 'ann@nfi.example.com', fromName: 'Ann Scratch', subject: 'Re: trailer turns', snippet: "I'm not the right person. Talk to Bob Lane.", receivedAt: '2026-10-06T13:00:00Z', threadId: 'thr-2', accountName: 'Nfi Scratch Co' }, { now: NOW });
    const { unmount } = render(<ReplyPrepPanel prep={ref} />);
    expect(screen.getByTestId('reply-prep-no-answer')).toHaveTextContent('A referral prepares no reply here');
    expect(screen.queryByTestId('reply-answer-prepare')).toBeNull();
    unmount();
    render(<ReplyPrepPanel prep={prepareReply({ id: 'm3', from: 'ann@nfi.example.com', fromName: null, subject: null, snippet: 'stop', receivedAt: '2026-10-06T13:00:00Z', threadId: 'thr-3', accountName: 'Nfi Scratch Co' }, { now: NOW })} />);
    expect(screen.getByTestId('reply-prep-no-answer')).toHaveTextContent('An opt-out: no reply goes back');
    expect(screen.queryByTestId('reply-answer-prepare')).toBeNull();
  });
});
