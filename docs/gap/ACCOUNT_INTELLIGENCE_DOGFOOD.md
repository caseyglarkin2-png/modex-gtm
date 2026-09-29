# Account Intelligence dogfood (Releases H, J-M)

STATUS: SHIPPED 2026-09-29

<!-- verified:2026-09-29 -->

This was a read-only run against production using `scripts/gap/dogfood-intel.ts`. Nothing was drafted, sent, created or changed.

- **BEFORE** is what GAP showed before this program (or earlier in it).
- **AFTER** is the brief on the final code.
- **DECISION CHANGE** is what Casey would now do differently.

## Final closeout dogfood (Releases J-M + red team, production)

Read-only, production `/gap/accounts/*` through the rig session, plus the candidate queue. No sends, no drafts, no
account created, no HubSpot writes. Candidate verdicts are Scout research rows (company level).

| | Account | Entity type | YardFlow fit | Physical network | Corporate family | Commercial conflict | Research state | Next human action |
|---|---|---|---|---|---|---|---|---|
| A | General Mills | manufacturer | Direct buyer | 28 US plants (FY2025 10-K) | None known | None (no open deal) | First touch ready: research held | Review the thesis and the first touch to the primary person |
| B | Crowley | Type unknown | Direct buyer (8 audited self-operated sites) | 8 sites audited | None known | Open deals (Pilot, Network) | In a deal: no cold research | Work the deal: the Deal brief objective |
| B | Lineage Logistics (MMYQB) | 3PL | Direct buyer (Scout, grounded) | cited cold-storage warehouses | n/a (candidate) | none | Scouted | ADD / MAP on /gap/candidates |
| C | FreightWaves | vendor | Partner / channel | none | n/a | none | Scouted | Partner conversation or ignore |
| C | American Logistics, Inc. | freight broker | Not a fit (no cited physical operation) | none | n/a | none | Scouted (gateway) | Ignore |
| D | Frito-Lay | manufacturer | Direct buyer | 28 sites audited | Parent: PepsiCo · No related GAP activity | none live in the family | Catalysts research offered | Deepen catalysts |
| D | PepsiCo | Type unknown | Direct buyer (30 self-operated sites) | 30 sites audited | Subsidiaries: Frito-Lay · No related GAP activity | none | Identity Scout offered (type only) | Draft and review a grounded thesis |
| E | Lineage Logistics / FedEx Supply Chain / DTX Trans | 3PL / 3PL / carrier | Direct buyer | cited | n/a | none | Scouted | Casey's ADD / MAP |
| F | Kroger | Type unknown | Direct buyer (62 facilities, 10-K) | 62 facilities | None known | Open deal: YardFlow - Kroger | In a deal: no cold research | Work the deal |

BEFORE J-M:
- Crowley, PepsiCo and Kroger read "Fit unknown" because the vertical is Unknown.
- Logistics / carrier names were rejected by name (Lineage Logistics, FedEx Supply Chain).
- Gemini quota stopped Scout.

AFTER:
- Fit comes from operations; the type stays descriptive.
- Every logistics name is checked.
- Scout fails over to the AI Gateway Perplexity search tool. Lineage Logistics came back DIRECT via Gemini; Schneider and 14 more came back via the gateway while Gemini and OpenAI were cooling.

The family hold was proven by unit and route tests:
- PepsiCo active opportunity → Frito-Lay held.
- Separate buying motion scoped with a snapshot.
- A new deal re-holds.

In production, no PepsiCo-family account has live activity today, so the page correctly shows "No related GAP activity" (no hold). FedEx exposed one more case, fixed in PR #322: duplicate CRM shells with no HubSpot company read as unreadable.

## PepsiCo

**BEFORE:** Research led with three keyword-hit drafts (for example, "PEP 10-Q mentions: capital expenditure") as if they were theses.

**First brief:**
- Fact-led on the Gatik quote.
- "Draft a thesis" in the same view.

