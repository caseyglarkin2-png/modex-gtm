/**
 * /gap/capture: buyer truth capture, phone first (Phase 2 D1).
 *
 * After a real conversation (a meeting, a conference hallway, a call), save
 * what the buyer said in seconds. The note is kept exactly as written; GAP
 * proposes candidate buyer truth that stays a candidate until Casey confirms
 * it. Unlinked notes are listed first so none is forgotten.
 * Behind GAP_OS_ENABLED + GAP_HYPOTHESIS_ENABLED; session enforced here too.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { CAPTURE_CONTEXTS, RAW_TEXT_MAX, listRecentCaptures } from '@/lib/gap/capture/store';
import { loadReplyForCapture } from '@/lib/gap/replies/list';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { CaptureFlow } from '@/components/gap/capture-flow';
import { transcriptionProvider } from '@/lib/gap/voice/transcribe';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Capture' };

export default async function CapturePage({ searchParams }: { searchParams?: Promise<{ account?: string; person?: string; deal?: string; dealName?: string; from?: string; context?: string }> }) {
  if (assertGapEnabled('GAP_HYPOTHESIS_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/capture/'));
  const recent = await listRecentCaptures(prisma, 8).catch(() => []);
  // ?account= from an account page: prefilled only when it names a real account (never a free-text guess).
  const q = (await searchParams) ?? {};
  const wanted = q.account?.trim() ?? '';
  const initialAccount = wanted ? ((await prisma.account.findUnique({ where: { name: wanted }, select: { name: true } }).catch(() => null))?.name ?? null) : null;
  // R44: the action that opened Capture prefills the person (only one at that account), the deal and the conversation.
  const from = /^(work|reply|commitment|account|meeting):(.{1,200})$/.exec(q.from ?? '');
  const source = initialAccount && from ? { kind: from[1], id: from[2] } : null;
  // R60: opened from a reply, the note starts as the reply itself (the seller keeps, cuts or adds) and the person is
  // the one who wrote it; Capture then reviews their words and what the reply means together.
  const reply = source?.kind === 'reply' ? await loadReplyForCapture(prisma, source.id).catch(() => null) : null;
  const replyHere = reply && reply.item.accountName === initialAccount ? reply : null;
  const personId = /^\d{1,9}$/.test(q.person ?? '') ? Number(q.person) : (replyHere?.item.personaId ?? null);
  const person = initialAccount && personId ? await prisma.persona.findUnique({ where: { id: personId }, select: { id: true, name: true, account_name: true } }).catch(() => null) : null;
  const initialPersona = person && person.account_name === initialAccount ? { id: person.id, name: person.name ?? `person ${person.id}` } : null;
  const initialDeal = initialAccount && q.deal?.trim() ? q.deal.trim().slice(0, 200) : null;
  // R50: the link carries the HubSpot deal id (what binds the note to the deal) and its name (what the seller reads).
  const initialDealName = initialDeal && q.dealName?.trim() ? q.dealName.trim().slice(0, 200) : null;
  const initialContext = (CAPTURE_CONTEXTS as readonly string[]).includes(q.context ?? '') ? (q.context as string) : replyHere ? 'email' : null;
  const initialText = replyHere ? replyHere.text.trim().slice(0, RAW_TEXT_MAX) || null : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capture buyer truth</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Right after the conversation. GAP keeps your note as written and suggests what might be buyer truth; only what you confirm counts.</p>
      </div>
      <CaptureFlow initialAccount={initialAccount} initialPersona={initialPersona} initialDeal={initialDeal} initialDealName={initialDealName} initialContext={initialContext} initialText={initialText} source={source} dictate={transcriptionProvider() !== 'disabled'} />
      {recent.length ? (
        <section className="space-y-2" data-testid="capture-recent">
          <h2 className="text-sm font-semibold">Recent notes</h2>
          <ul className="space-y-1 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span className={r.accountName ? '' : 'font-medium text-amber-700 dark:text-amber-400'}>{r.accountName ?? `Unlinked${r.accountHint ? ` ("${r.accountHint}")` : ''}`}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {r.context} · {r.createdAt.slice(0, 10)} · {r.pending} candidate{r.pending === 1 ? '' : 's'} waiting
                </span>
                <Link href={`/gap/capture/${encodeURIComponent(r.id)}`} className="text-xs underline">
                  open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
