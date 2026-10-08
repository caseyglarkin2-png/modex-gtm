/**
 * R63-A S2: "Open the reply" linked to #record-reply on the account page, and once the reply was recorded that anchor
 * and its section no longer existed. The account page now always renders the reply's place: the record section while a
 * reply waits, otherwise a line at the same anchor saying every reply is recorded (or that an owed answer is above).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recordReplyHref, RECORD_REPLY_ANCHOR } from '@/lib/gap/account-intel/href';

describe('R63-A S2: the reply link always lands on a real place', () => {
  it('both branches of the account page carry the record-reply anchor, and the work items render whenever the workspace does', () => {
    const page = readFileSync('src/app/gap/accounts/[slug]/page.tsx', 'utf8');
    expect(page.match(/id=\{RECORD_REPLY_ANCHOR\}/g)?.length).toBe(2);
    expect(page).toContain('data-testid="record-reply-none"');
    expect(page).toContain("'Every reply here is recorded; none waits.'");
    expect(page).toContain('workItems={pursuit || replyPrep || recordReply || obligations.length ? (');
    expect(recordReplyHref('Nfi Scratch Co r63')).toBe(`/gap/accounts/nfi-scratch-co-r63#${RECORD_REPLY_ANCHOR}`);
  });
});
