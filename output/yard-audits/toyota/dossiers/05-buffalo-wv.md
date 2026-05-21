# Deep-Audit Dossier — Toyota Motor Manufacturing West Virginia (TMMWV), Buffalo WV

**Account:** Toyota · **Roster idx:** 5
**Facility type:** Powertrain Plant (engines, transmissions, hybrid transaxles)
**Address:** 1 Sugar Maple Lane, Buffalo, WV 25033
**Resolved center:** 38.598, -81.992
**Confidence:** Medium

---

## Location resolution

Roster coordinates (38.597545, -81.993022, GEOMETRIC_CENTER, ~2 km move) landed
on employee parking between the plant buildings. Satellite probing at z16–z20
around that point positively identified the facility: a very large multi-building
manufacturing complex sandwiched between the Kanawha River (west) and a public
road (south/east), near the small town of Buffalo, WV. Web search confirmed the
address (1 Sugar Maple Lane) and that TMMWV builds engines and transmissions only
— no vehicle assembly. The locked center 38.598, -81.992 sits over the main
northern powertrain building.

## What the imagery showed

- **z16 / z17 overview:** A campus of two large building clusters — a northern
  main powertrain plant and a separate large southern building cluster — plus
  utility buildings, water-treatment tanks, and an electrical substation on a
  separate parcel to the east. A solar farm sits on adjacent land further east.
- **Drop yard (north):** A very large dedicated trailer storage yard fills the
  north end of the property — rows of 80+ trailers (mixed red and silver) in
  marked stalls. Clearly separate from active dock staging.
- **Dock aprons:** Trailers backed into the east face of the north building and
  the south/east faces of the south building. Estimated 60+ dock doors across
  the campus. Shipping and receiving run from physically distinct dock banks.
- **Main entrance:** The public-road junction (≈38.5915, -81.9965) feeds a
  divided 2-lane entrance road north into employee parking via a circle. Street
  View (2024-10) of this entrance shows an **open, unguarded driveway** — no
  barrier arm and no guard booth at the property line into the employee area.
- **Perimeter:** Chain-link perimeter fencing is clearly visible in Street View
  along the public road wrapping the dock/trailer side of the plant.

## Gate / guard-shack determination

- **truckGate: true** — The truck/dock operations are inside a fully chain-link
  perimeter-fenced area. Truck access is controlled. However, the truck gate
  structure itself is **not directly visible** — Street View coverage stops at
  the public road and does not enter the plant property. This is an inference.
- **guardShack: false / remoteGs: true** — No guard booth could be positively
  identified. The visible (employee/visitor) entrance is an open driveway. A
  Toyota TPS powertrain plant of this scale almost certainly has controlled
  truck check-in, but the booth structure is not confirmable from overhead
  imagery, so guardShack is left false and remoteGs true at **medium
  confidence**. Both fields are flagged uncertain.
- **multiStep: false** — No second checkpoint visible.

## Yard zones and counts

- **Perimeter:** ~311 acres fenced industrial footprint (excludes the separate
  east solar-farm parcel).
- **Drop yards:** One very large trailer drop yard on the north side (50+ band,
  ~200 trailer capacity, ~85 trailers visible in captured imagery).
- **Dock aprons:** Two — the east-face apron of the north building and the
  south-face apron of the south building.
- **Buildings:** ~6 distinct structures (campus / multipleFacilities true).
- **Rail:** No rail spur into the property — railServed false.

## Web findings

- Toyota USA Newsroom and Wikipedia confirm TMMWV at 1 Sugar Maple Lane, Buffalo,
  WV, producing engines, transmissions, and hybrid transaxles; phone (304)
  937-7000. The plant has expanded multiple times. It is a powertrain (not
  assembly) plant — outbound product is engines/transmissions trucked to Toyota
  assembly plants, and inbound is castings/components.

## YardFlow relevance

TMMWV is a JIT powertrain feeder with a very large trailer drop yard and 60+
dock doors across a multi-building campus — the kind of multi-zone yard where
trailer-location visibility and dock scheduling drive line uptime. The wide
internal service roads leave clear room for an express/bypass lane.

## Final confidence: Medium

Facility positively identified and yard layout well characterized. The
truck-gate structure and guard-shack call are inferred (Street View does not
enter the property), hence medium rather than high.
