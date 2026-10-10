/**
 * Release C review S5 (red team T9): after someone at an account writes in
 * (a reply to a colleague's GAP email, an assistant, a forward), a cold first
 * touch to ANOTHER person there is a human's call, not the queue's. The
 * send gate refuses step 0 to anyone at a domain with a recent human inbound
 * message until a human has read it and recorded a disposition on it (the
 * hold clears then; re-review S7). A shared consumer domain, or our own, says
 * nothing about the account. Enforced at the send gate (step 0) and at live
 * enrollment.
 *
 * R42b (audit addendum at 31f09c71): the hold and the Work card read the SAME
 * classification (classify.ts over the subject and the message text). An
 * automatic notice or a bounce holds nobody; a person (a reply, a referral,
 * an objection) or an opt-out holds until a human records it. Before, the
 * hold looked at the subject only, so a notice without the canonical subject
 * held every send with no card to tell the seller why.
 */
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';
import { isPersonReply } from './classify';
import { REPLY_SENT, REPLY_SUBJECT_TYPE } from '../execution/draft-ledger';
import { REPLY_RESOLVED } from '../work/recorded-replies';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** How far back an account's inbound message holds first touches to its people. */
export const ACCOUNT_REPLY_WINDOW_DAYS = 30;

export interface AccountReply {
  id: string;
  from_email: string;
  subject: string | null;
  received_at: Date;
  snippet?: string | null;
  body_text?: string | null;
}

/** A company domain (not a shared consumer domain, not ours) of an address, or null. */
function companyDomainOf(email: string | null | undefined): string | null {
  const d = (String(email ?? '').split('@')[1] ?? '').trim().toLowerCase();
  return d && !FREEMAIL_DOMAINS.has(d) && !OWN_DOMAINS.has(d) ? d : null;
}

/**
 * The newest human inbound message from the account in the window, or null.
 * Final review P1 (buyer + reliability lenses): with `accountName`, EVERY
 * company domain GAP holds at the account counts (an account's people can span
 * pepsico.com and fritolay.com), not only the recipient's.
 */
export async function accountRepliedRecently(prisma: PrismaLike, recipient: string, now: Date, opts: { accountName?: string | null } = {}): Promise<AccountReply | null> {
  const domains = new Set<string>();
  const own = companyDomainOf(recipient);
  if (own) domains.add(own);
  if (opts.accountName && prisma.persona?.findMany) {
    const people: Array<{ email: string | null }> = await prisma.persona.findMany({ where: { account_name: opts.accountName, email: { not: null } }, select: { email: true }, take: 200 });
    for (const p of people) {
      const d = companyDomainOf(p.email);
      if (d) domains.add(d);
    }
  }
  if (domains.size === 0) return null;
  const rows: AccountReply[] = await prisma.inboundMessage.findMany({
    where: {
      OR: [...domains].sort().map((d) => ({ from_email: { endsWith: `@${d}`, mode: 'insensitive' } })),
      received_at: { gte: new Date(now.getTime() - ACCOUNT_REPLY_WINDOW_DAYS * 86_400_000) },
    },
    select: { id: true, from_email: true, subject: true, received_at: true, snippet: true, body_text: true },
    orderBy: { received_at: 'desc' },
    take: 20,
  });
  const human = rows.filter((r) => isPersonReply({ text: r.body_text, snippet: r.snippet, subject: r.subject, from: r.from_email }));
  if (human.length === 0) return null;
  // A message a human has already read and dispositioned no longer holds anyone.
  const ids = human.map((r) => r.id);
  const read: Array<{ source_kind?: string; source_id: string; inbound_message_id?: string | null }> = prisma.conversationDisposition?.findMany
    ? await prisma.conversationDisposition.findMany({
        // Phase 2 D6: a reply that arrived through HubSpot is dispositioned as source_kind
        // hubspot_engagement (same inbound id); either kind of human disposition clears the hold.
        // R5 review (finding 3): a DONE by email records the reply as source email_command with the reply on
        // inbound_message_id; that human disposition clears the hold too.
        where: {
          human_confirmed: true,
          OR: [
            { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: ids } },
            { source_kind: 'email_command', inbound_message_id: { in: ids } },
          ],
        },
        select: { source_kind: true, source_id: true, inbound_message_id: true },
      })
    : [];
  const done = new Set(read.map((r) => (r.source_kind === 'email_command' ? String(r.inbound_message_id ?? '') : r.source_id)));
  // R5 review (finding 3): the C35 resolution row (the reply settled by the seller's word, work/recorded-replies.ts
  // resolveAnswerOwed, which DONE writes) is the record of the message too.
  if (prisma.gapAuditEvent?.findMany) {
    const resolved: Array<{ kind?: string; subject_type?: string; subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { kind: REPLY_RESOLVED, subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: ids } }, select: { kind: true, subject_type: true, subject_id: true } });
    for (const a of resolved ?? []) if (a.kind === REPLY_RESOLVED && a.subject_type === REPLY_SUBJECT_TYPE) done.add(String(a.subject_id));
  }
  // Batch item 8 (finding 3): an answer GAP sent in their thread is the record of their message too. The account stays
  // in a conversation (motion/load.ts loadAccountConversations counts the answer), so nobody else there gets a cold
  // first touch because of it.
  if (prisma.gapAuditEvent?.findMany) {
    const answered: Array<{ kind?: string; subject_type?: string; subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { kind: REPLY_SENT, subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: human.map((r) => r.id) } }, select: { kind: true, subject_type: true, subject_id: true } });
    for (const a of answered ?? []) if (a.kind === REPLY_SENT && a.subject_type === REPLY_SUBJECT_TYPE) done.add(String(a.subject_id));
  }
  return human.find((r) => !done.has(r.id)) ?? null;
}
