import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'will.bonifant@hormel.com',
    firstName: 'Will',
    accountName: 'Hormel Foods',
    personaName: 'Will Bonifant',
    accountSlug: 'hormel-foods',
    assetPath: '/for/hormel-foods/will-bonifant',
    assetLabel: 'Hormel Foods brief',
    previewEyebrow: 'Private brief for Will',
    previewTitle: 'Where plant standardization still breaks',
    previewText: 'A short Hormel brief on the yard routines that still stay local plant to plant.',
    previewTags: ['40+ facilities', 'Plant variance', 'CSCO lens'],
    subject: 'Will, one Hormel yard question',
    body: [
      'Hi Will,',
      'Quick note. I may be wrong, but if Hormel still has plant by plant yard routines, that is probably where standardization breaks first.',
      'I put the short version here.',
      `${BASE}/for/hormel-foods/will-bonifant`,
      'If it is off, tell me where.',
      'Casey',
    ],
  },
];