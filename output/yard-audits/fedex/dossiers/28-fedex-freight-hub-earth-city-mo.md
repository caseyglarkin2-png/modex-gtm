# Deep-Audit Dossier — idx 28

## FedEx Freight Hub - Earth City MO (St. Louis, STL)

**Type:** Freight LTL hub service center (~240 doors)
**Resolved coordinates:** 38.8350, -90.5210
**Confidence:** high

## Location resolution

The roster supplied "3300 Rider Trl S, Earth City, MO 63045" and coordinates
(38.761891, -90.455962, flagged ROOFTOP). Step-0 satellite probes and Street
View at the roster point showed a multi-story glass OFFICE building in the
Earth City office park — not a freight facility. The roster geocode was wrong
despite the ROOFTOP flag.

Web research (FedEx Freight STL service-center locator at
local.fedex.com/mo/saint-charles/freight-STL, Waze, opengovny) places the FedEx
Freight STL break-bulk hub at 3951 New Town Blvd, St Charles, MO 63301 —
across the Missouri River, ~9 km NW of the roster point. Satellite probes there
revealed a classic LTL break-bulk hub. Locked center: 38.8350, -90.5210.

## Key views

- **Wide satellite (z16):** Large rectangular LTL hub property on the edge of
  St Charles, surrounded by farmland and newer industrial development; ~86
  acres.
- **Hub (z17):** Long E-W cross-dock break-bulk building with a perpendicular
  north wing; vast trailer drop yard with hundreds of trailers on the north and
  east sides; employee parking at the south.
- **Cross-dock (z19):** Dense, regular rhythm of dock doors on both long faces
  of the cross-dock building, trailers backed in along both sides; office/
  dispatch building at the south face.
- **Street View (2025-12):** New Town Blvd access road south of the hub;
  pano coverage near the gate itself is limited.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Large dedicated LTL break-bulk hub; the truck yard is
  access-controlled via the New Town Blvd access corridor on the south/SW side.
  Exact gate position inferred (limited Street View near the gate). FedEx
  Freight break-bulk hubs are universally gated. High confidence one exists.
- **guardShack = true.** Not directly resolved in imagery. A ~240-door
  break-bulk hub is staffed-guard-controlled at the truck gate per FedEx Freight
  network standard. Classified true, medium confidence; remoteGs = false.
- **dockDoors = "50+".** Long cross-dock break-bulk building with doors on both
  long faces plus a north wing; cited in trucking forums as a ~240-door hub.
- **dropArea = "50+" / dropYard = true.** Vast paved trailer drop yard north and
  east of the docks, hundreds of trailers including organized rows.

## Yard zones and counts

- **perimeter:** S 38.8330, W -90.5240, N 38.8378, E -90.5165 (~86 acres).
- **truckGate:** small box on the SW access corridor off New Town Blvd.
- **dropYards:** two boxes — north drop yard and east drop yard.
- **dockAprons:** one box along the cross-dock building's faces.
- **staging:** post-gate apron between the gate and the docks.
- **yardMetrics:** dockDoorCount ~240, trailersVisible ~320, capacity ~600,
  1 truck gate, 3 buildings, ~86 acres, not rail-served.

## Web findings

FedEx Freight STL service-center page lists the hub under St Charles, MO.
Truckingboards LTL forum cites STL as a ~240-door break-bulk hub.

## Final confidence

High on facility identity, break-bulk cross-dock layout, dock band, and drop
yard. Medium on the exact truck-gate position and guard-shack (inferred from
FedEx Freight network norms and the access corridor, not a direct Street-View
sighting — pano coverage near the gate is limited).
