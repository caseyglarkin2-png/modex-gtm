/**
 * Recovery cohort for GM and Frito-Lay.
 *
 * These addresses were previously hit during the burned-domain period.
 * They are useful once Wave A confirmed is out and the pages are deployed,
 * but they are intentionally separated from the highest-confidence manifest.
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'nisar.ahsanullah@genmills.com',
    firstName: 'Nisar',
    accountName: 'General Mills',
    personaName: 'Nisar Ahsanullah',
    accountSlug: 'general-mills',
    assetPath: '/for/general-mills',
    assetLabel: 'General Mills overview',
    subject: 'General Mills yard throughput before MODEX',
    body: [
      'Nisar,',
      'The planning side of the network is strong. The gate-to-dock execution layer is still where minutes disappear.',
      'I put the General Mills view into one short page here.',
      `${BASE}/for/general-mills`,
      'Open to a quick conversation at MODEX if this is close to the problem your team sees?',
      'Casey',
    ],
  },
  {
    to: 'ryan.underwood@genmills.com',
    firstName: 'Ryan',
    accountName: 'General Mills',
    personaName: 'Ryan Underwood',
    accountSlug: 'general-mills',
    assetPath: '/for/general-mills',
    assetLabel: 'General Mills overview',
    subject: 'General Mills dock speed starts in the yard',
    body: [
      'Ryan,',
      'The Missouri absorption math only works if the yard moves as fast as the rest of the network.',
      'This page is the short version of that case for General Mills.',
      `${BASE}/for/general-mills`,
      'Worth 15 minutes at MODEX if the premise is right?',
      'Casey',
    ],
  },
  {
    to: 'zoe.bracey@genmills.com',
    firstName: 'Zoe',
    accountName: 'General Mills',
    personaName: 'Zoe Bracey',
    accountSlug: 'general-mills',
    assetPath: '/for/general-mills/zoe-bracey',
    assetLabel: 'Zoe Bracey brief',
    subject: 'Zoe, the dock promise still starts in the yard',
    body: [
      'Zoe,',
      'Customer promise breaks at the dock long before it shows up on the shelf. The yard is where that slip starts.',
      'I put the General Mills version of that story here.',
      `${BASE}/for/general-mills/zoe-bracey`,
      'Would 15 minutes at MODEX be useful if the page is close to the problem?',
      'Casey',
    ],
  },
  {
    to: 'lars.stolpestad@genmills.com',
    firstName: 'Lars',
    accountName: 'General Mills',
    personaName: 'Lars Stolpestad',
    accountSlug: 'general-mills',
    assetPath: '/proposal/general-mills',
    assetLabel: 'General Mills proposal',
    subject: 'General Mills dock scheduling is still manual',
    body: [
      'Lars,',
      'Most networks this large still do not know how long a trailer waits between the gate and the dock. That blind spot is still expensive.',
      'I tightened the General Mills case into one proposal page here.',
      `${BASE}/proposal/general-mills`,
      'Worth a quick conversation at MODEX if the logic holds?',
      'Casey',
    ],
  },
  {
    to: 'brian.watson@pepsico.com',
    firstName: 'Brian',
    accountName: 'Frito-Lay',
    personaName: 'Brian Watson',
    accountSlug: 'frito-lay',
    assetPath: '/for/frito-lay',
    assetLabel: 'Frito-Lay overview',
    subject: 'Frito-Lay yard ops in one page',
    body: [
      'Brian,',
      'At Frito-Lay speed, the yard is not overflow space. It is the live sequencing layer for the network.',
      'I put the current Frito-Lay case into one short page here.',
      `${BASE}/for/frito-lay`,
      'Open to 15 minutes at MODEX if this is directionally right?',
      'Casey',
    ],
  },
  {
    to: 'beth.mars@pepsico.com',
    firstName: 'Beth',
    accountName: 'Frito-Lay',
    personaName: 'Beth Mars',
    accountSlug: 'frito-lay',
    assetPath: '/for/frito-lay',
    assetLabel: 'Frito-Lay overview',
    subject: 'Frito-Lay dock throughput still starts outside',
    body: [
      'Beth,',
      'A faster dock window starts outside the building. That is the part most teams still do not instrument well.',
      'This is the current Frito-Lay brief in one page.',
      `${BASE}/for/frito-lay`,
      'Would a short conversation at MODEX be useful if the page lands?',
      'Casey',
    ],
  },
];