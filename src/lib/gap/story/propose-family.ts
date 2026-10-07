/**
 * PROPOSED PROBLEM FAMILY for a thesis drafted from a checked fact (GAP OS execution recovery, R11, 2026-10-06).
 *
 * The recorded Pepsi failure: the outreach anchor posted `problemFamily: 'unmapped'` and the submit guard refused
 * exactly that, so the interface offered a transition its own payload could not satisfy. The family is now DERIVED,
 * with a stated basis the reviewer reads, from what the fact itself supports:
 *
 *   1. the fact's own words hit a family's cue list (taxonomy classifyFamilies): that family, "the fact says ..."
 *   2. else the fact's change class (research/facts.ts classifyFact): a site closure, consolidation, opening,
 *      expansion or relocation is HIDDEN CAPACITY (the network change moves load onto the physical handoffs that
 *      remain: the catalog family for site_expansion and news); an automation program is AUTOMATION READINESS; an
 *      acquisition is NETWORK STANDARDIZATION (acquired sites and systems never unified)
 *   3. else NO family: preparation is incomplete and the seller is asked ONE question (which problem it points at)
 *      before the thesis can be submitted. Never a silent default, never `unmapped` on an advertised submit path.
 *
 * Batch item 3 (mandate section 8, no mandatory family selection; audit at 31f09c71): the question offers only the
 * families that HAVE event-led copy (`COPY_FAMILIES`, the seeded families' problem families; a choice without copy
 * dead-ended at no_version), with a SUGGESTED default preselected and its basis said, so answering is one confirm,
 * never a hunt; and a job- or procurement-led thesis is never asked at all (its copy is chosen by its approach
 * program): it takes the general family with that basis stated (`approachFamilyDefault`).
 *
 * Pure; pinned by tests/unit/gap/propose-family.test.ts.
 */
import { classifyFamilies, isProblemFamily, PROBLEM_FAMILY_CATALOG, type ProblemFamily } from '../taxonomy';
import { classifyFact, isPhysicalOpsFact, type FactChange } from '../research/facts';

export interface FamilyProposal {
  family: ProblemFamily | null;
  /** How it was derived, for the reviewer and the audit payload. */
  via: 'cue' | 'change' | 'none';
  basis: string;
}

const CHANGE_FAMILY: Partial<Record<FactChange, { family: ProblemFamily; basis: string }>> = {
  closure: { family: 'hidden_capacity', basis: 'a site closure or consolidation moves load onto the physical handoffs that remain' },
  relocation: { family: 'hidden_capacity', basis: 'a relocation moves load onto the physical handoffs that remain' },
  expansion: { family: 'hidden_capacity', basis: 'an expansion adds load to the gates, yards and docks that carry it' },
  opening: { family: 'hidden_capacity', basis: 'a new site opens on the gate, yard and dock handoffs it inherits' },
  automation: { family: 'automation_readiness', basis: 'an automation program depends on deterministic yard handoffs' },
  acquisition: { family: 'network_standardization', basis: 'an acquisition brings sites and systems that were never unified' },
};

/** The family a checked fact supports, or none. */
export function proposeFamilyFor(factText: string): FamilyProposal {
  const text = (factText ?? '').trim();
  if (!text) return { family: null, via: 'none', basis: 'no fact text' };
  const cue = classifyFamilies(text);
  // A clear cue winner decides; a tie between families (one cue each) is not a verdict, so the change class decides it.
  const clear = isProblemFamily(cue.primary) && (cue.secondary.length === 0 || cue.hits[cue.primary] > cue.hits[cue.secondary[0]]);
  if (clear && isProblemFamily(cue.primary)) {
    return { family: cue.primary, via: 'cue', basis: `the fact's own words point at ${label(cue.primary)}` };
  }
  if (isPhysicalOpsFact(text)) {
    // "ceasing", "shut down", "idled", "wind down" are closures the fact classifier files under a generic change.
    const change: FactChange = /\b(ceas(?:e|ed|es|ing)|shut(?:s|ting)? down|shutdown|idl(?:e|ed|es|ing)|mothball|wind(?:s|ing)? down|discontinu)/i.test(text) ? 'closure' : classifyFact(text).change;
    const mapped = CHANGE_FAMILY[change];
    if (mapped) return { family: mapped.family, via: 'change', basis: mapped.basis };
  }
  if (isProblemFamily(cue.primary)) {
    return { family: cue.primary, via: 'cue', basis: `the fact's own words point at ${label(cue.primary)} (and ${cue.secondary.map(label).join(', ')}); check it` };
  }
  return { family: null, via: 'none', basis: 'the fact names no problem family GAP can derive; choose the problem it points at' };
}

/** The family in seller words ("hidden capacity"). */
export function label(family: ProblemFamily | string): string {
  return family.replace(/_/g, ' ');
}

/**
 * The problem families that HAVE event-led copy (sequences/families.ts SEED_FAMILIES' problem families; parity pinned
 * by tests/unit/gap/propose-family.test.ts). Client-safe: a constant, not the seed module.
 */
export const COPY_FAMILIES: readonly ProblemFamily[] = ['network_standardization', 'hidden_capacity', 'automation_readiness'];

/** The general case for a physical change: the default suggested when the fact names no family. */
export const DEFAULT_FAMILY: ProblemFamily = 'hidden_capacity';

/** The families a seller may choose for an event-led thesis: only those with copy, each with its one-line problem. */
export function familyChoices(): Array<{ family: ProblemFamily; label: string; problem: string }> {
  return COPY_FAMILIES.map((family) => ({ family, label: label(family), problem: PROBLEM_FAMILY_CATALOG[family].problem }));
}

/** The family preselected on the one question: the derived one, else the general case, with the basis said. */
export function suggestedFamilyFor(factText: string): { family: ProblemFamily; basis: string } {
  const p = proposeFamilyFor(factText);
  if (p.family && COPY_FAMILIES.includes(p.family)) return { family: p.family, basis: p.basis };
  return { family: DEFAULT_FAMILY, basis: 'GAP could not tell from the fact; hidden capacity is the general case for a physical change. Pick another if it fits better.' };
}

/** A job- or procurement-led thesis takes its copy from its approach program: the family is recorded, never asked. */
export function approachFamilyDefault(factText: string): { family: ProblemFamily; basis: string } {
  const p = proposeFamilyFor(factText);
  if (p.family) return { family: p.family, basis: p.basis };
  return { family: DEFAULT_FAMILY, basis: 'a job- or procurement-led thesis takes its copy from the posting approach; the family is the general case and is not asked' };
}
