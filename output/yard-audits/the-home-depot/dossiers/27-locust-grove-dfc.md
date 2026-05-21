# Deep-Audit Dossier — Home Depot DFC, Locust Grove GA (idx 27)

**Facility:** Home Depot Direct Fulfillment Center (DC #6705)
**Address:** 2400 Highway 155 South, Bldg 200, Locust Grove, GA 30248
**Resolved coordinates:** 33.37055, -84.18450
**Confidence:** High

## Location confirmation
The supplied roster coordinate carried a large geocode error (ROOFTOP flag but
moved 8,852 m — the geocoder snapped to the wrong rooftop). Stepping out to
zoom 14 over the Locust Grove / McDonough logistics corridor and walking in,
the HD Direct Fulfillment Center resolves to a very large distribution
building at roughly 33.3705, -84.1845, alongside a second large DC, fronting
Hwy 155 South in the Gardner Logistics Park area of Henry County. HD opened
its first e-commerce DFC here in 2014-2016 (~1.6M+ sq ft across the campus per
HD press / Henry Herald coverage). Zoom 16-18 imagery shows the building with
extensive trailer fields and HD-spec trailers (white bodies, teal/green
roofs). Location positively identified; coordinates re-derived from imagery.

## Key views
- **Zoom 14 wide:** The Locust Grove industrial corridor holds many DCs; the
  HD DFC campus sits SW of the densest cluster, two large white buildings.
- **Zoom 16-17:** Main DFC building runs E-W with a huge trailer-storage field
  along the north edge, a long dock apron south, and a car parking lot plus a
  small office structure mid-campus. Truck circulation wraps the buildings.
- **Zoom 18 tight:** Dock doors with trailers backed in on both long faces;
  trailer rows in the north field; HD-livery trailers confirm the tenant.
- **Street View (Hwy 155, 2025):** Two-lane rural highway with trucks parked
  on the shoulder near the DFC access road and a free-standing site sign.

## Gate / guard-shack determination
- **truckGate: true.** The campus is fully fenced; controlled truck entrances
  off the perimeter road feed a fenced truck court. Truck circulation is
  internal and gate-controlled.
- **guardShack: false / remoteGs: true.** No staffed booth positively resolved
  at the entrances; classified as remote kiosk / app check-in. Lower-confidence
  — flagged in uncertainFields.
- **multiStep: false** — no second checkpoint visible.

## Yard zones & counts
- **Perimeter:** ~105 acres enclosing the two-building campus and trailer yards.
- **Dock doors:** 50+ band — dock banks on multiple building faces.
- **Drop area / drop yard:** 50+ band; a very large dedicated trailer-storage
  field north plus apron staging; 250+ trailers visible.
- **multipleFacilities: true** — two large distribution buildings on the
  campus (the original DFC plus an adjacent later building).
- **Ship/receive separate:** true — distinct dock clusters on opposing faces.
- **railServed:** false.

## Web findings
HD press releases and Henry Herald confirm the Locust Grove DFC as HD's
first e-commerce direct fulfillment center (~100K SKUs, opened 2014-2016,
later expanded). The Gardner Logistics Park / Scannell development context
explains the multi-building campus footprint.

## Final confidence: High
Facility type and campus layout are unambiguous despite the bad supplied
geocode. Soft calls: guard-shack vs. remote-kiosk, exact lane counts, and
whether the second building is fully HD-operated (treated as part of the
campus).
