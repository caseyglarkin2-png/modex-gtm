/**
 * S3-T11: the four seed sequence families as data. Spec section 4.5 (shape),
 * section 8 (every step passes the compiler) and the S3-T11 row.
 *
 * Each family is one steps.v2 shape (src/lib/gap/sequence/steps.ts): four
 * steps at 0/4/5/6 business days like the Top100 lane, observation-first cold
 * open, purposes intrigue -> root_cause -> value_offer -> close_loop, product
 * proof never on step 0. Copy is copy-voice with jake-voice stacked: a warm
 * hook from outside logistics fused to the cited observation, a hedged
 * hypothesis paragraph, one CTA from the cold-outbound policy family for the
 * stage (a gap question on step 0, an asset offer or a gap question after),
 * no meeting ask, no product in step 0, no em dashes, "yards" plural, no
 * "throughput", no "standardize paper".
 *
 * Placeholders: `{{first_name}}` and `{{account}}` are rendered per person;
 * the compiler treats them as text. `[[SRC:<id>]]` marks the observation
 * sentence and names a fixture ref in tests/fixtures/gap/seed-evidence.json.
 * That sentence and its marker are the slot a per-prospect render replaces
 * with a real, fresh, public evidence ref; the seed carries fixture refs so
 * the shape compiles as written and a template can never pass C01 against
 * live evidence by accident (an unresolved marker rejects).
 *
 * Proof appears only from the canon (src/lib/gap/compiler/canon.ts) with its
 * required phrasing: 48 to 24 minutes measured, about 5% observed, 24 sites
 * live, 260 sites under contract. Primo Brands is the only named customer.
 *
 * "New Sites and Acquisitions" is not one of the seven taxonomy problem
 * families; its problem family is `network_standardization` (the catalog maps
 * the `acquisition` and `new_site` signal types there) and it differs from the
 * Network Standardization family by trigger and persona, not by problem.
 *
 * Voice: no em dashes.
 */
import { STEPS_SCHEMA, type StepsV2, type StepV2 } from '@/lib/gap/sequence/steps';
import type { LanePurpose, Persona, ProblemFamily, SignalType, StepPurpose } from '@/lib/gap/taxonomy';

export const SEED_PROGRAM = 'gap-seed-2026-09';

/** The lane's cadence: step 1 at enrollment, then 4, 5 and 6 business days after the prior send. */
export const SEED_DELAYS_BUSINESS_DAYS = [0, 4, 5, 6] as const;

export const SEED_PURPOSES: readonly StepPurpose[] = ['intrigue', 'root_cause', 'value_offer', 'close_loop'];
export const SEED_SOURCE_PURPOSES: readonly LanePurpose[] = [
  'earn_reply',
  'clarify_consequence',
  'address_obstacle',
  'next_step_or_close',
];

export const SIGNATURE = 'Casey Larkin, YardFlow by FreightRoll';

export interface SeedStepCopy {
  subject: string;
  /** Paragraphs after the greeting, joined by a blank line; the greeting and signature are added by `seedBody`. */
  paragraphs: string[];
  askType: 'question' | 'asset_offer';
  requiredEvidenceTypes: SignalType[];
  claimsUsed: string[];
  /** Fixture evidence ids this step cites (its `[[SRC:id]]` markers, in order). */
  evidence: string[];
}

export interface SeedFamily {
  key: string;
  name: string;
  problemFamily: ProblemFamily;
  persona: Persona;
  steps: StepsV2;
  /** Per step, the fixture evidence ids the body cites. */
  evidence: string[][];
}

/** Greeting on its own line directly above the observation so paragraph 1 carries the marker. */
export function seedBody(paragraphs: readonly string[]): string {
  return `Hi {{first_name}},\n${paragraphs.join('\n\n')}\n\n${SIGNATURE}`;
}

