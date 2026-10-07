/**
 * THE NEXT DEAL ARTIFACT OR STAKEHOLDER MOVE (GAP OS execution recovery, R53, 2026-10-06). Pure and client-safe.
 *
 * From the deal's own confirmed context (R50 scope), its plan (R52) and its obligations, GAP PREPARES the artifact
 * the deal needs now, never sends it:
 *
 *   recap            the buyer's confirmed statements (in order, in their words, each cited) and the next steps the
 *                    BUYER agreed to (only milestones whose buyer agreement the seller recorded; the seller's own
 *                    open deliverables are said as the seller's), with an open invitation to correct it
 *   introduction     a request to the deal's contact to bring in who else must agree, naming the stakeholder move
 *   pilot criteria   success criteria in the buyer's own measures (their numbers, their picture of good, their
 *                    requirements); with none confirmed it says so and asks, never invents a target
 *   business case    the inputs: the ROI model stays MODELED with its inputs and assumptions shown, the buyer's own
 *                    numbers cited as theirs, YardFlow's proof labeled as YardFlow's (measured at Primo Brands, never
 *                    a forecast for them), and what is still needed from them
 *
 * No governed copy family exists for deal artifacts (the compiler's families are first-touch), so each is a prepared
 * text block labeled "Prepared, not sent", with its citations and a copy control. `artifactProblems` refuses what
 * may never appear: an em dash, "throughput", a canon figure without its qualifier, or a claim of the prospect's
 * acceptance or of legal, security or procurement approval that is not inside the buyer's own quoted words.
 */
import { CANON_NUMBERS } from '../compiler/canon';
import type { Milestone } from './action-plan';

export type ArtifactKind = 'recap' | 'introduction' | 'pilot_criteria' | 'business_case';

export interface ArtifactCitation {
  /** "Ann Scratch, Oct 2 (buyer confirmed)", "the plan: Pilot (Ann Scratch agreed Oct 5)", "ROI model v3 (modeled)". */
  label: string;
  /** The record it rests on (a BID id, a commitment id, the ROI model). */
  ref: string;
}

export interface PreparedArtifact {
  kind: ArtifactKind;
  title: string;
  dealId: string;
  /** Why this artifact, naming the actual commitment or blocker and the stakeholder. */
  why: string;
  /** Who it is for, when one person is. */
  to: string | null;
  text: string;
  citations: ArtifactCitation[];
  /** What it could not say, in words (nothing confirmed yet, no measure agreed). */
  gaps: string[];
  status: 'Prepared, not sent';
  /** No governed copy family exists for deal artifacts: the seller sends it by hand, if at all. */
  governed: false;
  /** The voice and claim guard's findings (empty when clean). */
  problems: string[];
}

export interface ArtifactInput {
  accountName: string;
  deal: { id: string; name: string | null; contacts: ReadonlyArray<{ name: string; title: string | null }> };
  /** This deal's confirmed buyer words and the account-level ones (labeled), oldest first. */
  needs: ReadonlyArray<{ id: string; type: string; quote: string; who: string; at: string; accountLevel: boolean }>;
  /** This deal's plan (R52). */
  plan: readonly Milestone[];
  /** This deal's open obligations. */
  commitments: ReadonlyArray<{ commitmentId: string; kind: string; title: string; line: string; dueAt: string | null }>;
  /** The account's ROI model, when one exists (account-intel: MODELED). */
  roi: { hardSavingsAnnual: number; totalValueAnnual: number; facilities: number; calculatorVersion: string | null; assumptions: readonly string[] } | null;
}

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const first = (name: string) => name.split(' ')[0];
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const MEASURE_TYPES = new Set(['metric', 'impact', 'future_state', 'constraint']);
const STATEMENT_TYPES = new Set(['current_state', 'business_problem', 'root_cause', 'impact', 'metric', 'priority', 'future_state', 'constraint']);

