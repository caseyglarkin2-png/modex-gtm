# Deep-Audit Dossier — idx 17

## KDP Distribution Center — Jacksonville, FL

**Roster address:** 3800 Fairchild St, Jacksonville, FL 32254 ("Verified street address" — INCORRECT)
**Resolved facility:** **2300 Pickettville Rd, Jacksonville, FL 32220**
**Resolved center:** 30.3522, -81.76505
**Type:** Distribution Center — Beverage
**Confidence:** High

---

## Step 0 — Locating the facility

The roster's geocoded ROOFTOP point (3800 Fairchild St) landed on a dirt-road
salvage/junk yard. The Florida Parcels record for that parcel (ID 0839720000R)
confirms it is a 5.95-acre lot owned by "First Global Import and Export,"
land-use class "Commercial (Open storage, junk yards, auto wrecking, equipment
and material storage)." The Dr Pepper Snapple business-directory listing at
that address is a stale/incorrect entry.

The real KDP Jacksonville distribution operation is at **2300 Pickettville Rd,
Jacksonville FL 32220** (coords 30.3522,-81.76505), confirmed by:
- Street View: a large KDP brand mural (A&W, RC Cola, Snapple, etc.) painted on
  the building's east wall.
- A "Keurig Dr Pepper — Visitor & Vendor Entrance" sign at the truck gate.
- Leasing records: 598,587 sq ft cross-dock DC built 2009 (former Hillwood spec
  building), KDP's southeast distribution hub, 32' clear height.

## Key views

- **Wide satellite (z16-17):** Single very large rectangular warehouse with
  dock doors and backed-in trailers on BOTH long faces (cross-dock). Drainage
  canal/retention ponds on the west/southwest; rail line further west across
  the canal; Pickettville Rd on the east; I-10 beyond.
- **Tight satellite (z18-20):** Continuous rows of dock doors with 53' trailers
  backed in along the east and west faces; deep concrete aprons; a large
  trailer storage yard off the north end.
- **Street View (Pickettville Rd, 2025):** KDP brand mural on the wall; the
  truck entrance driveway is painted "GATE 2" with a sliding chain-link gate
  and a KDP visitor/vendor sign.

## Gate / guard-shack / dock determinations

- **truckGate: true** — Driveway painted "GATE 2," sliding chain-link gate
  across the truck lane, perimeter fencing with hedge. Gate numbering implies
  at least two truck gates.
- **guardShack: false** — No clearly staffed multi-window guard booth at the
  Gate 2 entrance in 2025 Street View; a small gate-control kiosk sits beside
  the lane. Flagged uncertain.
- **remoteGs: true** — Gate present, no staffed shack → kiosk / remote check-in.
- **dockDoors: 50+** — Leasing records cite 128 dock doors; trailers backed in
  along both long faces confirm a very large dock count.
- **shipRcvSeparate: true** — Distinct dock banks on the east and west faces
  (classic cross-dock).
- **dropYard / dropArea 50+** — Trailer staging along both aprons plus a large
  dedicated trailer parking yard (~118 trailer capacity per records).
- **fastLaneOpportunity: true** — Wide entry apron and deep dock aprons (3+
  truck stacking) leave room for an express/bypass lane.

## Yard zones and counts

- **Perimeter:** ~610 m N-S x ~300 m E-W, ~45.2 acres.
- **Truck gate:** Gate 2 driveway off Pickettville Rd, ~30.3513,-81.7641.
- **Drop yard:** trailer storage yard off the north end.
- **Dock aprons:** east apron (Pickettville side) and west apron (canal side).
- **Staging:** paved area inside the gate before the dock face.
- **yardMetrics:** dockDoorCount 128 (from records), trailersVisible ~110,
  trailerParkingCapacity 118, truckGateCount 2, buildingCount 1,
  siteAreaAcres 45.2, railServed false.

## Web findings

- 2300 Pickettville Rd: 598,587 sq ft DC built 2009 by Hillwood (spec center);
  KDP consolidated several Jacksonville operations here; 32' clear, 128 dock
  doors, 326 car spaces, 118 trailer spaces.
- Property sold for $60.7M (Hillwood → EQT/Exeter); KDP remains the tenant.
- Functions as KDP's southeast distribution hub; appointments required, entry
  security present (consistent with the observed gate).

## Final confidence: High

Facility positively identified by on-building KDP branding and KDP entrance
signage; size and dock counts corroborated by leasing records. Only the
guard-shack/remote-check-in distinction is uncertain (small kiosk vs. staffed
booth not fully resolvable from imagery).
