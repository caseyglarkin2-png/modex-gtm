# Universal Logistics — Columbus Terminal, Columbus OH (idx 24)

**Facility:** Universal Logistics / Universal Intermodal Services — Columbus Terminal
**Type:** Intermodal / drayage terminal yard (ULH-owned operating property)
**Resolved address:** 2950 International St, Columbus, OH 43228
**Resolved coordinates:** 40.01300, -83.13080
**Confidence:** High

## Location resolution

The roster supplied no address or coordinates — only "Columbus OH named as owned
terminal/operating property" from the ULH 2025 10-K. Resolution path:

1. The loadmatch.com intermodal directory lists **Universal Intermodal Services,
   Inc. / Columbus, OH** at **2950 International St, Columbus, OH 43228**
   (companyID 5853). The profile describes a Columbus terminal with ingate/outgate,
   ~37 drivers, a secured parking lot, and a container-yard depot handling MSC and
   Maersk containers.
2. The address is independently corroborated by iBegin, Superpages and Yelp
   listings — all at 2950 International St, phone 614-777-9393, several branded
   **"Mason Dixon Lines"** (a Universal/ULH operating brand).
3. The geocoding-API rooftop point fell on a neighboring multi-tenant distribution
   warehouse. The actual terminal is the parcel ~150 m east, fronting International
   Street. **Street View (2021-07) shows a "Universal Intermodal Services" sign
   mounted on the property's perimeter fence** — positive confirmation.

The site sits in the west-Columbus industrial corridor (43228), bounded on the
north/east by the I-270 and rail right-of-way — the same district as the CSX
Columbus intermodal ramp the drayage terminal feeds.

## What the imagery showed

- **Satellite (z17–z20, 2026):** A large, roughly rectangular open terminal yard
  fronting International St on the west. The yard is predominantly gravel/paved and
  is filled with rows of trailers, chassis, and flatbeds carrying steel/material
  loads. An L-shaped metal office/equipment-shop building sits near the SW corner;
  a small shed adjoins it. The yard extends ~260 m east toward the I-270/rail tree
  line. No loading-dock doors anywhere — this is a yard operation, not a cross-dock.
- **Street View (International St, 2021-07):** Stacked ocean containers (MSC,
  Maersk and others) behind perimeter chain-link fencing, with a
  **"Universal Intermodal Services" sign** on the fence. The truck entrance is a
  **wide open paved apron** meeting International Street — no barrier arm, no
  sliding/swing gate across the lane, no guard booth.

## Gate / guard-shack / dock determinations

- **truckGate: false** — The truck entrance off International St is a wide,
  uncontrolled paved apron. Perimeter chain-link fencing rings the container yard,
  but the entrance driveway itself has no barrier, gate, or checkpoint pinch-point.
- **guardShack: false** — No staffed booth anywhere on the property. Only the
  L-shaped office/equipment-shop building is present.
- **remoteGs: false** — No truck gate, so no remote check-in implied.
- **dockDoors: "NONE"** — No cross-dock building; the only structure is an
  office/shop with no dock-door rhythm.
- **dropArea / dropYard: true, "50+"** — The yard is a large, dense working
  container/chassis/trailer storage lot.
- **railServed: false** — No spur enters the parcel; this is a truck drayage
  terminal that interchanges with the nearby CSX ramp.

## Yard zones and counts

- **Perimeter:** ~21.8-acre open terminal yard fronting International St on the
  west; bounded by the I-270/rail tree line on the north and east.
- **Truck gate:** Single wide open curb cut on the west (International St) frontage;
  ~2 inbound / 1 outbound lanes of usable width with room for an express bypass.
- **Drop yard:** Effectively the whole parcel — open gravel/paved
  container/chassis/trailer storage.
- **dockDoorCount 0; trailersVisible ~40; trailerParkingCapacity ~200** (honest
  overhead estimates — the yard is large and irregularly loaded; flagged uncertain).
- **buildingCount 2** (office/equipment-shop + small shed).

## Web findings

- loadmatch.com confirms Universal Intermodal Services operates a Columbus drayage
  terminal here with ~37 drivers, ingate/outgate, secured lot, and an MSC/Maersk
  container-yard depot serving six states.
- The "Mason Dixon Lines" branding on third-party directories is consistent with a
  Universal/ULH operating company at the address.
- ULH's intermodal segment runs local/regional drayage from ~40 terminals;
  Columbus is one, feeding the CSX Columbus intermodal ramp.

## Final confidence: High

Location is positively confirmed by the loadmatch directory, multiple third-party
listings, and a "Universal Intermodal Services" sign visible in Street View. Gate
and guard-shack calls are confirmed by 2021 Street View and 2026 satellite. Trailer
counts are honest overhead estimates and flagged as uncertain.
