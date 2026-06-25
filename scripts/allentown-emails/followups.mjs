// 48-hour reply-bumps for the Allentown batch — em-dash-free, signature-free.
// These go out as a REPLY on each original sent thread (the original message +
// pilot photo ride along quoted beneath), so the body is just the bump copy.
// Gmail's auto-signature + the quoted original carry the sig, so we DON'T
// repeat the "Casey Larkin / YardFlow" block here.
//
// Scope: 38 of the original 46. Excluded after Friday's send:
//   bounced  -> joe.nichols@wakefern.com, ccarter@packagingcorp.com,
//               jim.wells@nestle.com, tom.ponder@redbull.com,
//               brad.hicks@jbhunt.com, darin.monroe@estes-express.com
//   replied  -> slucas@onelineage.com, anthony.jordan@geodis.com
// (marcus.bennett@kuehne-nagel.com is OOO until Tue Jun 9 — kept; the bump
//  simply waits at the top of his inbox when he's back.)

export const BCC = '3819073@bcc.hubspot.com';

// Variant A — corporate / senior decision-maker.
const A = ({ first, dist, site, yard }) => [
  `${first},`,
  `Floating this back up. Short version: we're live in a yard ${dist} from your ${site}, Primo's standardizing us across all 260 sites because the ones on us ship more, and our CTO has cameras in the Valley June 22 and 23.`,
  `Real question is just whether we rig your ${yard} yard while he's already here. 15 minutes to decide?`,
];

// Variant B — local operator / site owner.
const B = ({ first, yard }) => [
  `${first},`,
  `Bumping this once. Chris's June 22 and 23 window is filling.`,
  `If standing up a machine-vision pilot in your ${yard} yard, no guard shack, trailers self-tracked in the YMS, is worth 20 minutes, say the word and I'll hold a slot before he's booked. If not, I'll leave you be.`,
];

// Variant C — beverage.
const C = ({ first, yard }) => [
  `${first},`,
  `Circling back. The Valley's beverage crowd is paying attention to this (you can guess who).`,
  `Chris is here with cameras June 22 and 23. Want your ${yard} yard to be one he stands up while he's in town?`,
];

