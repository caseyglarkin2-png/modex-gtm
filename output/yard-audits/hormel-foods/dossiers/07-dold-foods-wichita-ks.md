# Deep-Audit Dossier — Dold Foods (Wichita, KS) — idx 07

**Account:** Hormel Foods
**Facility type:** Meat Processing Plant (bacon — retail & foodservice)
**Resolved location:** 2929 N Ohio St, Wichita, KS 67219
**Locked center:** 37.7352, -97.3256
**Confidence:** high

## Step 0 — Location resolution
Roster coordinates (37.736379, -97.325459) landed directly on a large
industrial complex in north Wichita. Despite the geocode note (movedMeters
2004), the pin sat on the correct property. Street View along N Ohio St
shows the building plainly lettered **"DOLD"** — positive ID. Web research
confirmed 2929 N Ohio St, Wichita KS 67219 as Dold Foods, a Hormel bacon
plant (~760 employees, joined Hormel 1984, subject of a $50M / 156,000 sq ft
cooked-bacon-line expansion).

## Key views
- **Wide z16/z17:** Dold sits in a dense industrial district of north Wichita.
  Bounded by N Ohio St on the east, a drainage floodway with a rail line on the
  west, and other industrial parcels north and south.
- **z18 plant:** Large multi-building processing complex; employee parking on
  the NE; trailer drop yard along the west; process equipment scattered.
- **z19/z20 west side:** Two trailer drop-yard clusters (~18-20 trailers) along
  the building's west face, between the plant and the rail/canal corridor.
- **z20 dock faces:** West-facing dock with ~5-6 trailers backed in; a
  north-segment dock with another ~5-6; additional dock banks. Multiple dock
  clusters on different building faces.
- **Street View (captured 2026-02):** N Ohio St frontage. The east building
  wall is solid (no docks). The **south end has the truck entrance**.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** Street View shows a fenced perimeter with sliding
  gates across the truck driveway at the south end off N Ohio St. "Truck
  Entrance / Truck Exit" signage is visible at the entrance.
- **Guard shack: TRUE.** A small booth structure sits on a paved island in
  the entrance driveway, splitting inbound and outbound lanes — clearly
  visible in several Street View frames (headings 270-320°). Classic
  gate + guard-shack setup.
- **Remote GS: FALSE** — a staffed booth is present.
- **Docks:** Multiple dock faces with trailers backed in across the west and
  north building faces. Total estimated **25-50** band (~32 doors). Roof
  imagery is partly overexposed, so the count is a best-effort estimate.
- **Drop yard: TRUE.** Two marked trailer drop-yard clusters along the west
  side of the plant, `dropArea` 10-25 band.
- **Ship/Rcv separate: TRUE (inferred)** — distinct dock clusters on the west
  and north faces.

## Yard zones and counts
- **Perimeter:** ~445 m (N-S) × ~282 m (E-W) ≈ **31 acres**.
- **Truck gate zone:** south entrance off N Ohio St with island guard booth.
- **Drop yards:** two clusters on the west face (between plant and rail/canal).
- **Dock aprons:** west-facing dock apron and north-segment dock apron.
- **Staging:** paved area just inside the south gate before the dock approach.
- **dockDoorCount ≈ 32, trailersVisible ≈ 38, trailerParkingCapacity ≈ 55.**
- **buildingCount 3** (main processing plant + south warehouse + north office).
- **railServed FALSE** — rail line runs in the floodway west of the plant but
  no spur crosses the grass buffer onto the property.

## Web findings
Dold Foods is a Hormel bacon-processing plant in Wichita, KS, employing
~760+ people. The company has expanded with a cooked-bacon line ($50M,
156,000 sq ft, ~380 new jobs reported), making it a major contributor to
Hormel's overall bacon production.

## Final confidence: high
Facility positively identified by on-building signage; the gate and guard
booth are clearly visible in recent (2026-02) Street View. Confidence held
high; the dock-door count is the only soft figure (estimated from overhead
imagery) and is flagged in `uncertainFields`.
