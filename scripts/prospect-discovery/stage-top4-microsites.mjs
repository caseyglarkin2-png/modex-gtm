/**
 * Stage the top-4 buyer committees (Home Depot, FedEx, Walmart, PFG) as deduped
 * Outbox drafts. Each draft is a microsite opener that links to /for/<slug>.
 *
 * Dry-run by default (prints every draft, writes nothing).
 *   node scripts/prospect-discovery/stage-top4-microsites.mjs
 * Live (needs QUEUE_AGENT_SECRET in env):
 *   QUEUE_AGENT_SECRET=... node scripts/prospect-discovery/stage-top4-microsites.mjs --live
 */
const LIVE = process.argv.includes('--live');
const BASE = process.env.WAVE3_BASE_URL ?? 'https://modex-gtm.vercel.app';
const OWNER = 'casey@freightroll.com';

// audited = sites we mapped; network = sourced denominator; noun = facility word.
const ACCOUNTS = {
  'the-home-depot': { name: 'The Home Depot', audited: 30, network: 500, noun: 'sites',
    subject: 'The capacity hiding in Home Depot’s RDC yards' },
  fedex: { name: 'FedEx', audited: 29, network: 1250, noun: 'freight facilities',
    subject: 'What we found reading FedEx’s hub yards from orbit' },
  walmart: { name: 'Walmart', audited: 12, network: 164, noun: 'DCs',
    subject: 'Walmart’s DC yards are capacity you cannot see' },
  'performance-food-group': { name: 'Performance Food Group', audited: 29, network: 150, noun: 'DCs',
    subject: 'Your yards are the cap on what your DCs can ship' },
};

const ROLE_LINE = {
  primary: 'You own the network that turns trucks into product on the shelf, and your yards are the one step in it still running on radios and clipboards.',
  exec: 'Your network’s last ungoverned step is the yards, and they quietly cap what your sites can move.',
  ops: 'You run the operation where trailers sit waiting in the yards, and that wait is capacity you already paid for.',
  tech: 'Your stack governs the road and the building. It leaves your yards, the step between them, dark.',
};

const COMMITTEE = [
  // Home Depot
  { slug: 'the-home-depot', first: 'Amit', email: 'amit_kalra@homedepot.com', role: 'primary' },
  { slug: 'the-home-depot', first: 'John', email: 'john_deaton@homedepot.com', role: 'exec' },
  { slug: 'the-home-depot', first: 'Dennis', email: 'dennis_k_harrill@homedepot.com', role: 'ops' },
  { slug: 'the-home-depot', first: 'Casey', email: 'casey_choate@homedepot.com', role: 'ops' },
  // FedEx
  { slug: 'fedex', first: 'John', email: 'john.a.smith@fedex.com', role: 'primary' },
  { slug: 'fedex', first: 'Jeffrey', email: 'jptallman@fedex.com', role: 'tech' },
  { slug: 'fedex', first: 'Mark', email: 'mmark@fedex.com', role: 'exec' },
  // Walmart
  { slug: 'walmart', first: 'Tim', email: 'timothy.cooper@walmart.com', role: 'primary' },
  { slug: 'walmart', first: 'Ben', email: 'ben.miller@walmart.com', role: 'ops' },
  { slug: 'walmart', first: 'Adam', email: 'adam.dunbar@walmart.com', role: 'ops' },
  { slug: 'walmart', first: 'Sara', email: 'sara.ferry-behrens@wal-mart.com', role: 'tech' },
  // PFG
  { slug: 'performance-food-group', first: 'Jeff', email: 'jeff.williamson@pfgc.com', role: 'primary' },
  { slug: 'performance-food-group', first: 'Len', email: 'len.lamkin@pfgc.com', role: 'ops' },
  { slug: 'performance-food-group', first: 'Jack', email: 'jack.powell@pfgc.com', role: 'ops' },
  { slug: 'performance-food-group', first: 'Kristen', email: 'kristen.roberts@pfgc.com', role: 'tech' },
];

function buildBody(c) {
  const a = ACCOUNTS[c.slug];
  const url = `https://yardflow.ai/for/${c.slug}`;
  return [
    `${c.first},`,
    '',
    ROLE_LINE[c.role],
    '',
    `We read ${a.audited} of ${a.name}’s ~${a.network} ${a.noun} from satellite and modeled the yard layer across the network. The pattern held across all of them. Your yards are the step between your trucks and your docks, and they are the one piece of the network you cannot see from your TMS or your WMS.`,
    '',
    `We put the read on one page, built for ${a.name}: ${url}`,
    '',
    'Worth fifteen minutes to walk it?',
    '',
    'Casey',
  ].join('\n');
}

const items = COMMITTEE.map((c) => ({
  toEmail: c.email,
  accountName: ACCOUNTS[c.slug].name,
  personaName: c.first,
  subject: ACCOUNTS[c.slug].subject,
  body: buildBody(c),
  source: 'casey',
  owner: OWNER,
}));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(items));
  process.exit(0);
}

if (!LIVE) {
  for (const it of items) {
    console.log(`\n--- ${it.accountName} | ${it.toEmail}`);
    console.log(`Subject: ${it.subject}`);
    console.log(it.body);
  }
  console.log(`\n[DRY RUN] ${items.length} drafts ready. Re-run with --live to stage.`);
  process.exit(0);
}

const secret = process.env.QUEUE_AGENT_SECRET;
if (!secret) { console.error('QUEUE_AGENT_SECRET not in env'); process.exit(1); }
const res = await fetch(`${BASE}/api/cron/queue`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
  body: JSON.stringify({ items }),
});
if (!res.ok) { console.error(`queue POST ${res.status}: ${await res.text()}`); process.exit(1); }
const j = await res.json();
console.log(`Outbox: added ${j.added}, skipped ${(j.skipped || []).length}.`);
console.log(JSON.stringify(j, null, 2));