export const followups = [
  // Ryder — Alburtis
  { to: 'ssensing@ryder.com', blocks: A({ first: 'Steve', dist: '1.3 mi', site: 'Alburtis site', yard: 'Alburtis' }) },
  { to: 'kkillingbeck@ryder.com', blocks: C({ first: 'Kristy', yard: 'Alburtis' }) },
  // Kuehne + Nagel — Alburtis
  { to: 'marcus.bennett@kuehne-nagel.com', blocks: A({ first: 'Marcus', dist: '1.3 mi', site: 'Alburtis CL site', yard: 'Alburtis' }) },
  { to: 'michael.robinson@kuehne-nagel.com', blocks: B({ first: 'Michael', yard: 'Alburtis' }) },
  // Penske — Alburtis
  { to: 'jeff.jackson@penske.com', blocks: A({ first: 'Jeff', dist: '1.3 mi', site: 'Alburtis op', yard: 'Alburtis' }) },
  { to: 'brad.liddie@penske.com', blocks: B({ first: 'Brad', yard: 'Alburtis' }) },
  // Uline — Allentown
  { to: 'aventrone@uline.com', blocks: A({ first: 'Angelo', dist: '1.6 mi', site: '700 Uline Way', yard: 'Allentown' }) },
  // GEODIS — Breinigsville
  { to: 'laura.ritchey@geodis.com', blocks: A({ first: 'Laura', dist: '~2 mi', site: 'Breinigsville site', yard: 'Breinigsville' }) },
  // Bridgestone — Allentown
  { to: 'giarolavinicius@bfusa.com', blocks: A({ first: 'Vinicius', dist: '2 mi', site: 'Allentown DC', yard: 'Allentown' }) },
  { to: 'pettitcraig@bfusa.com', blocks: B({ first: 'Craig', yard: 'Allentown' }) },
  // PCA — Heidi (network special)
  { to: 'hpatton@packagingcorp.com', blocks: [
    'Heidi,',
    `Floating this back up. Short version: we're live in a yard a few miles from your Lehigh Valley footprint, Primo's standardizing us across all 260 sites because the ones on us ship more, and our CTO has cameras in the Valley June 22 and 23.`,
    `Real question is just where this fits your containerboard network. 15 minutes to scope it?`,
  ] },
  // Crete Carrier — Macungie
  { to: 'taschoff@cretecarrier.com', blocks: A({ first: 'Tim', dist: '2.4 mi', site: 'Macungie terminal', yard: 'Macungie' }) },
  { to: 'tostergard@cretecarrier.com', blocks: A({ first: 'Tonn', dist: '2.4 mi', site: 'Macungie terminal', yard: 'Macungie' }) },
  // NFI — Breinigsville
  { to: 'kevin.patterson@nfiindustries.com', blocks: A({ first: 'Kevin', dist: '2.4 mi', site: 'Breinigsville DC', yard: 'Breinigsville' }) },
  { to: 'kevin.wright@nfiindustries.com', blocks: B({ first: 'Kevin', yard: 'Breinigsville' }) },
  // Ocean Spray — Breinigsville (beverage)
  { to: 'elarson@oceanspray.com', blocks: C({ first: 'Earl', yard: 'Breinigsville' }) },
  { to: 'jmau@oceanspray.com', blocks: [
    'John,',
    `Circling back. The Valley's beverage crowd is paying attention to this (you can guess who).`,
    `Chris is here with cameras June 22 and 23. Want your Breinigsville yard to be one he stands up while he's in town? Easy to see how it maps across the 10 plants from there.`,
  ] },
  // KeHE — DC15 (beverage)
  { to: 'geoff.goetz@kehe.com', blocks: [
    'Geoff,',
    `Circling back. The Valley's beverage crowd is paying attention to this (you can guess who).`,
    `Chris is here with cameras June 22 and 23. Want DC15 to be one of the yards he stands up while he's in town?`,
  ] },
  { to: 'stacy.lippa@kehe.com', blocks: [
    'Stacy,',
    `Circling back. The Valley's beverage crowd is paying attention to this (you can guess who).`,
    `Chris is here with cameras June 22 and 23. Want DC15 to be one of the yards he stands up while he's in town?`,
  ] },
  // Lineage — Mitchell Ave
  { to: 'jrivera@lineagelogistics.com', blocks: A({ first: 'Jeff', dist: '2.7 mi', site: 'Mitchell Ave site', yard: 'Mitchell Ave' }) },
  // Nestle USA — Kurtenbach (Waters special)
  { to: 'jeff.kurtenbach@nestle.com', blocks: [
    'Jeff,',
    `Floating this back up. Short version: that former Nestle Waters plant (now Primo) 2.8 mi from your Breinigsville DC is live with us, Primo's standardizing us across all 260 sites because the ones on us ship more, and our CTO has cameras in the Valley June 22 and 23.`,
    `Real question is just whether we rig your Breinigsville yard while he's already here. 15 minutes to decide?`,
  ] },
  // Utz — Allentown (snacks)
  { to: 'cwhyte@utzsnacks.com', blocks: A({ first: 'Chad', dist: '~3 mi', site: 'Allentown operation', yard: 'Allentown' }) },
  { to: 'jreese@utzsnacks.com', blocks: B({ first: 'John', yard: 'Allentown' }) },
  // Red Bull — Allentown (beverage)
  { to: 'brad.paris@redbull.com', blocks: C({ first: 'Brad', yard: 'Allentown' }) },
  // Amcor — Rodrigo + Brodish referral
  { to: 'rodrigo.lecot@amcor.com', blocks: A({ first: 'Rodrigo', dist: '~3 mi', site: 'Schantz Rd plant', yard: 'Schantz Rd' }) },
  { to: 'david.brodish@amcor.com', blocks: [
    'David,',
    `Bumping my odd ask from earlier. Our CTO Chris is in the Valley June 22 and 23 with spare cameras and a couple of open windows, and the Primo plant 3 miles from you is already running it live.`,
    `Who runs the yard or shipping ops at Allentown I should grab 20 minutes with while he's here? Even just a name and I'll take it from there.`,
  ] },
  // Fastenal — Allentown
  { to: 'abroersma@fastenal.com', blocks: A({ first: 'Anthony', dist: '~4 mi', site: 'Allentown hub', yard: 'Allentown' }) },
  { to: 'klarson@fastenal.com', blocks: B({ first: 'Kevin', yard: 'Allentown' }) },
  // Americold — Allentown (cold-chain)
  { to: 'bryan.verbarendse@americold.com', blocks: A({ first: 'Bryan', dist: '~4 mi', site: 'Ambassador Dr site', yard: 'Allentown' }) },
  { to: 'robert.mason@americold.com', blocks: B({ first: 'Robert', yard: 'Allentown' }) },
  // ALDI — Lehigh Valley DC
  { to: 'kevin.ely@aldi.us', blocks: A({ first: 'Kevin', dist: '15 minutes', site: 'Lehigh Valley DC', yard: 'Lehigh Valley DC' }) },
  { to: 'bob.grammer@aldi.us', blocks: B({ first: 'Bob', yard: 'Lehigh Valley DC' }) },
  // US Foods — Allentown
  { to: 'bill.hancock@usfoods.com', blocks: A({ first: 'Bill', dist: '15 minutes', site: 'Allentown DC', yard: 'Allentown' }) },
  { to: 'rich.querci@usfoods.com', blocks: B({ first: 'Rich', yard: 'Allentown' }) },
  // J.B. Hunt — Bethlehem (Jason only; Brad Hicks bounced)
  { to: 'jason.cruz@jbhunt.com', blocks: B({ first: 'Jason', yard: 'Bethlehem' }) },
  // Old Dominion — Bethlehem ALN
  { to: 'greg.plemmons@odfl.com', blocks: A({ first: 'Greg', dist: '~20 minutes', site: 'Bethlehem service center', yard: 'ALN center' }) },
  { to: 'chris.kelley@odfl.com', blocks: B({ first: 'Chris', yard: 'Bethlehem service-center' }) },
  // Estes — Webb only (Darin Monroe bounced)
  { to: 'webb.estes@estes-express.com', blocks: A({ first: 'Webb', dist: '15 minutes', site: 'Allentown-Reading district', yard: 'Allentown-Reading' }) },
];

// Guard: no em/en-dashes anywhere in the copy.
for (const c of followups) {
  for (const b of c.blocks) {
    if (/[‒–—―]/.test(b)) throw new Error(`dash found in copy to ${c.to}: ${b}`);
  }
}
