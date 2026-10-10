# Intelligence briefing preview (intelligence wiring, October 9, 2026)

STATUS: RECEIPT. Rendered 2026-10-10T00:15:22.266Z (2026-10-09 New York) in 13956 ms against production data, READ ONLY: the fixture's records were imported into an in-memory overlay (never the production table), the intelligence was read from the overlay and production together, and every production write was intercepted (listed at the end). Nothing was sent, drafted, enrolled, queued or stored. The plan is the stored day (revision 3, planned 2026-10-09T23:59:48.139Z); Gmail Sent is not read by this process.

## The import (into the overlay)

- 0 accepted, 0 duplicates, 0 revised, 0 invalid of 159 records; by producer: .
- account placement by the existing resolver: 0 resolved, 0 ambiguous, 0 with no account (kept and shown as such).

## Sources: included and unavailable

| Source | In this preview | How |
|---|---|---|
| Freight X Signal Desk | included | 6 reports through 2026-10-09, from the captured snapshot (a bounded thread read); 21 items |
| Yards First Brief | included | 48 reports through 2026-10-09, from the captured snapshot (a bounded thread read); 83 items |
| HubSpot Activity & Engagement report | included | 2 reports through 2026-10-08, from the captured snapshot (a bounded thread read); 3 items |
| GAP's own signals (discovery, shares, Pounce) | included | production rows, 3288 undecided in all, 92 live triggers |
| HubSpot deals (coverage) | included (complete) | the in-deals summary the day builds |
| Clawd signal hunter | unavailable | no export endpoint on the producer yet (IW07 prepared, not deployed) |
| The vault (calls, meetings, next actions) | not in this digest | on the account stories and the people state since the knowledge program; a digest projection is IW06 |
| Gmail Sent | not read | this process has no GAP sender credential; production reads it |
| Skipped captures | n/a | Freight X Signal Desk 697d5918-278 (6500 chars, not a report); Yards First Brief f0fcfe11-119 (294 chars, not a report); Yards First Brief 2138572c-4a2 (98 chars, not a report); HubSpot Activity & Engagement report preview:01a1 (7077 chars, not a report) |

## The digest

