# Deep-Audit Dossier — Constellation Beer DC, Wilmer/Hutchins TX (idx 02)

## Facility
- **Name:** Constellation Beer DC - Wilmer TX (Dallas I-45)
- **Type:** Distribution Center (beer cross-dock, rail-served)
- **Roster address:** "I-45 corridor / southern Dallas County, Wilmer, TX (approx.)"
- **Actual operating address:** 1401 W Wintergreen Rd, Hutchins, TX 75141
- **Operator:** Biagi Bros (3PL handling Constellation beer distribution)
- **Roster source:** Good Beer Hunting Sightlines 2016 + Biagi Bros / Evans GC —
  450–475K sq ft build-to-suit cross-dock, rail-served, 24 rail + 64 truck dock doors.

## Step 0 — Location confirmation
The roster geocode (32.589661, -96.678392) was the **geometric center of the city of
Wilmer** (moved only 2 m from a city-level start) — roughly 5 km from the real building.
Web research resolved the actual facility:

- Biagi Bros' own website lists their Dallas-area warehouse as **1401 W Wintergreen Rd,
  Hutchins, TX 75141** — a 450,000 SF facility with 60 truck doors, "south of Dallas at
  I-20 and I-45."
- Evans General Contractors' project page describes the Biagi Brothers building as a
  "475,000 SF cross dock build-to-suit facility for the distribution of Constellation
  brand beer... rail served... can unload four thirty-car trains at once."
- Good Beer Hunting (2016) confirms Biagi co-operates the Constellation beer DC in the
  I-45 corridor near Dallas.
- Nominatim geocoded W Wintergreen Rd to ~32.6185, -96.7301; satellite probing located
  the building just NW of that point.

**Locked center:** 32.62120, -96.72950 (building centroid). Hutchins is immediately
adjacent to Wilmer in the same I-45/I-20 logistics corridor — the roster's "Wilmer"
label is geographically close but the precise site is in Hutchins.

## Key views
- **z17 overview:** A single long rectangular cross-dock building oriented NE–SW. A wide
  concrete truck court and trailer-parking apron run along the SE face; the NW face
  fronts a rail line and an access road.
- **z18–z20 docks:** Dock doors with trailers backed in along **both** long faces — the
  SE apron (truck distribution side, dozens of trailers, some with tractors = live
  loads) and the NW face (rail-side). Confirms a true cross-dock layout.
- **z19/z20 NW corner:** A rail track runs immediately along the NW edge of the building
  with the NW dock strip configured for rail-side handling. No crisp spur curving into
  the footprint is resolved, but the rail-adjacent dock arrangement corroborates the
  rail-served description.
- **z19/z20 SW end:** Employee car parking and the main driveway off W Wintergreen Rd.
  No barrier-arm or sliding gate clearly visible at the property entrance.
- **Street View (2026-02):** Ground-level views from W Wintergreen Rd confirm the
  operating long warehouse with a full dock face of trailers; some adjacent construction
  activity (cranes) visible nearby.

## Gate / guard-shack / dock determinations
- **truckGate:** FALSE (flagged uncertain). The SW-end driveway off W Wintergreen Rd
  appears open in imagery; no barrier arm / sliding gate resolvable. A 3PL beer DC of
  this class typically controls its entrance, so a gate may exist but cannot be
  confirmed from current imagery.
- **guardShack:** FALSE (uncertain). No guard booth resolvable at the entrance.
- **remoteGs:** FALSE — depends on a confirmed gate, which is not established.
- **dockDoors:** "50+" band. Roster cites 64 truck + 24 rail doors; trailer counts on
  both faces are consistent. Exact overhead count not verifiable — flagged uncertain.
- **shipRcvSeparate:** TRUE — distinct dock banks on two separate building faces
  (SE truck apron vs. NW rail-side face).

## Yard zones & counts
- **perimeter:** ~591 m × ~501 m box around the building, truck court, trailer apron
  and rail-side strip — ~41 acres operational footprint.
- **truckGate zone:** SW-end driveway / entrance area off W Wintergreen Rd.
- **dropYards:** One striped trailer-parking apron on the SE side.
- **dockAprons:** Two — the SE truck apron and the NW rail-side dock strip.
- **staging:** Left null — no distinct pre-gate staging area resolved.
- **yardMetrics:** dockDoorCount ~64, trailersVisible ~55, trailerParkingCapacity ~80,
  buildingCount 1, siteAreaAcres ~41, railServed true (rail line along NW face;
  roster-documented rail-served build-to-suit).

## Web findings
- Biagi Bros, Evans General Contractors, and Good Beer Hunting all corroborate this as
  the Constellation beer cross-dock operated by 3PL Biagi Bros in the Dallas I-45/I-20
  corridor. RealtyTrac shows the building lot at ~33.7 acres.

## Final confidence
**MEDIUM.** Building identity and cross-dock layout are well established and confirmed
by current (2026-02) imagery. Gate/guard-shack determinations are limited by satellite
resolution, and the exact rail-spur configuration is not crisply resolved — these are
flagged uncertain.

## 3-line summary
- Gate verdict: NO truck gate visible (entrance appears open); uncertain — gate may exist.
- Guard-shack verdict: NO guard shack resolvable; uncertain.
- Confidence: MEDIUM — facility ID and cross-dock layout solid; gate/rail details soft.
