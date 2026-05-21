# Universal Logistics — Louisville Terminal, Louisville KY (idx 23)

**Facility:** Universal Logistics / Universal Intermodal Services — Louisville Terminal
**Type:** Terminal yard / intermodal cross-dock terminal (ULH-owned operating property)
**Resolved address:** 2338 Millers Ln, Louisville, KY 40216
**Resolved coordinates:** 38.21422, -85.80280
**Confidence:** High

## Location resolution

The roster supplied no address or coordinates — only "Louisville KY named as owned
terminal/operating property" from the ULH 2025 10-K. Resolution path:

1. The loadmatch.com intermodal directory lists **Universal Intermodal Services, Inc.
   / Louisville, KY** at **2338 Millers Ln, Louisville, KY 40216** (companyID 3521).
2. The address is independently corroborated by a **Crown Enterprises** real-estate
   listing (gocrown.ws/property/2338-millers-lane). Crown Enterprises is the
   Moroun-family real-estate company that holds the Universal/ULH property portfolio —
   strong confirmation this is the ULH-owned terminal named in the 10-K. Crown's
   listing describes the parcel precisely: **4.72 acres**, three structures —
   a **16,195 SF terminal building with 46 cross-dock doors**, a 2,516 SF warehouse,
   and 4,880 SF of office — classified "Industrial / Terminal."
3. Crown's embedded Google Maps link pins the parcel at **38.214222, -85.802804**.
   Satellite at that point shows exactly the described facility.

The site sits in southwest Louisville's Millers Lane industrial corridor, just inside
the I-264 loop, in the same district as the CSX Osborn Yard intermodal ramp — the
ramp this drayage terminal feeds.

## What the imagery showed

- **Satellite (z18–z20):** A long, narrow cross-dock building running NW–SE, with
  trailers and containers backed against both long faces — consistent with a
  46-door cross-dock terminal. The surrounding yard is largely unpaved (gravel/dirt)
  and densely packed with stacked ocean containers (APL and others visible) and
  parked chassis/trailers. Neighboring parcels are similar small industrial yards.
- **Street View (Millers Lane, 2024-07):** The metal-sided terminal/office building
  faces the road with an employee parking strip in front. The truck yard is reached
  by an **open driveway directly off Millers Lane** — no barrier arm, no sliding or
  swing gate, no fence line across the truck lane, no call box. The frontage is
  completely open. (Some adjacent parcels have chain-link fencing; the ULH yard
  frontage does not.)

## Gate / guard-shack / dock determinations

- **truckGate: false** — Street View confirms an open, uncontrolled entrance off
  Millers Lane. No barrier, gate, or checkpoint pinch-point.
- **guardShack: false** — No staffed booth anywhere on the property. Only the
  terminal/office building is present.
- **remoteGs: false** — No gate, so no remote check-in implied.
- **dockDoors: "25-50"** — 46 cross-dock doors per the property record, confirmed by
  the long cross-dock building with trailers on both faces.
- **dropArea / dropYard: true, "50+"** — The yard is a dense working
  container/chassis storage lot, well beyond active dock staging.
- **railServed: false** — No spur enters the parcel; this is a truck drayage terminal
  that interchanges with the nearby CSX ramp.

## Yard zones and counts

- **Perimeter:** ~4.7-acre rectangular parcel fronting Millers Lane on the north.
- **Truck gate:** Single open curb cut on the north (Millers Lane) frontage.
- **Drop yard:** The bulk of the parcel — gravel container/chassis storage west and
  south of the building.
- **Dock apron:** Strips along both long faces of the cross-dock building.
- **dockDoorCount 46; trailersVisible ~35; trailerParkingCapacity ~70** (low-confidence
  estimates — the yard is densely and irregularly stacked with containers and chassis).
- **buildingCount 3** (terminal, warehouse, office — office integrated into the
  terminal building's near end).

## Web findings

- loadmatch.com confirms Universal Intermodal Services operates a Louisville drayage
  terminal at this address.
- Crown Enterprises (Moroun-family real estate) holds the parcel — consistent with the
  10-K describing Louisville as an *owned* ULH property.
- ULH's intermodal segment runs local/regional drayage from ~40 terminals; Louisville
  is one of them, serving the CSX Osborn intermodal ramp and the Ford Louisville auto
  corridor.

## Final confidence: High

Location is positively confirmed by two independent sources including the
property-owning entity. Gate and guard-shack calls are confirmed by recent (2024)
Street View. Dock-door count is from the official property record. Trailer counts are
honest overhead estimates and flagged as uncertain.
