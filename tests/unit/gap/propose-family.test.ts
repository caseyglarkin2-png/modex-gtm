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
  it('the seven choices carry the catalog problem line, for the one question', () => {
    const c = familyChoices();
    expect(c.map((x) => x.family)).toEqual([...PROBLEM_FAMILIES]);
    expect(c.find((x) => x.family === 'hidden_capacity')?.problem).toMatch(/Physical handoffs/);
    expect(c.every((x) => !x.label.includes('_'))).toBe(true);
  });
});
