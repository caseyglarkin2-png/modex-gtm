/**
 * Next cohort once the overview routes are visually reviewed and deployed.
 *
 * These emails are verified in DB. The gating item is page readiness, not
 * recipient quality.
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'bill.sideravage@diageo.com',
    firstName: 'Bill',
    accountName: 'Diageo',
    personaName: 'Bill Sideravage',
    accountSlug: 'diageo',
    assetPath: '/for/diageo',
    assetLabel: 'Diageo overview',
    subject: 'Diageo yard visibility before MODEX',
    body: [
      'Bill,',
      'The supply chain systems are already there. The yard is still the part that most teams do not see in real time.',
      'I put the Diageo version of that argument into one short page here.',
      `${BASE}/for/diageo`,
      'Open to a quick conversation at MODEX if the page is close to the problem?',
      'Casey',
    ],
  },
  {
    to: 'dcoe@coca-cola.com',
    firstName: 'Daniel',
    accountName: 'Coca-Cola',
    personaName: 'Daniel Coe',
    accountSlug: 'coca-cola',
    assetPath: '/for/coca-cola',
    assetLabel: 'Coca-Cola overview',
    subject: 'Coca-Cola yard execution brief',
    body: [
      'Daniel,',
      'The network does not actually speed up unless the yard handoff speeds up with it. That is the operating case in one line.',
      'I put the current Coca-Cola brief here.',
      `${BASE}/for/coca-cola`,
      'Would a short conversation at MODEX make sense if the page is directionally right?',
      'Casey',
    ],
  },
];