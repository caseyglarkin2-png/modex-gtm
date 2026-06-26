# Yard Deep-Audit — idx 32 · Riverside Creamery (Kroger)

**Type:** Dairy Plant / refrigerated DC
**Address:** 1500 Eastridge Ave, Riverside, CA 92507
**Resolved center:** 33.929553, -117.30595
**Confidence:** high

## Location confirmation (Step 0)
Supplied coords (33.929003, -117.305168) landed inside a multi-tenant industrial
park. Web search resolved 1500 Eastridge Ave as **Kroger Manufacturing Division –
Riverside Creamery Operations** (also branded Ralphs/Kroger; FCC licenses, Indeed
job posts, Waze/Yelp all confirm). The creamery is the **western parcel**: a large
diagonal (NW–SE oriented) building plus a separate refrigeration/process building
with a tank farm, backed against open scrub hillside to the W/S. Street View
positively confirmed it — a 2017 interior pano shows reefer dock doors numbered
42–45 with refrigerated trailers backed in, and a 2011 pano shows a "Ralphs" /
"DAIRY" monument at the entrance frontage. The big buildings to the N/E are
separate tenants, excluded from the geofence.

## Key views
- **z15/z17 overview:** creamery parcel = main DC building (dock face along NE
  edge, second dock row along SW hillside edge) + process building (tanks/silos)
  + large curved trailer drop yard wrapping the S/SE on a loop road.
- **z18–20 tight:** clear regular dock rhythm on two faces; dense trailer rows.
- **SV entrance (2025-12, pano 7HVO79JCRKo8PIw7jt8Wxw, E perimeter road):**
  sliding gate across the truck drive + a check-in instruction sign; no booth.
- **SV dock (2017, pano CAoSF0NJSE0wb2dLRUlDQWdJQzQ5ZnJHNGdF):** reefer dock doors
  with trailers — used for the perimeter/dock street view.

## Gate / guard / dock determinations
- **truckGate: TRUE** — sliding gate visibly across the entrance drive (SV 2025-12).
- **guardShack: FALSE** — no staffed booth at the entrance.
- **remoteGs: TRUE** — gate with no booth; entrance sign instructs drivers to
  check in before proceeding to a dock = kiosk/self check-in.
- **postGateStaging: TRUE / drivewayLong: TRUE** — deep internal paved yard
  between gate and docks holds a 3+ truck queue.
- **dockDoors: 50+** — two dock banks (NE reefer face + SW row); ~55 doors est.
- **shipRcvSeparate: TRUE** — dock clusters on two distinct building faces.
- **dropYard / dropArea 50+: TRUE** — dedicated trailer-storage lot, dozens parked.
- **multipleFacilities: TRUE** — DC building + separate refrigeration/process plant.
- **urbanRural: Rural** — SW edge of Riverside, bordered by open scrub hillside.
- **scale / multiStep / backupSensitive: FALSE** — none observed.

## Yard zones & counts
- **perimeter:** 10-vertex oriented ring tracing the western creamery parcel
  (fence line / scrub edge), ≈ **30.3 acres**.
- **truckGate:** quad over the gated entrance drive on the E perimeter road.
- **dropYards:** one ring over the curved S/SE trailer parking.
- **dockAprons:** two rings — NE reefer dock face and SW hillside dock row, each
  rotated to the building's true NW–SE angle.
- **yardMetrics:** dockDoorCount ~55, trailersVisible ~70, capacity ~90,
  truckGateCount 1, buildingCount 2, siteAreaAcres 30.3, railServed false.

## Web findings
Kroger Manufacturing Division operates this as the Riverside Creamery (dairy
processing + distribution, Ralphs/Kroger banner). Active hourly manufacturing
hiring; FCC industrial radio licenses on site.

## Final confidence: high
Building positively identified by signage in Street View and matching layout.
Low-confidence counts (dockDoorCount, trailerParkingCapacity) flagged.
