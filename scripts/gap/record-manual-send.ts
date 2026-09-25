/**
 * Record a GAP email Casey sent BY HAND (copied from the action pack) as
 * execution truth (dogfood addendum, 2026-09-25; first use: Joey Maggard).
 *
 *   npx tsx scripts/gap/record-manual-send.ts --decision <id>                 # dry run (default)
 *   npx tsx scripts/gap/record-manual-send.ts --decision <id> --apply \
 *     --statement "<Casey's own words that he sent it>"
 *
 * Renders the action pack for the decision (its hypothesis + persona, step 0
 * unless --step), lists every SENT message to the persona's address in the GAP
 * mailbox (GAP_GMAIL_USER_EMAIL via the delegated service account; read only),
 * and asks `matchManualSend` for the ONE message that is that email. Ambiguous
 * or no match: prints the candidates and writes nothing. It never guesses.
 *
 * --apply writes one `execution.gmail_manual_sent` row (engine manual, real
 * Gmail ids and sent time; no draft row is ever written) and, only when
 * --statement is given, human_action = emailed on the decision. Nothing is
 * sent, drafted, enrolled or scheduled. HubSpot is not touched.
 */
delete process.env.HUBSPOT_ACCESS_TOKEN;

import { PrismaClient } from '@prisma/client';
import { accessTokenForSender } from '@/lib/email/gmail-sender';
import { loadActionPack } from '@/lib/gap/execution/action-pack';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { matchManualSend, recordManualSend, type SentCandidate } from '@/lib/gap/execution/manual-send';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const APPLY = process.argv.includes('--apply');
const ACTOR = 'casey@freightroll.com';

type Part = { mimeType?: string; body?: { data?: string }; parts?: Part[] };
function textOf(p: Part): string {
  if (p.mimeType === 'text/plain' && p.body?.data) return Buffer.from(p.body.data, 'base64url').toString('utf8');
  return (p.parts ?? []).map(textOf).find((t) => t) ?? '';
}

async function main() {
  const decisionId = arg('decision');
  if (!decisionId) throw new Error('--decision is required');
  const stepIndex = Number(arg('step') ?? 0);
  const prisma = new PrismaClient();
  try {
    const decision = await prisma.routingDecision.findUnique({ where: { id: decisionId } });
    if (!decision?.hypothesis_id) throw new Error(`decision ${decisionId} not found or has no hypothesis`);
    const pack = await loadActionPack(prisma, { hypothesisId: decision.hypothesis_id, decisionId, stepIndex });
    if (!pack?.rendered || !pack.persona?.email || !pack.version) throw new Error('action pack has no rendered copy, recipient or pinned version');
    const rendered = { recipient: pack.persona.email.toLowerCase(), subject: pack.rendered.queued.subject, body: pack.rendered.queued.body };

    const sender = gapGmailSender();
    if (!sender) throw new Error('GAP_GMAIL_USER_EMAIL / sender credentials are not set');
    const token = await accessTokenForSender(sender);
    const api = async (path: string) => {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`gmail ${path}: ${r.status}`);
      return r.json();
    };
    const list = await api(`messages?q=${encodeURIComponent(`in:sent to:${rendered.recipient}`)}&maxResults=25`);
    const candidates: SentCandidate[] = [];
    for (const m of list.messages ?? []) {
      const full = await api(`messages/${m.id}?format=full`);
      const h = (n: string) => full.payload.headers.find((x: { name: string }) => x.name.toLowerCase() === n)?.value ?? '';
      candidates.push({ id: full.id, threadId: full.threadId, to: h('to'), subject: h('subject'), sentAt: new Date(Number(full.internalDate)).toISOString(), text: textOf(full.payload), rfcMessageId: h('message-id') || null });
    }

    const match = matchManualSend(rendered, candidates);
    console.log(`mailbox ${sender.userEmail}; ${candidates.length} sent message(s) to ${rendered.recipient}; subject "${rendered.subject}"`);
    if (match.kind !== 'match') {
      console.log(`${match.kind.toUpperCase()}: nothing written. Candidates:`);
      for (const c of match.candidates) console.log(`  ${c.id} thread ${c.threadId} ${c.sentAt} "${c.subject}"`);
      process.exitCode = 2;
      return;
    }
    console.log(`MATCH ${match.message.id} thread ${match.message.threadId} sent ${match.message.sentAt} on ${match.matchedOn.join(', ')}`);
    if (!APPLY) { console.log('dry run: pass --apply to record'); return; }

    const r = await recordManualSend(prisma, {
      decisionId,
      hypothesisId: decision.hypothesis_id,
      personaId: pack.persona.id,
      accountName: decision.account_name,
      sequenceVersionId: pack.version.id,
      stepIndex,
      senderIdentity: sender.userEmail,
      match,
      actor: ACTOR,
      now: new Date(),
      ownerStatement: arg('statement') ?? null,
    });
    console.log(JSON.stringify(r));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
