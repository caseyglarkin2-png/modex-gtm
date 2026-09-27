/**
 * S3-T11: the four seed sequence families as data. Spec section 4.5 (shape),
 * section 8 (every step passes the compiler) and the S3-T11 row.
 *
 * Each family is one steps.v2 shape (src/lib/gap/sequence/steps.ts) with ONE
 * step (red team T7, 2026-09-26). Steps 1 to 3 cited fixture facts about other
 * companies' sites (Fontana, Columbus, Bluewater, Reno, "your careers page",
 * "your Q2 call") that no prospect ever said; they are deleted, not replaced
 * with filler. A sequence is honest single-touch until real per-prospect
 * follow-ups are written by a human.
 *
 * Step 0 posture: the VERIFIED FACT (the approved evidence, through the
 * `{{observation}}` slot) -> a hedged pattern, explicitly not a claim about
 * this account -> the hypothesis as a question. No analogy hook, no
 * diagnosis, no business-impact or cost question before the buyer has said
 * the problem exists, no meeting ask, no product, no em dashes, "yards"
 * plural, no "throughput", no "standardize paper".
 *
 * Placeholders: `{{first_name}}` and `{{account}}` are rendered per person;
 * the compiler treats them as text. Step 0 carries NO prospect fact of its
 * own (R3-4): its observation sentence is the slot `{{observation}}`, which
 * src/lib/gap/sequence/render.ts fills from the hypothesis observation with
 * its `[S:<signal id>]` tokens turned into `[[SRC:<signal id>]]` markers, so
 * C01 resolves the cited fact against the hypothesis's own signals. The
 * stored step-0 body therefore carries no `[[SRC:` marker at all, and a
 * template with the slot left unfilled is refused `unrendered_placeholder`.
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
  /** Fixture evidence ids this step cites (its `[[SRC:id]]` markers, in order); empty on step 0, whose fact comes through the slot. */
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
    subject: 'One question on the network',
    paragraphs: [
      '{{observation}}',
      'When a network grows like that, the yards usually keep each site\'s own habits for a while, so one trailer event gets counted one way at one site and another way at the next. That might not be true at {{account}}.',
      'Is that something your team is working through, or do the sites already run the gate and dock one way?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['acquisition', 'site_expansion'],
    claimsUsed: [],
    evidence: [],
  },
];

// ---------------------------------------------------------------------------
// Hidden Capacity (distribution)
// ---------------------------------------------------------------------------

const HIDDEN_CAPACITY: SeedStepCopy[] = [
  {
    subject: 'Doors versus spots',
    paragraphs: [
      '{{observation}}',
      'When volume moves like that, the yards usually become the constraint before the doors do: a tractor hunting for the right trailer while a door waits. That might not be true at {{account}}.',
      'Is that showing up for your team, or are the yards keeping pace?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['site_expansion'],
    claimsUsed: [],
    evidence: [],
  },
];

// ---------------------------------------------------------------------------
// Automation Readiness (automation)
// ---------------------------------------------------------------------------

const AUTOMATION_READINESS: SeedStepCopy[] = [
  {
    subject: 'Before the robots',
    paragraphs: [
      '{{observation}}',
      'Automation plans usually assume the trailer is at the door when the schedule says it will be, and the yards tend to decide whether that holds. That might not be true at {{account}}.',
      'Is trailer timing something your automation team is planning around, or is it already handled?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['automation_program'],
    claimsUsed: [],
    evidence: [],
  },
];

// ---------------------------------------------------------------------------
// New Sites and Acquisitions (supply_chain)
// ---------------------------------------------------------------------------

const NEW_SITES_ACQUISITIONS: SeedStepCopy[] = [
  {
    subject: 'The new sites',
    paragraphs: [
      '{{observation}}',
      'New or acquired sites usually bring their own habits at the gate and in the yards, and they tend to stay until someone decides how the yards should run. That might not be true at {{account}}.',
      'Has your team settled how the new sites will run their yards, or is that still open?',
    ],
    askType: 'question',
    requiredEvidenceTypes: ['acquisition'],
    claimsUsed: [],
    evidence: [],
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
