/**
 * R60 (one product from Work): Casey sees what needs him, opens the right account, acts and records it there, and
 * moves to the next account without learning GAP internals. These pins hold the information architecture:
 *   - a reply is read and recorded on its own account, never in a list of every account's replies (the lanes);
 *   - every control that opens the same account keeps the seller's place in Work (Back to Work, Next account);
 *   - deal work opened from Work ends with the same Back to Work / Next account bar as every account.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accountHref, recordReplyHref, RECORD_REPLY_ANCHOR, withWorkContext } from '@/lib/gap/account-intel/href';

const src = (p: string) => readFileSync(p, 'utf8');

describe('R60: the Work position follows the seller through the account', () => {
  it('a link to the same account carries from=work and the position, keeping its own view and anchor', () => {
    expect(withWorkContext('/gap/accounts/acme-foods', 'Acme Foods', 3)).toBe('/gap/accounts/acme-foods?from=work&i=3');
    expect(withWorkContext('/gap/accounts/acme-foods?view=brief#meeting-5', 'Acme Foods', 0)).toBe('/gap/accounts/acme-foods?view=brief&from=work&i=0#meeting-5');
    expect(withWorkContext('/gap/accounts/acme-foods/#record-reply', 'Acme Foods', 7)).toBe('/gap/accounts/acme-foods/?from=work&i=7#record-reply');
    expect(withWorkContext(recordReplyHref('Acme Foods'), 'Acme Foods', 2)).toBe('/gap/accounts/acme-foods?from=work&i=2#record-reply');
  });
  it('any other link is unchanged: another account, Capture, Gmail, call prep, or no position', () => {
    expect(withWorkContext('/gap/accounts/other-co', 'Acme Foods', 3)).toBe('/gap/accounts/other-co');
    expect(withWorkContext('/gap/accounts/acme-foods-two', 'Acme Foods', 3)).toBe('/gap/accounts/acme-foods-two');
    expect(withWorkContext('/gap/capture?account=Acme+Foods', 'Acme Foods', 3)).toBe('/gap/capture?account=Acme+Foods');
    expect(withWorkContext('https://mail.google.com/mail/u/0/#all/t1', 'Acme Foods', 3)).toBe('https://mail.google.com/mail/u/0/#all/t1');
    expect(withWorkContext('/gap/call/41', 'Acme Foods', 3)).toBe('/gap/call/41');
    expect(withWorkContext('/gap/accounts/acme-foods', 'Acme Foods', null)).toBe('/gap/accounts/acme-foods');
  });
  it('Work applies it to every card control (the next move, an obligation, the reply\'s record link)', () => {
    const list = src('src/components/gap/work-list.tsx');
    expect(list).toMatch(/href=\{withWorkContext\(c\.next\.href, c\.accountName, c\.index\)\}/);
    expect(list).toMatch(/href=\{withWorkContext\(o\.href, c\.accountName, c\.index\)\}/);
    expect(list).toMatch(/withWorkContext\(c\.reply\.record\.href, c\.accountName, c\.index\)/);
  });
  it('the account page keeps it on every view and anchor, and the brief view ends with Back to Work / Next account', () => {
    const page = src('src/app/gap/accounts/[slug]/page.tsx');
    expect(page).toMatch(/p\.set\('from', 'work'\);\s*p\.set\('i', String\(workIndex\)\);/);
    const brief = page.slice(page.indexOf("if (view === 'brief')"), page.indexOf('// The cockpit\'s ready first-touch card'));
    expect(brief).toMatch(/<DoneNext slug=\{slug\} index=\{workIndex\}/);
  });
});

describe('R60: a reply is recorded on its own account', () => {
  it('the record place is the account page anchor', () => {
    expect(recordReplyHref('Walmart Inc.')).toBe(`${accountHref('Walmart Inc.')}#${RECORD_REPLY_ANCHOR}`);
  });
  it('the account page renders that account\'s waiting replies in place, and its reply panel points at the section', () => {
    const page = src('src/app/gap/accounts/[slug]/page.tsx');
    expect(page).toMatch(/<section id=\{RECORD_REPLY_ANCHOR\}[\s\S]{0,400}<RepliesTriage account=\{brief\.accountName\} \/>/);
    expect(page).toMatch(/record: \{ \.\.\.replyPrep\.record, href: `#\$\{RECORD_REPLY_ANCHOR\}` \}/);
  });
  it('no seller path sends a reply to the all-replies lane any more', () => {
    for (const f of ['src/lib/gap/work/list.ts', 'src/lib/gap/pursuit/next.ts', 'src/lib/gap/replies/prepare.ts', 'src/lib/gap/routing/card-readiness.ts', 'src/lib/gap/routing/next-up.ts', 'src/app/gap/accounts/[slug]/page.tsx']) {
      expect(src(f), f).not.toMatch(/['`"]\/gap\?lane=replies/);
    }
  });
});
