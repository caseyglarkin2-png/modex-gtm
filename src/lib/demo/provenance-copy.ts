/**
 * F.T2 — "How we built these" provenance content.
 *
 * Five sections rendered in the provenance modal (F.T1) and reachable
 * from the gallery footer (F.T6). Voice-CI clean: no em dashes, no
 * filler. Kept as data (not JSX) so the voice check can scan it and so
 * the same copy can feed a future docs page.
 */

export interface ProvenanceSection {
  heading: string;
  body: string;
}

/** sales@freightroll.com per the B.T9 decision (yardflow.ai sending
 *  domain was burned ~2 months ago; swap to audits@yardflow.ai when the
 *  domain is rebuilt). */
export const PROVENANCE_CORRECTION_MAILTO =
  'mailto:sales@freightroll.com?subject=Audit%20correction&body=Brand%3A%20%0AField%3A%20%0ACorrection%3A%20';

export const PROVENANCE_SECTIONS: ProvenanceSection[] = [
  {
    heading: 'Source imagery',
    body: 'Every facility starts from public overhead imagery and street-level views. We work from the Google Maps Static and Street View APIs, within their published terms, plus public records for ownership and address. No private feeds, no badge access, no insider data. What you see is what any analyst with the same public sources could reconstruct.',
  },
  {
    heading: 'The 22-field rubric',
    body: 'Each site is scored against a fixed 22-field rubric: truck gate, guard shack, pre and post gate staging, dock door count, trailer spots, driveway depth, rail spur, yard acreage, and more. Every field has a written definition and a visual-evidence test, so two analysts grading the same yard land on the same answer. Fields we cannot resolve from imagery are marked low confidence, not guessed.',
  },
  {
    heading: 'How we picked anchors',
    body: 'The eleven industry templates are real audited networks chosen to represent distinct yard archetypes: high-velocity beverage, snack DSD, branded CPG, big-box retail DC, 3PL warehousing, automotive OEM, heavy equipment, building materials, grocery distribution, and parcel. One strong, recognizable network per archetype, so a prospect can find the shape closest to their own in seconds.',
  },
  {
    heading: 'Refresh cadence',
    body: 'Packs are rebuilt when imagery refreshes or a network changes materially: a new DC opens, a yard expands, a site closes. The audit date on each template shows when that network was last modeled. We re-audit anchors ahead of major campaigns and on request when a prospect tells us something on the ground has changed.',
  },
  {
    heading: 'Tell us what we got wrong',
    body: 'These are external estimates from public imagery, not a substitute for a walk of your yard. If a count is off or a gate moved, we want to know. Send a correction and we will update the model. Getting the numbers right is the whole point, and the fastest way there is a note from someone who knows the site.',
  },
];