**AFTER:**
- Motion: *No good motion yet: a verified fact, but no thesis grounded in it (draft and review one first).*
- The approved thesis shows *THESIS NEEDS REVIEW: its fact is no longer live.*
- Gatik is labelled autonomous freight, public mention only. It is never the opener.
- The next question is non-leading: *how do trailers get checked in and found at your plants and DCs today?*
- The 105-facility count is labelled a YardFlow estimate (INFERENCE).

**DECISION CHANGE:** Do not open on the Gatik story. Re-ground or retire the stale approved thesis first. Research technology and freight (the plan offers both; catalysts and footprint are already known).

## General Mills

**BEFORE:** The best fact was a Brazil divestiture EDGAR excerpt.

**AFTER:**
- Best fact: the plant and warehouse network redesign behind Cheerios, Blue Buffalo and Pillsbury.
- Motion: Fact-led to Jonathan Ness (Chief Supply Chain Officer, LIKELY).
- The thesis keeps its label ("Inference: ...").
- Discovery starts at the current state.
- Start site: Cedar Rapids IA, a typical Gate + No GS site rather than the largest.

**DECISION CHANGE:** Work the network-redesign thesis. Ask about the current check-in process before claiming any problem. Keep the audited site names out of the first conversation.

## Kroger (live deal)

**BEFORE:** No account view. The deal existed only in In Deals.

**AFTER:**
- Motion: In a deal, "work it from the deal, never cold."
- The account page shows the Deal Brief: 0 of 6 known, every truth section UNKNOWN, and the next learning objective "learn the problem in their words."
- No research is offered: the plan holds all 7 sections.
- There is no wedge expansion while in the deal.
- "Who probably owns it" no longer picks the sourcing category manager.

**DECISION CHANGE:** Nothing cold. The deal's first job is learning the problem in the buyer's words; the brief now says so in one place.

## Tyson Foods (Inland26 conference)

**First brief:**
- Why-now was a plant closure that put 2,500 people out of work.
- Motion: Fact-led on it.

**AFTER:**
- The sensitive fact never leads. The best fact is the Eagle Mountain case-ready closure tied to the cattle shortage.
- Motion: *Relationship-led: Ryan Heman, Inland26 contact: ask for their perspective. No problem is claimed; GAP drafts nothing until a usable fact and a grounded thesis exist.*

**DECISION CHANGE:** Follow up with the person Casey met at Inland26 as a conversation, not a pitch built on layoffs.

## Hormel Foods (deep microsite account)

**BEFORE:** A priority, microsite-audited account looked ready.

**AFTER:**
- Motion: *No good motion yet: no verified fact and no relationship to open with. Research first (Deepen catalysts on this page).*
- The plan offers catalysts, technology and freight research, plus the buyer questions.
- "Who probably owns it" moved from a supply chain planning lead to the Group VP and Chief Supply Chain Officer.

**DECISION CHANGE:** Do not contact yet. Run DEEPEN on catalysts first.

## FedEx (a 3PL that runs its own yards)

SUPERSEDED BY Release J (entity type != fit). The Release H reading ("not a shipper prospect: work it as a partner")
was the defect this closeout fixed.

**AFTER (J-M):** 3PL / contract logistics · Direct buyer (29 audited self-operated sites). Its duplicate GAP records
(FedEx Services, FedEx Logistics, FedEx Corporation) are held together as the same company, never merged.

**DECISION CHANGE:** A yard pitch to FedEx's own network, not a partner conversation.

## Harbor Foods Group (MMYQB new shipper)

**BEFORE:** The company appeared only as an unplaced MMYQB subscriber's company.

**AFTER:**
- Scout (production): LIKELY ICP, shipper, harborfoods.com, with cited network evidence.
- Read-only creation check: clear in GAP. HubSpot already has "Harbor Foods" (54048857649), so ADD would link it rather than create a second company.

**DECISION CHANGE:** Add it as an account (Casey's click on /gap/candidates) and it lands linked to the existing HubSpot company. Nothing was created during dogfood.
