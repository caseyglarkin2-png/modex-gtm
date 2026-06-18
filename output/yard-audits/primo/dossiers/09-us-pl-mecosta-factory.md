# US PL Mecosta Factory — Deep Yard Audit

**Facility:** US PL Mecosta Factory (Bottling plant, PL)
**Operator:** Ice Mountain / Nestle Waters North America, now Primo Brands (BlueTriton)
**Address:** 19275 8 Mile Rd, Stanwood, MI 49346 (Mecosta County)
**Locked center:** 43.58110, -85.46640
**Maps:** https://www.google.com/maps/@43.58110,-85.46640,400m/data=!3m1!1e3
**Confidence:** high

## Location resolution
The supplied approximate coordinates (43.5803, -85.2097) carried a wrong longitude and
landed in open farmland roughly 21 km east of the plant. Google geocoding of the street
address returned 43.58243, -85.46877, and satellite imagery there shows the large
(~411,000 sq ft, LEED-certified) Ice Mountain bottling plant — the documented Nestle
Waters / BlueTriton-Primo facility. I locked the building-area center at
43.58110, -85.46640. The plant fronts a county road (8 Mile Rd / a diagonal road) on its
north side; a private truck drive runs south off that road into the yard.

## What the key views showed
- **Wide satellite (z16-z17):** one very large rectangular plant building running roughly
  east-west, slightly rotated (east end dips south). The south wall is a long continuous
  dock bank with trailers backed in; a second dock bank sits on the east/NE face. A big
  dedicated trailer drop yard fills the area east of the building. A separate small cluster
  of white pole-barn warehouses with their own trailers sits immediately NE.
- **South dock (z18/z19):** a long line of dock doors along the south wall with trailers
  backed in, plus a row of trailers/tractors parked in the wide apron below.
- **East end (z18) / drop yard (z18):** dense, multiple long rows of parked trailers
  (no tractors) east of the building — a clear dedicated drop yard, 60-80+ trailers.
- **Street View (pano dM-z9Dmn3ZPJxyeq-N9leg, captured 2025-07):** the public road and the
  mouth of the private truck drive. Looking south down the drive, a chain-link slide/swing
  gate spans the lane ~80 m in, with a perimeter fence line, a stop sign mid-drive, a tall
  light pole, and a card-reader / call-box pole at the gate. The plant building stands
  behind the fence. Google did not drive past the gate.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** A controlled chain-link gate across the private truck drive is
  visible in Street View, with a fence line, signage, and a check-in pole. This is an
  unambiguous controlled checkpoint, not an open driveway.
- **Guard shack — FALSE (low confidence).** No large multi-window staffed booth is visible.
  A small (~1-vehicle-footprint) white-roofed structure sits beside the drive at the gate
  (z21), but it reads as a check-in kiosk / call-box shelter rather than a manned booth.
- **Remote GS — TRUE (low confidence).** There is a gate but no confirmed staffed booth,
  with a visible card-reader / call-box pole and stop sign — consistent with kiosk /
  call-box / card check-in. Paired with the guard-shack call; resolving it definitively
  would need on-site or post-gate imagery (none available).
- **Dock doors — 50+.** The south wall is a continuous long dock bank and the east/NE face
  carries a second bank, both with trailers backed in. Honest overhead estimate ~58 doors.
- **Drop area / drop yard — 50+ / TRUE.** A dedicated east-side drop yard holds 60-80+
  parked trailers in marked rows, distinct from the active dock-apron staging.

## Yard zones and counts measured
- **Perimeter:** ~32 acres of fenced active yard + building footprint (front pond/grass
  buffer to the road excluded); bounding extent ~484 m E-W x ~312 m N-S.
- **Truck gate:** single controlled entrance on the north property line; entry and exit
  share one drive (entry=exit=1 lane).
- **Drop yard:** one large east-side lot (multiple trailer rows).
- **Dock aprons:** two — the long south-face apron and the east/NE-face apron.
- **Metrics:** dockDoorCount ~58, trailersVisible ~105, trailerParkingCapacity ~120,
  truckGateCount 1, buildingCount 2 (main plant + attached NE warehouse mass),
  siteAreaAcres ~32, railServed false (no rail spur).

## Web findings
Documented as the Ice Mountain bottling plant at 19275 8 Mile Rd, Stanwood MI; ~411,000
sq ft, LEED NC 2.0 (2003); operated by Nestle Waters North America (state-permitted
withdrawal ~211M gal/yr, 400 gpm), now part of Primo Brands (BlueTriton). Sources: GBIG
building record, Michigan EGLE permit records (SRN N7149), Yelp/BBB listings.

## Residual uncertainty
- Booth-vs-kiosk (guardShack / remoteGs): the gate is confirmed but no post-gate imagery
  exists to confirm whether the small structure is staffed.
- Exact dock-door count (banded 50+ confidently; precise number uncertain).
- shipRcvSeparate inferred from two distinct dock banks, not from observed function.
- The NE pole-barn cluster is campus-adjacent; treated as a separate operation, so
  multipleFacilities=false for the Ice Mountain plant proper (flagged uncertain).

**Final confidence: high** on location, gate presence, dock and drop-yard scale;
medium-to-low only on the guard-booth-vs-kiosk distinction and exact dock count.
