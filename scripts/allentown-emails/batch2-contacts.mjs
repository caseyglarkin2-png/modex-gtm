// Batch 2 - Part A: 14 vetted contacts, de-duped to ONE owner per company
// (GXO -> Cathy Chambers, Gordon Food Service -> Keith Davis, ODW -> Jeff Clark),
// leaving 11. Same Casey-voice evergreen spine as the tier-1 batch, no em dashes.
// Distances here run larger (8-20 mi), so the hook softens to "same metro / your
// backyard" past ~10 mi instead of "down the road".

export const BCC = '3819073@bcc.hubspot.com';
export const IMG = { img: 1 };

const STACCATO = `Autonomous yard-spotter dash-cam keeps every trailer's location current in the YMS. Machine-vision gate check-in and out. No guard shack, no clipboard.`;
const SCALE = `Primo is ripping out PINC and rolling us to all their sites, because the yards running our machine vision ship meaningfully more. The win is the standard at scale, not one tuned yard. You can't automate what AI can't see.`;

function std({ first, dist, city, noun, site, far }) {
  const same = city.toLowerCase() === site.toLowerCase();
  let lead;
  if (far) {
    lead = `Small world, we landed in your backyard. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant over in ${site}.`;
  } else if (same) {
    lead = `Small world. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant right there in ${site}.`;
  } else {
    lead = `Small world. We're live ${dist} from your ${city} ${noun}, at the Primo Brands plant over in ${site}.`;
  }
  const cta = `Worth putting a couple cameras in your ${city} yard to prove it in your lane, then standardizing from there?`;
  return [`${first},`, lead, STACCATO, IMG, SCALE, cta];
}

const SUBJECTS = [
  ({ dist, city, noun }) => `a live yard ${dist} from your ${city} ${noun}`,
  ({ dist, city, noun }) => `we're live ${dist} from your ${city} ${noun}`,
  ({ dist, city }) => `small world, a live yard near ${city}`,
  ({ dist, city, noun }) => `${dist} from your ${city} ${noun}, live with us`,
];

// far = distance over ~10 mi (soften the proximity language)
const rows = [
  { to: 'michael.leggett@la-z-boy.com', first: 'Michael', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '1.3 mi' },
  { to: 'ming.gao@sheingroup.com', first: 'Ming', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '2.0 mi' },
  { to: 'jeff.clark@odwlogistics.com', first: 'Jeff', noun: 'operation', city: 'Ontario', site: 'Ontario', dist: '3.8 mi' },
  // SKIP kendall.stout@clorox.com (prior thread "are your yards out of space?")
  { to: 'pablo.crespo@ashleyfurniture.com', first: 'Pablo', noun: 'DC', city: 'Plainfield', site: 'Greenwood', dist: '14 mi', far: true },
  { to: 'cathy.chambers@gxo.com', first: 'Cathy', noun: 'operation', city: 'Plainfield', site: 'Greenwood', dist: '15 mi', far: true },
  // SKIP steve.robertson@kohls.com (mid-thread "Kohl's yard protocol across 13 sites")
  { to: 'keith.davis@gfs.com', first: 'Keith', noun: 'operation', city: 'Plant City', site: 'Zephyrhills', dist: '17 mi', far: true },
  { to: 'john.rae@us.yusen-logistics.com', first: 'John', noun: 'operation', city: 'Greenfield', site: 'Greenwood', dist: '19 mi', far: true },
  // Eric Kaufold left Smithfield; his auto-reply referred us to Mark Ramsey.
  { to: 'meramsey@smithfield.com', first: 'Mark', noun: 'operation', city: 'Greenfield', site: 'Greenwood', dist: '20 mi', far: true },
  { to: 'erin.horvath@unfi.com', first: 'Erin', noun: 'DC', city: 'Riverside', site: 'Ontario', dist: '20 mi', far: true },
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
