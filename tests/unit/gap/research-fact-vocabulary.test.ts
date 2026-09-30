/**
 * Scale dogfood: paid research found real operations events the fact gate rejected for vocabulary alone. They
 * are facts; the gate's negation, habitual, hypothetical and boilerplate guards still hold.
 */
import { describe, expect, it } from 'vitest';
import { isPhysicalOpsFact } from '@/lib/gap/research/facts';
import { failureClass } from '@/lib/gap/research/run';

describe('real operations events are facts', () => {
  it.each([
    'On November 4, 2025, PepsiCo Foods U.S. ceased manufacturing and onsite warehouse operations at its Frito-Lay facility in Orlando, Florida, laying off approximately 454 workers.',
    'On May 9, 2026, Frito-Lay officially shut down its secondary off-site warehouse facility located at 2000 Parks Oaks Avenue in Orlando, Florida, eliminating 46 roles.',
    'Lineage reported during a quarterly analyst call that it had idled operations at five additional facilities so far in 2026.',
    'Lineage celebrated the groundbreaking of its new automated cold storage facility in Hutchins, Texas, with officials from the City of Hutchins.',
    'The new distribution center went live in March and now serves 300 stores across the Southeast.',
    'On May 9, 2026, Frito-Lay closed its warehouse facility in Orlando, Florida.',
    'In May 2026, Acme opened a new distribution center in Columbus, Ohio.',
    'Following its acquisition of La Tiara, General Mills reopened the Gladstone, Missouri, manufacturing plant to make taco shells.',
    'Crews began the physical demolition of the 60-year-old Orlando manufacturing facility in January 2026.',
    'Frito-Lay said it would discontinue its internal warehouse operations at its distribution center in Raleigh in September.',
    'PepsiCo is actively consolidating mixing centers across its North American distribution network.',
    'ShipBob is deploying autonomous mobile robots in its Chicago fulfillment center.',
    'The project added approximately 188,000 square feet of space and 58,000 pallet positions to Lineage’s existing Hobart site.',
    "Operational since October 1, 2025, this facility replaces the former site in Fontanil-Cornillon and enhances XPO Logistics' French national network.",
    'APM Terminals Los Angeles added 40 battery-electric terminal tractors, growing the facility’s electric fleet to 60 units.',
    'The Port of Los Angeles and APM Terminals completed a $73 million rail infrastructure project at Pier 400, adding 31,000 linear feet of track.',
  ])('%s', (s) => expect(isPhysicalOpsFact(s)).toBe(true));
});

describe('non-events stay rejected', () => {
  it.each([
    'The company has no plans to open additional distribution centers this year.',
    'We may close facilities from time to time in the ordinary course of business.',
    'Our warehouses could be shut down by severe weather or other disruptions.',
    'We celebrated our employees at every facility during appreciation week.',
    'The company may close two distribution centers next year.',
    'We may open a new warehouse in May if demand holds.',
  ])('%s', (s) => expect(isPhysicalOpsFact(s)).toBe(false));
});

describe('failure classes', () => {
  it('names blocked, missing and unreadable sources apart from weak reanchors', () => {
    expect(failureClass('source_unreadable:fetch 403')).toBe('SOURCE_FETCH_BLOCKED');
    expect(failureClass('source_unreadable:fetch 404')).toBe('SOURCE_NOT_FOUND');
    expect(failureClass('source_unreadable:no_readable_text')).toBe('SOURCE_NOT_FOUND');
    expect(failureClass('reanchor_too_weak')).toBe('REANCHOR_TOO_WEAK');
    expect(failureClass('source_too_weak')).toBe('SOURCE_TOO_WEAK');
    expect(failureClass('not_a_physical_operations_fact')).toBe('NOT_PHYSICAL_OPERATIONS');
  });
});

describe('html entities decode to characters (no mangled names)', () => {
  it('numeric and named entities', async () => {
    const { htmlToText } = await import('@/lib/gap/research/facts');
    expect(htmlToText('<p>sell our business in Brazil to Caf&#233; Tr&#234;s Cora&#231;&#245;es S.A.</p>').trim()).toBe('sell our business in Brazil to Café Três Corações S.A.');
    expect(htmlToText('an initial 15,000 m&sup2; near Saint-&Eacute;gr&egrave;ve &amp; more').trim()).toBe('an initial 15,000 m² near Saint-Égrève & more');
  });
});

describe('review P1: the page names the account exactly (no common-word fallback)', () => {
  it('a descriptor-less or common word is not the account', async () => {
    const { textNamesAccount } = await import('@/lib/gap/research/run');
    expect(textNamesAccount('The Lineage of the family business is long.', 'lineage logistics')).toBe(false);
    expect(textNamesAccount('Penske Automotive opened a dealership.', 'penske logistics')).toBe(false);
    expect(textNamesAccount('Lineage Logistics opened a warehouse.', 'lineage logistics')).toBe(true);
  });
});

describe('review P1: non-facility sites and speculation stay out', () => {
  it.each([
    'Our site has been redesigned and will launch a new privacy policy.',
    'The company announced it will open a new job site portal for drivers in 2026.',
    'The company added 20,000 square feet of office space at its headquarters.',
    'Acme announced it will deploy a new website across all its sites.',
    'Analysts said Acme would close the Memphis plant.',
  ])('%s', (s) => expect(isPhysicalOpsFact(s)).toBe(false));
});

describe('review P2: entities decode safely', () => {
  it('no prototype names, controls, surrogates or bidi overrides', async () => {
    const { htmlToText } = await import('@/lib/gap/research/facts');
    expect(htmlToText('a&constructor;b').trim()).toBe('ab');
    expect(htmlToText('x&#8238;y&#xD800;z&#127;w').trim()).toBe('x y z w');
  });
});
