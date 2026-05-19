# Deep Audit — Toyota Parts Distribution Center, Mansfield MA (idx 17)

**Facility:** Toyota Parts Distribution Center (Boston-region PDC)
**Type:** Parts Distribution Center
**Resolved coordinates:** 42.01685, -71.23445
**Address:** 440 Forbes Blvd, Mansfield, MA 02048
**Confidence:** High

## Location resolution

Roster supplied a confirmed address (440 Forbes Blvd) and a GEOMETRIC_CENTER
point (42.016967, -71.234706). Web research (Yelp "Toyota Parts Warehouse",
Macrae's Blue Book, Manta, MerchantCircle) confirms a Toyota Parts Distribution
Center / regional office at this address serving Toyota's New England dealer
network. Satellite at z17-z20 resolves the facility to the white-roof warehouse
in the Forbes Blvd industrial park: a dock bank with trailers backed in, a drop
yard with parked trailers, and employee parking. Street View at the entrance
shows monument signage, an American flag, and the building with trailers staged
alongside — confirming the identification. High confidence.

## What the imagery showed

- **z17/z18 overview:** A white-roof warehouse in the Forbes Blvd / Cabot
  industrial park, surrounded by woods, with neighboring industrial buildings.
- **z19 NW dock face:** A single dock bank — ~18 dock doors with trailers
  (green / orange / white) backed into most; a paved truck apron; a drop yard
  with ~20+ parked trailers to the NW. A rail line runs along the NW edge of the
  corridor.
- **z20 entrance:** Employee parking lots on the south side; an open driveway
  entrance — no barrier arm, gate or guard booth at the road.
- **Street View (Forbes Blvd, 2025-06):** Open driveway entrance with monument
  signage and a flag; the truck driveway runs straight into the dock yard. A rail
  line crosses Forbes Blvd at the facility frontage.

## Gate / guard-shack determination

- **truckGate = false.** The entrance off Forbes Blvd is an open driveway — no
  barrier arm, sliding/swing gate, guard booth or checkpoint pinch-point was
  visible in 2025-06 Street View or z20 satellite. The truck driveway runs
  straight from the public road to the dock yard. Classified an open site.
  (Flagged uncertain — dock-yard perimeter security could not be fully ruled out
  from imagery.)
- **guardShack = false** — no gate, no booth.
- **remoteGs = false** — no truck gate.
- **multiStep = false** — no checkpoint stages.

## Yard zones & counts

- **Perimeter:** ~16 acres (building + dock yard + drop yard + employee parking).
- **Dock doors:** ~18 on the single NW face — band 10-25.
- **Drop yard:** NW-corner lot with ~20+ parked trailers — band 10-25;
  `dropYard` true.
- **Dock apron / post-gate staging:** deep paved apron between dock face and drop
  yard — `drivewayLong` true.
- **Ship/Rcv:** single NW dock face — `shipRcvSeparate` false.
- **Rail served:** classified NO — a rail line runs along the NW corridor and
  crosses Forbes Blvd nearby, but no spur clearly enters the Toyota parcel;
  flagged uncertain.

## Web findings

- Toyota Parts Distribution Center, 440 Forbes Blvd, Mansfield MA — regional
  service-parts warehouse / regional office for the New England dealer network.
- Standard business hours; established in MA records ~2018 at this address.

## Final confidence: HIGH

The facility is positively identified (confirmed address + signage in Street
View + matching satellite layout). Layout, dock count and drop yard are read
clearly from imagery. The only uncertainties are whether the dock yard has
back-of-house perimeter control beyond the open road entrance, and whether the
nearby rail serves the parcel — both flagged in uncertainFields. The gate verdict
(open site, no truck gate) is well-supported by recent Street View.
