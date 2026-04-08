import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'troy.retzloff@heb.com',
    firstName: 'Troy',
    accountName: 'H-E-B',
    personaName: 'Troy Retzloff',
    accountSlug: 'h-e-b',
    assetPath: '/for/h-e-b/troy-retzloff',
    assetLabel: 'H-E-B brief',
    previewEyebrow: 'Private brief for Troy',
    previewTitle: 'Where freshness gets taxed before the dock',
    previewText: 'A short H-E-B brief on the yard handoff that burns time before the building ever touches the load.',
    previewTags: ['Freshness', 'Distribution', 'Trailer turns'],
    subject: 'Troy, one H-E-B distribution question',
    body: [
      'Hi Troy,',
      'My hunch may be off, but it still looks like the yard is one place product life and trailer turns get taxed before the dock can fix it.',
      'I put the short version here.',
      `${BASE}/for/h-e-b/troy-retzloff`,
      'If I am wrong, tell me where.',
      'Casey',
    ],
  },
];