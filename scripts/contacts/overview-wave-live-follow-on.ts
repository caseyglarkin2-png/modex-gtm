/**
 * Remaining live-safe drip sends after Niccole Pippin and Daniel Coe.
 *
 * Use this only after Niccole Pippin and Daniel Coe have already been sent.
 * The copy here is optimized for one-by-one drip sends.
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'kelly.killingsworth@kdrp.com',
    firstName: 'Kelly',
    accountName: 'Keurig Dr Pepper',
    personaName: 'Kelly Killingsworth',
    accountSlug: 'keurig-dr-pepper',
    assetPath: '/for/keurig-dr-pepper/kelly-killingsworth',
    assetLabel: 'KDP Kelly brief',
    previewEyebrow: 'Private brief for Kelly',
    previewTitle: 'DSD depot chaos is still a yard problem',
    previewText: 'A short KDP brief on where cost per case leaks between DSD depots and warehouse flow.',
    previewTags: ['13,000 DSD routes', 'Fuel for Growth', 'Headcount neutral'],
    subject: 'Kelly, one KDP yard hypothesis',
    body: [
      'Hi Kelly,',
      'KDP runs two networks at once. DSD depots and warehouse flow.',
      'Could be wrong, but I think the yard is where cost per case leaks between them.',
      'Primo used one yard standard to take on more volume without adding dock-office headcount.',
      `${BASE}/for/keurig-dr-pepper/kelly-killingsworth`,
      'Curious if it feels close or way off.',
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
    assetLabel: 'Diageo brief',
    previewEyebrow: 'Private brief for Bill',
    previewTitle: "Diageo's shortest aging process",
    previewText: 'A short Diageo brief on the gate-to-dock gap that hides before the dock team touches the load.',
    previewTags: ['90-minute blind spot', '$500K+ trailer value', 'Peak season spike'],
    subject: 'Bill, where 90 minutes disappears',
    body: [
      'Hi Bill,',
      'My read may be off, but I think a lot of Diageo\'s delay starts before the dock team touches the load.',
      'That gate-to-dock gap can hide 90 minutes in plain sight.',
      'Primo saw the same pattern once the yard ran one standard.',
      `${BASE}/for/diageo`,
      'If it misses, tell me where.',
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
    assetLabel: 'KDP operations brief',
    previewEyebrow: 'Private brief for Jay',
    previewTitle: "What decides KDP's first route out",
    previewText: 'A short KDP brief on the yard handoff that determines whether the morning launches clean.',
    previewTags: ['5-6 AM departure', 'Gate-to-dock handoff', 'Route readiness'],
    subject: 'Jay, what sets the first departure?',
    body: [
      'Hi Jay,',
      'The first route out is usually decided before the dock team starts loading.',
      'My hunch is the yard handoff is where KDP wins or loses that window.',
      'I put a short page together here.',
      `${BASE}/for/keurig-dr-pepper`,
      'If that feels close, I would value your reaction.',
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
    assetLabel: 'KDP standardization brief',
    previewEyebrow: 'Private brief for Deborah',
    previewTitle: 'Where KDP standardization still breaks',
    previewText: 'A short KDP brief on the yard layer that stays local while the rest of the network gets standardized.',
    previewTags: ['One yard language', 'Local variance', 'Network protocol'],
    subject: 'Deborah, where yard standardization stops',
    body: [
      'Hi Deborah,',
      'Most network programs standardize planning and ERP first.',
      'The yard still stays local. Different rules. Different handoffs.',
      'That may be the wrong read, but it feels like a lot of the variance still hides there at KDP.',
      'I put the short version here.',
      `${BASE}/for/keurig-dr-pepper`,
      'Curious if this feels right or if I\'m off.',
      'Casey',
    ],
  },
];