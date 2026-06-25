// 46 Allentown buyer-committee contacts — em-dash-free BLUF copy.
// Each contact's `blocks` is an ordered list: a string = a paragraph,
// the IMG sentinel = the inline pilot photo. The Playwright script builds
// these as real DOM nodes (createElement/textContent/img.src) so Gmail's
// Trusted-Types CSP can't block them. Drafts only — nothing is sent.

export const PHOTO_URL = 'https://modex-gtm.vercel.app/artifacts/allentown-pilot.jpg';
export const PHOTO_ALT = 'Live YardFlow pilot at the Primo Brands (former Nestle Waters / Deer Park) plant in Allentown';
export const BCC = '3819073@bcc.hubspot.com';
export const IMG = { img: 1 };

const STACCATO = 'Machine vision check-in. Autonomous spotter cam auto-updating the YMS. No guard shack.';
const SCALE = `Allentown's the proving ground, but Primo is ripping out PINC and rolling us to all 260 sites. Same driver experience, same yard standard across the board.`;
const SAM = 'Also have a call Monday about running the same thing at Sam Adams next door. Timing is good.';
const CLOSE = 'Worth a conversation?';

// Standard BLUF email. `intro` (optional) overrides the hook sentence.
function std({ first, intro, hook, dist, site, shortSite }) {
  const lead = intro || `${hook}: the Primo Brands plant ${dist} from your ${site} is live with us.`;
  const cta = `Our CTO Chris is onsite at Primo June 22 and 23 with cameras. He can stand a pilot up in your ${shortSite} yard while he's already there.`;
  return [`${first},`, lead, STACCATO, SCALE, IMG, cta, SAM, CLOSE];
}

