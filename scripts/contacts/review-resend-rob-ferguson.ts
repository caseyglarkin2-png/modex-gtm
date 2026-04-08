import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'rob.ferguson@jmsmucker.com',
    firstName: 'Rob',
    accountName: 'JM Smucker',
    personaName: 'Rob Ferguson',
    accountSlug: 'jm-smucker',
    assetPath: '/for/jm-smucker/rob-ferguson',
    assetLabel: 'JM Smucker brief',
    previewEyebrow: 'Private brief for Rob',
    previewTitle: 'Three supply chains. One yard layer.',
    previewText: 'A short Smucker brief on the yard variance that still sits under the Hostess integration.',
    previewTags: ['Hostess integration', '25+ facilities', 'Yard variance'],
    subject: 'Rob, one Smucker yard question',
    body: [
      'Hi Rob,',
      'My read may be off, but after Hostess it still looks like the yard is where three supply chains act like three supply chains.',
      'I put the short version here.',
      `${BASE}/for/jm-smucker/rob-ferguson`,
      'If it misses, tell me where I am wrong.',
      'Casey',
    ],
  },
];