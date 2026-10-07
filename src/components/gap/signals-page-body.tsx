/**
 * The /gap/signals page body, shared by /gap/signals and /gap/signals/new?url=
 * (the share-sheet / iPhone Shortcut entry). Server component.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listSignals } from '@/lib/gap/signals/ops';
import { sharedUrlOf, type SharedParams } from '@/lib/gap/signals/shared-url';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { SignalShare } from '@/components/gap/signal-share';
import { SignalInbox } from '@/components/gap/signal-inbox';
import { SignalWatch } from '@/components/gap/signal-watch';
import { loadWatchProfilesCached } from '@/lib/gap/signals/watch';

export async function SignalsPageBody({ searchParams }: { searchParams?: Promise<SharedParams> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/signals/'));
  const p = (await searchParams) ?? {};
  const [items, profiles] = await Promise.all([listSignals(prisma, { limit: 60 }).catch(() => []), loadWatchProfilesCached(prisma).catch(() => [])]);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Signals</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">See something that may matter? Share it. GAP finds the account, researches the real event, and brings back anything worth deciding. A signal is not a fact.</p>
      </div>
      <SignalShare initialUrl={sharedUrlOf(p)} initialAccount={(p.account ?? '').slice(0, 200)} initialNote={(p.note ?? '').slice(0, 1_000)} />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Signal inbox</h2>
        <SignalInbox items={items} />
      </section>
      <SignalWatch profiles={profiles.map((p) => ({ accountName: p.accountName, aliases: p.aliases, reasons: p.reasons }))} />
    </div>
  );
}

