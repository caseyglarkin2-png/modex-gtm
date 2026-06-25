// Batch 2 - Part B: 35 web-sourced contacts (Apollo-free; names + confirmed
// company email patterns). Same Casey-voice evergreen spine, no em dashes.
// Source + triage: output/prospect-discovery/batch2-partB-sourced-2026-06-05.csv
// (6 accounts dropped, 2 held, 3 gaps chased separately.)

export const BCC = '3819073@bcc.hubspot.com';
export const IMG = { img: 1 };

const STACCATO = `Autonomous yard-spotter dash-cam keeps every trailer's location current in the YMS. Machine-vision gate check-in and out. No guard shack, no clipboard.`;
const SCALE = `Primo is ripping out PINC and rolling us to all their sites, because the yards running our machine vision ship meaningfully more. The win is the standard at scale, not one tuned yard. You can't automate what AI can't see.`;

function std({ first, dist, city, noun, site, far }) {
  const same = city.toLowerCase() === site.toLowerCase();
  let lead;
  if (far) lead = `Small world, we landed in your backyard. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant over in ${site}.`;
  else if (same) lead = `Small world. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant right there in ${site}.`;
  else lead = `Small world. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant over in ${site}.`;
  const cta = `Worth putting a couple cameras in your ${city} yard to prove it in your lane, then standardizing from there?`;
  return [`${first},`, lead, STACCATO, IMG, SCALE, cta];
}

const SUBJECTS = [
  ({ dist, city, noun }) => `a live yard ${dist} from your ${city} ${noun}`,
  ({ dist, city, noun }) => `we're live ${dist} from your ${city} ${noun}`,
  ({ dist, city }) => `small world, a live yard near ${city}`,
  ({ dist, city, noun }) => `${dist} from your ${city} ${noun}, live with us`,
];

