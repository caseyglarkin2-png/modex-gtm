# Deep-Audit Dossier — idx 22

## Mondelez Houston Distribution Center — Houston, TX

**Status: RESOLVED — confidence HIGH** (re-audit of an earlier low-confidence stub)

### Step 0 — Location
Confirmed address: **6903 W Sam Houston Pkwy N, Houston TX 77041** — a
~105,594 SF industrial distribution building in a corporate park fronting
Beltway 8 (W Sam Houston Pkwy N) in NW Houston, near the US-290 interchange.
Google geocode returned a ROOFTOP match at `29.870738, -95.565030`. This is a
**multi-tenant** warehouse — Mondelez is one tenant of the building (other
industrial tenants / FMCSA-registered carriers are also tied to the address).
Locked center: `29.87074, -95.56503`.

### Steps 1-5 — Audit

**Building & layout.** A single rectangular warehouse. Dock doors run along
the **north** face under a dock canopy; the **south** face is a two-story
office with landscaped employee/visitor parking and an open, uncontrolled car
entrance off the public street.

**Docks.** A dock canopy with a regular door rhythm along the north face —
estimated ~22 doors for a ~105k SF warehouse (`dockDoors: 10-25`; count
flagged uncertain). Single dock cluster — ship/receive not separated.

**Truck yard / drop.** The north truck yard is enclosed by chain-link fence
with privacy slats and is heavily used — trailers, tractors, equipment,
lumber and materials, shared with the neighboring building's tenants. A band
of parked trailers without tractors gives a drop area in the 25-50 band
(`dropYard: true`).

**Truck gate.** Street View (Oct 2025) shows the truck-yard entrance on the
NE side as a **sliding chain-link gate** across the truck driveway off the
side street. `truckGate: true`.

**Guard shack.** No staffed guard booth visible at the truck-yard gate — a
sliding chain-link gate only; remote/kiosk check-in inferred
(`remoteGs: true`). `guardShack` flagged uncertain (busy multi-tenant yard;
a small booth could be present but not clearly seen).

**Setting.** Dense NW Houston industrial fabric beside Beltway 8 — **Urban**.

**Geofence.** Perimeter captures the geocoded building and its north truck-yard
share: ~200 m N-S x ~160 m E-W ≈ **7.9 acres**.

**Rail.** No rail spur — `railServed: false`.

### Verdicts
- **Gate verdict:** truck gate present — sliding chain-link gate on the fenced
  north truck yard.
- **Guard-shack verdict:** no guard shack observed — remote check-in inferred;
  flagged uncertain.
- **Confidence:** high.