/** YardFlow's own proof, in the canon's words (measured, live, at Primo Brands): ours, never a forecast for them. */
export const YARDFLOW_PROOF = 'For reference, our own measured result: at 24 live Primo Brands sites, drop and hook went from 48 to 24 minutes, measured. That is a YardFlow result at Primo Brands, not a forecast for your yards.';

/** Claims the seller may never make on the buyer's behalf, unless they are the buyer's own quoted words. */
const ACCEPTANCE = /\b(?:you(?:'ve| have)? (?:approved|accepted|signed off|agreed to (?:buy|purchase|proceed))|(?:legal|security|procurement|IT) (?:has |have )?(?:approved|cleared|signed off)|approved by (?:legal|security|procurement)|(?:passed|cleared) (?:your )?(?:legal|security) review|signed off on (?:the )?(?:pilot|contract|purchase))\b/i;

/** The guard over a prepared text: what may never appear outside the buyer's own quoted words. */
export function artifactProblems(text: string, buyerQuotes: readonly string[] = []): string[] {
  const problems: string[] = [];
  if (text.includes('—')) problems.push('an em dash');
  let outside = text;
  for (const q of buyerQuotes) outside = outside.split(q).join(' ');
  if (/\bthroughput\b/i.test(outside)) problems.push('"throughput" (say production capacity)');
  const m = ACCEPTANCE.exec(outside);
  if (m) problems.push(`a claim of approval or acceptance the buyer did not make: "${m[0]}"`);
  for (const sentence of outside.split(/(?<=[.!?])\s+|\n+/)) {
    for (const canon of CANON_NUMBERS) {
      const re = new RegExp(canon.pattern.source, canon.pattern.flags.replace('g', ''));
      if (re.test(sentence) && !canon.requiredPhrasing.test(sentence)) problems.push(`a ${canon.label.replace(/_/g, ' ')} figure without "${canon.requiredLabel}"`);
    }
  }
  return problems;
}

function finish(a: Omit<PreparedArtifact, 'status' | 'governed' | 'problems'>, quotes: readonly string[]): PreparedArtifact {
  return { ...a, status: 'Prepared, not sent', governed: false, problems: artifactProblems(a.text, quotes) };
}

export function prepareArtifacts(i: ArtifactInput): PreparedArtifact[] {
  const dealName = i.deal.name ?? `the ${i.accountName} deal`;
  const lead = i.deal.contacts[0] ?? null;
  const statements = i.needs.filter((n) => STATEMENT_TYPES.has(n.type));
  const quotes = i.needs.map((n) => n.quote);
  const cite = (n: ArtifactInput['needs'][number]) => ({ label: `${n.who}, ${dayOf(n.at)} (buyer confirmed${n.accountLevel ? ', account-level' : ''})`, ref: `bid:${n.id}` });
  const agreedByBuyer = i.plan.filter((m) => m.state === 'agreed' && m.buyerAgreed);
  const agreedNotByBuyer = i.plan.filter((m) => m.state === 'agreed' && !m.buyerAgreed);
  const ours = i.commitments.filter((c) => c.kind === 'deliverable' || c.kind === 'answer_request');

  // RECAP: their words, in order, then only what THEY agreed, then what we owe.
  const recapLines = [
    `${lead ? `Hi ${first(lead.name)},` : 'Hi,'}`,
    '',
    'Thank you for the time. Here is what I heard, in your words, so you can correct anything I got wrong:',
    ...(statements.length ? statements.map((n) => `- "${n.quote}" (${n.who})`) : ['- (Nothing confirmed yet: send this only after you have their words.)']),
    ...(agreedByBuyer.length ? ['', 'What we agreed as next steps:', ...agreedByBuyer.map((m) => `- ${m.title}${m.dueDay ? `, by ${dayOf(`${m.dueDay}T16:00:00Z`)}` : ''}${m.responsible?.name ? ` (${m.responsible.name})` : ''}`)] : []),
    ...(ours.length ? ['', 'What I owe you:', ...ours.map((c) => `- ${c.title}`)] : []),
    '',
    'If any of this is off, tell me and I will fix it.',
  ];
  const recap = finish(
    {
      kind: 'recap',
      title: 'The agreed recap',
      dealId: i.deal.id,
      why: statements.length
        ? `${statements.length} confirmed statement${statements.length === 1 ? '' : 's'} from ${[...new Set(statements.map((n) => n.who))].join(' and ')} on ${dealName}: send them back so ${lead ? first(lead.name) : 'they'} can correct them${agreedByBuyer.length ? `, with the ${agreedByBuyer.length} step${agreedByBuyer.length === 1 ? '' : 's'} they agreed` : ''}.`
        : `Nothing confirmed from the buyer on ${dealName} yet: there is no recap to send until there is.`,
      to: lead?.name ?? null,
      text: recapLines.join('\n'),
      citations: [...statements.map(cite), ...agreedByBuyer.map((m) => ({ label: `the plan: ${m.title.split(':')[0]} (${m.buyerAgreed!.by} agreed ${m.buyerAgreed!.on})`, ref: m.commitmentId ?? `plan:${m.step}` }))],
      gaps: [...(statements.length ? [] : ['No confirmed buyer statement on this deal yet.']), ...(agreedNotByBuyer.length ? [`${agreedNotByBuyer.length} agreed step${agreedNotByBuyer.length === 1 ? '' : 's'} left out: the buyer's agreement is not recorded.`] : [])],
    },
    quotes,
  );

  // INTRODUCTION: who else must agree, asked of the deal's contact.
  const alignment = i.plan.find((m) => m.step === 'stakeholder_alignment');
  const intro = finish(
    {
      kind: 'introduction',
      title: 'An introduction request',
      dealId: i.deal.id,
      why: `${i.deal.contacts.length <= 1 ? `Only ${lead ? lead.name : 'nobody GAP holds'} is on ${dealName}` : `${i.deal.contacts.length} people are on ${dealName}`}; stakeholder alignment is ${alignment?.state === 'agreed' ? 'an agreed step' : alignment?.state === 'declined' ? 'declined for now' : 'still only proposed'}: ask ${lead ? first(lead.name) : 'your contact'} who else must agree.`,
      to: lead?.name ?? null,
      text: [
        `${lead ? `Hi ${first(lead.name)},` : 'Hi,'}`,
        '',
        `Before we go further on ${dealName}, who else needs to be part of this for it to move? If it is someone who runs the yards day to day, or the person who owns the paperwork, would you introduce us? I will keep it short and send them what you and I have covered.`,
      ].join('\n'),
      citations: [...i.deal.contacts.map((c) => ({ label: `${c.name}${c.title ? `, ${c.title}` : ''} (a contact on the deal)`, ref: `deal:${i.deal.id}` })), ...(alignment ? [{ label: `the plan: stakeholder alignment (${alignment.state})`, ref: alignment.commitmentId ?? 'plan:stakeholder_alignment' }] : [])],
      gaps: lead ? [] : ['Nobody GAP holds is a contact on this deal: add the person first.'],
    },
    quotes,
  );

  // PILOT SUCCESS CRITERIA: only their own measures.
  const measures = i.needs.filter((n) => MEASURE_TYPES.has(n.type));
  const pilot = i.plan.find((m) => m.step === 'pilot');
  const criteria = finish(
    {
      kind: 'pilot_criteria',
      title: 'Pilot success criteria',
      dealId: i.deal.id,
      why: measures.length
        ? `The pilot is ${pilot?.state ?? 'proposed'} on ${dealName}; ${measures.length} of their own measure${measures.length === 1 ? '' : 's'} can define success: confirm them with ${lead ? first(lead.name) : 'them'}.`
        : `The pilot is ${pilot?.state ?? 'proposed'} on ${dealName} and no success measure is confirmed: ask ${lead ? first(lead.name) : 'them'} what they would need to see.`,
      to: lead?.name ?? null,
      text: measures.length
        ? ['Pilot success, in your own measures (please correct any of them):', ...measures.map((n) => `- "${n.quote}" (${n.who})`), '', 'How we would check each one, and when, is for us to agree together before the pilot starts.'].join('\n')
        : ['Pilot success criteria: none agreed yet.', '', `Question for ${lead ? first(lead.name) : 'them'}: what would you need to see at the end of a pilot to call it worth rolling out?`].join('\n'),
      citations: measures.map(cite),
      gaps: measures.length ? [] : ['No success measure confirmed by the buyer: nothing is invented.'],
    },
    quotes,
  );

  // BUSINESS-CASE INPUTS: modeled stays modeled, their numbers are theirs, our proof is ours.
  const theirNumbers = i.needs.filter((n) => n.type === 'metric' || n.type === 'impact');
  const caseText = [
    'Business-case inputs (for your review, not a conclusion):',
    ...(i.roi
      ? [`- Modeled, not measured: about ${money(i.roi.hardSavingsAnnual)} a year in hard savings and ${money(i.roi.totalValueAnnual)} a year in total value across ${i.roi.facilities} facilit${i.roi.facilities === 1 ? 'y' : 'ies'}, from our ROI model${i.roi.calculatorVersion ? ` (version ${i.roi.calculatorVersion})` : ''}.`, ...i.roi.assumptions.slice(0, 4).map((a) => `- Model input: ${a}`)]
      : ['- No ROI model exists for this account yet.']),
    ...(theirNumbers.length ? theirNumbers.map((n) => `- Your number: "${n.quote}" (${n.who})`) : ['- Your numbers: not given yet (dwell hours, detention spend, trailer moves a day).']),
    `- ${YARDFLOW_PROOF}`,
  ];
  const businessCase = finish(
    {
      kind: 'business_case',
      title: 'Business-case inputs',
      dealId: i.deal.id,
      why: `${i.plan.find((m) => m.step === 'procurement')?.state === 'agreed' ? 'Procurement is an agreed step' : 'A business case comes before procurement'} on ${dealName}: share the inputs (modeled, with their own numbers cited) so ${lead ? first(lead.name) : 'they'} can correct them.`,
      to: lead?.name ?? null,
      text: caseText.join('\n'),
      citations: [...(i.roi ? [{ label: `ROI model${i.roi.calculatorVersion ? ` ${i.roi.calculatorVersion}` : ''} (modeled)`, ref: 'roi' }] : []), ...theirNumbers.map(cite), { label: 'YardFlow proof at Primo Brands (measured, ours)', ref: 'canon:turn_time' }],
      gaps: [...(i.roi ? [] : ['No ROI model for this account.']), ...(theirNumbers.length ? [] : ['Their own numbers are not given yet.'])],
    },
    quotes,
  );
  return [recap, intro, criteria, businessCase];
}

/**
 * The one artifact the deal needs now, in order: a recap when their words are confirmed and not yet sent back; an
 * introduction when stakeholder alignment is on the plan and only one person is on the deal; pilot criteria once a
 * pilot is agreed; else the business-case inputs. Deterministic; the reason is the artifact's own `why`.
 */
export function nextArtifact(arts: readonly PreparedArtifact[], i: Pick<ArtifactInput, 'needs' | 'plan' | 'deal'>): PreparedArtifact {
  const by = (k: ArtifactKind) => arts.find((a) => a.kind === k)!;
  if (i.needs.some((n) => STATEMENT_TYPES.has(n.type))) return by('recap');
  const alignment = i.plan.find((m) => m.step === 'stakeholder_alignment');
  if (alignment && alignment.state !== 'declined' && i.deal.contacts.length <= 1) return by('introduction');
  if (i.plan.find((m) => m.step === 'pilot')?.state === 'agreed') return by('pilot_criteria');
  return by('business_case');
}
