/**
 * UX-03 timing probe (read-only): how long each read behind the account NOW page takes for one account, so the slow
 * read is named before anyone guesses. Run: GAP_OS_ENABLED=true npx tsx scripts/gap/time-pursuit.ts "PepsiCo"
 * Never writes; never sends; HubSpot reads only through the cached people read.
 */
import { prisma } from '@/lib/prisma';
import { loadAccountView } from '@/lib/gap/account-intel/load';
import { accountSlug } from '@/lib/gap/account-intel/href';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import { listQueue } from '@/lib/gap/routing/queue';
import { loadCockpitMotions } from '@/lib/gap/motion/cockpit';
import { loadMotionChoices } from '@/lib/gap/motion/load';
import { listReplies } from '@/lib/gap/replies/list';
import { loadReadyTarget } from '@/lib/gap/context/send-target';
import { loadPursuit } from '@/lib/gap/pursuit/load';

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`${label}: ${Date.now() - t0} ms`);
  }
}

async function main() {
  const name = process.argv[2] ?? 'PepsiCo';
  const now = new Date();
  const loaded = await timed('loadAccountView (brief + inputs + context)', () => loadAccountView(prisma, accountSlug(name), now, { live: true, name, context: true }));
  if (!loaded || 'collision' in loaded) throw new Error('account not found');
  const { brief, inputs, context } = loaded;
  await timed('loadReadyTarget', () => loadReadyTarget(prisma, name, now));
  const q = await timed('listQueue', () => listQueue(prisma, { accountName: name, limit: 200 }));
  await timed(`loadCockpitMotions (${q.items.length} items)`, () => loadCockpitMotions(prisma, q.items, now));
  await timed('loadMotionChoices', () => loadMotionChoices(prisma, [name]));
  await timed('listReplies(all, 200)', () => listReplies(prisma, { state: 'all', limit: 200 }));
  const r = await timed('loadOwnerResolution (cold first touch)', () => loadOwnerResolution(prisma, { accountName: name, purpose: 'COLD_FIRST_TOUCH', now }));
  if (r.ok) console.log(`  eligible ${r.resolution.eligible.length}, excluded ${r.resolution.excluded.length}, hubspot people ${r.people.length}, family companies ${r.family.companies}`);
  await timed('loadOwnerResolution again (cache)', () => loadOwnerResolution(prisma, { accountName: name, purpose: 'COLD_FIRST_TOUCH', now }));
  const p = await timed('loadPursuit (all of the above, in parallel)', () => loadPursuit(prisma, { brief, inputs, ctx: context!, now }));
  console.log(`  state ${p.state.state}: ${p.state.stateLine}; person ${p.state.person?.name ?? 'none'}; motion type ${brief.motion.type}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
