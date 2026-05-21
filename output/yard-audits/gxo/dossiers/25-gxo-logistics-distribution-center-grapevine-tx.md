# Deep-Audit Dossier — GXO Logistics Distribution Center, Grapevine TX

**Roster idx:** 25
**Roster address (approximate, corrected):** 4220 Diplomacy Rd, Grapevine, TX 76051
**Confirmed address:** 2425 Esters Blvd, Grapevine, TX 76051 — "DFW Trade Center VII"
**Type:** Distribution Center (multi-tenant cross-dock warehouse)
**Locked coordinates:** 32.93180, -97.03200
**Method:** deep-audit
**Confidence:** medium

## Location confirmation
The roster's address (4220 Diplomacy Rd) was explicitly flagged as approximate.
Web research (Racklify and multiple warehouse directories) confirms GXO
Logistics' Grapevine operation is at **2425 Esters Blvd, Grapevine, TX 76051**,
known as **DFW Trade Center VII** — a multi-tenant cross-dock distribution
building that GXO shares with ShipBob and Tornado Transport.

Esters Boulevard was geocoded via OpenStreetMap/Nominatim to ~32.9346, -97.0331,
in the International Commerce Park / LINK Logistics business park on DFW Airport
land, beside a major highway interchange. The roster's original pin (32.825,
-97.041) was ~1.2 km away in a different Grapevine industrial park and was
discarded.

DFW Trade Center VII's published profile — cross-dock, ~276,000–298,000 SF,
350-ft building depth, 32-ft clear, ~2,500 SF office — matches the cross-dock
warehouse at the locked coordinates within the park. The exact building unit
could not be read from a sign in imagery, so the building was identified by type
and location.

## Key views
- **Wide satellite (z14–17):** Large speculative-industrial park of uniform
  cross-dock distribution buildings with truck courts and trailer parking,
  beside a freeway interchange. LINK Logistics branding visible on a park
  building.
- **Tight satellite (z18–19):** The audited cross-dock building has dock-door
  banks on both long faces; employee car parking and the office at the SE
  corner; an open truck-court apron along the NW dock face.
- **Street View (multiple frames):** Open parking lots and driveways throughout
  the park; no guard booths or barrier arms at any building entrance.

## Gate / guard-shack / dock determinations
- **truckGate: false** — modern speculative multi-tenant cross-dock building.
  Truck courts on both long faces are open, ungated paved areas; no guard booth
  and no barrier arm/sliding gate observed at any driveway, consistent with the
  uniform character of the surrounding spec-industrial park.
- **guardShack: false** — no booth structure observed anywhere on the property
  or in the park.
- **remoteGs: false** — no controlled gate exists.
- **dockDoors: 50+** — cross-dock building with continuous dock-door banks on
  both long faces; ~70 doors estimated (low confidence on exact count).
- **dropArea: 10-25** — a moderate number of trailer-parking stalls on the
  truck-court aprons (estimate).
- **dropYard: false** — no dedicated separate trailer-storage lot; trailers
  stage on the dock aprons.
- **shipRcvSeparate: true** — cross-dock layout, dock banks on opposite faces.

## Yard zones and counts
- **perimeter:** the GXO/DFW Trade Center VII building parcel — ~19.9 acres from
  the box.
- **truckGate:** open driveway access to the NW truck court (no physical gate).
- **dropYards:** none distinct.
- **dockAprons:** NW long-face apron and SE long-face apron (cross-dock).
- **staging:** none distinct beyond the wide truck courts (postGateStaging).
- **dockDoorCount:** ~70 (estimate). **trailersVisible:** ~12 in captured
  imagery. **trailerParkingCapacity:** ~30. **truckGateCount:** ~2 open
  accesses. **buildingCount:** 1 (multi-tenant). **railServed:** false.

## Web findings
- Racklify and warehouse directories list GXO Logistics' Grapevine 3PL warehouse
  at 2425 Esters Blvd, Grapevine, TX 76051.
- The building is DFW Trade Center VII (commercialcafe / LoopNet listings):
  cross-dock, ~276,000–298,000 SF, 350-ft depth, 32-ft clear, ~2,500 SF office,
  50' x 50' column spacing.
- The site sits in International Commerce Park on DFW Airport land — Triple
  Freeport Texas Exemption and Foreign Trade Zone benefits.
- The building is multi-tenant: GXO Logistics, ShipBob, and Tornado Transport
  are all listed at the address.

## Final confidence
**Medium.** The GXO facility had to be relocated from a wrong/approximate roster
address (4220 Diplomacy Rd) to the web-confirmed 2425 Esters Blvd, and the exact
building unit within the DFW Trade Center park was inferred from the cross-dock
building profile rather than read from a sign. The ungated truckGate /
guardShack determination is well-supported by the uniform, open character of
the speculative-industrial park observed across satellite and Street View. Dock
and trailer counts are honest overhead estimates and flagged uncertain.
