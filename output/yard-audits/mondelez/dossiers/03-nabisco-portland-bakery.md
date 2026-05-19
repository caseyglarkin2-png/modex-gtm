# Deep-Audit Dossier — Nabisco Portland Bakery (Portland OR)

**Account:** Mondelez · **Roster idx:** 3
**Type:** Manufacturing — biscuit/cookie bakery
**Address:** 100 NE Columbia Blvd, Portland, OR 97211
**Resolved center:** 45.58110, -122.66520
**Confidence:** Medium

## Location confirmation
Roster coordinate (45.581046, -122.664875) landed on the bakery property.
Satellite probes (z16-18) revealed a large legacy industrial bakery complex
bordered by NE Columbia Blvd on the NE and a multi-track rail corridor on the
SW/S. Web research (OPB, Panjiva, Yelp, Waze) confirms 100 NE Columbia Blvd as
the Mondelez/Nabisco Portland bakery producing Oreo, Ritz, and Chips Ahoy. Locked
center on the main building-complex centroid.

## Key views
- **Wide (z16-17):** Legacy urban plant — large multi-section main building, an
  SE truck-dock building, employee parking to the N/NE, all hemmed by NE
  Columbia Blvd and the rail corridor.
- **South face (z19, 45.5805,-122.666 & 45.5798,-122.664):** Flour silos and a
  rail siding directly along the building wall on the rail-corridor side.
- **SE dock court (z20 + Street View 2025-07):** A dock building with multiple
  truck doors; trucks and trailers backed in; the court is open to a side
  street with no barrier.
- **NE Columbia Blvd frontage (Street View):** Black metal perimeter fence with
  a landscaped buffer; no truck entrance on this face.

## Gate / guard-shack determination
- **truckGate = false (flagged uncertain).** The active truck-dock court on the
  SE side is open-access off a side street — Street View shows trucks/trailers
  at the dock doors with no barrier arm or gate across the truck lane at the
  public road. The main bakery is perimeter-fenced along NE Columbia Blvd, but
  the truck operations themselves use an open driveway. Per the rubric, an open
  driveway with no control = false.
- **guardShack = false (flagged uncertain).** A small square roofed structure
  sits internally near the dock court (~45.5808,-122.6634) — possibly a booth
  or covered checkpoint — but it is not positioned at a road-side controlled
  gate, so it does not satisfy the guard-shack criterion.
- **remoteGs = false** (no truck gate established).
- **drivewayShort = true.** Tight urban site; the dock court connects almost
  directly to the side street.

## Yard zones & counts
- **Perimeter:** S 45.57970 / W -122.66800 / N 45.58250 / E -122.66250 — approx
  33 acres.
- **Truck gate / dock court:** SE dock building area.
- **Drop yard:** trailers at the dock building plus a likely associated
  green-trailer lot just SE across NE Columbia Blvd.
- **Dock doors:** ~18, banded 10-25.
- **shipRcvSeparate = true:** rail receiving (silos) on the south face is
  separate from the SE truck-dock cluster.
- **Rail:** rail siding to flour silos → railServed = true.
- **Buildings:** main bakery + SE dock building + ancillary structures →
  multipleFacilities = true.

## Web findings
OPB / Panjiva / Yelp / Waze: 100 NE Columbia Blvd is the Mondelez/Nabisco
Portland bakery, the company's West Coast biscuit hub, producing Oreo, Ritz,
Chips Ahoy, Wheat Thins, Good Thins, and Premium. A long-running unionized
plant (BCTGM). Exact square footage not published.

## Final confidence: Medium
Facility unambiguously identified and confirmed by web research, but the gate
and guard-shack calls are genuinely uncertain: the SE truck-dock court reads as
open-access from Street View, while the property carries perimeter fencing and
an internal booth-like structure. truckGate and guardShack flagged uncertain;
truck-scale presence and exact drop-yard counts also low-confidence.
