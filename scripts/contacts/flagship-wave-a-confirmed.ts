/**
 * High-confidence Wave A for immediate distribution after page deploy.
 *
 * Selection rule:
 * - Account route is already in the send-now lane
 * - Email is either verified in DB or has later successful send history
 * - Copy points to the highest-confidence finished asset available today
 */

import type { BatchContact } from '../batch-send-gmail';

const BASE = 'https://modex-gtm.vercel.app';

export const CONTACTS: BatchContact[] = [
  {
    to: 'jonathan.ness@genmills.com',
    firstName: 'Jonathan',
    accountName: 'General Mills',
    personaName: 'Jonathan Ness',
    accountSlug: 'general-mills',
    assetPath: '/proposal/general-mills',
    assetLabel: 'General Mills proposal',
    subject: 'General Mills yard execution proposal',
    body: [
      'Jonathan,',
      'The more I look at the General Mills network, the more the same gap shows up. The yard still decides how fast the dock can actually run.',
      'I put the current operator case into one page so your team can review the network math and the execution thesis in one place.',
      `${BASE}/proposal/general-mills`,
      'If it is directionally right, would 15 minutes at MODEX make sense?',
      'Casey',
    ],
  },
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
    to: 'paul.gallagher@genmills.com',
    firstName: 'Paul',
    accountName: 'General Mills',
    personaName: 'Paul Gallagher',
    accountSlug: 'general-mills',
    assetPath: '/proposal/general-mills',
    assetLabel: 'General Mills proposal',
    subject: 'General Mills yard math before MODEX',
    body: [
      'Paul,',
      'I tightened the General Mills operator brief into a cleaner proposal view. It is the fastest way to see how the yard constraint shows up across the network.',
      `${BASE}/proposal/general-mills`,
      'Worth 15 minutes at MODEX if the logic tracks?',
      'Casey',
    ],
  },
  {
    to: 'bob.fanslow@pepsico.com',
    firstName: 'Bob',
    accountName: 'Frito-Lay',
    personaName: 'Bob Fanslow',
    accountSlug: 'frito-lay',
    assetPath: '/for/frito-lay/bob-fanslow',
    assetLabel: 'Bob Fanslow brief',
    subject: 'Bob, Frito-Lay still breaks at the yard',
    body: [
      'Bob,',
      'The Frito-Lay network runs too fast for a manual yard. That is the whole case in one sentence.',
      'I put the operator version of that argument here.',
      `${BASE}/for/frito-lay/bob-fanslow`,
      'If it is directionally right, can we grab 15 minutes at MODEX?',
      'Casey',
    ],
  },
  {
    to: 'david.chambers@pepsico.com',
    firstName: 'David',
    accountName: 'Frito-Lay',
    personaName: 'David Chambers',
    accountSlug: 'frito-lay',
    assetPath: '/proposal/frito-lay',
    assetLabel: 'Frito-Lay proposal',
    subject: 'Frito-Lay gate-to-dock proposal',
    body: [
      'David,',
      'The production line is not the slow part. The handoff into the yard still is.',
      'This is the shortest version of the Frito-Lay case with the throughput thesis and the modeled value in one place.',
      `${BASE}/proposal/frito-lay`,
      'Would 15 minutes at MODEX be worth it if the page lines up with what your team sees?',
      'Casey',
    ],
  },
];