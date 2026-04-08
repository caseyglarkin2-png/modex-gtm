import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'john.deaton@homedepot.com',
    firstName: 'John',
    accountName: 'The Home Depot',
    personaName: 'John Deaton',
    accountSlug: 'the-home-depot',
    assetPath: '/for/the-home-depot/john-deaton',
    assetLabel: 'Home Depot brief',
    previewEyebrow: 'Private brief for John',
    previewTitle: 'Where a 200-plus site network still runs local',
    previewText: 'A short Home Depot brief on the yard layer that still varies site to site.',
    previewTags: ['200+ facilities', 'Site variance', 'MODEX timing'],
    subject: 'John, a short Home Depot yard note',
    body: [
      'Hi John,',
      'Short note. The question I keep coming back to is whether a network this large can still afford site by site yard variance.',
      'I put the short version here.',
      `${BASE}/for/the-home-depot/john-deaton`,
      'If it is off, I would value the correction.',
      'Casey',
    ],
  },
];