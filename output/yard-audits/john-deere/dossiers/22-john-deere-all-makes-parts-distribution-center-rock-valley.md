# Deep-Audit Dossier — idx 22

## John Deere All-Makes Parts Distribution Center — Rock Valley, IA

**Type:** Parts Distribution Center
**Address (roster):** 1300 16th Ave, Rock Valley, IA 51247 — unverified / likely incorrect
**Resolved facility:** John Deere A&I Products complex, SW Rock Valley industrial park (10th St / 22nd Ave)
**Resolved coords:** 43.19680, -96.31370 (center of the A&I warehouse/manufacturing complex)
**Gate verdict:** No truck gate — open, ungated access road
**Guard-shack verdict:** No guard shack
**Confidence:** MEDIUM

---

## Step 0 — Locating the facility

The roster supplied 43.203456, -96.294498 with the note that the street address was "approximate - exact street not confirmed." Probing that point at z14-z17 landed in **downtown Rock Valley** — small-town commercial/residential blocks and grain elevators, with no large distribution warehouse. The supplied coordinates were not the facility.

Research resolved the facility. "John Deere All-Makes Parts Distribution Center, Rock Valley IA" corresponds to **A&I Products** — John Deere's all-makes aftermarket-parts subsidiary:

- A&I Products was **acquired by John Deere on 1 December 2010**.
- Rock Valley is A&I's **corporate HQ, main manufacturing facility, and central distribution hub**.
- The Rock Valley operation runs **750,000+ sq ft of warehouse space** across roughly three connected/adjacent buildings; ~300,000 sq ft has been added since 2001, with a semi-automated conveyor stocking/retrieval system.
- Waze lists "**John Deere A&I Products, 2200-2298 10th St, Rock Valley**"; Yelp lists 1020 22nd Ave for A&I HQ. Both point to the same industrial-park complex SW of downtown.

Satellite probing of the SW Rock Valley industrial park located a cluster of large white/gray warehouse + manufacturing buildings around a central courtyard. Street View (2025-08) confirmed the industrial character and showed an **XPO Logistics** office sign on one building — XPO appears to provide 3PL services on site. Locked center: **43.19680, -96.31370**.

The roster address "1300 16th Ave" could not be matched to any building and is treated as incorrect.

## Imagery findings

| View | Zoom | What it showed |
|------|------|----------------|
| Roster point | 14-17 | Downtown Rock Valley — not the DC. Rejected. |
| SW industrial park | 16-17 | Cluster of large warehouse/manufacturing buildings — the A&I complex. |
| Complex overview | 18 | ~3 connected/adjacent buildings forming an L-shape around a central courtyard apron; employee parking SW; open access road off 10th St. |
| Courtyard / docks | 19-20 | Dock and overhead doors facing the courtyard; a modest number of trailers in the apron. |
| Street View x6 | 2025-08 | Open access road into the complex; warehouses both sides; drive-in overhead doors and a few dock-height positions; no fence, no gate, no booth. |

## Gate / guard-shack / dock determinations

**Truck gate — FALSE.** The complex is entered via an open road off 10th St that runs into the central courtyard. Multiple 2025-08 Street View captures — taken from inside the complex and from 10th St — show **no barrier arm, no sliding/swing gate, no checkpoint pinch-point**, and no perimeter fence. Access is fully open.

**Guard shack — FALSE.** No staffed booth (1-3-vehicle footprint, multi-side windows) anywhere near the entrance in any Street View heading.

**remoteGs — FALSE.** Requires a truck gate; there is none.

**Docks — "10-25" (medium/low confidence).** The complex loads via a mix of dock-height doors and truck-level overhead drive-in doors facing the central courtyard and the access road. Street View confirms several dock and overhead positions; overhead imagery is consistent with roughly 12-20 doors. As a manufacturing + distribution facility (not a high-bay cross-dock), the count is moderate. Flagged uncertain.

**Drop area — "0-10", dropYard = false.** No large dedicated marked drop-trailer lot. A modest number of trailers park in the courtyard apron.

## Yard zones and counts

- **perimeter** — the owner-occupied A&I parcel: roughly 43.1952-43.1985 N-S, -96.3152 to -96.3122 E-W (~22 acres). The parcel is not visibly fenced, so the box is an estimate.
- **truckGate** — the open access-road entrance off 10th St.
- **dropYards** — none (empty array).
- **dockAprons** — one box: the central courtyard apron serving the dock/overhead doors.
- **staging** — the central courtyard (doubles as internal staging).
- **yardMetrics** — ~16 dock doors; ~8 trailers visible; ~12 trailer capacity; 1 truck gate; 3 buildings; ~22 acres; no rail.

Other flags: `multipleFacilities = true` (~3-building campus). `postGateStaging = true` and `drivewayLong = true` (long access road + large courtyard apron). `entryExitTogether = true` (single access road). `fastLaneOpportunity = false`. `shipRcvSeparate = false`, `scale = false`, `multiStep = false`, `railServed = false`.

## Setting

`urbanRural = Rural` — Rock Valley is a small NW-Iowa town (~3,800 population); the complex sits in a small-town industrial park ringed by farmland. `connectivityIssue = false` at medium confidence (the site is inside a built-up industrial park, so cellular coverage is likely adequate).

## Web findings

- A&I Products "Who we are" page and PitchBook — A&I is the all-makes aftermarket-parts company; Rock Valley HQ + central distribution hub; 750,000+ sq ft.
- Multiple sources — John Deere acquired A&I Products in December 2010.
- Waze — "John Deere A&I Products, 2200-2298 10th St, Rock Valley."
- Welter Storage — completed conveyor project at A&I Products, Rock Valley (semi-automated parts handling).

## Final confidence

**MEDIUM.** The facility is positively resolved (A&I Products = John Deere's all-makes parts arm; correct industrial complex confirmed by satellite + Street View + multiple address records). The gate / guard-shack determinations are HIGH-confidence (clear 2025-08 Street View). Confidence is held at MEDIUM overall because the roster address was wrong, the parcel is not fenced (perimeter is an estimate), and the dock-door / trailer counts on a compact manufacturing-plus-distribution campus are moderate-confidence estimates from overhead imagery.
