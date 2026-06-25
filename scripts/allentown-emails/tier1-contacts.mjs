// Tier-1 cold-outreach copy (Casey's voice, evergreen spine). 36 prospects, each
// near a LIVE YardFlow (Primo) site. Built from send-queue-tier1-2026-06-05.{md,csv}.
//
// Excluded from the source 40:
//   - DHL / Filip Kozak       (region mismatch: DHL Supply Chain CEE / Europe)
//   - Newell / Kyle Wang      (region mismatch: director ASIA supply chain)
//   - Lineage / Quyen Thompson(already in a prior YardFlow thread - OOO autoreply)
//   - General Mills / K.Govern(already in a prior YardFlow thread - OOO autoreply)
//
// Each `blocks` is an ordered list: a string = paragraph, IMG = the inline proof
// frame. No em dashes. No Allentown-only specifics (no CTO June 22-23, no brewery).

export const BCC = '3819073@bcc.hubspot.com';
export const IMG = { img: 1 };

const STACCATO = `Autonomous yard-spotter dash-cam keeps every trailer's location current in the YMS. Machine-vision gate check-in and out. No guard shack, no clipboard.`;
const SCALE = `Primo is ripping out PINC and rolling us to all their sites, because the yards running our machine vision ship meaningfully more. The win is the standard at scale, not one tuned yard. You can't automate what AI can't see.`;

// hook: same-city -> "right there in <site>", different city -> "over in <site>"
function std({ first, dist, city, noun, site }) {
  const same = city.toLowerCase() === site.toLowerCase();
  const where = same ? `right there in ${site}` : `over in ${site}`;
  const lead = `Small world. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant ${where}.`;
  const cta = `Worth putting a couple cameras in your ${city} yard to prove it in your lane, then standardizing from there?`;
  return [`${first},`, lead, STACCATO, IMG, SCALE, cta];
}

const SUBJECTS = [
  ({ dist, city, noun }) => `a live yard ${dist} from your ${city} ${noun}`,
  ({ dist, city, noun }) => `we're live ${dist} from your ${city} ${noun}`,
  ({ dist, city }) => `small world, a live yard ${dist} from ${city}`,
  ({ dist, city, noun }) => `${dist} from your ${city} ${noun}, live with us`,
];

