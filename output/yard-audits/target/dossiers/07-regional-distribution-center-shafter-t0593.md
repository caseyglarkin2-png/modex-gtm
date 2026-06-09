# Deep-Audit Dossier — Target Regional Distribution Center Shafter (T0593)

- **Facility:** Target Regional Distribution Center Shafter (T0593), RDC
- **Address:** 3880 Zachary Ave, Shafter, CA 93263
- **Resolved center:** 35.44514, -119.18478
- **Geocoded input:** 35.444229, -119.184852 (landed on the south face of the correct building; recentered on the building/yard centroid)
- **Confidence:** HIGH
- **Method:** deep-audit (satellite zoom 15-21 + Street View 2026-02 + web)

## Location confirmation
The geocoded point sat on the south edge of a very large warehouse. Web search
confirms 3880 Zachary Ave, Shafter is the Target Distribution Center (phone
661-396-6000); T0593 is Target's internal site code used in its warehouse job
postings. The Walsh Group build record describes this as a **1,000,000 sq ft
automated distribution center on a 99-acre site** (22 acres under roof), the
prototype for Target's national/regional DC series, anchoring the Rita Tech
Park. Satellite shows a single ~600 m x ~725 m walled property with a giant
roof-mounted solar array, a continuous dock-door bank, and a massive
trailer drop yard — unambiguously the Target RDC. My traced perimeter measures
**99.7 acres**, matching the documented 99-acre figure.

## Setting
Edge-of-town Shafter, ringed by orchards and row-crop fields, inside an
industrial park (a neighboring DC with an "ATD" sign sits across Zachary Ave to
the west). Broader setting is **Rural**. No rail spur enters the property.

## Key views
- **Wide (z15/z16):** Single large building, center of the parcel; trailer drop
  yard fills the north; employee parking lot at the south; farmland on the east.
- **West frontage (z17/z18) + Street View (Zachary Ave, 2026-02):** Continuous
  chain-link perimeter fence. One truck driveway opening on the west frontage.
- **Gate close-ups (Street View headings 60-95):** The defining frames — see below.
- **North yard (z17, Street View N):** Hundreds of trailers in marked rows;
  **Target red-bullseye logos clearly visible** on trailers, plus a wide
  turnaround/staging apron at the north end.
- **East/NE/SE corners (z18):** Property bounded by a perimeter road then orchard
  on the east; south road E-W; no rail, no scale.

## Gate / guard-shack / remote determination
- **truckGate = TRUE.** Street View (heading ~75-95) shows a **closed double-leaf
  chain-link rolling/swing gate** across the truck driveway on Zachary Ave,
  flanked by yellow bollards, with the fenced trailer yard and DC building
  beyond. The entire property is fenced. This is a controlled truck entrance.
- **guardShack = FALSE.** There is **no compact lane-side staffed booth**. At the
  gate sits a small tan/gray louvered structure, but the close-up (heading 60)
  shows it is a **utility/electrical enclosure inside its own little fenced pen**
  — no attendant windows or door facing the lane. The larger modular building
  nearby is a **yard/admin office set back behind the perimeter fence**, not a
  guard booth straddling the lane.
- **remoteGs = TRUE.** Gate present, no guard booth -> implies kiosk / app /
  appointment-based check-in, consistent with this being an automated Target
  RDC. (The Walsh "exterior guard house" note in the search results refers to a
  *different* Target DC in North Carolina, not Shafter; the Shafter description
  has no guard house.) Medium confidence on the exact check-in mechanism;
  flagged in uncertainFields.

## Yard zones & counts
- **Perimeter:** 4-corner ring tracing the fenced property line; ~99.7 acres.
- **Truck gate:** small quad at the west driveway opening (~35.4454, -119.1883).
- **Drop yard:** one large ring over the north trailer field (the bulk of the
  parked-trailer storage).
- **Dock apron:** long thin quad hugging the north building wall where trailers
  back into the dock-door bank.
- **Staging:** not separately ringed; the open paved area inside the gate west of
  the trailer rows serves as post-gate staging (postGateStaging = true).
- **Counts (overhead estimates):** dock doors 50+ (est. ~120 across north + west +
  south faces of a 1M sq ft RDC); trailers visible ~350; drop capacity ~450;
  1 truck gate; 1 building; rail-served false.

## Other classification notes
- **postGateStaging / drivewayLong / fastLaneOpportunity = true:** very wide gate
  apron and deep open internal yard — room to queue many trucks and to add an
  express bypass lane.
- **entryExitTogether = true, entryLanes 1:** single combined gate on the west.
- **dropYard = true; dropArea 50+:** dedicated multi-acre Target trailer-storage
  lot, distinct from the active dock apron.
- **scale = false, multiStep = false, multipleFacilities = false,
  shipRcvSeparate = false, backupSensitive = false.**

## Street View metadata
The Zachary Ave pano (~35.4455, -119.1897, captured 2026-02) covers both the
perimeter entrance and the truck gate; heading ~89-95 points east into the gate.
hasCoverage = true for both perimeter and truckGate.

## Web findings
- Walsh Group project page: 1,000,000 sq ft automated DC on a 99-acre site, 22
  acres of roof, three remote office pods (~25,000 sq ft); prototype for Target's
  national/regional DC series; anchors the 137-acre Rita Tech Park, Shafter.
- Target job postings (T0593), TruckMap, TruckerPath all confirm the Shafter DC
  address and truck access.

## Confidence
HIGH overall — facility unambiguous, imagery clear, gate state directly observed
in recent Street View. Residual uncertainty is limited to the exact unmanned
check-in mechanism (guardShack/remoteGs) and outbound-lane count.
