# Deep-Audit Dossier — idx 17

## Universal Logistics — Polaris Madison Plant Contract Logistics — Madison, AL

**Status: RESOLVED — confidence HIGH** (re-audit of an earlier low-confidence stub)

### Step 0 — Location
Confirmed address: **7049 Greenbrier Pkwy NW, Madison AL 35756** — the
**Polaris Industries** off-road-vehicle manufacturing plant in the
Greenbrier corridor of Limestone County, in the Huntsville metro. Universal
Logistics runs **inbound contract logistics** (parts sequencing / value-added
warehousing) inside the Polaris plant, so the audited yard is the Polaris
plant's captive freight yard. Google geocode returned a ROOFTOP match at
`34.6521957, -86.8525792`. Locked center: `34.65205, -86.85300`.

> This is **not** the Mazda-Toyota Manufacturing plant at 9000 Greenbrier Pkwy
> (a separate, larger facility ~1.5 mi NE). The earlier stub's "near Mazda
> Toyota" note led to ambiguity — the correct site is the Polaris plant.

### Steps 1-5 — Audit

**Campus & layout.** A manufacturing campus: a very large main plant building,
a separate large distribution/warehouse building on the north end, and
ancillary structures — `multipleFacilities: true`. Employee car-parking covers
the east and south; the freight operation is on the west and north.

**Truck gate.** The main plant entrance on the north access loop has a clear
controlled checkpoint — a **guard house structure in the road median** with
multiple **barrier-arm-controlled lanes** (striped barrier marks visible
across the lanes), with vehicles queued at the arms. `truckGate: true`.

**Guard shack.** A staffed guard house sits in the median of the checkpoint
with controlled lanes on each side — `guardShack: true`, `remoteGs: false`.
Roughly 2 inbound and 2 outbound controlled lanes split around the central
booth. The wide multi-lane apron leaves clear room for an express lane
(`fastLaneOpportunity: true`).

**Drop yards.** Extensive — the **west** side of the plant holds many hundreds
of trailers in long rows (inbound parts/components staging for the
contract-logistics operation); a second staging/drop area sits at the **north**
warehouse. `dropArea: 50+`, `dropYard: true`.

**Docks.** Extensive dock banks — a long dock face along the building's west
side plus the north warehouse dock bank — estimated ~70 doors
(`dockDoors: 50+`; count flagged uncertain given plant scale). Inbound parts
docks/yards are physically separate from finished-vehicle outbound staging —
`shipRcvSeparate: true`.

**Scale / rail.** No distinct truck scale in the truck path (`scale: false`)
and no rail spur into the property (`railServed: false`).

**Setting.** The plant sits in open farmland on the edge of the Greenbrier
logistics corridor, surrounded by fields — **Rural**.

**Geofence.** Perimeter captures the developed plant footprint — buildings,
west drop yards, north warehouse, and employee parking: ~857 m N-S x ~916 m
E-W ≈ **194 acres** (the overall parcel is larger; the box is the
operational/developed area).

### Verdicts
- **Gate verdict:** truck gate present — multi-lane barrier-arm checkpoint.
- **Guard-shack verdict:** guard shack present — staffed gatehouse in the
  checkpoint median.
- **Confidence:** high.
