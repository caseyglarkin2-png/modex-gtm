/**
 * The Kenco vault and Clawd fixture for the stream-B tests (C14-C25), shaped like the real vault on 2026-10-08: an
 * account note refreshed October 8 with an undated wedge, dated inbox notes with wiki-links, a stale "no associated
 * deal" source line, a modeled prize, a deck-engagement line; the July 16 discovery meeting with verbatim buyer
 * words; the October 7 standup transcript; Craig's person note with a private detail; a Ball Corporation meeting
 * and a stale Dave note at another company (both must stay out); Clawd notes with two wedge versions and a copy.
 */
import type { VaultAdapter } from '@/lib/gap/context/retrieval';

export const NOW = new Date('2026-10-08T15:00:00Z');

export const ACCOUNT = `---
type: account
company: Kenco Logistics
domain: kencogroup.com
prize: $98.9M/yr (modeled)
next_action: Regroup with Craig Morrison and the Kenco contacts the week of 2026-10-12.
next_action_due: 2026-10-15
last_touched: 2026-07-17
last_refreshed: 2026-10-08
---
<!-- seed:auto -->
# Kenco Logistics

## One-line read
Kenco is the largest woman-owned 3PL in North America and sells innovation to its clients out of its Chattanooga Innovation Lab.

## Why now
- Kenco hired Ainsley Williams as VP Automation and Innovation in February 2026.
- Two Kenco leaders, Kristi Montgomery and Tushar Chandrakapure, already opened the YardFlow network deck on May 12, so the buying committee has self-identified its champion.

## YardFlow wedge
You have already automated the four walls with AMRs, but the yards outside the dock still run on spotters and radios. Orchestrate gate-to-dock across your sites.

Proof point: Primo Brands saw plus 5% realized capacity from the driver-journey layer alone.

## Prize (modeled)
Modeled $98.9M/yr, $933.3K/yr, 4 month payback. (Model, not a quote. Label it as such.)

## Sources
- HubSpot company Kenco Logistics id 55608495412: tam_tier A, 64 associated contacts, no associated deal (dealStage null)
- Deck engagement: carousel-deck-visitors-2026-06-11.csv (2 kencogroup.com viewers, 3 views, all 2026-05-12)

<!-- clawd:start -->
## Live signals (clawd, 2026-10-08)
- Outreach state: 1 contact(s) already emailed, last 2026-07-20. Dedup before you send.
<!-- clawd:end -->

## Inbox notes
- 2026-10-07 standup: Kenco looks crowded out by existing vendors (Bird's Eye, possible Highway, Open Dock, Blue Yonder per Casey and Jake, unverified). Casey: Craig owns shunting and spotting. See [[2026-10-07 Sales Standup]], [[Craig Morrison]]. Source: [[2026-10-07-call-sales-standup]].
- 2026-07-29 standup: Today's Kenco call rescheduled to 2026-08-05 (Craig's wife has a pre-op appointment). Source: [[2026-07-29-call-sales-standup]].
- Discovery call held 2026-07-16 with [[Dave Kiesling]] and [[Craig Morrison]]. Real buyer asks are brokerage/custody. Full debrief in [[2026-07-16 Kenco Logistics]]. Source: [[2026-07-16-call-kenco-x-yardflow-discovery]].
- Same-week signal: a separate Ball Corporation call flagged "Kenco interest growing via network connections". Source: [[2026-07-16 Ball Corporation]].
`;

export const MEETING = `---
type: meeting
account: Kenco Logistics
people: [Craig Morrison, Dave Kiesling]
date: 2026-07-16
outcome: Held. Next session Wed 2026-07-29 2-4pm.
---
# Kenco x YardFlow - Discovery (Kenco Logistics)

## Wedge
You have already automated the four walls with AMRs.

## Buyer words (verbatim)
- Dave Kiesling: "We got open dock, we've got Terminal, we got Claris [Kaleris], we've got Blue Yonder's YMS, we've got Bird's Eye... we're all over the place... no real consistency there."
- Craig Morrison: "I'd love to see the case study work on it just because I know the operation real well."
- Craig Morrison: "I have a medical procedure on the 30th so I will dial in."

## Commitments
- [ ]

## What actually happened (2026-07-16, written after the call)
Dave is the sponsor with the brokerage P&L; Craig came from Primo and can check the record himself.
`;

export const BALL = `---
type: meeting
account: Ball Corporation
date: 2026-07-16
---
## Buyer words (verbatim)
- Ball ops lead: "Kenco interest growing via network connections; we hear about Kenco a lot."
`;

export const RAW = `---
type: raw
captured: 2026-10-07
source: fireflies
call_title: Sales Standup
participants: casey@freightroll.com, jake@freightroll.com
---

## Action items

**Casey Larkin**
Regroup with Kenco contacts (51:27)

## Transcript (verbatim)

**Jake Koppinger:** That was sub zero. Good.

**Casey Larkin:** Kenco. Craig owns the shunting and spotting. They have Open Dock and Blue Yonder, and Bird's Eye at the secure yards. Get the blockers on a call.

**Jake Koppinger:** Decisions are made by a committee there.
`;

export const CRAIG = `---
type: person
name: Craig Morrison
company: Kenco Logistics
title: Asset Leader (shuttling and spotting)
role: user
seniority: Director
email: craig.morrison@kencogroup.com
last_touched: 2026-07-16
---
# Craig Morrison

## Why they matter
Kenco's new asset leader. Shuttling and spotting sit under him, which is exactly the scope our product lands in.

Lives in Ohio, works Chattanooga Sunday to Thursday. Has a medical procedure on 2026-07-30, dialing in to the 29th.
`;

export const DAVE = `---
type: person
name: Dave Kiesling
company: Primo Brands
title: VP
---
# Dave
## Why they matter
Wrong company on this stale note.
`;

export const FILES: Record<string, string> = {
  '02_Accounts/Kenco Logistics.md': ACCOUNT,
  '05_Meetings/2026-07-16 Kenco Logistics.md': MEETING,
  '05_Meetings/2026-07-16 Ball Corporation.md': BALL,
  '00_Inbox/raw/2026-10-07-call-sales-standup.md': RAW,
  '03_People/Craig Morrison.md': CRAIG,
  '03_People/Dave Kiesling.md': DAVE,
};

export const vaultOf = (files: Record<string, string>): VaultAdapter => ({ readFile: async (p) => files[p] ?? null });

export const NOTES = ['<strong>Vault wedge (2026-07-11):</strong> Primo proof first, then the committee.', '<strong>Vault wedge (2026-08-07):</strong> Craig is bought in; phase the rollout across ~140 facilities.', '<strong>Vault wedge (2026-07-11):</strong> Primo proof first, then the committee.', 'HubSpot: no associated deal (dealStage null)', 'Deck engagement: 3 views on 2026-05-12 (scanner)'];

export const snapshot = (notes: string[] = NOTES) => ({ found: true, rebuiltAt: '2026-10-08T13:02:52.000Z', reasoningNotes: notes });

export const KENCO = { accountName: 'Kenco Logistics', aliases: ['Kenco'], domain: 'kencogroup.com', now: NOW, otherAccounts: ['Ball Corporation', 'Primo Brands', 'PepsiCo'] };

export const DAVE_EMAIL = 'dave.kiesling@kencogroup.com';
export const ROADMAP = 'We will keep Open Dock at the ungated locations, Birdseye for security and gate automation at the secure yards, and pilot Blue Yonder YMS where the WMS is migrating. Please cancel for now and reconnect toward the end of October during 2027 budgeting.';
