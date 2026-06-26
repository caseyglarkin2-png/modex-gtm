# Deep-Audit Dossier — idx 62 — Ralphs Distribution Center, Paramount CA

**Facility:** Ralphs Distribution Center (Kroger family grocery DC)
**Address:** 14900 Garfield Ave, Paramount, CA 90723
**Resolved center:** 33.899300, -118.166450
**Method:** deep-audit (satellite + Street View + web) · **Confidence:** medium

## Step 0 — Location confirmation
Supplied coords (33.899493, -118.166962) landed directly on a very large
solar-paneled warehouse roof. Web search confirmed 14900 Garfield Ave =
Ralphs/Kroger Distribution Center (Yelp, TruckMap, Waze, worldorgs). The
building grid is N-S/E-W aligned with the Paramount street grid; Garfield Ave
is the true-N-S western boundary, a freight rail line is the eastern boundary.
Positively identified as a large grocery DC campus (not an office/unrelated
property).

## Layout (satellite)
A sprawling, contiguous multi-building grocery DC mass between Garfield Ave (W)
and the rail (E):
- **North dock warehouse** — long E-W building, dock doors on both faces with
  trailers backed in along a deep apron.
- **Central solar building** — enormous rooftop-PV warehouse, docks on its
  north and south faces.
- **Southern warehouse(s)** — additional large buildings with internal drive
  aisles continuing south to ~33.8975.
- **East drop yard** — a large angled-parking trailer-storage lot running along
  the rail (NE-corner imagery shows dozens of dropped trailers).
The adjacent multi-tenant complexes to the north (14506 "TF Foods" etc.) and
the business park south of the campus are separate and excluded.

## Gate / guard-shack determination
- Street View has **zero internal coverage** — the only available pano is on the
  public Garfield Ave frontage (pano `b6V54sa-LfWWxXZiS3Ozuw`, 2025-05), which
  shows a landscaped office/employee frontage, not the truck gate. The car
  could not enter the property = the campus is **secured/gated**.
- **Driver reviews** (TruckMap/Yelp) explicitly describe **waiting at the
  security gate** and being turned away without a hi-vis reflective vest →
  a controlled, staffed truck entrance with check-in.
- Verdict: **truckGate = true**, **guardShack = true** (staffed check-in
  inferred from driver accounts; a discrete booth could not be confirmed
  overhead, so medium confidence). remoteGs = false. The exact gate point could
  not be imaged, so the truckGate geofence is left **null** rather than guessed;
  streetViewMeta points the Garfield frontage pano toward the property.

## Docks, yard, counts
- **dockDoors: 50+** — multiple large dock banks across the campus faces.
- **dropArea: 50+ / dropYard: true** — the east rail-side angled trailer yard.
- dockDoorCount ~220, trailersVisible ~180, capacity ~250 (honest overhead
  estimates; flagged).
- **multipleFacilities: true** — 3+ contiguous warehouse buildings.
- **shipRcvSeparate: true** — docks on physically separate building faces/banks.
- **scale: false**, **multiStep: false** (none confirmed).
- **railServed: false** — rail is the boundary, no spur into the yard.
- **urbanRural: Urban** — dense LA-metro (Paramount) industrial fabric.
- **siteAreaAcres ~30** — traced contiguous warehouse+drop-yard core between
  Garfield and the rail.

## Web findings
14900 Garfield Ave, Paramount CA 90723; Kroger/Ralphs grocery DC; hours ~04:00-
00:00 daily; lumper fees; no overnight parking; security gate with vest
enforcement and check-in wait (TruckMap/Yelp driver reviews).

## Final confidence: medium
Building/site identity and the secured-gate + large-drop-yard determinations are
solid; the precise gate geometry, booth presence, and exact lane counts are
inferred (Street View cannot enter the property) and are listed in
uncertainFields.
