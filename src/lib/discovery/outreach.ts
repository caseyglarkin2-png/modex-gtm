/**
 * Outreach draft builder — the single source of the prospect email copy, shared by
 * the in-app composer and the batch send-queue generator so they never drift.
 * Recipient-facing, references THEIR facility, claims only what we show, no em dashes.
 */
import { facilityNoun, formatMiles, NEAR_REFERENCE_MI } from './angle';
import { buildAngleStack } from './angles';
import { buildAbsoluteUrl } from '@/lib/site-url';
import type { AngleKey, CuratedRow } from './types';

/** Live YardFlow yard-spotter frame (Primo Allentown), cropped to the aerial yard +
 *  AI trailer detections — visual proof for near-reference outreach. */
export const PROOF_IMAGE_PATH = '/artifacts/allentown-yard-proof.jpg';

export interface Outreach {
  subject: string;
  body: string;
  /** Inline proof image (absolute URL), only for near-reference prospects. */
  imageUrl?: string;
}

/**
 * Lightly differentiate copy by the recipient's job title. Operations-flavored
 * titles (yard / dock / plant / ops) win over network-flavored ones, so an
 * "Operations" title resolves to 'yard ops'. Returns null when neither matches.
 */
export function personaScope(title?: string): 'yard ops' | 'network' | null {
  const t = (title || '').toLowerCase();
  if (/yard|dock|terminal|plant|\bsite\b|warehouse|distribution|operations|\bops\b/.test(t)) return 'yard ops';
  if (/transport|logistics|supply chain|fleet|network/.test(t)) return 'network';
  return null;
}

/**
 * @param angleKey Optional angle-library framing (src/lib/discovery/angles.ts).
 *   Omitted → the default proximity-or-fit copy, byte-identical to before. When
 *   provided, the subject + opener come from that angle; the proof image stays
 *   proximity-only. Everything else (greeting, CTA, signature) is unchanged.
 */
export function buildOutreach(
  prospect: CuratedRow,
  firstName?: string,
  title?: string,
  angleKey?: AngleKey,
): Outreach {
  const near = prospect.nearestPrimoDistance <= NEAR_REFERENCE_MI;
  const scope = personaScope(title);
  const noun = facilityNoun(prospect.name);
  const where = prospect.cityState ? ` in ${prospect.cityState}` : '';
  const angle = angleKey ? buildAngleStack(prospect).find((a) => a.key === angleKey) : undefined;
  const subject = angle
    ? angle.subject
    : near
      ? `A live YardFlow site ${formatMiles(prospect.nearestPrimoDistance)} mi from your operation`
      : `YardFlow yard network system for your team`;
  const opener = angle
    ? angle.opener
    : near
      ? `Primo Brands runs YardFlow at a live site just ${formatMiles(prospect.nearestPrimoDistance)} mi from your ${noun}${where}.`
      : `We run YardFlow's yard network system for shippers and 3PLs across the ${prospect.corridor} corridor.`;
  // The proof image is the proximity yard-spotter shot — only attach it when the
  // draft actually leads with proximity (default near path, or the proximity angle).
  const showProof = near && (!angle || angle.key === 'proximity');
  const body = [
    `Hi ${firstName || 'there'},`,
    '',
    opener,
    '',
    `We'd love to show you the live yard ops and see if it's worth a look for your ${scope || 'team'}. Open to a quick 15 minutes?`,
    '',
    'Best,',
    'Casey',
  ].join('\n');
  return { subject, body, imageUrl: showProof ? buildAbsoluteUrl(PROOF_IMAGE_PATH) : undefined };
}
