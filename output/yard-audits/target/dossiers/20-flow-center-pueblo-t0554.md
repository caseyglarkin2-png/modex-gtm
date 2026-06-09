# Deep-Audit Dossier — Target Flow Center Pueblo (T0554)

- **Facility:** Target Flow Center Pueblo (T0554)
- **Type:** Flow Center / regional distribution center
- **Address:** 34800 United Ave, Pueblo, CO 81001
- **Resolved center:** 38.279662, -104.467883 (geocoded point landed correctly on the main building)
- **Confidence:** medium
- **Method:** deep-audit (satellite z15-z21 + Street View, 2022-10 panos)

## Location confirmation
The geocoded coordinates landed directly on a very large white-roofed
distribution building. Web search confirms this is **Target's Pueblo
distribution center, 34800 (E) United Ave, Pueblo CO 81001** — a 24/7 operation
with ~600 staff and ~$61.8M reported volume (Pueblo Latino Chamber / CMac /
BBB listings). Building footprint (>1,000 ft long), extensive dock banks, and a
massive trailer drop yard are all consistent with a Target regional/flow
center. No neighboring-building ambiguity: the smaller buildings to the NW and
SW are separate, far smaller structures across United Ave / setbacks. The point
was used as-is for the audit center.

## Key views and what they showed
- **wide z16 / context z15 / full z16:** Single dominant DC building running
  roughly WNW-ESE, slightly rotated off north. United Ave runs along the north
  side; US-50 (divided, limited-access) runs along the south. Employee parking
  lot at the NW; enormous trailer yard filling the east and SE.
- **z17/z18 overviews:** East face = continuous dock bank with trailers backed
  in; south face = second dock bank with trailers; SE = double-row trailer
  storage yard (drop yard).
- **z19/z20 yard crops:** Confirmed 200+ parked trailers in tidy rows across the
  east and SE yard — a large dedicated drop/storage yard.
- **Street View (United Ave, 2022-10):**
  - W/E panos along United Ave show the tan metal-clad DC wall on the south side
    of the road behind a grass setback and a **continuous chain-link perimeter
    fence**.
  - Pano @ 38.2826,-104.4660 (heading 180) looks across the fence into the
    trailer yard (orange Schneider trailers backed to docks) — fence + gate
    posts visible across the front.
  - **Pano C-dKnSGksGFHPLIOjkSgIw @ 38.28266,-104.46504** is the truck entrance:
    looking SW (heading ~191-200) it shows the wide lane-marked entrance apron,
    bobtail/tractor staging on the left, and the fenced trailer yard on the
    right — the frame an arriving driver sees.
  - NW panos show the building corner, a cylindrical fire-water tank, the
    employee/visitor lot, and a **red Target logo sign** behind the fence.

## Gate / guard-shack / remote determinations
- **truckGate = TRUE (high confidence).** Fully fenced facility — continuous
  chain-link perimeter confirmed in 6+ independent Street-View frames. A wide,
  lane-marked truck entrance/exit apron opens off United Ave at the NE
  (~38.2827,-104.4650) with tractor staging. United Ave is the only public road
  touching the property; the south side fronts limited-access US-50 with no
  driveway. This is a controlled, fenced entrance, not an open driveway.
- **guardShack = TRUE (medium confidence).** Operationally this is a 24/7 Target
  regional DC (~600 staff) — these run staffed gates. A small checkpoint-style
  structure sits at the south yard edge (~38.2768,-104.4666). The main north
  entrance apron in the 2022 imagery is open to the road with the security
  gate/booth set back inside the fence; overhead resolution did not crisply
  isolate the booth at the throat, so this call is medium confidence and flagged
  in `uncertainFields`.
- **remoteGs = FALSE.** A staffed booth is the most likely control given the
  facility class; not a kiosk/app-only check-in. (False because guardShack=true.)

## Yard zones and counts (estimates from overhead imagery)
- **Perimeter:** ~82 acres (oriented 6-vertex ring tracing the fenced
  operational area: building + parking + east/SE trailer yard).
- **Drop yards:** two rings — the large east/north trailer-storage block and the
  SE block. 200+ trailers visible; ~300 trailer-stall capacity.
- **Dock aprons:** east-face apron (long thin quad hugging the east wall) and a
  south-face apron — two distinct dock banks → `shipRcvSeparate` likely true.
- **Truck gate:** single combined entry/exit apron at the NE off United Ave.
- **Staging:** pre/post-gate paved staging present (tractor staging outside +
  large paved apron inside the gate → drivewayLong, fastLaneOpportunity).
- **dockDoorCount ≈ 120** (east + south banks); **truckGateCount = 1**;
  **buildingCount = 1**; **railServed = false** (no spur into the property).

## Web findings
- Pueblo Latino Chamber / CMac.ws / BBB: Target Distribution Center, United Ave,
  Pueblo CO 81001; open 24/7; ~600 staff; ~$61.8M volume; phone 719-948-3031.
  Confirms a major, staffed, around-the-clock distribution operation.

## Final confidence
**medium** — facility identity and location are certain and gate/fence/dock/
drop-yard structure is clearly visible. Guard-shack booth and exact entry/exit
lane counts are inferred from operational class + partial imagery rather than a
crisp top-down of the booth, so the audit is held at medium with those fields
flagged.

### 3-line summary
- Gate: TRUE — fully fenced major Target DC, lane-marked truck entrance apron off United Ave (sole public road; US-50 is limited-access).
- Guard shack: TRUE (medium) — 24/7 staffed DC with a south-yard checkpoint structure; booth set back inside the gate, not crisply resolved overhead. remoteGs=false.
- Confidence: medium.
