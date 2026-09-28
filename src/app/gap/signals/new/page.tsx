/**
 * /gap/signals/new?url=<encoded>&account=&note=   SHARE TO GAP, pre-filled.
 * The iPhone Shortcut (and the Web Share Target, which sends ?title=&text=&url=)
 * opens this; Casey confirms the account, adds a note if he wants, and saves.
 * Session required (middleware + the body); no token path.
 */
import { SignalsPageBody } from '@/components/gap/signals-page-body';
import type { SharedParams } from '@/lib/gap/signals/shared-url';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Share to GAP' };

export default function ShareToGapPage(props: { searchParams?: Promise<SharedParams> }) {
  return <SignalsPageBody {...props} />;
}
