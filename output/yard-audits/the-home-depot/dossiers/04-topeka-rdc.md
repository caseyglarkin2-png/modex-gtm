# Deep-Audit Dossier — Home Depot RDC, Topeka KS (idx 4)

**Facility:** Home Depot Rapid Deployment Center (DC #5024)
**Roster address:** 5200 SW Wenger Drive, Topeka, KS 66619 (Waze lists 66609)
**Roster coords:** 38.972986, -95.697161 (geocoding-api, ROOFTOP, movedMeters 5133)
**Resolved coords:** 38.97299, -95.69715
**Final confidence:** HIGH

---

## Step 0 — Location resolution

The roster's final lat/lng land **directly on the RDC rooftop** (the large
`movedMeters` reflects a street-range guess corrected to the rooftop). The
building is a long warehouse at **5200 SW Wenger Drive, Topeka KS**, on the
city's southern industrial edge. SupplierWiki ties this address to **HD DC
#5024 (an RDC)**, and Waze lists the place explicitly as "The Home Depot Rapid
Deployment Center." Confirmed.

## Key views

- **z16-z18 satellite:** a long cross-dock building with dock doors and
  backed-in trailers along **both** long faces; a very large trailer drop yard
  fills the area south of the building in long parallel rows; employee parking
  at the SW/office corner. Active farmland abuts the property to the north.
- **z19 satellite:** trailer rows several hundred units deep — a heavy
  drop-and-hook RDC operation.
- **Street View on SW Wenger Drive (2024):** the RDC office side with employee
  parking and a **Plug Power hydrogen fuel station** (fuel-cell forklift
  refueling — a recurring HD RDC feature, corroborating HD tenancy). A separate
  Street View segment along the curved truck access road shows the road **lined
  with parked/staged trailers** leading to the fenced trailer yard.

## Gate / guard-shack determination

- **truckGate: true** — high confidence. A single curved truck access road runs
  up from SW Wenger Drive and is the only vehicle entry into the trailer yard;
  it pinches into a controlled entrance where it meets the chain-link-fenced
  yard. Trucks were observed staged along this approach road.
- **guardShack: true** — set per the HD-RDC standard of staffed gate check-in;
  a discrete booth structure was not unambiguously isolated in the available
  imagery, so it is listed in `uncertainFields`. `remoteGs` false.
- **preGateStaging / postGateStaging: true** — the long access road provides
  ample outside-the-gate staging (trailers already parked along it); the wide
  internal yard holds trucks before the docks.
- **drivewayLong: true; backupSensitive: false** — the approach is long and set
  well back from SW Wenger Drive, so a queue cannot spill onto a public road.
- **entryExitTogether: true** — single entry/exit point.

## Yard zones and counts

- **Perimeter:** ~60 acres around the RDC building and its large drop yard.
- **shipRcvSeparate: true** — cross-dock RDC with dock banks on both long faces.
- **dockDoorCount ~120** across both elevations of a ~550K sq ft RDC (estimate;
  listed uncertain).
- **trailersVisible ~230; trailerParkingCapacity ~320** — one of the densest
  trailer drop yards in this batch.
- **dropArea: 50+; dropYard: true.**
- **urbanRural: Rural** — edge-of-town site with farmland directly north;
  adjacent industrial park, but the broader setting is rural/edge-of-town
  (per the rubric, choose Rural when torn).
- **buildingCount 1; railServed false; scale false.**

## Web findings

- HD DC #5024 confirmed as an RDC (SupplierWiki, Waze). Operating hours roughly
  6:45 AM-12:45 AM weekdays per business listings — high-throughput
  store-replenishment cross-dock.
- The Plug Power hydrogen station is consistent with HD's network-wide
  fuel-cell forklift program.

## Final confidence: HIGH

Building positively identified as HD RDC #5024; cross-dock layout, large drop
yard, single gated truck approach and HD-specific hydrogen station all
confirmed. Guard-booth structure and exact dock/lane counts are estimates.
