/**
 * R42: the reply panel on the Work card and the account page shows the incoming message, the prepared notes, the
 * fail-closed line and only two ways out: answer in the Gmail thread, record what they said. No send control.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReplyPrepPanel } from '@/components/gap/reply-prep';
import { prepareReply } from '@/lib/gap/replies/prepare';

const NOW = new Date('2026-10-06T15:00:00Z');

describe('<ReplyPrepPanel>', () => {
  it('the message, the notes, the no-copy line, the thread and the record link; nothing that sends', () => {
    const prep = prepareReply({ id: 'm1', from: 'ann@nfi.example.com', fromName: 'Ann Scratch', subject: 'Re: trailer turns', snippet: 'Can you send the two-site comparison? Thursday works.', receivedAt: '2026-10-06T13:00:00Z', threadId: 'thr-1', accountName: 'Nfi Scratch Co' }, { mailbox: 'casey@yardflow.ai', now: NOW });
    render(<ReplyPrepPanel prep={prep} />);
    expect(screen.getByTestId('reply-prep-label')).toHaveTextContent('Someone replied: Ann Scratch (ann@nfi.example.com)');
    expect(screen.getByTestId('reply-prep-message')).toHaveTextContent('Can you send the two-site comparison? Thursday works.');
    expect(screen.getByTestId('reply-prep-notes')).toHaveTextContent('They asked: "Can you send the two-site comparison?". Answer that first.');
    expect(screen.getByTestId('reply-prep-no-copy')).toHaveTextContent('No reply copy family yet: GAP does not write this reply.');
    expect(screen.getByTestId('reply-prep-thread')).toHaveAttribute('href', 'https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/thr-1');
    expect(screen.getByTestId('reply-prep-record')).toHaveAttribute('href', '/gap?lane=replies');
    const links = [...document.querySelectorAll('[data-testid="reply-prep"] a, [data-testid="reply-prep"] button')];
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.textContent)).toEqual(['Answer in Gmail', 'Record what they said']);
  });
});