export const contacts = [
  // 1-2 Ryder — Alburtis 1.3
  { to: 'ssensing@ryder.com', subject: 'the live yard 1.3 mi from your Alburtis site',
    blocks: std({ first: 'Steve', hook: `Dedicated and SCS is your house, so this'll land`, dist: '1.3 mi', site: 'Alburtis dedicated site', shortSite: 'Alburtis' }) },
  { to: 'kkillingbeck@ryder.com', subject: 'the beverage yard 1.3 mi from your Alburtis op is live with us',
    blocks: std({ first: 'Kristy', hook: 'Beverage CPG is your portfolio, so this is right in your lane', dist: '1.3 mi', site: 'Alburtis site', shortSite: 'Alburtis' }) },
  // 3-4 Kuehne+Nagel — Alburtis 1.3
  { to: 'marcus.bennett@kuehne-nagel.com', subject: `small world, we're live 1.3 mi from your Alburtis CL site`,
    blocks: std({ first: 'Marcus', hook: 'Since you run North America, this is close to home', dist: '1.3 mi', site: 'Alburtis contract-logistics site', shortSite: 'Alburtis' }) },
  { to: 'michael.robinson@kuehne-nagel.com', subject: 'rig your Alburtis yard, cameras are 1.3 mi away',
    blocks: std({ first: 'Michael', hook: 'Operator to operator, you run the Lehigh Valley sites', dist: '1.3 mi', site: 'Alburtis site', shortSite: 'Alburtis' }) },
  // 5-6 Penske — Alburtis 1.3
  { to: 'jeff.jackson@penske.com', subject: `we're live 1.3 mi from your Alburtis site`,
    blocks: std({ first: 'Jeff', hook: 'Since you sit on top of the field network, this is worth 60 seconds', dist: '1.3 mi', site: 'Alburtis op', shortSite: 'Alburtis' }) },
  { to: 'brad.liddie@penske.com', subject: 'rig your Alburtis yard, cameras are 1.3 mi away',
    blocks: std({ first: 'Brad', hook: 'DC management is yours, so the yard is your problem to solve', dist: '1.3 mi', site: 'Alburtis site', shortSite: 'Alburtis' }) },
  // 7 Uline — Allentown 1.6
  { to: 'aventrone@uline.com', subject: 'live yard pilot 1.6 mi from 700 Uline Way',
    blocks: std({ first: 'Angelo', hook: 'With the speed Uline moves freight, this is right up your alley', dist: '1.6 mi', site: 'Allentown DC (700 Uline Way)', shortSite: 'Allentown' }) },
  // 8 Wakefern — Breinigsville 1.7
  { to: 'joe.nichols@wakefern.com', subject: 'live yard 1.7 mi from your Breinigsville DC',
    blocks: std({ first: 'Joe', hook: 'For a 400-tractor, 2,000-trailer operation, yard visibility compounds', dist: '1.7 mi', site: 'Breinigsville DC', shortSite: 'Breinigsville' }) },
  // 9-10 GEODIS — Breinigsville ~2
  { to: 'laura.ritchey@geodis.com', subject: `small world, we're live ~2 mi from your Breinigsville site`,
    blocks: std({ first: 'Laura', hook: 'Since you run the Americas, this is worth 60 seconds', dist: '~2 mi', site: 'Breinigsville site', shortSite: 'Breinigsville' }) },
  { to: 'anthony.jordan@geodis.com', subject: 'rig your Breinigsville yard, our cameras are 2 mi away',
    blocks: std({ first: 'Anthony', hook: 'Ops is your remit, so this is right in your lane', dist: '~2 mi', site: 'Breinigsville site', shortSite: 'Breinigsville' }) },
  // 11-12 Bridgestone — Allentown 2.0
  { to: 'giarolavinicius@bfusa.com', subject: 'live yard 2 mi from your Allentown DC',
    blocks: std({ first: 'Vinicius', hook: 'Consumer supply chain is yours, so this lands', dist: '2 mi', site: 'Allentown DC (8001 Industrial Blvd)', shortSite: 'Allentown' }) },
  { to: 'pettitcraig@bfusa.com', subject: 'the live yard 2 mi from your Allentown DC',
    blocks: std({ first: 'Craig', hook: 'International logistics is your house, so the yard is where it shows up', dist: '2 mi', site: 'Allentown DC', shortSite: 'Allentown' }) },
  // 13-14 PCA — corporate (specials)
  { to: 'hpatton@packagingcorp.com', subject: 'the yard standard spreading across the Lehigh Valley',
    blocks: ['Heidi,', 'As Trexlertown winds down, the rest of your containerboard network still lives and dies by the yard. A few miles from your Lehigh Valley footprint, the Primo Brands plant is live with us.', STACCATO, SCALE, IMG, 'Our CTO Chris is in the Valley June 22 and 23. Worth 30 minutes to scope where this fits your network?', SAM, CLOSE] },
  { to: 'ccarter@packagingcorp.com', subject: 'where mill throughput quietly leaks',
    blocks: ['Charles,', 'At mill scale, the yard is where throughput quietly leaks: dwell, gate variability, detention no dashboard catches. A few miles from your Lehigh Valley footprint, the Primo Brands plant is live with us.', STACCATO, SCALE, IMG, 'Our CTO Chris is in the area June 22 and 23. 30 minutes to scope where this fits your network?', SAM, CLOSE] },
  // 15-16 Crete — Macungie 2.4
  { to: 'taschoff@cretecarrier.com', subject: 'live yard 2.4 mi from your Macungie terminal',
    blocks: std({ first: 'Tim', hook: `For a fleet your size, the win is the same standard at every terminal, and one's live next door`, dist: '2.4 mi', site: 'Macungie terminal', shortSite: 'Macungie' }) },
  { to: 'tostergard@cretecarrier.com', subject: `the yard is where throughput dies, we're live 2.4 mi away`,
    blocks: std({ first: 'Tonn', hook: `The yard is the last unmeasured part of most fleets, and it's where throughput dies`, dist: '2.4 mi', site: 'Macungie terminal', shortSite: 'Macungie' }) },
  // 17-18 NFI — Breinigsville 2.4
  { to: 'kevin.patterson@nfiindustries.com', subject: 'live yard 2.4 mi from your Breinigsville DC',
    blocks: std({ first: 'Kevin', hook: 'Warehousing and distribution is yours, so this is right in your lane', dist: '2.4 mi', site: 'Breinigsville DC', shortSite: 'Breinigsville' }) },
  { to: 'kevin.wright@nfiindustries.com', subject: 'rig your Breinigsville yard, cameras are 2.4 mi away',
    blocks: std({ first: 'Kevin', hook: 'Since the East is yours, this is in your region', dist: '2.4 mi', site: 'Breinigsville DC', shortSite: 'Breinigsville' }) },
  // 19-20 Ocean Spray — Breinigsville 2.5 (beverage)
  { to: 'elarson@oceanspray.com', subject: 'a live beverage yard 2.5 mi from your Breinigsville plant',
    blocks: std({ first: 'Earl', hook: 'You own manufacturing, logistics and customer ops, so this is right in your lane', dist: '2.5 mi', site: 'Breinigsville plant', shortSite: 'Breinigsville' }) },
  { to: 'jmau@oceanspray.com', subject: `rig your Breinigsville yard, the live one's 2.5 mi away`,
    blocks: std({ first: 'John', hook: `You own network optimization across the plants, so you'll get this`, dist: '2.5 mi', site: 'Breinigsville plant', shortSite: 'Breinigsville' }) },
  // 21-22 KeHE — Breinigsville DC15 2.7 (beverage/grocery)
  { to: 'geoff.goetz@kehe.com', subject: 'your DC15 has a live neighbor on Nestle Way',
    blocks: std({ first: 'Geoff', intro: `Small world: your DC15 on Nestle Way sits 2.7 mi from the Primo Brands plant, and it's live with us right now.`, shortSite: 'DC15' }) },
  { to: 'stacy.lippa@kehe.com', subject: `rig DC15's yard, the live one's 2.5 mi down the road`,
    blocks: std({ first: 'Stacy', hook: 'You own the East Coast yards out of PA, so this is close to home', dist: '~2.5 mi', site: 'Breinigsville DC15', shortSite: 'DC15' }) },
  // 23-24 Lineage — Allentown Mitchell Ave 2.7 (cold chain)
  { to: 'jrivera@lineagelogistics.com', subject: 'live yard 2.7 mi from your Mitchell Ave site',
    blocks: std({ first: 'Jeff', hook: 'Since you run global ops, this is worth a look', dist: '2.7 mi', site: 'Mitchell Ave site', shortSite: 'Mitchell Ave' }) },
  { to: 'slucas@onelineage.com', subject: `rig your Mitchell Ave yard, the live one's 2.7 mi away`,
    blocks: std({ first: 'Shaun', hook: 'Operator to operator', dist: '2.7 mi', site: 'Mitchell Ave yard', shortSite: 'Mitchell Ave' }) },
  // 25-26 Nestle USA — Breinigsville 2.8
  { to: 'jim.wells@nestle.com', subject: 'your old Waters yard down the road is live with us',
    blocks: std({ first: 'Jim', intro: `Small-world note: that plant 2.8 mi from your Breinigsville DC is the old Nestle Waters operation, now Primo Brands, and it's live with us right now.`, shortSite: 'Breinigsville' }) },
  { to: 'jeff.kurtenbach@nestle.com', subject: 'the old Nestle Waters yard 2.8 mi from Breinigsville, now live with us',
    blocks: std({ first: 'Jeff', intro: `Given your Waters background you'll appreciate this: that former Nestle Waters plant, now Primo, 2.8 mi from your Breinigsville DC is live with us.`, shortSite: 'Breinigsville' }) },
  // 27-28 Utz — Allentown 3.1 (snacks)
  { to: 'cwhyte@utzsnacks.com', subject: 'live yard ~3 mi from your Allentown op',
    blocks: std({ first: 'Chad', hook: 'Same rhythm a high-velocity snack DC runs', dist: '~3 mi', site: 'Allentown operation', shortSite: 'Allentown' }) },
  { to: 'jreese@utzsnacks.com', subject: `rig your Allentown yard, the live one's 3 mi away`,
    blocks: std({ first: 'John', hook: 'Customer logistics is yours, so this is right in your lane', dist: '~3 mi', site: 'Allentown op', shortSite: 'Allentown' }) },
  // 29-30 Red Bull — Allentown 3.3 (beverage)
  { to: 'brad.paris@redbull.com', subject: 'a live beverage yard ~3 mi from your Allentown site',
    blocks: std({ first: 'Brad', hook: 'Since you run North America ops, this is right in your lane', dist: '~3 mi', site: 'Allentown operation', shortSite: 'Allentown' }) },
  { to: 'tom.ponder@redbull.com', subject: `rig your Allentown yard, the live one's 3 mi away`,
    blocks: std({ first: 'Tom', hook: `Distribution's yours, so this is right in your lane`, dist: '~3 mi', site: 'Allentown site', shortSite: 'Allentown' }) },
  // 31-32 Amcor — Allentown Schantz Rd 3.4
  { to: 'rodrigo.lecot@amcor.com', subject: 'live yard 3 mi from your Schantz Rd plant',
    blocks: std({ first: 'Rodrigo', hook: `For a packaging plant, the yard is where shipping throughput quietly bottlenecks, and one's live next door`, dist: '~3 mi', site: 'Schantz Rd plant', shortSite: 'Schantz Rd' }) },
  { to: 'david.brodish@amcor.com', subject: 'quick one, who runs the Schantz Rd yard?',
    blocks: ['David,', 'Odd ask, you are my local link. The Primo Brands plant 3 mi from your Schantz Rd site is live with our yard tech (autonomous spotter cam, machine-vision check-in), and our CTO Chris is in the Valley June 22 and 23 with spare cameras.', IMG, 'Who runs the yard or shipping ops at Allentown I should grab 20 minutes with while he is here? Happy to make it worth their time.'] },
  // 33-34 Fastenal — Allentown PAAL1 3.6
  { to: 'abroersma@fastenal.com', subject: 'live yard ~4 mi from your Allentown hub',
    blocks: std({ first: 'Anthony', hook: 'Supply-to-fulfillment, the yard is the last unmeasured link', dist: '~4 mi', site: 'Allentown hub (PAAL1)', shortSite: 'Allentown' }) },
  { to: 'klarson@fastenal.com', subject: `rig your Allentown yard, the live one's 4 mi away`,
    blocks: std({ first: 'Kevin', hook: `Since transportation's yours, this is right in your lane`, dist: '~4 mi', site: 'Allentown hub', shortSite: 'Allentown' }) },
  // 35-36 Americold — Allentown Ambassador Dr 4.0 (cold chain)
  { to: 'bryan.verbarendse@americold.com', subject: 'live yard ~4 mi from your Ambassador Dr site',
    blocks: std({ first: 'Bryan', hook: 'Drop-and-hook, same rhythm as a reefer yard', dist: '~4 mi', site: 'Ambassador Dr site', shortSite: 'Allentown' }) },
  { to: 'robert.mason@americold.com', subject: `rig your Allentown yard, the live one's 4 mi away`,
    blocks: std({ first: 'Robert', hook: 'Operator to operator', dist: '~4 mi', site: 'Allentown site', shortSite: 'Allentown' }) },
  // 37-38 ALDI — Lehigh Valley ~15 min
  { to: 'kevin.ely@aldi.us', subject: 'a live yard pilot 15 min from your Lehigh Valley DC',
    blocks: std({ first: 'Kevin', hook: 'The kind of yard standard that scales across a DC network', dist: '15 minutes', site: 'Lehigh Valley DC', shortSite: 'Lehigh Valley DC' }) },
  { to: 'bob.grammer@aldi.us', subject: `rig your Lehigh Valley DC yard, the live one's 15 min away`,
    blocks: std({ first: 'Bob', hook: `Since the PA division's yours, this is in your backyard`, dist: '15 minutes', site: 'Lehigh Valley DC', shortSite: 'Lehigh Valley DC' }) },
  // 39-40 US Foods — Allentown ~15 min
  { to: 'bill.hancock@usfoods.com', subject: `the local proof I didn't have last time`,
    blocks: std({ first: 'Bill', hook: 'Following up with something better than a roadmap question', dist: '15 minutes', site: 'Allentown DC', shortSite: 'Allentown' }) },
  { to: 'rich.querci@usfoods.com', subject: `rig your Allentown DC yard, the live one's 15 min away`,
    blocks: std({ first: 'Rich', hook: `Since the Northeast's yours, this is in your region`, dist: '15 minutes', site: 'Allentown DC', shortSite: 'Allentown' }) },
  // 41-42 J.B. Hunt — Bethlehem ~20 min
  { to: 'brad.hicks@jbhunt.com', subject: 'a live dedicated yard ~20 min from your Bethlehem op',
    blocks: std({ first: 'Brad', hook: `DCS lives in the yard, so this'll land`, dist: '~20 minutes', site: 'Bethlehem operation', shortSite: 'Bethlehem' }) },
  { to: 'jason.cruz@jbhunt.com', subject: `rig your Bethlehem yard, the live one's 20 min away`,
    blocks: std({ first: 'Jason', hook: 'Operator to operator', dist: '~20 minutes', site: 'Bethlehem operation', shortSite: 'Bethlehem' }) },
  // 43-44 ODFL — Bethlehem ALN ~20 min
  { to: 'greg.plemmons@odfl.com', subject: 'a live yard ~20 min from your ALN center',
    blocks: std({ first: 'Greg', hook: 'At LTL dock density, the gate and yard are where the clock hides', dist: '~20 minutes', site: 'Bethlehem service center', shortSite: 'ALN center' }) },
  { to: 'chris.kelley@odfl.com', subject: 'the live yard 20 min from your Bethlehem service center',
    blocks: std({ first: 'Chris', hook: 'Since operations is yours, this is right in your lane', dist: '~20 minutes', site: 'ALN service center', shortSite: 'Bethlehem' }) },
  // 45-46 Estes — Allentown-Reading district ~15 min
  { to: 'webb.estes@estes-express.com', subject: 'a live terminal yard ~15 min from your district',
    blocks: std({ first: 'Webb', hook: `Terminal-yard visibility is hard to picture until you stand in one that's live`, dist: '15 minutes', site: 'Allentown-Reading district', shortSite: 'Allentown-Reading' }) },
  { to: 'darin.monroe@estes-express.com', subject: `rig your district's yard, the live one's 15 min away`,
    blocks: std({ first: 'Darin', hook: 'Operator to operator', dist: '15 minutes', site: 'Allentown-Reading terminals', shortSite: 'Allentown-Reading' }) },
];
