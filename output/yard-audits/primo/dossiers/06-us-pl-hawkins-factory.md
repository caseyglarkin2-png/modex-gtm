# Deep Audit — US PL Hawkins Factory (Ozarka / Primo Brands bottling plant)

**Type:** Bottling plant (PL)
**Locked center:** 32.66655, -95.19120
**Address:** 3265 S FM 2869, Hawkins, TX 75765 (Wood County)
**Maps (satellite):** https://www.google.com/maps/@32.66655,-95.19120,400m/data=!3m1!1e3
**Confidence:** high (site ID and yard layout); the gate call is low-confidence (no ground-level coverage)

---

## How the location was confirmed

The supplied approximate coords (32.5690, -95.2150) landed in empty East Texas
timberland SW of Hawkins. Geocoding the literal street number "3265 (S) FM 2869"
returned 32.7516, -95.1898 — also empty timber, because rural FM-road street-number
interpolation is unreliable. Probing both points (z15-z17) showed only forest,
pasture, and the US-80 corridor, no plant.

The plant was resolved by geocoding the **named place "Ozarka Plant, Hawkins TX"**,
which returned **32.6668, -95.1925** and landed directly on a single very large
light-blue-roofed industrial building set in cleared timberland NE of Hawkins.
Web research corroborates: this is the **Ozarka / Primo Brands (BlueTriton) Wood
County spring-water bottling plant**, a ~618,000 sq ft facility on S FM 2869 that
was rebuilt and reopened after a 2023 tornado. The building footprint, the two
water-treatment ponds at opposite corners, the process tanks/silos, and the
spring-water context all match. Center locked at 32.66655, -95.19120.

## What the key views showed

- **Wide z16-z17 (full site):** One dominant manufacturing/DC building, roof rotated
  ~35° (long axis NW→SE), with an attached office annex and curved employee parking
  at the W corner. A long internal paved drive runs NW from the building to an
  unpaved perimeter ring road; the ring road connects out to the public road network
  to the W. Water-treatment ponds sit at the SW and SE corners.
- **z18 (building detail):** Stepped L-shaped mass — larger NE wing + SW wing. Dock
  apron strip and a covered dock canopy on the SE/E face beside the process tanks;
  trailers backed along the long SW wall.
- **z19/z20 SW wall + west-office crops:** Continuous dock bank along the long
  SW-facing wall with trailers backed in, plus the SW drop yard immediately below it.
- **z20 drop-yard crops:** 8-10 long marked rows of trailers parked without tractors
  — a large dedicated drop yard.
- **z19/z20 north-junction crops:** The internal drive meets a dirt perimeter road
  crossed by electrical/transmission pylons. **No barrier arm, gate, or guard booth.**
- **z20 east crop:** Cleared brush and a dirt track beyond the building — empty
  company land, no fence line, no rail.

## Gate / guard-shack / dock determinations

- **Truck gate — FALSE (low confidence).** No barrier arm, sliding/swing gate, or
  checkpoint pinch-point is visible at any captured point, including the internal-drive /
  perimeter-road junction. The site is protected by remoteness (deep private timber,
  ~1.5 km off the nearest public road) rather than a physical gate. Caveat: a manned
  or arm gate could sit further out along the private approach beyond the frames, and
  there is **zero Street View coverage within ~1.5 km** (the nearest pano, 32.6649/
  -95.2048, dated 2023-05, shows only open ranch pasture). Flagged uncertain.
- **Guard shack — FALSE.** No booth-sized structure (1-3 vehicle footprint,
  multi-side windows) at the entrance or perimeter junction.
- **Remote GS — FALSE.** No confirmed gate, so no inference of kiosk/app check-in.
- **Dock doors — 50+.** Continuous dock bank along the ~300 m+ SW wall plus a second
  bank on the SE/E face (covered canopy by the process tanks). Honest estimate ~55
  total; exact count obscured where trailers occlude doors. Flagged.
- **Ship/receive separate — TRUE (medium confidence).** Two physically distinct dock
  clusters on different building faces; function not confirmable from imagery.

## Yard zones and counts measured

- **Perimeter:** 10-vertex oriented ring tracing the cleared/built footprint inside
  the perimeter road → **60.5 acres** (shoelace from the polygon). Surrounding
  company timber/spring land is far larger but is forest, not yard.
- **Truck gate zone:** small quad at the internal-drive / perimeter-road junction
  (the only entrance), traced for reference even though no physical gate is present.
- **Drop yard:** one large oriented ring over the SW trailer-storage lot.
- **Dock aprons:** two oriented quads — the long SW-wall apron and the SE/E-face apron.
- **Staging:** the internal paved apron wrapping the S/E of the building between the
  dock banks and the drop yard (postGateStaging = true).
- **yardMetrics:** dockDoorCount ~55 (50+ band); trailersVisible ~120; trailer
  parking capacity ~160; truckGateCount 1; buildingCount 2 (main + office annex);
  siteAreaAcres 60.5; railServed false.
- **Other flags:** drivewayLong (long internal approach + deep apron), entryExitTogether
  (single shared drive), fastLaneOpportunity (very wide, lightly-used aprons),
  dropYard true, scale false, multiStep false, multipleFacilities false,
  urbanRural Rural, connectivityIssue true (isolated → likely weaker cellular).
  Street-View coverage: none for any zone (hasCoverage false).

## Web findings

- Operator: Ozarka brand under **Primo Brands** (formerly BlueTriton); the Wood
  County spring-water bottling plant near Hawkins.
- Scale: reported **~618,000 sq ft**, consistent with the large single footprint.
- Recent history: damaged by a 2023 tornado and rebuilt/reopened ~7 months later —
  explains the modern roof and freshly graded surrounds visible in imagery.

## Final confidence

**High** on site identification and yard layout (docks, drop yard, aprons, acreage,
no rail). **Low** specifically on the gate/guard-shack determination — no ground-level
imagery exists within ~1.5 km to confirm or rule out a controlled entrance further out
the private drive. Dock-door count and ship/receive split are medium-confidence
estimates and are flagged in `uncertainFields`.
