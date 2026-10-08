/**
 * GAP OS sales execution engine, X12: the demonstration driver for the seller's REPLIES on the scratch harness.
 *
 *   npx tsx scripts/gap/execution-engine-demo.ts <step> [words]
 *     status                 the day's plan, the assignments, the agent tasks and the revisions on the ledger
 *     start                  the seller replies START to the briefing thread
 *     next                   the seller replies NEXT to the briefing thread
 *     revise "<critique>"    the seller replies REVISE: <critique> to the latest assignment
 *     drain                  the agent task drain (what the cron and the after() kick run)
 *     approve                the seller replies APPROVE to the latest assignment (creates the Gmail draft, in the sink)
 *     skip | done "<note>"   the same, on the latest assignment
 *
 * Why a driver: under the transport sink (R05) there is no Gmail inbox to poll, so the seller's reply is built here
 * exactly as the GAP mailbox cron would read it (the sender, the assignment's thread id, Gmail's Authentication-Results
 * with DMARC aligned) and handed to the SAME code path the cron runs (replies/commands-apply.ts applyCommand with the
 * revise and approve effects, through the sink). Nothing here bypasses a gate. Scratch only: the script refuses any
 * DATABASE_URL that is not 127.0.0.1 or localhost, and GAP_SEND_TRANSPORT must be `sink`.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
  // The stub carries the harness token; a real one must never load here.
  if (process.env[name] && !/^(scratch|stub|test)/i.test(process.env[name] as string)) delete process.env[name];
}

import { sendViaGmail } from '../../src/lib/email/gmail-sender';
import type { MailboxMessage } from '../../src/lib/email/gmail-inbox';
import { approveRequest } from '../../src/lib/gap/agents/approve-request';
import { agentTaskHandlers } from '../../src/lib/gap/agents/handlers';
import { reviseRequest } from '../../src/lib/gap/agents/revise-message';
import { listAgentTasks, runAgentTasks } from '../../src/lib/gap/agents/tasks';
import { loadProposedCopyRevisions } from '../../src/lib/gap/execution/copy-revision';
import { gapGmailSender } from '../../src/lib/gap/execution/gap-sender';
import { applyCommand, loadCommandContext } from '../../src/lib/gap/replies/commands-apply';
import { actionSecret } from '../../src/lib/gap/work/action-token';
import { loadAssignments } from '../../src/lib/gap/work/assignment';
import { nyDay } from '../../src/lib/gap/work/dates';
import { loadDayPlan } from '../../src/lib/gap/work/plan';
import { loadSellerSettings } from '../../src/lib/gap/work/settings';

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === '127.0.0.1' || h === 'localhost';
  } catch {
    return false;
  }
}

async function main() {
  const [step, ...rest] = process.argv.slice(2);
  const words = rest.join(' ').trim();
  const url = process.env.DATABASE_URL ?? '';
  if (!isLocal(url)) throw new Error('refused: DATABASE_URL is not local (scratch only)');
  // The real-Gmail variant (DEMO_REAL=1): the real wire, but only to Casey's own addresses (checked again below on the settings).
  const OWN = new Set(['casey@freightroll.com', 'casey@yardflow.ai', 'caseyglarkin2@gmail.com']);
  if ((process.env.GAP_SEND_TRANSPORT ?? '') !== 'sink' && process.env.DEMO_REAL !== '1') throw new Error('refused: GAP_SEND_TRANSPORT must be sink (the harness mailbox), or DEMO_REAL=1 for the real-Gmail variant to Casey only');
  const { prisma } = await import('../../src/lib/prisma');
  const now = new Date();
  const day = nyDay(now);
  const settings = await loadSellerSettings(prisma);
  const sender = gapGmailSender();
  if (!sender) throw new Error('GAP sender unconfigured');
  const seller = settings.commandSenders[0];
  if (!seller) throw new Error('no command sender in the seller settings');
  if (process.env.DEMO_REAL === '1' && (!settings.briefingTo || !OWN.has(settings.briefingTo) || !settings.commandSenders.every((a) => OWN.has(a)))) throw new Error('refused: the real-Gmail variant mails only addresses that belong to Casey');
  const ctx = await loadCommandContext(prisma, settings, now);
  const plan = await loadDayPlan(prisma, day);

  if (step === 'status') {
    console.log(JSON.stringify({ day, settings, plan: plan ? { items: plan.items.map((i) => ({ rank: i.rank, key: i.key, account: i.accountName, title: i.title })) , counts: plan.counts } : null }, null, 2));
    for (const item of plan?.items ?? []) {
      const a = await loadAssignments(prisma, item.key);
      if (a.length) console.log('assignments', item.key, a.map((x) => ({ revision: x.revision, thread: x.gmailThreadId, hash: x.contentHash.slice(0, 12), at: x.at })));
      const dec = /^first_touch:(.+)$/.exec(item.key)?.[1];
      if (dec) {
        const revs = await loadProposedCopyRevisions(prisma, { decisionId: dec, stepIndex: 0 });
        if (revs.length) console.log('revisions', dec, revs.map((r) => ({ id: r.revisionId, verdict: r.compileVerdict, approved: r.approved, hash: r.contentHash.slice(0, 12), subject: r.queued.subject })));
      }
    }
    console.log('agent tasks', (await listAgentTasks(prisma, { now })).map((t) => ({ id: t.id, status: t.status, attempts: t.attempts, item: t.itemKey, error: t.lastError })));
    console.log('briefings by thread', [...ctx.briefingsByThread.keys()], 'assignments by thread', [...ctx.assignmentsByThread.entries()].map(([k, v]) => `${k} -> ${v.itemKey}@${v.revision}`));
    await prisma.$disconnect();
    return;
  }

  if (step === 'drain') {
    const report = await runAgentTasks(prisma, { now, max: 3, claimer: 'demo:drain', handlers: agentTaskHandlers() });
    console.log(JSON.stringify(report, null, 2));
    await prisma.$disconnect();
    return;
  }

  // The seller's reply, as the mailbox cron would read it from Gmail.
  let threadId: string;
  let subject: string;
  if (step === 'start' || step === 'next') {
    const brief = [...ctx.briefingsByThread.entries()].find(([, b]) => b.day === day);
    if (!brief) throw new Error('no briefing sent today (run the briefing cron first)');
    threadId = brief[0];
    subject = `Re: GAP today [GAP#${brief[1].dayToken}]`;
  } else {
    const latest = [...ctx.assignmentsByThread.entries()].sort((a, b) => b[1].revision - a[1].revision)[0];
    if (!latest) throw new Error('no assignment sent yet (START first)');
    // The newest assignment of the newest item: the thread whose revision is the highest for its item.
    const byItem = new Map<string, [string, (typeof latest)[1]]>();
    for (const e of ctx.assignmentsByThread.entries()) {
      const cur = byItem.get(e[1].itemKey);
      if (!cur || e[1].revision > cur[1].revision) byItem.set(e[1].itemKey, e);
    }
    const wanted = process.env.DEMO_ITEM_KEY ? byItem.get(process.env.DEMO_ITEM_KEY) : [...byItem.values()].sort((a, b) => (plan?.items.find((i) => i.key === a[1].itemKey)?.rank ?? 99) - (plan?.items.find((i) => i.key === b[1].itemKey)?.rank ?? 99))[0];
    if (!wanted) throw new Error('no assignment for the item');
    threadId = wanted[0];
    subject = `Re: GAP ${wanted[1].itemKey} [GAP#${wanted[1].itemToken}.${wanted[1].revision}]`;
  }
  const line = step === 'revise' ? `REVISE: ${words}` : step === 'done' ? `DONE: ${words}` : step === 'skip' ? `SKIP${words ? ` ${words}` : ''}` : step.toUpperCase();
  const m: MailboxMessage = {
    id: `demo-${Date.now()}`,
    threadId,
    rfcMessageId: `<demo-${Date.now()}@example.com>`,
    fromEmail: seller,
    fromName: 'Casey (demo)',
    subject,
    snippet: line.slice(0, 80),
    bodyText: line,
    rawText: `${line}\n\nOn ${now.toDateString()} GAP wrote:\n> (quoted assignment)`,
    bodyHtml: '',
    deliveryStatus: null,
    labelIds: ['INBOX'],
    receivedAt: now,
    headers: { 'Authentication-Results': `mx.google.com; spf=pass smtp.mailfrom=${seller}; dmarc=pass (p=NONE) header.from=${seller.split('@')[1]}`, 'In-Reply-To': '<unknown>' },
  };
  const result = await applyCommand(prisma, { m, ctx, now, settings, sender, baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100', actionSecret: actionSecret(), actor: 'demo:gap-mailbox' }, { send: sendViaGmail, onRevise: reviseRequest, onApprove: approveRequest });
  console.log(JSON.stringify({ step, line, threadId, result }, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
