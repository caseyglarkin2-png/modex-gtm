/**
 * THE canonical hard-bounce write (red team T9, 2026-09-26): one path for a
 * permanently undeliverable address, whichever channel observed it (the
 * HubSpot `email.bounce` webhook, or a delivery-status notification in the
 * GAP mailbox casey@yardflow.ai).
 *
 *   Persona.email_status = 'hard_bounce', Persona.do_not_contact = true
 *     (case-insensitive on the address: Persona.email is stored as imported)
 *   EmailLog rows to that address -> status 'bounced', bounce_type 'hard'
 *   one `bounce` Notification per source event (deduped on source_id)
 *
 * The vocabulary is `hard_bounce` (what the webhook always wrote). Every
 * reader treats `bounced`, `hard_bounce` and `hard_bounced` alike
 * (HARD_BOUNCE_STATUSES); `hard_bounced` is never written.
 *
 * A bounce is never a reply: nothing here touches InboundMessage, a
 * disposition or buyer truth.
 */

/** Every email_status spelling that means the address permanently bounced. */
export const HARD_BOUNCE_STATUSES: ReadonlySet<string> = new Set(['bounced', 'hard_bounce', 'hard_bounced']);

export interface HardBounceInput {
  email: string;
  /** Where it was observed: 'hubspot_webhook' | 'gap_mailbox_dsn'. */
  source: string;
  /** The event id (HubSpot eventId, Gmail message id) the notification is keyed on. */
  sourceId: string;
  accountName?: string | null;
  subject?: string | null;
}

export interface HardBounceResult {
  email: string;
  personaUpdated: number;
  emailLogUpdated: number;
  notified: boolean;
}

// House convention for DB glue is `prisma: any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordHardBounce(prisma: any, input: HardBounceInput): Promise<HardBounceResult> {
  const email = input.email.trim().toLowerCase();
  const persona = await prisma.persona.updateMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    data: { email_status: 'hard_bounce', do_not_contact: true },
  });
  const logs = await prisma.emailLog.updateMany({
    where: { to_email: { equals: email, mode: 'insensitive' }, status: { not: 'bounced' } },
    data: { status: 'bounced', bounce_type: 'hard' },
  });
  let notified = false;
  const already = await prisma.notification.findFirst({ where: { source_id: input.sourceId, type: 'bounce' }, select: { id: true } });
  if (!already) {
    await prisma.notification.create({
      data: {
        type: 'bounce',
        account_name: input.accountName ?? null,
        persona_email: email,
        subject: `Bounce: ${input.subject ?? email}`.slice(0, 500),
        source_id: input.sourceId,
      },
    });
    notified = true;
  }
  return {
    email,
    personaUpdated: typeof persona?.count === 'number' ? persona.count : 0,
    emailLogUpdated: typeof logs?.count === 'number' ? logs.count : 0,
    notified,
  };
}
