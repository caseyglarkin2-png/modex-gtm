/**
 * Casey's actions on a source card (research aperture). Every source rides the existing GapSignal spine: a page a
 * research run looked at is captured as a signal row (no hypothesis, no evidence link, no activation), then the
 * EXISTING signal op runs:
 *
 *   verify         queue this source for evidence research: the strict verifyCandidate contract decides, and a
 *                  failure stays visible with its reason (nothing is deleted)
 *   ignore         out of the default view (counted, never deleted)
 *   wrong_account  unassigned; it waits in Signal intake for Casey to name the right account
 *
 * Nothing here approves, activates, drafts or sends.
 */
import { captureSignal, normalizeSignalUrl, signalUrlHash } from '../signals/intake';
import { applySignalOp, type SignalOpRefusal } from '../signals/ops';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SOURCE_OPS = ['verify', 'ignore', 'wrong_account'] as const;
export type SourceOp = (typeof SOURCE_OPS)[number];
export type SourceOpRefusal = SignalOpRefusal | 'bad_url' | 'account_not_found' | 'other_account';

export async function applySourceOp(
  prisma: PrismaLike,
  input: { accountName: string; url: string; title?: string | null; publishedAt?: string | null; op: SourceOp; actor: string; now: Date },
): Promise<{ ok: true; signalId: string; researchStatus: string; feedback: string | null } | { ok: false; reason: SourceOpRefusal; detail?: string }> {
  const normalized = normalizeSignalUrl(input.url);
  if (!normalized) return { ok: false, reason: 'bad_url' };
  const acct: { name: string } | null = await prisma.account.findFirst({ where: { name: input.accountName }, select: { name: true } });
  if (!acct) return { ok: false, reason: 'account_not_found' };
  const existing: { id: string; account_name: string | null } | null = await prisma.gapSignal.findUnique({ where: { url_hash: signalUrlHash(normalized) }, select: { id: true, account_name: true } });
  // One URL is one signal row: a source already filed under another account is that account's to act on.
  if (existing?.account_name && existing.account_name !== acct.name) return { ok: false, reason: 'other_account', detail: existing.account_name };
  let id = existing?.id ?? null;
  if (!id) {
    const published = input.publishedAt ? new Date(input.publishedAt) : null;
    const r = await captureSignal(
      prisma,
      {
        url: input.url,
        title: input.title ?? null,
        publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
        origin: 'discovery',
        actor: input.actor,
        now: input.now,
        accountName: acct.name,
        resolutionBasis: 'research_source',
      },
      { fetchHtml: null },
    );
    if (!r.ok) return { ok: false, reason: r.reason === 'bad_url' ? 'bad_url' : 'not_found' };
    id = r.signal.id;
  }
  const op = input.op === 'verify' ? ({ op: 'research' } as const) : input.op === 'ignore' ? ({ op: 'ignore' } as const) : ({ op: 'feedback', value: 'wrong_account' } as const);
  const r = await applySignalOp(prisma, { id, actor: input.actor, now: input.now, ...op });
  if (!r.ok) return { ok: false, reason: r.reason };
  return { ok: true, signalId: id, researchStatus: r.signal.researchStatus, feedback: input.op === 'ignore' ? 'ignored' : input.op === 'wrong_account' ? 'wrong_account' : null };
}
