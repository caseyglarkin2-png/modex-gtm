# Deep-Audit Dossier — GM Lansing Grand River Assembly (LGR)

**Facility:** GM - Lansing Grand River Assembly, Lansing MI
**Address:** 920 Townsend St, Lansing, MI 48933
**Type:** Vehicle Assembly + Stamping (integrated manufacturing campus)
**Resolved center:** 42.7228, -84.5600
**Confidence:** High

## Step 0 — Identity confirmation

The roster coordinates pointed near downtown Lansing; the first wide probe at
42.7325,-84.5467 landed on Jackson Field (the minor-league ballpark) downtown,
not the plant. Wikipedia gives LGR's coordinates as 42 deg 43'22"N
84 deg 33'42"W (= 42.7228, -84.5617). Probing there immediately resolved the
correct building: a single continuous 3.4M-sq-ft white-roofed manufacturing
complex on the Grand River, hemmed by Interstate 496 on the north and the river
plus a rail line on the south/southwest. This matches the public record: LGR is
a 111-acre integrated assembly + stamping plant opened 2001, currently building
the Cadillac CT4 and CT5, with an on-site logistics/sequencing center.

## Key views

- **Wide (z15-16):** one fenced campus spanning the full frame; finished-vehicle
  marshaling lots on the west and east, employee parking on the perimeter,
  I-496 across the top, Grand River wrapping the south/SW.
- **West lot (z18):** large striped finished-vehicle storage rows + employee
  lots; an access road from the I-496 ramp area feeds the west side.
- **Verlinden Ave Street View (2025-07):** plant building wall on the right with
  a continuous perimeter fence; a signalized, coned, controlled intersection
  ahead at the truck entry — clear gated access, not an open driveway.
- **Internal courtyard (z19):** trailers staged (8-10 visible) on internal
  paved lanes between connected building masses, with a covered conveyor/ped
  bridge spanning the drive — docks face these internal courtyards.
- **SW rail edge (z18-19):** an active rail line runs along the river bank on
  GM property with a spur and rail-served trailer/container staging.
- **North face (z19):** I-496 and its overpass form the hard north boundary;
  dock doors/trailers sit along the building's south-of-freeway face.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Verlinden Ave SV shows continuous perimeter fencing and
  a signalized controlled entry; satellite shows internal lane markings and a
  pinch-point where the main drive meets the courtyard. A guarded GM assembly
  campus, not an open site.
- **guardShack = true.** Controlled gates on a guarded auto-assembly campus
  carry staffed booths at the main truck/employee entries; booth-scale
  structures present at the entries. remoteGs = false accordingly.
- **dockDoors = 25-50 (est. ~45).** Docks are distributed across multiple
  connected building faces and internal courtyards (assembly, body, stamping,
  logistics center); some are tucked between building masses, so the count is
  an honest band estimate.
- **dropArea / dropYard = true, 25-50.** A west-central paved lot holds parked
  trailers next to a dirt parcel, plus trailer/container rows along the SW
  rail/river edge — dedicated trailer storage distinct from active dock staging.

## Yard zones and counts measured

- `perimeter`: 8-vertex ring tracing the fenced footprint between I-496 (N),
  Verlinden/Townsend (E), and the Grand River + rail (S/SW). ~111 acres.
- `truckGate`: quad over the Verlinden-side controlled entry/courtyard pinch.
- `dropYards`: (1) west-central trailer lot; (2) SW rail-edge trailer staging.
- `dockApron`: internal-courtyard apron strip in front of the central docks.
- `yardMetrics`: dockDoorCount 45, trailersVisible 22, trailerParkingCapacity
  70, truckGateCount 2, buildingCount 4, siteAreaAcres 111, railServed true.

## Web findings

- Wikipedia / GM facility pages: 3.4M sq ft, 111 acres, opened 2001, body +
  paint + general assembly + on-site stamping; builds Cadillac CT4/CT5.
- Automotive Logistics / GM: a $44.5M logistics optimization & sequencing
  center coordinates inbound supplier (JIT) logistics on site.
- Operating profile: the plant cycles inbound trucks every few minutes during a
  build day; a stranded/late JIT trailer at the gate is an hour-by-hour problem
  — a high-velocity, gate-controlled yard, a strong YardFlow fit.

## Final confidence

**High.** Building identity is unambiguous (river + I-496 + rail signature,
matches 111-acre public footprint). Gate, fencing, rail, drop yards, and the
integrated multi-building campus are all visually confirmed. Dock count,
entry/exit lane counts, truck-scale presence, and the multi-step checkpoint are
estimates/uncertain and flagged in `uncertainFields`.
