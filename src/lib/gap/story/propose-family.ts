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
    const change: FactChange = /(ceas(?:e|ed|es|ing)|shut(?:s|ting)? down|shutdown|idl(?:e|ed|es|ing)|mothball|wind(?:s|ing)? down|discontinu)/i.test(text) ? 'closure' : classifyFact(text).change;
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

/** The seven families with their one-line problem, for the one question a seller answers when nothing can be derived. */
export function familyChoices(): Array<{ family: ProblemFamily; label: string; problem: string }> {
  return (Object.keys(PROBLEM_FAMILY_CATALOG) as ProblemFamily[]).map((family) => ({ family, label: label(family), problem: PROBLEM_FAMILY_CATALOG[family].problem }));
}
