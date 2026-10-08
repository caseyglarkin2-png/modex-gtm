/**
 * GAP OS sales execution engine (X03): set the seller settings from the command line (the settings page, X13, is the
 * everyday way; this is the operator's way and the harness's).
 *
 *   GAP_OS_ENABLED=true DATABASE_URL=postgresql://... [GAP_GMAIL_USER_EMAIL=casey@yardflow.ai] \
 *   npx tsx scripts/gap/set-seller-settings.ts [--briefing-to <email>|none] [--hour <0-23>] \
 *     [--command-senders a@x.com,b@y.com] [--mode prepare|review] [--targets first_touches=5,calls=10] \
 *     [--actor <who>] [--apply] [--remote]
 *
 * Reads the stored settings, applies the given fields over them, validates (the GAP mailbox is refused as the
 * briefing address or a command sender; `execute` is refused), prints the result. Dry run by default: nothing is
 * written. With `--apply` it writes one SystemConfig row and one `seller.settings_changed` ledger row. Refuses when
 * GAP_OS_ENABLED is off, when DATABASE_URL is unset, and, with `--apply`, when DATABASE_URL is not local unless
 * `--remote` is passed. HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are deleted before anything loads.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { isGapOsEnabled } from '../../src/lib/gap/flags';
import { loadSellerSettings, saveSellerSettings, validateSellerSettings, type SellerSettings } from '../../src/lib/gap/work/settings';

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('usage: npx tsx scripts/gap/set-seller-settings.ts [--briefing-to <email>|none] [--hour <0-23>] [--command-senders a,b] [--mode prepare|review] [--targets k=n,...] [--actor <who>] [--apply] [--remote]');
  process.exit(1);
}

interface Args {
  apply: boolean;
  remote: boolean;
  actor: string;
  patch: Partial<Record<keyof SellerSettings, unknown>>;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, remote: false, actor: 'gap-set-seller-settings', patch: {} };
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) usage(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--remote') args.remote = true;
    else if (a === '--actor') args.actor = value(i++, a);
    else if (a === '--briefing-to') {
      const v = value(i++, a);
      args.patch.briefingTo = v === 'none' ? null : v;
    } else if (a === '--hour') args.patch.briefingHourNy = Number(value(i++, a));
    else if (a === '--command-senders') args.patch.commandSenders = value(i++, a).split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--mode') args.patch.mode = value(i++, a);
    else if (a === '--targets') {
      const targets: Record<string, number> = {};
      for (const pair of value(i++, a).split(',')) {
        const [k, n] = pair.split('=');
        if (!k || n === undefined) usage(`--targets expects k=n pairs, got ${pair}`);
        targets[k.trim()] = Number(n);
      }
      args.patch.targets = targets;
    } else usage(`unknown argument ${a}`);
  }
  return args;
}

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === '127.0.0.1' || h === 'localhost';
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!isGapOsEnabled()) {
    console.error('refused: gap_disabled (set GAP_OS_ENABLED=true)');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('refused: DATABASE_URL is unset');
    process.exit(1);
  }
  if (args.apply && !isLocal(url) && !args.remote) {
    console.error('refused: DATABASE_URL is not local; pass --remote to write elsewhere');
    process.exit(1);
  }
  const { prisma } = await import('../../src/lib/prisma');
  const current = await loadSellerSettings(prisma);
  const gapMailbox = process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null;
  const v = validateSellerSettings({ ...current, ...args.patch }, { gapMailbox });
  if (!v.ok) {
    console.error(`refused: ${v.reason} (${v.field})`);
    process.exit(1);
  }
  console.log(JSON.stringify({ mode: args.apply ? 'apply' : 'dry-run', gapMailbox, before: current, after: v.value }, null, 2));
  if (args.apply) {
    await saveSellerSettings(prisma, v.value, args.actor);
    console.log('written');
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
