# Deep-Audit Dossier — KB Specialty Foods (idx 45, Kroger)

**Facility:** KB Specialty Foods (Kroger Manufacturing) — Deli/Meat Plant
**Address:** 1225 N Broadway St, Greensburg, IN 47240
**Resolved center:** 39.34955, -85.48590
**Confidence:** high · **Method:** deep-audit

## Step 0 — Location confirmation
Supplied coords (39.349828, -85.485327) landed on the correct property. Web
search confirms KB Specialty Foods is a Kroger Manufacturing deli-salad and
cake-icing plant operating in Greensburg since 1973 (~250-499 employees,
appointment-based deliveries). Satellite shows a single large white-roof food
plant with extensive rooftop refrigeration, an employee parking lot on the
west, and a fenced truck yard on the south/east. The "K.B. Specialty Foods Co"
building sign is visible in Street View at the NE entrance — positively the
right building, not an office or unrelated parcel.

## Key views
- **Wide (z17/z18):** Plant fronts N Broadway (N-S road) on the east; building
  near-square to north with slight tilt. Employee lot to the NW, drop yard and
  dock apron to the south. Water-treatment ponds sit further west (off-site).
- **Dock (z20):** Long south-facing dock wall, trailers backed in on both sides
  of a central building extension — continuous bank, ~32 doors (banded 25-50).
- **Drop yard (z20):** Paved lot full of drop trailers in rows (~9 visible in
  one row) plus XTRA lease trailers staged along the fence; capacity ~35.
- **Street View (Apr 2026):** Chain-link perimeter fence with barbed-wire top
  runs the entire N Broadway frontage; trailers parked just inside it.

## Gate / guard / docks
- **Truck gate: TRUE.** Single truck entrance at the NE corner — a paved drive
  off N Broadway through a gate panel in the barbed-wire chain-link fence, with
  a posted rules / sign-in board at the throat. No barrier arm, but a sliding
  gate in the fence line and a fully fenced perimeter = controlled entry.
- **Guard shack: FALSE → remoteGs TRUE.** No staffed booth structure beside the
  lane in any heading (250/270/180/0) of the Apr-2026 panos; only signage.
  Gated-but-unstaffed implies remote/self check-in.
- **Docks: 25-50.** One continuous south-face dock cluster; ship/rcv not clearly
  separated. Long deep approach inside the gate (drivewayLong, postGateStaging).
- Entry and exit share the one NE gate (entryExitTogether, 1 in / 1 out).

## Yard zones & counts
- **Perimeter:** ~18.7 acres, 7-vertex ring tracing the fenced property
  (employee lot + building + south drop yard), traced to the true near-square
  orientation off N Broadway.
- **truckGate:** small quad at the NE entrance drive.
- **dropYard:** one ring over the south trailer-drop lot (dropYard TRUE).
- **dockApron:** long thin quad hugging the south dock wall.
- dockDoorCount 32 · trailersVisible 22 · capacity 35 · 1 gate · 1 building ·
  rail-served false.

## Web findings
Kroger-owned deli/icing plant, est. 1973, ~$100-500M revenue, 250-499 staff,
appointment scheduling for deliveries; driver reviews note fast unloads.

## Final confidence
**High.** Fresh (Apr 2026) Street View on the entrance and crisp z20 satellite
nailed the gate, fence, drop yard, and dock face. Lower-certainty items
(exact door count, ship/rcv separation) flagged in uncertainFields.
