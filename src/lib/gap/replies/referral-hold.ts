/**
 * THE REFERRAL HOLD (GAP OS execution recovery, R42b, 2026-10-06; independent audit at 31f09c71).
 *
 * When a buyer names someone ("I'm not the right person, talk to Bob Lane"), the named person is a DECISION for the
 * seller, never a cold target: no cold first touch, no live enrollment and no routed cold card for them until the
 * seller has chosen how to approach them. The choice is the R40 referral obligation reaching done or skipped (the
 * seller marks it on Work or on the account page). The referral implies no consent and no relationship.
 *
 * Before the referral is recorded, the account-reply hold (account-reply.ts) already holds every first touch at the
 * account; once it is recorded, this hold keeps the named person held. The obligation names the person by email when
 * the message or the seller gave one, else by name at the account; both are matched (an email match never needs the
 * name). Enforced where the other holds live: the send gate's step 0 (execution/seller-draft.ts, which the send path
 * shares), live enrollment (enroll/service.ts) and routing (routing/rules.ts `named_in_referral`). A failed read
 * throws: no gate treats an unreadable ledger as clear.
 */
import { foldCommitments } from '../work/commitments';
import { COMMITMENT_EVENT, TERMINAL_STATUSES, type Commitment } from '../work/commitment-model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ReferralHold {
  commitmentId: string;
  /** The obligation's words: "Ann named Bob Lane: decide how to approach them". */
  title: string;
  /** Since when (the obligation's creation). */
  since: string;
}

const normName = (s: string | null | undefined): string =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Pure: the open referral obligation that names this person at this account, or null. */
export function referralHoldIn(commitments: readonly Commitment[], person: { email: string | null | undefined; name: string | null | undefined; accountName: string | null | undefined }): ReferralHold | null {
  const email = String(person.email ?? '').trim().toLowerCase();
  const name = normName(person.name);
  const account = String(person.accountName ?? '');
  for (const c of commitments) {
    if (c.kind !== 'referral' || TERMINAL_STATUSES.includes(c.status) || !c.person) continue;
    const namedEmail = String(c.person.email ?? '').trim().toLowerCase();
    const byEmail = !!email && !!namedEmail && namedEmail === email;
    const byName = !namedEmail && !!name && name.split(' ').length >= 2 && normName(c.person.name) === name && c.accountName === account;
    if (byEmail || byName) return { commitmentId: c.commitmentId, title: c.title, since: c.createdAt };
  }
  return null;
}

/**
 * The open referral obligation that names this person, read from the ledger. An email match is searched across
 * every account (a named person can sit at a sibling company); a name match only at the person's own account.
 */
export async function referralHoldFor(prisma: PrismaLike, person: { email: string | null | undefined; name: string | null | undefined; accountName: string | null | undefined }): Promise<ReferralHold | null> {
  // A client without the ledger model (a partial test double) has no obligations, as loadCommitments reads it; a
  // failed read on a real client throws.
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return null;
  // Only referral obligations are read (every snapshot row carries the whole commitment, so the fold is complete).
  const rows = await prisma.gapAuditEvent.findMany({
    where: { kind: COMMITMENT_EVENT, payload: { path: ['commitment', 'kind'], equals: 'referral' } },
    select: { id: true, payload: true, created_at: true },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
  });
  return referralHoldIn([...foldCommitments(rows).values()], person);
}

/** The seller words for a refusal or a routed card. */
export function referralHoldDetail(h: ReferralHold): string {
  return `${h.title.replace(/: decide how to approach them$/, '')}. No cold email to them until you choose how to approach them: mark the referral done or skipped on Work.`;
}
