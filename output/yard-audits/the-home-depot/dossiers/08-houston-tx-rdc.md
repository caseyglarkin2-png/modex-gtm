# Deep-Audit Dossier — Home Depot RDC, Houston TX (idx 8)

**Facility:** Home Depot RDC #5521 (Rapid Deployment Center)
**Address:** 11333 N. Gessner Road, Houston, TX 77064
**Resolved center:** 29.94050, -95.55430
**Confidence:** High

## Location resolution
The roster geocode (29.940329, -95.554781, ROOFTOP, moved 2095 m) landed on
the correct building despite the large geocode move — the RDC is the large
distribution building immediately at that point. Web confirmation: TruckMap,
SupplierWiki HD DC list, Manta, and HD careers all place HD RDC #5521 at 11333
N. Gessner Rd, Houston, TX 77064. It is described as Home Depot's Northwest
Houston rapid deployment center (Willowbrook / Hwy 249 area), operating 24/7.

## What the imagery showed
- **Building:** One long rectangular RDC, the long axis running E–W (~700+ m
  long). Continuous loading-dock doors with trailers backed in line **both
  long faces** — the north face fronts a huge trailer drop yard, the south
  face fronts an apron and the south yard.
- **Docks:** 50+ band — estimated ~180 doors across the two long faces.
- **Drop yard:** A very large dedicated trailer drop yard fills the entire
  north half of the property — rows of marked stalls packed with parked
  trailers, easily 100+; ~320 trailers visible site-wide.
- **Access:** A single controlled private access road enters at the SW corner,
  crossing a wide grassy drainage easement that separates the property from
  public roads. A small structure is visible near the SW access lane.
- **Setting:** Northwest Houston metro — surrounded by residential
  subdivisions and other industrial development. Classed Urban.

## Gate / guard-shack determination
The property is set well back behind a wide drainage easement, with a single
controlled private access road at the SW corner — a clear checkpoint
pinch-point where the truck drive meets the approach. Street View does not
reach the gate (it is deep on the private drive; public panos only cover
N Gessner Rd and the residential subdivision south of the easement). The gate
booth could not be isolated cleanly in satellite, though a small structure is
visible near the SW access lane.

- **truckGate: TRUE** — single controlled private access at the SW; the site
  is a 24/7 perimeter-controlled HD RDC.
- **guardShack: TRUE (flagged uncertain)** — a guard booth at the SW access is
  the HD-RDC operating norm; the booth was not directly imaged. Flagged.
- **remoteGs: FALSE** — guard booth assumed present.

## Yard zones & counts
- **Dock doors:** 50+ (~180 estimated, both long faces).
- **Drop area:** 50+ — the very large north drop yard (100+ trailers).
- **Trailers visible:** ~320; **capacity** ~400.
- **Truck gates:** 1 controlled SW access.
- **Buildings:** 1 RDC (the smaller building to the east is a separate
  property).
- **Site area:** ~103 acres (perimeter box ~540 m × ~770 m incl. drop yard).
- **Rail:** Not served — no spur enters the property.

## Other classification notes
- **shipRcvSeparate: TRUE** — dock banks on both long building faces.
- **drivewayLong / preGateStaging / postGateStaging: TRUE** — long private SW
  access drive plus deep internal yard hold a 3+ truck queue.
- **backupSensitive: FALSE** — wide drainage easement and long private drive
  isolate any gate queue from public roads.
- **fastLaneOpportunity: TRUE** — abundant unused paved width on the SW access
  drive and yard for an express lane.
- **scale / multiStep / multipleFacilities: FALSE** — none observed.

## Web findings
HD RDC #5521 confirmed as the Northwest Houston rapid deployment center,
24/7 operation, part of HD's same-day/next-day supply-chain investment. No
public driver reviews detailing the gate were found, but the 24/7 RDC
operating model and the perimeter-controlled single-access layout are clear
from imagery.

## Final confidence
**High.** Building positively identified, imagery clear at z15–z20, two-face
dock layout and the very large north drop yard plainly visible, and the single
controlled SW access road confirmed. Guard-booth presence is inferred (gate
deep on the private drive, no Street View) and lane counts are estimates —
both flagged in `uncertainFields`.
