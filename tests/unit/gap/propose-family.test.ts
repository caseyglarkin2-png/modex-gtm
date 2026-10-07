/**
 * R11: the problem family of a thesis drafted from a checked fact is DERIVED with a basis, or missing and asked for;
 * it is never a silent default and never `unmapped` on the submit path.
 */
import { describe, expect, it } from 'vitest';
import { familyChoices, proposeFamilyFor } from '@/lib/gap/story/propose-family';
import { PROBLEM_FAMILIES } from '@/lib/gap/taxonomy';

describe('proposeFamilyFor', () => {
  it('a warehouse closure (the Pepsi Tulsa story) derives hidden capacity from its change class, with a basis', () => {
    const p = proposeFamilyFor('PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.');
    expect(p).toEqual({ family: 'hidden_capacity', via: 'change', basis: expect.stringMatching(/closure or consolidation moves load/) });
  });
  it('a plant that is "ceasing" operations is a closure too: the ceasing / shut down / idled wording reaches the closure class', () => {
    // The owning regex once held a literal backspace byte where \b belonged, so this wording never matched.
    // The fact classifier files this sentence under "investment"; only the closure wording regex makes it a closure.
    const p = proposeFamilyFor('PepsiCo is ceasing manufacturing and warehouse operations at a bottling plant in Maryland, which will result in 143 layoffs, according to a WARN notice and statement from the beverage giant.');
    expect(p).toEqual({ family: 'hidden_capacity', via: 'change', basis: expect.stringMatching(/closure or consolidation moves load/) });
    const idled = proposeFamilyFor('Acme Foods idled the distribution center at its Reno plant for the season.');
    expect(idled?.family).toBe('hidden_capacity');
  });
  it('an autonomous freight agreement derives automation readiness from the fact words', () => {
    const p = proposeFamilyFor('PepsiCo and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.');
    expect(p.family).toBe('automation_readiness');
    // 'network' and 'autonomous' tie on cues; the change class (an automation program) decides, with its basis.
    expect(p.via).toBe('change');
  });
  it('an acquisition of sites derives network standardization', () => {
    expect(proposeFamilyFor('Kroger acquired three distribution centers from a regional grocer.').family).toBe('network_standardization');
  });
  it('a sentence that names no problem family is NOT mapped: the seller is asked, nothing defaults', () => {
    const p = proposeFamilyFor('The company reported second quarter results on Tuesday.');
    expect(p.family).toBeNull();
    expect(p.via).toBe('none');
    expect(p.basis).toMatch(/choose the problem/);
    expect(proposeFamilyFor('').family).toBeNull();
  });
  it('a divestiture abroad is not everything-is-hidden-capacity: no physical change, no family', () => {
    expect(proposeFamilyFor('General Mills entered into an agreement to sell its business in Brazil.').family).toBeNull();
  });
  it('the choices (item 3: only the families with event-led copy) carry the catalog problem line, for the one question', () => {
    const c = familyChoices();
    expect(c.map((x) => x.family)).toEqual(['network_standardization', 'hidden_capacity', 'automation_readiness']);
    expect(PROBLEM_FAMILIES.length).toBeGreaterThan(c.length);
    expect(c.find((x) => x.family === 'hidden_capacity')?.problem).toMatch(/Physical handoffs/);
    expect(c.every((x) => !x.label.includes('_'))).toBe(true);
  });
});

describe('item 3: no mandatory family selection', () => {
  it('the choices are exactly the families with event-led copy (parity with the seeded families)', async () => {
    const { COPY_FAMILIES, familyChoices } = await import('@/lib/gap/story/propose-family');
    const { SEED_FAMILIES } = await import('@/lib/gap/sequences/families');
    expect([...COPY_FAMILIES].sort()).toEqual([...new Set(SEED_FAMILIES.map((f) => f.problemFamily))].sort());
    expect(familyChoices().map((c) => c.family)).toEqual([...COPY_FAMILIES]);
  });
  it('the question preselects a suggestion (the derived family, else the general case, with why); a job-led thesis is never asked', async () => {
    const { suggestedFamilyFor, approachFamilyDefault, DEFAULT_FAMILY } = await import('@/lib/gap/story/propose-family');
    expect(suggestedFamilyFor('Kroger will close its Dallas distribution center.')).toMatchObject({ family: 'hidden_capacity' });
    expect(suggestedFamilyFor('Kroger named a new chief financial officer.')).toEqual({ family: DEFAULT_FAMILY, basis: 'GAP could not tell from the fact; hidden capacity is the general case for a physical change. Pick another if it fits better.' });
    expect(approachFamilyDefault('Tyson is hiring a Yard Operations Supervisor at its Amarillo distribution center.')).toMatchObject({ family: expect.any(String), basis: expect.any(String) });
    expect(approachFamilyDefault('We are hiring a supervisor.')).toEqual({ family: DEFAULT_FAMILY, basis: 'a job- or procurement-led thesis takes its copy from the posting approach; the family is the general case and is not asked' });
  });
});
