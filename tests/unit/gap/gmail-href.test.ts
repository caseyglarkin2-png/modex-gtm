import { describe, expect, it } from 'vitest';
import { gmailThreadHref } from '@/lib/gap/account-intel/href';

describe('gmailThreadHref', () => {
  it('opens the search in the signed-in seller mailbox', () => {
    expect(gmailThreadHref('Avinash Rao', 'casey@freightroll.com')).toBe('https://mail.google.com/mail/u/0/?authuser=casey%40freightroll.com#search/from%3A%22Avinash%20Rao%22');
  });
  it('without a known mailbox, the default account', () => {
    expect(gmailThreadHref('Avinash Rao', null)).toBe('https://mail.google.com/mail/u/0/#search/from%3A%22Avinash%20Rao%22');
  });
});