// rows: to, first, noun, city (their facility city), site (nearest live site), dist
const rows = [
  { to: 'yngve.ruud@kuehne-nagel.com', first: 'Yngve', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.1 mi' },
  { to: 'michelle.schlie@pepsico.com', first: 'Michelle', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '0.7 mi' },
  { to: 'tlschultz@fedex.com', first: 'Tracci', noun: 'operation', city: 'Sacramento', site: 'Sacramento', dist: '1.1 mi' },
  { to: 'phil.favorito@jbhunt.com', first: 'Phil', noun: 'operation', city: 'Breinigsville', site: 'Breinigsville', dist: '1.2 mi' },
  { to: 'brian_wirtz@ryder.com', first: 'Brian', noun: 'operation', city: 'Alburtis', site: 'Breinigsville', dist: '1.3 mi' },
  { to: 'eric.clark@penske.com', first: 'Eric', noun: 'operation', city: 'Alburtis', site: 'Breinigsville', dist: '1.3 mi' },
  { to: 'ryan_staver@homedepot.com', first: 'Ryan', noun: 'terminal', city: 'Sacramento', site: 'Sacramento', dist: '0.3 mi' },
  { to: 'reyes.mota@cocacolaswb.com', first: 'Reyes', noun: 'DC', city: 'Houston', site: 'Houston', dist: '1.6 mi' },
  { to: 'justin.leeson@geodis.com', first: 'Justin', noun: 'operation', city: 'Breinigsville', site: 'Breinigsville', dist: '1.9 mi' },
  { to: 'bob.blankenship@sclogistics.com', first: 'Bob', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '0.4 mi' },
  { to: 'paul.koch@pbvllc.com', first: 'Paul', noun: 'plant', city: 'Sacramento', site: 'Sacramento', dist: '2.4 mi' },
  { to: 'tyler.james@scotts.com', first: 'Tyler', noun: 'operation', city: 'Denver', site: 'Denver', dist: '1.3 mi' },
  { to: 'archibald.john@sysco.com', first: 'John', noun: 'operation', city: 'Houston', site: 'Houston', dist: '2.5 mi' },
  { to: 'bsink@swirecc.com', first: 'Bryan', noun: 'plant', city: 'Denver', site: 'Denver', dist: '2.6 mi' },
  { to: 'jpulido@reyesholdings.com', first: 'Jon', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '2.2 mi' },
  { to: 'jeremyturner@arcb.com', first: 'Jeremy', noun: 'terminal', city: 'Madison', site: 'Madison', dist: '1.5 mi' },
  { to: 'lou.ashworth@rlcarriers.com', first: 'Lou', noun: 'operation', city: 'Dallas', site: 'Dallas', dist: '2.4 mi' },
  { to: 'rabie.yasmine@cevalogistics.com', first: 'Rabie', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '3.7 mi' },
  { to: 'scott.cassell@pg.com', first: 'Scott', noun: 'operation', city: 'Sacramento', site: 'Sacramento', dist: '1.4 mi' },
  { to: 'matt_guillaume@swifttrans.com', first: 'Matthew', noun: 'terminal', city: 'Jurupa Valley', site: 'Ontario', dist: '3.1 mi' },
  { to: 'carl.saba@kdrp.com', first: 'Carl', noun: 'operation', city: 'Allentown', site: 'Breinigsville', dist: '2.7 mi' },
  { to: 'sara.nida@efwnow.com', first: 'Sara', noun: 'operation', city: 'Greenwood', site: 'Greenwood', dist: '3.3 mi' },
  { to: 'alex.balderas@nfiindustries.com', first: 'Alex', noun: 'DC', city: 'Breinigsville', site: 'Breinigsville', dist: '2.4 mi' },
  { to: 'douglas.barnes@exel.com', first: 'Douglas', noun: 'warehouse', city: 'Dallas', site: 'Dallas', dist: '2.1 mi' },
  { to: 'dgriffis@packagingcorp.com', first: 'Deron', noun: 'operation', city: 'Allentown', site: 'Breinigsville', dist: '2.1 mi' },
  { to: 'kaushik.sarda@americold.com', first: 'Kaushik', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '3.6 mi' },
  { to: 'jason.gaiser@kroger.com', first: 'Jason', noun: 'operation', city: 'Greenwood', site: 'Greenwood', dist: '2.9 mi' },
  { to: 'john_long@shamrockfoods.com', first: 'John', noun: 'warehouse', city: 'Denver', site: 'Denver', dist: '2.2 mi' },
  { to: 'gus.arndt@redbull.com', first: 'Gus', noun: 'operation', city: 'Allentown', site: 'Breinigsville', dist: '3.3 mi' },
  { to: 'mderby@allendistribution.com', first: 'Michael', noun: 'DC', city: 'Allentown', site: 'Breinigsville', dist: '3.7 mi' },
  { to: 'ryan.meenach@ipaper.com', first: 'Ryan', noun: 'operation', city: 'Auburn', site: 'Poland Spring', dist: '4.4 mi' },
  { to: 'tushar.chandrakapure@kencogroup.com', first: 'Tushar', noun: 'operation', city: 'Allentown', site: 'Breinigsville', dist: '4.5 mi' },
  { to: 'jeff.owen@saia.com', first: 'Jeff', noun: 'terminal', city: 'Fontana', site: 'Ontario', dist: '6.4 mi' },
  { to: 'gregmazzella@benekeith.com', first: 'Greg', noun: 'operation', city: 'Alachua', site: 'High Springs', dist: '5.4 mi' },
  { to: 'rick.barrett@tyson.com', first: 'Rick', noun: 'DC', city: 'Indianapolis', site: 'Greenwood', dist: '11 mi' },
  { to: 'lyndsay.barnes@effem.com', first: 'Lyndsay', noun: 'warehouse', city: 'Lancaster', site: 'Dallas', dist: '9.5 mi' },
];

export const contacts = rows.map((r, i) => ({
  to: r.to,
  subject: SUBJECTS[i % SUBJECTS.length](r),
  blocks: std(r),
}));

// Guard: no em/en-dashes anywhere in subject or body.
for (const c of contacts) {
  if (/[‒–—―]/.test(c.subject)) throw new Error(`dash in subject to ${c.to}`);
  for (const b of c.blocks) if (typeof b === 'string' && /[‒–—―]/.test(b)) throw new Error(`dash in body to ${c.to}: ${b}`);
}
