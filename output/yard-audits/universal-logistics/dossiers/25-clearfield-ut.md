# Universal Logistics — Clearfield Terminal, Clearfield UT (idx 25)

**Facility:** Universal Logistics / Specialized Rail Service, Inc. (SRS) — Clearfield Terminal
**Type:** Intermodal / rail-served transload & distribution terminal (ULH-owned operating property)
**Resolved address:** 120 E 700 S, Clearfield, UT 84015
**Resolved coordinates:** 41.10540, -112.02320
**Confidence:** Medium

## Location resolution

The roster supplied no address or coordinates — only "Clearfield UT named as owned
terminal/operating property" from the ULH 2025 10-K. Resolution path:

1. **Specialized Rail Service, Inc. (SRS)** is a Clearfield, UT-based intermodal
   drayage / transloading / warehousing-and-distribution / intermodal-facility-
   management operator, founded 1992. **Universal Logistics Holdings acquired SRS
   in October 2018 for $12.3M.** SRS is the ULH operating presence behind the
   10-K-named Clearfield property.
2. The SRS address is **firm**: **120 E 700 S, Clearfield, UT 84015** — confirmed
   identically by FMCSA SAFER (USDOT 506498, physical and mailing address),
   loadmatch.com (companyID 504), Yelp, Dun & Bradstreet, and Loc8NearMe.
3. **The exact parcel is not positively confirmed.** 120 E 700 S sits inside a
   dense multi-tenant industrial district south of Clearfield's center, and **no
   SRS signage was visible in any Street View pass**. OpenStreetMap returned two
   interpolated points for the address. Resolved to the **rail-served warehouse /
   transload building at ~41.1054, -112.0232** on the 700 South surface street,
   because: (a) a Union Pacific rail line/spur runs directly alongside its NE face
   — the defining feature of a "Specialized Rail Service" transload facility;
   (b) the address interpolates onto the 700 South street where this building
   sits; and (c) SRS's stated business is rail transload + cross-dock + warehouse
   distribution, which this building's layout matches.

**This is a medium-confidence location.** The address is certain; the exact
building within the multi-tenant district is a reasoned inference, not a
signage-confirmed lock.

## What the imagery showed

- **Satellite (z16–z20, 2026):** A long warehouse/transload building running
  NW-SE. A **Union Pacific rail line runs directly along its NE face**, with
  covered hopper railcars parked on the spur and lumber/material staged for
  transload. A truck/trailer yard with parked trailers and chassis lies NW of the
  building; a dock apron with backed trailers runs along the SW face. A
  petroleum/chemical **tank farm to the SW is a separate tenant** and is excluded
  from the geofence.
- **Street View (2022-11):** The building frontage shows internal industrial-park
  roads, employee parking, and decorative block walls. No SRS signage; no barrier
  arm or sliding gate observed across a truck lane. The SW tank farm was confirmed
  as a distinct petroleum/chemical storage operation.

## Gate / guard-shack / dock determinations

- **truckGate: false** (medium confidence) — Industrial-park access via internal
  roads; no barrier arm or sliding/swing gate observed across a truck lane. The
  exact entrance could not be definitively walked in Street View.
- **guardShack: false** — No staffed booth visible in satellite or Street View.
- **remoteGs: false** — No identified truck gate, so no remote check-in implied.
- **dockDoors: "10-25"** (low confidence) — A dock apron with trailers backed
  along the building's SW face; estimated ~14 doors, partly tree-obscured.
- **dropArea / dropYard: true, "10-25"** (low confidence) — A trailer/chassis yard
  adjoins the building NW; transload material is staged on the rail side.
- **railServed: true** (high confidence) — A UP rail line runs directly alongside
  the building with railcars on the spur and active transload. This is the
  strongest physical finding for the site and is consistent with SRS's
  rail-transload / intermodal-facility-management business.

## Yard zones and counts

- **Perimeter:** ~9.2-acre building + immediate yard parcel (low confidence given
  parcel-boundary ambiguity in the multi-tenant district).
- **Truck gate:** Not boxed — open industrial-park access, exact point unconfirmed.
- **Drop yard:** Trailer/chassis yard NW of the building.
- **Dock apron:** Strip along the building's SW face.
- **dockDoorCount ~14; trailersVisible ~25; trailerParkingCapacity ~90** — honest
  overhead estimates, all flagged uncertain.
- **buildingCount 1** (the rail-served warehouse/transload building; the SW tank
  farm is a separate tenant, excluded).
- **railServed true.**

## Web findings

- SRS (founded 1992) runs intermodal drayage, transloading, cross-docking,
  warehousing/distribution, and intermodal-facility management across 11 western
  states; operates ~140 tractors regionally; also runs Southwest Transload &
  Distribution in North Las Vegas adjacent to the UP intermodal/auto facility.
- ULH acquired SRS in October 2018, extending ULH's intermodal footprint into the
  Intermountain West. Clearfield is SRS's home/HQ facility.
- SRS's Ogden, UT facility (a separate site) is UP-served with 11 rail-car spots —
  consistent with SRS being a rail-anchored operator.

## Final confidence: Medium

The address (120 E 700 S, Clearfield UT 84015) and the SRS↔ULH ownership are
firmly confirmed. The exact parcel within a dense multi-tenant industrial district
is a reasoned inference from rail-adjacency and address interpolation — no SRS
signage was found in Street View. Rail-served is high-confidence; gate, dock, and
yard counts are flagged as lower-confidence. The site is flagged for human review
of the precise parcel boundary.
