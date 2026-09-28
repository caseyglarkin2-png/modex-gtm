/**
 * /gap/capture/[id]: reopen a saved note to confirm or reject its candidates,
 * link it to an account, or record the meeting outcome (Phase 2 D).
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadCapture } from '@/lib/gap/capture/store';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { CaptureFlow } from '@/components/gap/capture-flow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Capture' };

export default async function CaptureNotePage({ params }: { params: Promise<{ id: string }> }) {
  if (assertGapEnabled('GAP_HYPOTHESIS_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { id } = await params;
  const capture = await loadCapture(prisma, id);
  if (!capture) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <h1 className="text-2xl font-semibold tracking-tight">Buyer note</h1>
      <details className="rounded-md border border-[var(--border)] p-3 text-sm">
        <summary className="cursor-pointer text-[var(--muted-foreground)]">The note as written</summary>
        <p className="mt-2 whitespace-pre-wrap break-words">{capture.rawText}</p>
      </details>
      <CaptureFlow initial={capture} />
    </div>
  );
}
