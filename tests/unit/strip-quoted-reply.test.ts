import { describe, expect, it } from 'vitest';
import { stripQuotedReply } from '@/lib/email/gmail-inbox';

describe('stripQuotedReply', () => {
  it('drops the Gmail attribution line and everything quoted after it', () => {
    const body = [
      'Thanks Casey — this looks compelling.',
      'Can you send the short overview?',
      '',
      'On Fri, May 16, 2026 at 2:00 PM Casey Larkin <casey@freightroll.com> wrote:',
      '> Hi Flavio, here is the YardFlow overview...',
      '> Let me know your thoughts.',
    ].join('\n');

    const result = stripQuotedReply(body);

    expect(result).toContain('Thanks Casey');
    expect(result).toContain('short overview');
    expect(result).not.toContain('YardFlow overview');
    expect(result).not.toContain('wrote:');
  });

  it('drops an Outlook-style original-message separator', () => {
    const body = [
      'Looping in our ops lead.',
      '',
      '-----Original Message-----',
      'From: Casey Larkin',
      'Sent: Friday',
    ].join('\n');

    expect(stripQuotedReply(body)).toBe('Looping in our ops lead.');
  });

  it('strips a trailing run of quote lines with no attribution', () => {
    const body = 'Sounds good.\n\n> previous message\n> more quoted text';
    expect(stripQuotedReply(body)).toBe('Sounds good.');
  });

  it('returns an empty string for empty input', () => {
    expect(stripQuotedReply('')).toBe('');
  });
});
