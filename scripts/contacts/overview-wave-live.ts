/**
 * Broader live overview wave using only currently reachable contacts.
 *
 * Selection rule:
 * - Not in unsubscribed_emails
 * - Not in blocked domains
 * - Route is live in production and returns 200
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'niccole.pippin@genmills.com',
    firstName: 'Niccole',
    accountName: 'General Mills',
    personaName: 'Niccole Pippin',
    accountSlug: 'general-mills',
    assetPath: '/for/general-mills',
    assetLabel: 'General Mills overview',
    subject: 'General Mills yard visibility before MODEX',
    body: [
      'Niccole,',
      'General Mills has planning, warehouse, and network systems in place. The blind spot is still the live gate-to-dock handoff.',
      'This short brief shows how we frame that gap for the General Mills footprint.',
      `${BASE}/for/general-mills`,
      'Open to a quick conversation at MODEX if the page is close to the problem your team sees?',
      'Casey',
    ],
  },
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
      'The planning systems are already there. The yard is still the part most teams do not see in real time.',
      'I put the Diageo version of that operating case into one short page here.',
      `${BASE}/for/diageo`,
      'Would a quick conversation at MODEX make sense if the page is close to the problem your team sees?',
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
  {
    to: 'kelly.killingsworth@kdrp.com',
    firstName: 'Kelly',
    accountName: 'Keurig Dr Pepper',
    personaName: 'Kelly Killingsworth',
    accountSlug: 'keurig-dr-pepper',
    assetPath: '/for/keurig-dr-pepper',
    assetLabel: 'Keurig Dr Pepper overview',
    subject: 'KDP yard ops before MODEX',
    body: [
      'Kelly,',
      'The DSD side of KDP lives on fixed departure windows. That means the yard is not overflow space. It is the live sequencing layer for the network.',
      'I put the current KDP brief here.',
      `${BASE}/for/keurig-dr-pepper`,
      'Worth 15 minutes at MODEX if the page lines up with the pressure your team sees?',
      'Casey',
    ],
  },
  {
    to: 'jay.traficante@kdrp.com',
    firstName: 'Jay',
    accountName: 'Keurig Dr Pepper',
    personaName: 'Jay Traficante',
    accountSlug: 'keurig-dr-pepper',
    assetPath: '/for/keurig-dr-pepper',
    assetLabel: 'Keurig Dr Pepper overview',
    subject: 'KDP facility throughput starts outside the building',
    body: [
      'Jay,',
      'When the network is running on tight retailer windows, the handoff from gate to dock decides whether the rest of the day is clean or late.',
      'I put the KDP version of that case into one page here.',
      `${BASE}/for/keurig-dr-pepper`,
      'Open to a quick conversation at MODEX if the page is close to the problem?',
      'Casey',
    ],
  },
  {
    to: 'deborah.finney@kdrp.com',
    firstName: 'Deborah',
    accountName: 'Keurig Dr Pepper',
    personaName: 'Deborah Finney',
    accountSlug: 'keurig-dr-pepper',
    assetPath: '/for/keurig-dr-pepper',
    assetLabel: 'Keurig Dr Pepper overview',
    subject: 'KDP yard standardization before MODEX',
    body: [
      'Deborah,',
      'A multi-format network only standardizes when the yard standardizes too. That is still the blind spot in most beverage operations.',
      'This short KDP brief shows how we frame that gap.',
      `${BASE}/for/keurig-dr-pepper`,
      'Would 15 minutes at MODEX make sense if the page is directionally right?',
      'Casey',
    ],
  },
];