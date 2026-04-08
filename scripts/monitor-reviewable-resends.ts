import { PrismaClient } from '@prisma/client';

type BatchContact = {
  to: string;
  accountName: string;
};

type ContactModule = {
  CONTACTS?: BatchContact[];
  default?: BatchContact[];
};

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`${name}=`))?.split('=')[1];
}

async function loadContacts(names: string[]): Promise<Array<{ manifest: string; to: string; accountName: string }>> {
  const loaded: Array<{ manifest: string; to: string; accountName: string }> = [];

  for (const name of names) {
    const mod = await import(`./contacts/${name}.ts`) as ContactModule;
    const contacts = mod.CONTACTS || mod.default;
    if (!contacts || !Array.isArray(contacts)) {
      throw new Error(`No CONTACTS array exported from scripts/contacts/${name}.ts`);
    }

    for (const contact of contacts) {
      loaded.push({ manifest: name, to: contact.to, accountName: contact.accountName });
    }
  }

  return loaded;
}

async function main() {
  const contactsArg = getArg('--contacts');
  const lookbackMinutes = Number(getArg('--lookbackMinutes') || '60');
  if (!contactsArg) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/monitor-reviewable-resends.ts --contacts=review-resend-ryan-hutcherson');
    process.exit(1);
  }

  const manifests = contactsArg.split(',').map((name) => name.trim()).filter(Boolean);
  const contacts = await loadContacts(manifests);
  const emails = contacts.map((contact) => contact.to);
  const lookbackStart = new Date(Date.now() - lookbackMinutes * 60 * 1000);

  const logs = await prisma.emailLog.findMany({
    where: {
      to_email: { in: emails },
    },
    select: {
      to_email: true,
      status: true,
      sent_at: true,
      subject: true,
      provider_message_id: true,
    },
    orderBy: [{ to_email: 'asc' }, { sent_at: 'desc' }],
  });

  const unsubscribed = await prisma.unsubscribedEmail.findMany({
    where: { email: { in: emails } },
    select: { email: true, unsubscribed_at: true, reason: true },
    orderBy: { email: 'asc' },
  });

  const unsubscribedMap = new Map(unsubscribed.map((row) => [row.email, row]));

  let shouldStop = false;

  console.log('\n=== Reviewable Resend Monitor ===');
  console.log(`Manifests: ${manifests.join(', ')}`);
  console.log(`Lookback: ${lookbackMinutes} minutes\n`);
  console.log('Telemetry note: current live sends use Gmail API. This stack logs provider acceptance as sent, but Gmail does not emit outbound delivery/open/click webhooks here.\n');

  for (const contact of contacts) {
    const contactLogs = logs.filter((row) => row.to_email === contact.to);
    const latest = contactLogs[0];
    const recent = contactLogs.filter((row) => row.sent_at >= lookbackStart);
    const recentBounce = recent.find((row) => row.status === 'bounced');
    const unsub = unsubscribedMap.get(contact.to);

    if (unsub || recentBounce) {
      shouldStop = true;
    }

    console.log(`${contact.to} | ${contact.accountName}`);
    console.log(`  Manifest: ${contact.manifest}`);
    console.log(`  Latest status: ${latest ? `${latest.status} at ${latest.sent_at.toISOString()}` : 'no sends logged'}`);
    if (latest?.provider_message_id) {
      console.log(`  Provider message id: ${latest.provider_message_id}`);
    }
    if (unsub) {
      console.log(`  Unsubscribed: ${unsub.unsubscribed_at.toISOString()}${unsub.reason ? ` (${unsub.reason})` : ''}`);
    }
    if (recentBounce) {
      console.log(`  Recent bounce: ${recentBounce.sent_at.toISOString()}`);
    }
    console.log('');
  }

  console.log('=== Guardrail ===');
  if (shouldStop) {
    console.log('STOP: A watched address bounced or unsubscribed. Do not send the next review resend.');
  } else {
    console.log('CLEAR: No bounce or unsubscribe found in the watch window.');
    console.log('Note: sent is the expected terminal status for Gmail in this monitor unless a separate tracking provider is added.');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});