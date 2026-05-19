# General Mills - Reed City MI (idx 14)

## Resolved location
- Roster coords (43.87584, -85.509751, geocode precision ROOFTOP, moved only 16m) **correctly landed** on the **General Mills Yoplait yogurt plant** at **128 E Slosson Ave, Reed City MI**. Locked center **43.8756, -85.5087**.
- This is an **active General Mills facility** — the Yoplait yogurt manufacturing plant in downtown Reed City. The plant is a dense process facility (silos, tanks, pipe racks visible) with a separate NE cooler/warehouse building and trailer drop yard.

## Key views
- **z16/z17 satellite:** Main plant building cluster in the downtown core, with a dock face on the N side. A large drop yard to the NE holds many parked trailers plus a separate dark-roofed warehouse/cooler building. The plant fronts directly on public streets (Chestnut St on the W, E Slosson Ave on the S).
- **z19 N dock:** A bank of dock doors along the N wall of the main plant with ~6-10 trailers backed in; the plant interior is dense with process equipment.
- **z18 NE drop yard:** A substantial trailer-storage lot with ~30-40 parked trailers and a connected cooler/warehouse building.
- **Street View (2018/2021/2024):** Downtown Reed City storefronts to the W; the N side of the plant fronts an open paved yard/parking off the public street. No clearly visible barrier arm, gate, or guard booth at the property line in any frame. A "Reed City Crossroads" rail-trail/park sign sits N of the plant near the Hersey River.

## Gate / guard-shack / dock determinations
- **truckGate: true (LOW CONFIDENCE — flagged)** — The N truck/dock yard appears to have perimeter fencing and the NE drop yard is a defined trailer lot, but the N approach from the public street is fairly open with no visible barrier arm, swing/sliding gate, or guard booth in any Street View. Set true as a defined fenced truck yard, but heavily flagged.
- **guardShack: false / remoteGs: true** — No guard booth identified at any entrance. Defaulted to remote check-in. Both flagged uncertain.
- **dockDoors: 10-25** — N-side dock bank, ~6-10 trailers backed in plus dock structures; some doors may be obscured by process equipment. Flagged.
- **dropArea: 25-50 / dropYard: true** — Large NE drop yard, ~30-40 trailers, plus staged trailers near the dock.
- **multipleFacilities: true** — Two building clusters (main plant + NE cooler/warehouse).
- **shipRcvSeparate: false** — Dock activity concentrated on the main plant's N face.
- **drivewayShort: true, backupSensitive: true** — Compact downtown-core footprint; short dock approach; a truck queue would spill onto public streets.

## Yard zones and counts
- **perimeter:** ~34 acres covering the main plant plus the NE drop yard and warehouse.
- **truckGate:** N-side dock-yard entrance.
- **dropYards:** NE trailer-storage lot.
- **dockAprons:** N-wall dock apron of the main plant.
- **yardMetrics:** dockDoorCount ~14, trailersVisible ~50, capacity ~55, 2 buildings, 1 truck gate, not rail-served.

## Web findings
- General Mills Yoplait yogurt plant; categorized as a yogurt manufacturer. Active General Mills facility (unlike idx 10 and 13, which were divested).
- The NE corridor near the Hersey River is the "Reed City Crossroads" rail-trail / recreation path, not active freight rail.

## Final confidence
**Medium.** Site identity, layout, dock face, drop yard, and multi-building campus are clearly confirmed by satellite, and the facility is a confirmed active General Mills Yoplait plant. The gate/guard-shack determination is genuinely uncertain — the small-town plant fronts open onto public streets with no visible controlled checkpoint — so `truckGate`, `guardShack`, and `remoteGs` are flagged, along with `dockDoors` (process equipment obscures some doors) and `scale`.
