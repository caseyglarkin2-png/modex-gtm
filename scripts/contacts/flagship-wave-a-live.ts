/**
 * Actual live Wave A after current unsubscribe filtering.
 *
 * This is the manifest to send first once the pages are deployed.
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
];