- Shown 17 (4 from the briefs, 4 GAP found, 2 triggers; 8 people), 4109 omitted and reachable on the Intelligence page; 5 rotated.
- Subject: GAP today, Fri Oct 9: 13 to execute, 17 to decide [GAP#preview]

| Key | Producer | Account | Title | Truth |
|---|---|---|---|---|
| signal:cmul615nk0001l7041bvnozli | Trucking Dive | PepsiCo | PepsiCo expanding autonomous truck use in its supply chain | verified_fact |
| signal:cmul6drwl0000i304qjn3bdr1 | Food Dive | General Mills | General Mills to build $24M distribution center in Michigan | historical_observation |
| signal:cmurn8upl0002i404zykegis1 | careers.walmart.com | Walmart Inc. | https://careers.walmart.com/us/en/jobs/R-2426277 | unverified_status |
| signal:cmurn8s8n0001i4043qhabxw8 | careers.walmart.com | Walmart Inc. | https://careers.walmart.com/us/en/jobs/R-2547672 | unverified_status |
| trigger:93 | clawd | PepsiCo | PEP 10-Q (2026-10-08) mentions: capital expenditure | unverified_status |
| trigger:92 | clawd | Costco Wholesale (no account yet) | COST 10-K (2026-10-07) mentions: capital expenditure | unverified_status |
| person:craig.morrison@kencogroup.com | inbound | Kenco | Morrison, Craig at Kenco | historical_observation |
| person:ccuebas@lazerlogistics.com | inbound | Lazer Logistics | Cristian Cuebas Morales at Lazer Logistics | historical_observation |
| person:twasson@firecrown.com | inbound | firecrown.com (no account yet) | Thomas Wasson (firecrown.com) | historical_observation |
| person:seb@riserify.com | inbound | riserify.com (no account yet) | Seb Hulme (riserify.com) | historical_observation |
| person:agarcia@exemplifyrisk.com | inbound | exemplifyrisk.com (no account yet) | Arideilys Garcia (exemplifyrisk.com) | historical_observation |

## The email, as text

```text
Good evening. Here is Fri Oct 9 from GAP, in order.
This replays the plan GAP made at 7:59 PM New York on Fri Oct 9, as it stood then; what changed since is on Work, not here.
13 to execute: the plan's items, the same list START and NEXT walk, in this order. 17 to decide: intelligence, counted apart (4190 waiting in all).

Intelligence worth a look (12 of 4121). Any age, for your call; Pursue and GAP develops the angle. 4 from your briefs, 4 found by GAP, 2 triggers, 2 from the vault; 4109 more waiting; 5 shown in an earlier briefing wait behind the unseen.
   Sources: Yards First Brief reports through Oct 9, 2026, imported Oct 9, 2026 (83 items); Freight X Signal Desk reports through Oct 9, 2026, imported Oct 9, 2026 (21 items); HubSpot Activity & Engagement report reports through Oct 8, 2026, imported Oct 9, 2026 (3 items); Clawd signal hunter reports through Oct 10, 2026, imported Oct 9, 2026 (500 items); war_room_dossier reports through Aug 27, 2026, imported Oct 9, 2026 (58 items); the vault reports through Oct 9, 2026, imported Oct 9, 2026 (7434 notes). Every record here is persisted in production; nothing is overlaid. Not read this time: our Gmail Sent (this process has no sender credential; production reads it).
   Everything retained, with filters: https://modex-gtm.vercel.app/gap/intelligence/
- X-Rite: X-Rite: 45-yard shipper network. Clawd signal hunter reported it Oct 10, 2026 (the capture date; the report states none) (relevance 20). Unverified present-day status.
   What was reported: X-Rite: 45-yard shipper network
   In the producer's words: Relevance 20 by Clawd's classifier; not verified by GAP.
   The producer's read (not an obligation): Clawd classified it: facility_expansion, urgency ambient
   Sources: fit_rationale https://xrite.com/.
   Reported Oct 10, 2026 by Clawd signal hunter (the capture date; the report states none); imported Oct 10, 2026.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- No account yet: Kodiak reaches Laredo, but not yet Mexico. Yards First Brief reported it Oct 9, 2026 (NEW). Unverified present-day status. Themes: autonomy, freight.
   What was reported: Kodiak and Charger announced the operation October 8. The first delivery occurred September 8. Kodiak-equipped trucks are moving refrigerated and dry CPG and food-and-beverage freight between Charger terminals in Dallas and Laredo. A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.
   In the producer's words: Score: 28/30, A5 B5 C4 D5 E5 F4. Confidence: HIGH on the supervised operation; LOW on driverless timing and scale. Primary company disclosure plus independent trade coverage, with no operating metrics.
   The producer's read (not an obligation): Why now and buyer read: This is a live operating deployment, not only a pilot announcement. Charger is combining its proprietary TMS, managed transportation, terminals, and automated-driving supplier.
   Sources: Kodiak-Charger announcement https://www.nasdaq.com/press-release/kodiak-ai-and-charger-usa-launch-autonomous-trucking-between-dallas-and-laredo-2026; Truck News https://www.trucknews.com/technology/kodiak-charger-launch-autonomous-freight-service-between-dallas-and-laredo/1003222975/; Laredo trade data https://www.laredoedc.org/site-selection/international-trade/.
   Reported Oct 9, 2026 by Yards First Brief; imported Oct 9, 2026.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- World Market: Jarrod Black — World Market. HubSpot Activity & Engagement report reported it Oct 8, 2026 (active evaluation). Unverified present-day status.
   What was reported: Accepted the demo and Oct. 8 demo-debrief invitation.
   In the producer's words: active evaluation, medium confidence The contact’s company field says World Market, but the company association is not verified.
   The producer's read (not an obligation): Next: prepare a concrete debrief agenda and decision path.
   Sources: HubSpot contact record https://app.hubspot.com/contacts/3819073/record/0-1/252589576372; HubSpot engagement (evidence) https://app.hubspot.com/contacts/3819073/objects/0-49?filters=%5B%7B%22property%22%3A%22hs_object_id%22%2C%22operator%22%3A%22EQ%22%2C%22value%22%3A%22118263986727%22%7D%5D. CRM: hubspot contact 252589576372, hubspot engagement 118263986727.
   Reported Oct 8, 2026 by HubSpot Activity & Engagement report; imported Oct 9, 2026.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- General Motors: General Motors: why now, from the war-room dossier. war_room_dossier reported it Aug 27, 2026 (tam tier A). Unverified present-day status. Themes: digital ops.
   What was reported: In March 2025 GM and NVIDIA announced an Omniverse digital-twin collaboration to build virtual replicas of GM assembly lines for material-handling robotics, transport and precision welding. The twin models the plant; the yards is the part it cannot run, and that gate-to-dock seam is exactly where realized capacity is hiding. GM committed a $4 billion US manufacturing investment over two years, including $2B at Arlington for full-size SUVs and $1.5B at Flint for heavy-duty trucks, and Flint Assembly moves to six days a week from June 2026, so every added shift puts more trucks through the same gates the network runs blind on.
   In the producer's words: A seller-written dossier from the war-room, last changed 2026-08-27; its claims are as written, the sources named but not linked here; intent score 88 (last 2026-06-18); 2 deck views, 0 page visits: engagement context, never buying intent.
   The producer's read (not an obligation): The dossier's one-liner: GM runs two yards inside every plant, parts in and vehicles out, and is publicly rebuilding its factories around an NVIDIA Omniverse digital twin that models the line but cannot run the gate.
   Sources: the for page https://yardflow.ai/for/general-motors; the demo page https://yardflow.ai/demo/general-motors. CRM: war_room dossier general-motors.
   Reported Aug 27, 2026 by war_room_dossier; imported Oct 10, 2026.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- PepsiCo: PepsiCo expanding autonomous truck use in its supply chain. You shared it. Trucking Dive, published Jun 15, 2026. Verified fact. Themes: autonomy. A verified fact is in Research.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- General Mills: General Mills to build $24M distribution center in Michigan. You shared it. Food Dive, published Nov 6, 2013. Historical observation. Themes: network capex.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Walmart Inc.: https://careers.walmart.com/us/en/jobs/R-2426277. You shared it. careers.walmart.com, observed Oct 2, 2026. Unverified present-day status.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Walmart Inc.: https://careers.walmart.com/us/en/jobs/R-2547672. You shared it. careers.walmart.com, observed Oct 2, 2026. Unverified present-day status.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- PepsiCo: PEP 10-Q (2026-10-08) mentions: capital expenditure. clawd, published Oct 8, 2026. Unverified present-day status. Themes: network capex, facility expansion.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Costco Wholesale: COST 10-K (2026-10-07) mentions: capital expenditure. clawd, published Oct 7, 2026. Unverified present-day status. Costco Wholesale is not a GAP account yet. Themes: network capex, facility expansion.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- No account yet: YMX<>FR. A Fireflies call Oct 6, 2026 with jhiller@ymxlogistics.com, on the vault. Unverified present-day status. The summary is advisory; the verbatim is on the note.
   What was reported: Allentown rollout: 12 spotters deployed using Zebra handhelds; V2 hardware review planned in two weeks. Vision platform: Proprietary system supports existing yard software; V0, V1, and V2 deployments are progressing. Location accuracy: Uses roughly 30 variables beyond GPS to validate trailer locations and confidence. Action item (Jake Koppinger): Keep Jeff Hiller updated Action item (Jake Koppinger): Finalize V2 hardware bill
   In the producer's words: The Fireflies summary is advisory and has been seen to hallucinate; the verbatim transcript on the note is the ground truth.
   Reported Oct 6, 2026 by the vault; event date Oct 6, 2026; imported Oct 9, 2026.
   Open Work: https://modex-gtm.vercel.app/gap/
- No account yet: World Market x YardFlow - Demo. A Fireflies call Oct 6, 2026 with jarrod.black@worldmarket.com, on the vault. Unverified present-day status. The summary is advisory; the verbatim is on the note.
   What was reported: Dock Management: Workflow includes driver SMS, dock timers, outbound coordination, and spotter tasking. Operations History: Tasking app tracks trailer history and related dock activities. Unrecorded Item: One system item lacks a matching record; record creation remains open. Action item: (none captured)
   In the producer's words: The Fireflies summary is advisory and has been seen to hallucinate; the verbatim transcript on the note is the ground truth.
   Reported Oct 6, 2026 by the vault; event date Oct 6, 2026; imported Oct 9, 2026.
   Open Work: https://modex-gtm.vercel.app/gap/

Prospects to reengage (5 of 69). They wrote to us and went quiet.
- Kenco: Morrison, Craig at Kenco. Wrote to us Sep 24, 2026 (8 messages), last about "Re: [Caution: External]referral request"; their account is in an open deal (YardFlow - Kenco, Presentation scheduled): work it from the deal; not a GAP contact yet. Previously contacted, a response. Our Sent was not read for this list, so a reply of ours may exist. Review before outreach: purpose unknown: review before any outreach.
   In a deal at Kenco: YardFlow - Kenco (Presentation scheduled). Work it from the deal: https://modex-gtm.vercel.app/gap/accounts/kenco/?view=brief
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Lazer Logistics: Cristian Cuebas Morales at Lazer Logistics. Wrote to us Sep 21, 2026 (1 message), last about "Re: FreightRoll Help On Site Today"; their account is in an open deal (Lazer, Appointment scheduled): work it from the deal; not a GAP contact yet. Previously contacted, a response. Our Sent was not read for this list, so a reply of ours may exist. Review before outreach: purpose unknown: review before any outreach.
   In a deal at Lazer Logistics: Lazer (Appointment scheduled). Work it from the deal: https://modex-gtm.vercel.app/gap/accounts/lazer-logistics/?view=brief
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- firecrown.com: Thomas Wasson (firecrown.com). Wrote to us Sep 18, 2026 (10 messages), last about "Re: Jake BIO and YardFlow Background."; open deal unknown: the person is not placed at an account; not a GAP contact yet. Previously contacted, a response. Our Sent was not read for this list, so a reply of ours may exist.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- riserify.com: Seb Hulme (riserify.com). Wrote to us Sep 15, 2026 (5 messages), last about "Good to connect"; open deal unknown: the person is not placed at an account; not a GAP contact yet. Previously contacted, a response. Our Sent was not read for this list, so a reply of ours may exist.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- exemplifyrisk.com: Arideilys Garcia (exemplifyrisk.com). Wrote to us Sep 14, 2026 (1 message), last about "Re: Email Inquiry - Gold Star Adjusters - Larkin - #HO260036"; open deal unknown: the person is not placed at an account; not a GAP contact yet. Previously contacted, a response. Our Sent was not read for this list, so a reply of ours may exist. Review before outreach: purpose unknown: review before any outreach.
   Decide it on Work: https://modex-gtm.vercel.app/gap/

Pursued (3): what GAP prepared on your decisions.
- Tractor Supply Company: Tractor Supply opens Idaho distribution center with automation, dedicated AI team - Supply Chain Dive. The angle: A report from October 7, 2026, indicates Tractor Supply Company is opening a new distribution center in Idaho with a focus on automation and a dedicated AI team. This suggests a proactive approach to enhancing supply chain efficiency. It's likely their yards, particularly at new facilities, might benefit from standardized driver journeys and optimized dock assignments to unlock hidden production capacity. Roles: VP Supply Chain, Director of Distribution, Director of Operations. Ask: How are you currently managing driver check-in and yard routing at your distribution centers? Proposed: research first. Need to verify if the Idaho DC is operational and what specific automation technologies are being implemented beyond AI.
   Open Work: https://modex-gtm.vercel.app/gap/
- Hormel Foods: Hormel Plans $150M Expansion Project at Iowa Plant. The angle: This 2018 observation about Hormel's expansion project suggests a potential for increased volume and complexity in their yards. Expanding facilities often leads to a greater number of trucks moving through their distribution centers and plants. Without standardized processes, this growth might exacerbate the existing challenges of manual gate check-in, radio dispatching, and tribal knowledge, potentially leading to increased dwell times and hidden lost production capacity in their yards. Who: nicholas schwartz (supply chain planning coe & strategy lead). Ask: How have your yards evolved since the 2018 expansion plans were announced? Proposed: an email.
   Open Hormel Foods: https://modex-gtm.vercel.app/gap/accounts/hormel-foods/
- Kenco: dave.kiesling@kencogroup.com wrote to us. The angle: The undated note from Dave Kiesling suggests Kenco Group might have previously expressed interest in optimizing their yards. This historical observation hints at potential challenges Kenco faces with manual gate check-in, radio dispatching, and tribal knowledge affecting dwell times and dock friction. A conversation could explore how standardizing the driver journey might help unlock hidden production capacity within their yards. Roles: Director of Operations, VP of Supply Chain, Logistics Manager. Ask: How do you currently manage gate check-in and driver communication during busy periods? Proposed: an email. The exact date of the communication is unknown, and it's unclear if Kenco Group has implemented any yard management solutions since this note was written.
   Open Kenco: https://modex-gtm.vercel.app/gap/accounts/kenco/

Begin with item 1, Keurig Dr Pepper: Decide the angle. https://modex-gtm.vercel.app/gap/

Ready to send (1)
6. PepsiCo: Ready for a first touch: Tom Kamantauskas. Tom Kamantauskas (Senior Director - Logistics, Distribution & Transportation). A prepared first touch. Ranked here: a first touch prepared.
   Ready for a first touch: Tom Kamantauskas.
   Next: Prepare the first touch.
   Source: the Work lanes.
   https://modex-gtm.vercel.app/gap/accounts/pepsico

Everything else (5)
1. Keurig Dr Pepper: Decide the angle. A proposal to review. Ranked here: the vault's next action: One DSD or beverage-plant yard, one pilot Brian owns, configured per site so it carves cleanly between Beverage Co and Global Coffee Co, wit, due Jul 17; a decision to review.
   Decide the angle.
   Next: Decide the angle.
   Source: the Work lanes.
   https://modex-gtm.vercel.app/gap/accounts/keurig-dr-pepper
10. Coca-Cola: Decide the angle. A proposal to review. Ranked here: a decision to review.
   Decide the angle.
   Next: Decide the angle.
   Source: the Work lanes.
   https://modex-gtm.vercel.app/gap/accounts/coca-cola
11. Walmart Inc.: Opted out. Tim Cooper. Admin: record it; buyer activity Oct 5; the vault's next action: One regional DC, one pilot: prove the gate-to-dock flow gain at a single site Tim or Hugo owns, then take the number to Montgomery, due Jul 24. Carried from Thu Oct 8.
   Opted out.
   Last: Tim Cooper wrote Oct 5, "Re: Leaving this with you": stop.
   Next: Record the opt-out.
   Source: their email in the GAP mailbox, Oct 5.
   https://modex-gtm.vercel.app/gap/capture?account=Walmart+Inc.&context=email&from=reply%3A1a10c5b93faff47d
12. Gusto: Someone replied. Emily Maja. An old reply to triage (52 days): record what they said or dismiss it; buyer activity Aug 19. Carried from Thu Oct 8.
   Someone replied.
   Last: Emily Maja wrote Aug 18, "Re: Gusto Benefits": Hi Jake, I did let the onboarding advocate know for this to get Casey added. Additionally we need you to review the enrollments <https://app.gusto.com/payroll_a.
   Next: Log what they said.
   Source: their email in the GAP mailbox, Aug 18.
   https://modex-gtm.vercel.app/gap/capture?account=Gusto&person=1751&context=email&from=reply%3A1a016c008b385f38
13. The Boston Beer Company: Someone replied. Savastano, Philip. An old reply to triage (129 days): record what they said or dismiss it; buyer activity Jun 3; the vault's next action: Send the 4 tracked sales docs (Pilot-Program, Pricing-and-Packaging, ROI-One-Pager, Solution-Overview) as tracked links, first stop per [[RE, due yesterday. Carried from Thu Oct 8.
   Someone replied.
   Last: Savastano, Philip wrote Jun 2, "Re: [EXTERNAL] Yard flow insights amid leadership change": Hi. Not sure if would work, feel free to send some info and I’ll take look. Phil.
   Next: Log what they said.
   Source: their email in the GAP mailbox, Jun 2.
   https://modex-gtm.vercel.app/gap/capture?account=The+Boston+Beer+Company&person=980&context=email&from=reply%3A19e8826006435cef

Deals, in one line (7): Crowley (crowley - Pilot: The close date (Sep 29) has passed and the deal is still open. Confirm the real date); GXO Logistics (no activity on the deal in HubSpot since Sep 8 (31 days). Agree the next step, or close it out); Kraft Heinz (no activity on the deal in HubSpot since Sep 8 (31 days). Agree the next step, or close it out); Kroger (the close date (Sep 30) has passed and the deal is still open. Confirm the real date); Boston Beer Company (the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passed, nothing prepared)); Mondelez International (the close date (Sep 30) has passed and the deal is still open. Confirm the real date. Ranked here: deal hygiene only (close date passed, nothing prepared)); Wesco International (no activity on the deal in HubSpot since Sep 9 (30 days). Agree the next step, or close it out). The deal workspace holds the detail.

Carried over: 10 of 13 (10 from Thu Oct 8).

Waiting on them: 0. Parked (research, holds, set aside): 31. Snoozed: 0.
Everything, with what is waiting and parked: https://modex-gtm.vercel.app/gap/

To work from your inbox, reply with START and the first item arrives as its own email. Each item takes APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT or HELP on the first line of your reply.

Sent by GAP at 8:15 PM New York. This is an internal message to you; nothing in it went to a buyer.
```

The HTML body is beside this receipt: docs/gap/INTELLIGENCE_BRIEFING_RECEIPT_2026-10-09-wide.html.

## Named checks (IW14)

- PASS: Kodiak: the development and the supervised-operation caveat are in the text and the HTML (row cmv1mhsg4000r7kg04hx5o97b, resolution needs_account).
- PASS: 7-Eleven: the uncertainty survives (what was not named) (row cmv1mhszl000s7kg0q58ma1bj).
- PASS: Sub-Zero: the engagement record carries contact 250520610151 and engagement 118262547717 (row cmv1mj9ml004c7kg0vfmmwm12, account none (needs_account)).
- PASS: World Market: the record keeps "company association is not verified" and stays unresolved or ambiguous as the resolver says (row cmv1mja8b004d7kg0fv9q87ny, account none (needs_account)).
- PASS: Southern Glazer's: the May out-of-office writer is not a prospect to reengage (availability, parked), and not an intelligence item (people listed: 8).
- PASS: Nothing imported became a plan item or an obligation (13 plan items).
- PASS: No production write (systemConfig.upsert).
- PASS: Approval bindings untouched (no assignment, no approval row written) (systemConfig.upsert).

## Intercepted production writes (proof of read-only)

- systemConfig.upsert

<!-- verified:2026-10-09 -->
