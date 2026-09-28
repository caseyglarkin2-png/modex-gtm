/**
 * /gap/signals: SHARE TO GAP + the Signal Inbox (GAP Signal Intelligence).
 *
 * WHAT HAPPENED THAT MAY MATTER? Casey drops a link (or a conference note)
 * in seconds; GAP remembers it, resolves the account, and follows it up with
 * evidence research. The inbox shows every signal's state so he never
 * wonders whether GAP did anything with a link. A signal is not a fact:
 * verified facts appear in the Research lane for his judgment.
 * `/gap/signals/new?url=...` is the same page with the link pre-filled (the
 * iPhone Shortcut / share target). Session enforced here and by middleware.
 */
import { SignalsPageBody } from '@/components/gap/signals-page-body';
import type { SharedParams } from '@/lib/gap/signals/shared-url';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Signals' };

export default function SignalsPage(props: { searchParams?: Promise<SharedParams> }) {
  return <SignalsPageBody {...props} />;
}
