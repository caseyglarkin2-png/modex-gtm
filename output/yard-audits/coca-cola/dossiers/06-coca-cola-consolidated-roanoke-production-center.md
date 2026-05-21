# Deep-Audit Dossier — Coca-Cola Consolidated Roanoke Production Center (idx 6)

## Facility
- **Name:** Coca-Cola Consolidated - Roanoke Production Center, VA
- **Type:** Bottling / Manufacturing Plant
- **Roster address (incorrect):** 2001 Towne Square Blvd NW, Roanoke, VA 24012
- **Corrected address:** 235 Shenandoah Ave NW, Roanoke, VA 24016
- **Locked coordinates:** 37.27550, -79.94830

## Step 0 — Location correction
The roster geocode (37.317912, -79.9677) landed at the Valley View Mall retail
area near the airport ("Towne Square Blvd" is a shopping-center address) — not
a production facility. Web research (Yelp, TruckMap, BBB, Waze) established the
actual Coca-Cola Consolidated Roanoke production/distribution facility at 235
Shenandoah Ave NW, Roanoke VA 24016 (37.27386, -79.94698). Satellite probes
confirmed a large white-roofed production building with an extensive trailer
yard; Street View shows Red Classic trailers (Coca-Cola Consolidated's
logistics fleet) and chain-link perimeter fencing — positively confirming the
facility. Audited at the corrected location.

## Key views
- **z17/z18 overview:** Large white-roofed production building plus connected
  warehouse/ancillary buildings; extensive diagonal trailer-stall yard filling
  the center/west of the property; a rail yard runs to the south.
- **z19/z20 entrance:** Chain-link perimeter fence along Shenandoah Ave; trailer
  yard fronts the road; driveway gate openings into the yard.
- **Street View (2019-2023):** Red Classic and Coca-Cola trailers parked in the
  fenced yard; chain-link fencing along the road; dense urban industrial
  surroundings.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain).** The trailer yard is fully enclosed by a
  chain-link perimeter fence with a driveway gate; controlled entry. No formal
  guard booth structure is visible — flagged uncertain.
- **guardShack = false.** No staffed booth identified at the entrance.
- **remoteGs = true.** Fenced controlled entry without a visible booth implies
  kiosk / remote check-in.
- **dockDoors = 25-50.** Dock banks on the production/warehouse building faces,
  ~30 doors estimated.
- **dropYard = true.** Very extensive on-site trailer yard, ~70 trailers
  visible.

## Yard zones and counts
- **Perimeter:** ~28 acres.
- **Drop yard:** Large diagonal-stall trailer yard, ~70 trailers visible,
  capacity ~90.
- **Dock apron:** Production/warehouse building faces on the east side.
- **truckGateCount:** 1.
- **buildingCount:** ~4 (production building + warehouse + ancillary; campus →
  multipleFacilities = true).
- **railServed = false** — rail yard runs south of the property but no clear
  spur enters the facility.

## Web findings
Coca-Cola Bottling Co. Consolidated operates a 330,000 sq ft Roanoke
manufacturing facility (316,000 sq ft per a 2003 SEC 10-K) with ~180 team
members. Listed among Coca-Cola Consolidated's manufacturing facilities; Red
Classic logistics trailers confirm the Consolidated affiliation.

## Final confidence
**Medium.** Location corrected and confirmed by signage (Red Classic fleet),
fencing and imagery. Production building, trailer yard and dock banks are
clear, but the truck-gate / guard-shack determination is uncertain because no
formal staffed checkpoint is visible at the fenced yard entrance.
