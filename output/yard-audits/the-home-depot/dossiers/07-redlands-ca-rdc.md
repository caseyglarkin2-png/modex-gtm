# Deep-Audit Dossier — Home Depot RDC, Redlands CA (idx 7)

**Facility:** Home Depot RDC #5087 (Rapid Deployment Center)
**Address:** 27352 River Bluff Avenue, Redlands, CA 92374
**Resolved center:** 34.08820, -117.20440
**Confidence:** High

## Location resolution
The roster geocode (34.088222, -117.204711, ROOFTOP, moved 142 m) landed on
the correct building. Web confirmation: TruckMap, BusinessYab, SupplierWiki HD
DC list, and HD careers all place HD DC #5087 / RDC 5087 at 27352 River Bluff
Ave, Redlands, CA. The facility is a large RDC in the dense San
Bernardino/Redlands logistics corridor, with the I-10 freeway forming its east
boundary. The building was positively identified — a large rectangular
distribution building with trailers backed in on all four faces.

## What the imagery showed
- **Building:** One very large rectangular RDC, the long axis running E–W,
  roughly 600+ m long. Continuous loading-dock doors with trailers backed in
  line **all four faces** (north, south, east, and west ends) — a true
  high-volume cross-dock RDC.
- **Docks:** 50+ band — estimated ~200 doors across all faces.
- **Drop yard:** A large trailer drop area runs along the north side; a second
  parallel row of parked trailers sits in the south apron. The yard is dense
  with colored trailers — well over 50 visible, ~280 site-wide.
- **Office / car entry (z19/z20):** A wide divided entrance driveway with a
  landscaped median leads off River Bluff Ave to the office and employee
  parking on the building's west end.
- **Setting:** Dense, wall-to-wall distribution-park fabric, directly adjacent
  to I-10. Classed Urban.

## Gate / guard-shack determination
Street View along River Bluff Avenue (panos 2024) shows the RDC truck yard
fully enclosed by a **continuous black metal perimeter security fence**, with
gate sections set into the fence line; the south and SW fence runs are clearly
visible with trailers and yard equipment behind them. Driver reviews of the
facility report a check-in process ("easy and quick check in and out"),
confirming a controlled gated entrance rather than an open driveway.

- **truckGate: TRUE** — fully fenced/gated truck yard, confirmed by Street View
  fence/gate runs plus driver-reported check-in.
- **guardShack: TRUE (flagged uncertain)** — a fenced, check-in-controlled HD
  RDC of this scale runs guard-staffed entry; the booth itself is screened by
  the dense palm/landscaping strip along the fence and was not isolated in a
  clean Street View frame.
- **remoteGs: FALSE** — guard booth assumed present.

## Yard zones & counts
- **Dock doors:** 50+ (~200 estimated, all four faces).
- **Drop area:** 50+ — north drop yard plus south-apron trailer row.
- **Trailers visible:** ~280; **capacity** ~320.
- **Truck gates:** 1 controlled entrance.
- **Buildings:** 1 (neighboring DCs are separate properties).
- **Site area:** ~57 acres (perimeter box ~700 m × ~330 m).
- **Rail:** Not served — east boundary is the I-10 freeway, no spur.

## Other classification notes
- **shipRcvSeparate: TRUE** — dock banks on multiple separate building faces.
- **drivewayLong / preGateStaging / postGateStaging: TRUE** — deep yard
  approach and ample paved staging both before and inside the gate.
- **fastLaneOpportunity: TRUE** — wide divided entrance driveway and generous
  paved yard width give room for an express/bypass lane.
- **scale / multiStep / multipleFacilities: FALSE** — none observed.

## Web findings
HD DC #5087 confirmed as the Redlands RDC (TruckMap, SupplierWiki, HD careers).
Driver reviews note quick check-in — a positive operational signal but still a
gated, controlled process. The facility sits in one of the highest-density
logistics submarkets in the U.S. (the Inland Empire), where YardFlow's
throughput value is high.

## Final confidence
**High.** Building positively identified, imagery clear at z15–z20, four-face
dock layout and dense trailer yard plainly visible, and the perimeter fence /
gated entry confirmed by Street View and driver reviews. Guard-booth presence
is inferred (screened by landscaping) and the lane counts are estimates — both
flagged in `uncertainFields`.
