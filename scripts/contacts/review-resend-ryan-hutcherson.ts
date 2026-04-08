import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'ryan.hutcherson@gapac.com',
    firstName: 'Ryan',
    accountName: 'Georgia Pacific',
    personaName: 'Ryan Hutcherson',
    accountSlug: 'georgia-pacific',
    assetPath: '/for/georgia-pacific/ryan-hutcherson',
    assetLabel: 'Georgia Pacific brief',
    previewEyebrow: 'Private brief for Ryan',
    previewTitle: 'One mill language instead of many',
    previewText: 'A short Georgia Pacific brief on yard metrics that still vary mill to mill.',
    previewTags: ['Mill network', 'Koch discipline', 'Operator brief'],
    subject: 'Ryan, one GP yard question',
    body: [
      'Hi Ryan,',
      'I may be wrong, but it still looks like each mill measures the yard a little differently and the network pays for it.',
      'I put the short version here.',
      `${BASE}/for/georgia-pacific/ryan-hutcherson`,
      'If that is off, tell me where.',
      'Casey',
    ],
  },
];