const rows = [
  // Ontario CA
  { to: 'njha@niagarawater.com', first: 'Niraj', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.3 mi' },
  { to: 'brad.stout@cat.com', first: 'Brad', noun: 'DC', city: 'Ontario', site: 'Ontario', dist: '1.6 mi' },
  { to: 'bernard.henderson@staples.com', first: 'Bernard', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '1.8 mi' },
  { to: 'andrew.correll@panerabread.com', first: 'Andrew', noun: 'warehouse', city: 'Ontario', site: 'Ontario', dist: '2 mi' },
  { to: 'jeff.harrison@autozone.com', first: 'Jeff', noun: 'DC', city: 'Ontario', site: 'Ontario', dist: '2.8 mi' },
  { to: 'jeff.perrot@kcc.com', first: 'Jeff', noun: 'DC', city: 'Ontario', site: 'Ontario', dist: '3.4 mi' },
  { to: 'harris.hornbuckle@westrock.com', first: 'Harris', noun: 'plant', city: 'Ontario', site: 'Ontario', dist: '3.6 mi' },
  { to: 'nick.matuck@shorr.com', first: 'Nick', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '4 mi' },
  { to: 'greg.claburn@kgplogistics.com', first: 'Greg', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.1 mi' },
  { to: 'emerson.cavalhiero@elsupermarkets.com', first: 'Emerson', noun: 'DC', city: 'Ontario', site: 'Ontario', dist: '0.6 mi' },
  { to: 'tom.lentz@flexlogistics.com', first: 'Tom', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.7 mi' },
  { to: 'operation@jctlogisticsinc.com', first: 'Team', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.9 mi' },
  { to: 'jvossler@frontierlogistics.com', first: 'John', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.9 mi' },
  { to: 'dan@wcsdistribution.com', first: 'Dan', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '1 mi' },
  // Houston / Pasadena
  { to: 'andy.switzer@basf.com', first: 'Andy', noun: 'operation', city: 'Houston', site: 'Houston', dist: '1.6 mi' },
  { to: 'bobby@consolidatedbondedwarehouses.com', first: 'Bobby', noun: 'warehouse', city: 'Houston', site: 'Houston', dist: '0.9 mi' },
  { to: 'lee.whitley@dsicompanies.com', first: 'Lee', noun: 'operation', city: 'Houston', site: 'Houston', dist: '1.1 mi' },
  { to: 'federico.benavides@dsv.com', first: 'Federico', noun: 'warehouse', city: 'Pasadena', site: 'Pasadena', dist: '6.8 mi' },
  { to: 'bcromer@superior-carriers.com', first: 'Barry', noun: 'terminal', city: 'Pasadena', site: 'Pasadena', dist: '6.8 mi' },
  { to: 'nichole.brown@oecgroup.com', first: 'Nichole', noun: 'operation', city: 'Houston', site: 'Pasadena', dist: '0.4 mi' },
  // Dallas
  { to: 'ddevol@chewy.com', first: 'Damien', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '0.5 mi' },
  { to: 'travis.stanton@danone.com', first: 'Travis', noun: 'plant', city: 'Dallas', site: 'Dallas', dist: '1.7 mi' },
  { to: 'anthony.brown@cummins.com', first: 'Anthony', noun: 'DC', city: 'Dallas', site: 'Dallas', dist: '2.1 mi' },
  { to: 'tpauszek@exchange-logistics.com', first: 'Tom', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '4.6 mi' },
  { to: 'jakeburger@wsgc.com', first: 'Jake', noun: 'DC', city: 'Arlington', site: 'Dallas', dist: '7.6 mi' },
  { to: 'roland@riospackagingcorp.com', first: 'Roland', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '8.6 mi' },
  { to: 'dhughes@msiexpress.com', first: 'David', noun: 'plant', city: 'Grand Prairie', site: 'Dallas', dist: '8.9 mi' },
  // Denver / Wisconsin
  { to: 'smccarthy@newaypkg.com', first: 'Susan', noun: 'operation', city: 'Commerce City', site: 'Denver', dist: '9.1 mi' },
  { to: 'achavez@medline.com', first: 'Angelica', noun: 'DC', city: 'Aurora', site: 'Denver', dist: '13.2 mi', far: true },
  { to: 'john.everitt@stearnspkg.com', first: 'John', noun: 'operation', city: 'Madison', site: 'Madison', dist: '4.1 mi' },
  { to: 'jvike@kwiktrip.com', first: 'Joe', noun: 'DC', city: 'Windsor', site: 'Madison', dist: '9.2 mi' },
  // PA / IN / NY
  { to: 'andrew.plank@blueeaglelogistics.com', first: 'Andrew', noun: 'operation', city: 'Breinigsville', site: 'Breinigsville', dist: '2.4 mi' },
  { to: 'dmartin@bisontransport.com', first: 'Dave', noun: 'terminal', city: 'Kutztown', site: 'Breinigsville', dist: '7.5 mi' },
  { to: 'kat.pohl@nextcarriers.com', first: 'Kat', noun: 'operation', city: 'Greenwood', site: 'Greenwood', dist: '2.6 mi' },
  { to: 'huipeng.koh@gf.com', first: 'Hui Peng', noun: 'operation', city: 'Malta', site: 'Saratoga Springs', dist: '7.2 mi' },
  // Gap contacts named via follow-up search (med confidence; see sourced CSV notes).
  // CJ Logistics: domain uncertain (alt christina.rennig@america.cjlogistics.com).
  { to: 'christina.rennig@cjlogistics.com', first: 'Christina', noun: 'operation', city: 'Breinigsville', site: 'Breinigsville', dist: '2.6 mi' },
  // Target T553: common name, possible collision (verify).
  { to: 'daniel.perez@target.com', first: 'Daniel', noun: 'DC', city: 'Fontana', site: 'Ontario', dist: '8.3 mi' },
];

export const contacts = rows.map((r, i) => ({
  to: r.to,
  subject: SUBJECTS[i % SUBJECTS.length](r),
  blocks: std(r),
}));

for (const c of contacts) {
  if (/[‒–—―]/.test(c.subject)) throw new Error(`dash in subject to ${c.to}`);
  for (const b of c.blocks) if (typeof b === 'string' && /[‒–—―]/.test(b)) throw new Error(`dash in body to ${c.to}: ${b}`);
}
