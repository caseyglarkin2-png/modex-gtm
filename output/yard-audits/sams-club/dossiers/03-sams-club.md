# Deep-Audit Dossier — Sam's Club Distribution Center, Lakeland FL (idx 3)

**Resolved location:** 28.0763, -81.8972 (operating-block center)
**Address:** 3010 Saddle Creek Rd, Bldg 19, Lakeland, FL 33801 — Sam's Club DC 8229, operated by 3PL Saddle Creek Logistics
**Method:** deep-audit (satellite probe.ts + Street View + web)
**Confidence:** high

---

## Step 0 — Confirming the exact building

The supplied coordinates (28.075673, -81.899074) landed inside the **Saddle Creek
Logistics campus**, a very large multi-tenant 3PL site that runs as a long N-S
string of warehouses along Saddle Creek Rd on the eastern edge of Lakeland. The
campus is over a mile long, so "3010 Saddle Creek Rd" alone does not identify the
Sam's Club building — I had to isolate the Sam's Club / Walmart-dedicated DC block.

Confirmation evidence:
- **Street View, internal Saddle Creek Rd (heading W, ~28.0750,-81.8957):** the
  drop-yard fence is lined with trailers carrying the **Walmart "spark" logo**
  (Sam's Club is a Walmart, Inc. division) plus **Saddle Creek** 3PL trailers —
  the operator-and-tenant signature of this exact block.
- **SupplierWiki / Saddle Creek release:** Sam's Club DC 8229 receiving is c/o
  Saddle Creek Corp at 3010 Saddle Creek Rd (Bldg 19).
- The block has the heaviest dock/trailer activity on the campus, consistent with
  an active retail-club DC.

Locked operating block: main DC building + its drop yard + a N-S cross-dock
finger building, bounded by the rail buffer / building west wall (west), the
internal-road drop-yard fence (east), the office/employee-parking edge (north),
and a drainage canal (south).

---

## Key views

- **z15/z16 wide:** confirmed the mile-long campus; pinned the operating block at
  mid-campus just N of the signalized internal intersection.
- **z18/z19 block:** main DC building (docks on both W and E faces) + a long dark-
  roofed cross-dock finger with trailers backed on both sides; dense drop rows.
- **z20 gate (28.0772,-81.8966):** a **hip/pyramid-roofed guard booth sitting in
  the median island** between the inbound and outbound truck lanes; trucks queued
  on both approaches; fenced drive with lane markings.
- **Street View (gate pano yOhYGx5dBt43nJbNqvT22g, 2024-01):** low canopied
  gatehouse straddling the lane, perimeter chain-link, wide apron — confirms the
  controlled checkpoint from the ground.
- **Street View (drop-yard fence):** Walmart + Saddle Creek + carrier trailers
  three-deep behind chain link along the internal road.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled checkpoint: median booth, fenced drive, lane
  markings, two-sided truck queue. Not an open driveway.
- **guardShack = true.** Small hip-roofed booth in the lane median (≈1-2-space
  footprint, multi-side), distinct from the main building. Confirmed in z20
  satellite and ground-level Street View.
- **remoteGs = false** (a staffed shack is present).
- **dockDoors = "50+".** The main building carries dock banks on both its west and
  east faces and the cross-dock finger has doors on both sides — well over 100
  doors total (estimate ~140).
- **dropArea = "50+" / dropYard = true.** Hundreds of parked drop trailers in
  dedicated rows; ~320 visible, ~420 capacity.
- **shipRcvSeparate = true.** Two distinct dock clusters on different faces plus
  the separate cross-dock building.
- **fastLaneOpportunity = true.** Wide gate apron with room for an express bypass.
- **backupSensitive = false.** Gate sits deep inside the campus, far from the
  public road, with vast internal stacking room.
- **multipleFacilities = true.** One block within a much larger multi-building
  3PL campus.
- **multiStep = false / scale = false.** Single checkpoint; no second booth or
  truck scale identified in the gate path (both flagged uncertain).

---

## Yard zones & counts

- **perimeter:** ~26.3 acres operating block (main DC + drop yard + cross-dock).
- **truckGate:** quad over the median guard booth and its two lanes.
- **dropYards:** the dense trailer-storage lot east of the main building.
- **dockAprons:** two long thin quads hugging the main building's west and east
  dock faces.
- **staging:** post-gate paved holding area just inside the checkpoint.
- **yardMetrics:** dockDoorCount ~140, trailersVisible ~320, capacity ~420,
  1 truck gate, 3 buildings, 26.3 acres, railServed false (rail runs along the
  campus west edge but no spur enters this DC's docks).

Street View coverage exists on the internal road, so both perimeter
(pano jnVJdZH8DV4CYemTd3sUXg, heading 282°) and truckGate
(pano yOhYGx5dBt43nJbNqvT22g, heading 278°) render a driver's-eye frame.

---

## Web findings

- Saddle Creek Logistics (sclogistics.com, HQ Lakeland) operates the Sam's Club
  DC at this address; phone (863) 665-0966.
- Listed as Sam's Club DC 8229 in supplier receiving directories; driver reviews
  describe organized unloading with ~2-hour turn times.

## Confidence

**High.** Building positively identified by branded trailers + supplier records;
gate and guard shack confirmed in both overhead (z20) and ground-level imagery.
Door/trailer counts and lane counts are honest overhead estimates (flagged in
uncertainFields).