function buildSteps(copy: readonly SeedStepCopy[]): StepsV2 {
  const steps: StepV2[] = copy.map((c, i) => ({
    index: i,
    delay: { value: SEED_DELAYS_BUSINESS_DAYS[i], unit: 'business_days' as const },
    purpose: SEED_PURPOSES[i],
    sourcePurpose: SEED_SOURCE_PURPOSES[i],
    condition: null,
    askType: c.askType,
    productProofAllowed: i > 0,
    requiredEvidenceTypes: [...c.requiredEvidenceTypes],
    claimsUsed: [...c.claimsUsed],
    templates: { subjectTemplate: c.subject, bodyTemplate: seedBody(c.paragraphs), hubspotTemplateId: null },
  }));
  return { schema: STEPS_SCHEMA, steps };
}

function family(
  key: string,
  name: string,
  problemFamily: ProblemFamily,
  persona: Persona,
  copy: readonly SeedStepCopy[],
): SeedFamily {
  return { key, name, problemFamily, persona, steps: buildSteps(copy), evidence: copy.map((c) => [...c.evidence]) };
}

// ---------------------------------------------------------------------------
// Network Standardization (executive_ops)
// ---------------------------------------------------------------------------

const NETWORK_STANDARDIZATION: SeedStepCopy[] = [
  {
    subject: 'Three regions, one number',
    paragraphs: [
      "Nobody thinks about the wiring until the lights flicker in one room and not the others. {{account}}'s annual report lists 41 distribution centers folded in from three regional operators over six years [[SRC:ns_ev_1]].",
      'My guess is each region still runs its own version of the same shift, so one trailer event gets counted three different ways across sites before it reaches you.',
      'Which of the three regions do you trust least when the numbers disagree?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['acquisition', 'site_expansion'],
    claimsUsed: [],
    evidence: ['ns_ev_1'],
  },
  {
    subject: 'The analyst who reconciles',
    paragraphs: [
      'Your careers page is hiring a regional analyst whose first listed duty is reconciling DC scorecards by hand [[SRC:ns_ev_2]].',
      'That role usually exists when the definitions differ, not the people. One region clocks a turn at the fence line, another at the dock, and the report reads like two operators disagreeing when it is two stopwatches.',
      'Worth sending over the short version of how peers pinned one definition across sites before touching a system?',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['job_posting'],
    claimsUsed: [],
    evidence: ['ns_ev_2'],
  },
  {
    subject: 'One model, three fence lines',
    paragraphs: [
      'Your investor day deck names one operating model as a 2026 priority and puts the integration owner in the COO office [[SRC:ns_ev_3]].',
      'If the model stops at the warehouse door, the yards keep three vocabularies. Primo Brands started at the fence instead: 24 sites live on one protocol, same driver journey, same clocks, before any system consolidation.',
      'If useful, I can send the 1-page scorecard peers use to grade one definition across facilities.',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['news'],
    claimsUsed: ['CR-002'],
    evidence: ['ns_ev_3'],
  },
  {
    subject: 'Three truths, one logo',
    paragraphs: [
      'Your Q2 call set an integration target for the acquired network and tied it to shared systems by year end [[SRC:ns_ev_4]].',
      'Systems usually inherit whatever the sites already count. If three regions clock a trailer three ways, the consolidated stack reports three truths with one logo on top.',
      'How does each region define a completed turn, and which definition wins in the consolidated report?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['news'],
    claimsUsed: [],
    evidence: ['ns_ev_4'],
  },
];

// ---------------------------------------------------------------------------
// Hidden Capacity (distribution)
// ---------------------------------------------------------------------------

const HIDDEN_CAPACITY: SeedStepCopy[] = [
  {
    subject: 'Doors versus spots at Fontana',
    paragraphs: [
      'Airports do not pour runways when the taxiway is the problem. Your Fontana DC opened 30 more dock doors this spring; the lot still holds about 180 trailer spots [[SRC:hc_ev_1]].',
      'My guess is the doors are no longer the constraint. The spots are, and the tractor hunting for the right trailer is where the new capacity goes to wait.',
      'How many doors sit empty on a normal Tuesday because nobody can say where the trailer is?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['site_expansion'],
    claimsUsed: [],
    evidence: ['hc_ev_1'],
  },
  {
    subject: 'Weekend overtime on the lot',
    paragraphs: [
      'Your careers page lists two second-shift spotter openings at Fontana with mandatory weekend overtime [[SRC:hc_ev_2]].',
      'Overtime on the lot usually means the moves are reactive: a door opens, someone radios, a tractor hunts. The doors could be turning faster than the lot can feed them, which is the definition of hidden capacity.',
      'Worth sending over the short version of how a peer measured the gap between door speed and lot speed?',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['job_posting'],
    claimsUsed: [],
    evidence: ['hc_ev_2'],
  },
  {
    subject: 'Near capacity, or near the ceiling',
    paragraphs: [
      'Your Q2 call described Fontana as shipping near capacity, with the next wave of volume routed there anyway [[SRC:hc_ev_3]].',
      'If the doors are near capacity but the lot is not, the ceiling might be softer than it looks. Primo Brands shipped about 5% more volume, observed, from the driver-journey layer alone, on the same dock-office staff, with no new doors.',
      'Which number do your Fontana leads quote first when they say full: door turns or lot moves?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['news'],
    claimsUsed: ['CR-004'],
    evidence: ['hc_ev_3'],
  },
  {
    subject: 'Peak and the lot',
    paragraphs: [
      'Your investor deck names Fontana the highest-volume DC in the network for the coming peak [[SRC:hc_ev_4]].',
      'Peak is when reactive moves get expensive: a late trailer at one door starves the line behind it, and the fix is usually more people on the lot for six weeks. The alternative is a clean handoff, knowing where every trailer is before the door asks.',
      'If useful, I can send the 1-page scorecard peers use to find the gap between door speed and lot speed.',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['news'],
    claimsUsed: [],
    evidence: ['hc_ev_4'],
  },
];

// ---------------------------------------------------------------------------
// Automation Readiness (automation)
// ---------------------------------------------------------------------------

const AUTOMATION_READINESS: SeedStepCopy[] = [
  {
    subject: 'Road markings before the truck',
    paragraphs: [
      'A self-driving car is only as calm as the road markings it reads. Your Columbus plant announced an autonomous yard truck pilot for the second half of the year [[SRC:ar_ev_1]].',
      'My guess is the truck will be fine. The open point is whether the moves it gets handed are deterministic yet, or whether a radio call still decides which trailer goes where.',
      "What share of Columbus moves start from a written rule versus a spotter's judgment?",
    ],
    askType: 'question',
    requiredEvidenceTypes: ['automation_program'],
    claimsUsed: [],
    evidence: ['ar_ev_1'],
  },
  {
    subject: 'The exception list at Columbus',
    paragraphs: [
      'Your automation engineer posting for Columbus lists exception handling for lot robotics as the first responsibility [[SRC:ar_ev_2]].',
      'Exceptions are usually where these programs stall: not the software, the undocumented ones. A trailer with a broken door latch, a tractor parked in the wrong row, a dock that went down at two in the afternoon. Each one becomes a manual fallback until someone writes the rule.',
      'Worth sending over the short version of how peers sized their exception list before the robots arrived?',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['job_posting'],
    claimsUsed: [],
    evidence: ['ar_ev_2'],
  },
  {
    subject: 'Clean events before robots',
    paragraphs: [
      'Your investor presentation frames the capex program as automation first, with Columbus as the proving ground [[SRC:ar_ev_3]].',
      'Automation compounds whatever it lands on. If the arrival, dock and status events are already clean, the robots inherit a clean lot; if they are not, the program spends its first year documenting exceptions. Primo Brands cut drop-and-hook turn time from 48 to 24 minutes, measured in a side-by-side pilot, before any automated move.',
      'Which of those three events does Columbus trust least: arrival, dock or status?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['news'],
    claimsUsed: ['CR-001', 'GAP-007'],
    evidence: ['ar_ev_3'],
  },
  {
    subject: 'A playbook that travels',
    paragraphs: [
      'Trade coverage of the Columbus automation program says the playbook is meant to travel to the other plants [[SRC:ar_ev_4]].',
      'A playbook travels only if the inputs are the same at every plant. My guess is Columbus will run clean and the second site will surface a different set of exceptions, because the trailer events were never standard to begin with.',
      "If useful, I can send the 1-page scorecard that grades a site's readiness before the robots are ordered.",
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['news'],
    claimsUsed: [],
    evidence: ['ar_ev_4'],
  },
];

// ---------------------------------------------------------------------------
// New Sites and Acquisitions (supply_chain; problem family network_standardization)
// ---------------------------------------------------------------------------

const NEW_SITES_ACQUISITIONS: SeedStepCopy[] = [
  {
    subject: 'Six plants and the forks',
    paragraphs: [
      'Two families moving into one house argue about the forks long before they argue about money. Your Bluewater acquisition brings six plants into the network at the close of Q3 [[SRC:na_ev_1]].',
      'My guess is the day-one plan covers the ERP and the brand, and the yards sit on a list called later. That is usually where two operating vocabularies collide first, at the fence.',
      'Which of the six plants takes its first truck from your existing lanes?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['acquisition'],
    claimsUsed: [],
    evidence: ['na_ev_1'],
  },
  {
    subject: 'Harmonizing at the fence',
    paragraphs: [
      'Your integration lead posting for the Bluewater deal lists harmonizing site processes as the first deliverable [[SRC:na_ev_2]].',
      'Harmonizing tends to start with the systems and end with the people, and the trailer events in between stay local. Six plants with six check-in habits look integrated in the ERP and act acquired at the fence for years.',
      'Worth sending over the short version of how a peer ran the acquired sites on one protocol in the first ninety days?',
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['job_posting'],
    claimsUsed: [],
    evidence: ['na_ev_2'],
  },
  {
    subject: 'Shared lanes, different clocks',
    paragraphs: [
      'Your Q2 call tied the Bluewater cost target to shared logistics, with the plants moving onto the {{account}} network within a year [[SRC:na_ev_3]].',
      'Shared logistics is likely to expose the yards first: same lanes, different clocks at the fence. Primo Brands committed its entire network, 260 sites under contract, with 24 live on one protocol and the rest rolling out.',
      'Do the six Bluewater plants get one fence-line protocol on day one, or does each keep its own until the systems catch up?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['news'],
    claimsUsed: ['CR-007', 'CR-002'],
    evidence: ['na_ev_3'],
  },
  {
    subject: 'Reno as the template',
    paragraphs: [
      'The Reno DC opening next year gives the network its first site that was never anyone else\'s legacy [[SRC:na_ev_4]].',
      'A greenfield site is the one place the fence-line protocol can be right from day one, and it usually becomes the template the acquired plants get graded against. If Reno opens on the same paper and radio habits, the network gains a seventh vocabulary instead of a first standard.',
      "Reply and I'll send the short version.",
    ],
    askType: 'asset_offer',
    requiredEvidenceTypes: ['new_site'],
    claimsUsed: [],
    evidence: ['na_ev_4'],
  },
];

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

export const SEED_FAMILIES: readonly SeedFamily[] = [
  family('network_standardization', 'Network Standardization', 'network_standardization', 'executive_ops', NETWORK_STANDARDIZATION),
  family('hidden_capacity', 'Hidden Capacity', 'hidden_capacity', 'distribution', HIDDEN_CAPACITY),
  family('automation_readiness', 'Automation Readiness', 'automation_readiness', 'automation', AUTOMATION_READINESS),
  family('new_sites_acquisitions', 'New Sites and Acquisitions', 'network_standardization', 'supply_chain', NEW_SITES_ACQUISITIONS),
];

export const SEED_FAMILY_KEYS: readonly string[] = SEED_FAMILIES.map((f) => f.key);

export function seedFamilyByKey(key: string): SeedFamily | undefined {
  return SEED_FAMILIES.find((f) => f.key === key);
}

/** Render the per-person placeholders the way a queue render would; the compiler sees plain text either way. */
export function renderSeedPlaceholders(text: string, values: { firstName: string; account: string }): string {
  return text.replaceAll('{{first_name}}', values.firstName).replaceAll('{{account}}', values.account);
}
