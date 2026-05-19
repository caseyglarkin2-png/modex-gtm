# Deep-Audit Dossier — Coca-Cola Mobile Production Center (idx 5)

## Facility
- **Name (roster):** Coca-Cola Consolidated - Mobile Production Center, AL
- **Type:** Bottling / Manufacturing Plant
- **Roster address (incorrect):** 6350 Rangeline Rd, Mobile, AL 36582
- **Corrected address:** 5300 Coca-Cola Rd, Mobile, AL 36619 (Tillmans Corner)
- **Operator (corrected):** Coca-Cola Bottling Company UNITED, Inc.
- **Locked coordinates:** 30.58700, -88.16800

## Step 0 — Location correction
The roster geocode (30.555828, -88.123576) landed in a small-commercial area
near I-10 with no facility matching a Coca-Cola production center. Web research
established that the Mobile Coca-Cola facility is operated by Coca-Cola UNITED
(not Consolidated) and that its production/distribution hub is at 5300
Coca-Cola Rd, Mobile AL 36619 (the Coca-Cola UNITED Mobile location page gives
30.5851, -88.1688). Satellite probes confirmed a large white-roofed
production/warehouse complex with employee parking, trailer yard and a red
Coca-Cola sign visible in Street View. Audited at the corrected location.

## Key views
- **z17/z18 overview:** Large connected white-roofed building complex
  (production + warehouse) with a separate office building, extensive paved
  parking and yard, and ongoing expansion/construction on the east side.
- **z19/z20 entrance:** Internal access road off Coca-Cola Rd; office building
  and warehouse; ornamental metal perimeter fence visible.
- **Street View (2018-2023):** Red Coca-Cola sign on a pole at the entrance;
  ornamental fence enclosing the property.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain).** The property is enclosed by an ornamental
  perimeter fence; access is via Coca-Cola Rd. A controlled entry is implied but
  no formal checkpoint structure is clearly visible — flagged uncertain.
- **guardShack = false.** No guard booth identified.
- **remoteGs = true.** Set on the assumption of a fenced controlled entry
  without a staffed booth (kiosk / call-box check-in).
- **dockDoors = 10-25.** Production + distribution hub; ~22 doors estimated
  across the building faces; imagery shows active expansion so counts are
  approximate.
- **dropYard = true.** Paved trailer yard on the east/north side.

## Yard zones and counts
- **Perimeter:** ~38 acres.
- **Drop yard:** Paved trailer parking east/north of the buildings; ~15
  trailers visible, paved capacity ~50.
- **truckGateCount:** 1.
- **buildingCount:** ~3 (production + warehouse + office).
- **railServed = false.**

## Web findings
Coca-Cola UNITED acquired the Mobile production facility and distribution
territory in October 2017. In 2021 it announced a $48M expansion (120,000 sq ft
warehouse addition, Vertique case-picking system), completed ~end of 2022. The
facility has 300+ employees, produces 13M+ cases annually, and serves ~3,300
customers along the Gulf Coast.

## Final confidence
**Medium.** Location corrected and confirmed (operator is Coca-Cola UNITED, not
Consolidated; correct address 5300 Coca-Cola Rd). Building complex, fencing and
trailer yard are clear, but the gate/guard-shack determination and dock counts
are uncertain due to internal access and active construction in the imagery.
