# UNFI — Sarasota North DC, Sarasota FL (idx 1)

**Resolved location:** 8380 21st Street East, SRQ Logistics Center, Manatee/Sarasota
county line, FL (~27.3935, -82.5418) — **NOT** the roster's geocoded point.
**Confidence:** medium (location confirmed; yard configuration not observable).

## Location resolution — roster geocoded the wrong building

The roster supplied lat/lng `27.264831, -82.484075` and address `6272 McIntosh Rd,
Sarasota FL 34238`. Web research (Yellow Pages, Business Observer, Sarasota Magazine,
UNFI press) shows **6272 McIntosh Rd is UNFI's OLD ~734,000 sq ft Sarasota DC** — the
aging facility being *replaced*. Satellite confirms a large but visibly older complex
at that point.

The roster facility *name* is "Sarasota **North** DC" and the source line explicitly
describes the "new 1M sq ft automated DC opened FY26 (KNAPP robotics)". That new
facility is at **8380 21st Street East**, inside the **SRQ Logistics Center** — a
300-acre master-planned business park east of Sarasota-Bradenton International Airport
(KSRQ), on the north side of the University Parkway / US-301 intersection, near I-75.
The address is technically in Manatee County. UNFI broke ground Aug 2023 and opened
the 1M sq ft DC in September 2025; 400+ associates transitioned from the old McIntosh
Rd site. KNAPP Pick-it-Easy Robot + Goods-to-Person automation; tri-temp grocery.

I audited the **new** facility, per the roster's clear intent.

## Imagery state — facility under construction in available imagery

Maxar satellite of the SRQ Logistics Center parcel shows the UNFI building
**mid-construction**: a large elongated (~440 m N–S) building shell, roofed, but
surrounded by bare earth — no striped parking, no installed dock doors, no gate
structure. Street View on 21st St E dates to 2019/2022, before the building existed.
The facility opened Sept 2025, after this imagery.

**Consequence:** the building and parcel are positively located, but the truck gate,
guard shack, dock apron, drop yard, and lane geometry **cannot be observed**. Those
fields are estimated from the building footprint plus UNFI's published spec for its
comparable new-build DC (Manchester PA: 214 dock positions, 492 trailer spaces) and
flagged in `uncertainFields`.

## What the imagery did show

- A single very large elongated DC building, consistent with a 1M sq ft footprint,
  oriented roughly N–S, dominating the parcel.
- A **rail line runs N–S immediately along the west edge** of the parcel. No spur
  observed entering the property; UNFI grocery DCs are truck-served. `railServed`
  marked false but flagged for verification.
- The parcel sits inside a built-out logistics/industrial park with adjacent
  warehouses, an Amazon Last Mile facility, and (planned) a Ferguson DC — a dense
  metro-edge industrial setting → `urbanRural: Urban`.
- Generous parcel area (~95 acres estimated within the 300-acre master plan), open
  land around the building → ample room for a deep driveway, staging, and an
  express/bypass lane → `fastLaneOpportunity: true`, `drivewayLong: true`.

## Classification rationale (estimates for a new-build automated grocery DC)

- `truckGate: true`, `guardShack: false`, `remoteGs: true` — a 2025 1M sq ft
  automated grocery DC on a master-planned park parcel will have perimeter control;
  current-generation new builds favor kiosk/app gate check-in over a staffed booth.
  All three are estimates, not observed — flagged.
- `dockDoors: "50+"`, `dropArea: "25-50"`, `dropYard: true` — scaled from the 1M sq ft
  footprint and the Manchester PA comparable. Not counted.
- `postGateStaging: true`, `drivewayLong: true`, `fastLaneOpportunity: true` — large
  open parcel supports interior staging and a deep approach.
- `multipleFacilities: false` — one UNFI building (the rest of the SRQ park is other
  owners' parcels).
- `scale: false`, `multiStep: false`, `shipRcvSeparate: false`, `backupSensitive: false`.

## Web findings

- UNFI press / Progressive Grocer / Business Observer / MDM: 1M sq ft, opened Sept
  2025, ~35% larger than the replaced 734k sq ft McIntosh Rd DC, 400+ associates,
  KNAPP automation (first UNFI DC with the Pick-it-Easy Robot), tri-temp.
- Peak Development Co.: SRQ Logistics Center is 300 acres, 1,226,000 sq ft of
  industrial space; tenants include Amazon Last Mile, the 1M sq ft UNFI cold-storage
  DC, and a future Ferguson DC; 6.7-acre retail parcel on University Pkwy.

## Final confidence: medium

Location positively resolved and corrected from the roster error. Yard-level
classification is an informed estimate because all available imagery predates the
facility's completion. Recommend re-auditing once post-2025 high-resolution imagery
or Street View of 21st St E becomes available.
