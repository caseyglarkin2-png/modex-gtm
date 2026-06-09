# Deep-Audit Dossier — Stop & Shop Grocery Distribution Center, Freetown MA

- **Account:** Stop & Shop (ADUSA Supply Chain / Ahold Delhaize USA)
- **Facility:** Freetown Grocery (dry) Distribution Center
- **Type:** Grocery Distribution Center
- **Address:** 136 South Main Street, Assonet (Freetown), MA 02702
- **Resolved center:** 41.7798, -71.0945
- **Truck gate:** 41.7792, -71.0924
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

---

## Step 0 — Location confirmation

The supplied coordinates (41.779383, -71.091412) landed on the eastern edge of
the correct campus but east of the buildings. Satellite at z15-16 revealed a
multi-building ADUSA/Stop & Shop distribution campus west of the supplied point.
Web research confirmed this is the **Freetown** campus: a 1.1M-sq-ft grocery
(dry) DC opened 2004 plus a separate **Freetown Fresh** (perishable) DC, both
serving Stop & Shop and now run under ADUSA self-distribution.

The campus holds (per overview imagery):
- **Center / NW building** — the Fresh (perishable) DC. Covered by a sister agent.
- **SE building (largest footprint)** — the **Grocery (dry) DC**, the audit
  target. It dominates the southern half of the campus, with dock faces and
  trailer drop yards on its NE, SW and SE sides.

The two buildings abut at a connector and sit inside one fenced footprint served
by a single guarded truck entrance off the South Main St access drive. This audit
scopes the grocery building, its dock aprons, the drop yards feeding it, and the
shared gate. The grocery building's long axis runs NW-SE, rotated ~30-40 deg off
north; all traced zones follow that orientation.

---

## Key views

- **z15/16 overview** — three structures: a long NW rooftop/parking structure, the
  center Fresh DC, and the large SE Grocery DC. Confirmed campus, not an office.
- **z17 grocery building** — large rectangle, dock lines with trailers backed in
  along SW and NE faces, employee lot to the NE, drop-yard trailer rows on the
  E/SE.
- **z19 dock faces** — continuous bays with trailers on both SW and NE building
  walls; door count clearly in the 50+ band for the grocery building alone.
- **Street View on the access drive (pano 9vK0XofNciTX-CyslbAdOg, 2023-07)** —
  the decisive frame: a staffed guard booth on a center island with barrier
  arm(s) across the truck lanes, lane markings, traffic cones and red checkpoint
  signage. A parked trailer and a pedestrian appear on the approach lane.

---

## Gate / guard-shack / dock determinations

- **truckGate: TRUE.** Controlled truck entrance confirmed in Street View — a
  barrier-arm checkpoint with a center booth island and lane markings where the
  campus access drive meets the public approach off South Main St.
- **guardShack: TRUE.** A small, multi-window, ~1-vehicle-footprint staffed booth
  sits on the gate island beside the lanes. It is a guard shack, not the main
  building.
- **remoteGs: FALSE.** A staffed booth is present, so this is not a kiosk /
  call-box / app-only remote gate.
- **Lanes / flow:** Entry and exit run through the same gate complex
  (`entryExitTogether`). ~2 inbound lanes plus a separate outbound lane split
  around the booth island (exitLanes estimated, flagged uncertain). The wide
  apron and spare paved width give a clear **fastLaneOpportunity**.
- **Staging:** A paved approach long enough to hold a 3+ truck queue
  (`drivewayLong`) outside the booth (`preGateStaging`) and paved holding inside
  the gate before the docks (`postGateStaging`). Not backup-sensitive — the gate
  sits deep on a private drive, not hard against a busy public intersection.
- **dockDoors: 50+.** Long continuous dock lines with trailer rows on both the SW
  and NE faces of a 1.1M-sq-ft DC; estimated ~120 doors attributable to the
  grocery building.
- **dropArea / dropYard: 50+ / TRUE.** Dedicated trailer-storage rows fill the NE
  and SE yards with many bobtail (tractorless) trailers.
- **shipRcvSeparate:** Likely — distinct dock banks on opposite building faces
  (SW vs NE); medium confidence on a formal ship/receive split, flagged uncertain.
- **scale: FALSE.** No clear weigh pad / scale house identified; gate is booth +
  barrier only.
- **multiStep: FALSE.** Single guarded checkpoint; no visible second booth/scale
  stage before the docks.

---

## Yard zones & counts (overhead estimates)

- **Perimeter:** oriented 7-vertex ring traced to the tree/fence line around the
  grocery building and its NE/SE drop yards. ~**38.7 acres** (grocery portion of
  the shared campus).
- **truckGate zone:** rotated quad over the booth island / gate lanes at
  41.7792, -71.0924.
- **dropYards:** two rings — the NE drop yard (east of the building) and the SE
  drop yard — both aligned to the trailer rows.
- **dockAprons:** two rings — the SW dock apron and the NE dock apron — long thin
  quads hugging the building walls at the building's NW-SE angle.
- **staging:** post-gate holding quad inside the gate ahead of the docks.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~180, trailerParking
  capacity ~260, truckGateCount 1, buildingCount 2 (grocery + abutting fresh),
  siteAreaAcres 38.7, railServed false (no rail spur into the property).

streetViewMeta: truckGate has coverage (pano 9vK0XofNciTX-CyslbAdOg, heading
283 deg toward the booth) — the driver's arrival frame. Perimeter centroid is
interior private property and returned ZERO_RESULTS, so hasCoverage is false.

---

## Web findings

- Freetown Grocery: 1.1M sq ft, opened 2004, fulfills grocery demand for the
  Stop & Shop banner; Stop & Shop owns and operates it while ADUSA Procurement
  manages replenishment.
- A separate **Freetown Fresh** (perishable) DC sits on the same Assonet campus;
  perishables joined the ADUSA self-distribution network ~3 months after grocery
  in 2021. This corroborates the two-building / campus-split read.
- Sources: ADUSA Distribution news release; Progressive Grocer; Supermarket News;
  Winsight Grocery Business; Loc8NearMe / Yelp facility listings.

---

## Confidence

**High.** Facility positively identified, the gate and guard shack are
unambiguous in Street View, and dock/drop bands are well-supported by tight
imagery. Lower-confidence items (exitLanes split, formal ship/receive
separation, absence of a scale) are listed in `uncertainFields`.
