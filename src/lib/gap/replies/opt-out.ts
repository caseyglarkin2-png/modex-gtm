/**
 * AN OPT-OUT REPLY ON FILE (R63 blocker, 2026-10-07). Server only.
 *
 * A person who wrote back "stop" has opted out whether or not anyone recorded it yet. GAP's own send gate stops on
 * their replies (execution/next-touch.ts reads the inbound messages from the address and classifies each with
 * replies/classify.ts); the legacy composer's send (lib/email/perform-send.ts) never read replies, so Doug's "stop"
 * at Walmart was on file, unrecorded, and the composer sent to him anyway. This is the same read: the inbound messages
 * from the address, each classified by `classifyReply`, never a second classifier. An opt-out from that address is on
 * file when any of them classifies as one; a bounce, an automatic notice or a person's ordinary reply is not.
 */
import { classifyReply } from './classify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** How many of the address's newest messages are read (an opt-out is rarely buried deeper). */
export const OPT_OUT_READ_MAX = 50;

export interface OptOutOnFile {
  email: string;
  fromName: string | null;
  receivedAt: string;
  /** Their words, the start of the message. */
  said: string;
}

export async function optOutReplyOnFile(prisma: PrismaLike, email: string): Promise<OptOutOnFile | null> {
  const address = email.trim().toLowerCase();
  if (!address) return null;
  const rows: Array<{ subject: string | null; snippet: string | null; body_text: string | null; from_email: string; from_name: string | null; received_at: Date | string }> = await prisma.inboundMessage.findMany({
    where: { from_email: { equals: address, mode: 'insensitive' } },
    select: { subject: true, snippet: true, body_text: true, from_email: true, from_name: true, received_at: true },
    orderBy: { received_at: 'desc' },
    take: OPT_OUT_READ_MAX,
  });
  const hit = rows.find((m) => classifyReply({ snippet: m.body_text || m.snippet || '', subject: m.subject, from: m.from_email }).kind === 'opt_out');
  if (!hit) return null;
  const words = (hit.body_text || hit.snippet || '').replace(/\s+/g, ' ').trim();
  return { email: address, fromName: hit.from_name?.trim() || null, receivedAt: new Date(hit.received_at).toISOString(), said: words.length > 60 ? `${words.slice(0, 57).trimEnd()}...` : words };
}

/** The refusal in words: who said what and when, and what to do instead. */
export function optOutRefusalText(o: OptOutOnFile, name?: string | null): string {
  const who = name?.trim() || o.fromName || o.email;
  const day = new Date(o.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  return `${who} replied "${o.said}" on ${day}. Nobody emails them from here. Record it as do not contact from their reply.`;
}
