# Quaker Oats - Columbia MO — Deep-Audit Dossier (idx 25)

**Address:** 4501 Paris Rd, Columbia, MO 65202
**Locked center:** 38.99655, -92.28245
**Maps:** https://www.google.com/maps/@38.99655,-92.28245,400m/data=!3m1!1e3

## Location confirmation
Roster geocode (ROOFTOP, 38.996817,-92.282298) landed directly on a large white-roofed
manufacturing building on the west side of Paris Rd (US-63 business) on Columbia's NE
industrial edge, with an active rail corridor on the west property line and a truck-stop
travel plaza to the south. Layout (single large plant + dedicated trailer field + long
dock wall) is fully consistent with the Quaker rice-cakes plant. Street View from the
entrance drive (pano captured 2026-04) shows trailers and plant structures matching the
overhead. Confirmed; no relocation needed.

## Key views
- **z17/z18 overview:** one large plant building (~300k+ sq ft) oriented ~15-20 deg off
  north; employee car lot NE; long dock wall on the E/SE face; large trailer field S.
- **Entrance (z19-z21 + SV):** single shared truck/car driveway off Paris Rd at
  ~38.9954,-92.2820. The mouth at the public road is open (no barrier, no booth —
  confirmed from the 2026-04 Street View pano sitting on the drive). ~70m up the drive,
  z21 imagery shows a **fence line crossing the truck lane with gate posts/hardware on
  both sides — a sliding gate** at 38.99572,-92.28219. No booth-sized structure beside
  it -> gate + no guard shack -> remote/badge check-in (`remoteGs: true`).
- **Docks (z19/z20):** one continuous dock bank along the E/SE wall; ~20 trailers backed
  in, door rhythm implies ~25-30 doors. Band **25-50**.
- **Trailer storage:** marked trailer rows S of the plant (~40 stalls, ~25-30 trailers
  parked) plus herringbone stalls E of the apron (~20 stalls). `dropArea: 50+`,
  `dropYard: true`.

## Determinations
- **truckGate: TRUE** — sliding gate across the inner drive (overhead evidence only;
  flagged in uncertainFields since no ground view of the gate exists).
- **guardShack: FALSE** — no booth at the gate or the road mouth.
- **remoteGs: TRUE** — gate present, unstaffed.
- Entry/exit together, 1 lane each; long post-gate approach (3+ truck queue fits);
  big paved yard inside the gate (`postGateStaging: true`); generous setback from the
  divided highway -> not backup-sensitive.
- **Rail:** corridor adjacent W but no spur enters the property -> `railServed: false`.
- **Setting:** edge-of-town industrial strip, farmland across the highway -> Rural;
  no connectivity concern (inside Columbia metro fringe).

## Zones traced
- Perimeter: 5-vertex ring following Paris Rd ROW (E), neighbor lot line (N), rail
  corridor (W), tree line/fence above the travel plaza (S). ~13 acres.
- truckGate quad on the sliding gate; dock apron strip hugging the E dock wall at the
  building's rotation; 2 drop-yard rings (S trailer field, E herringbone stalls).
- Street View: best pano `aXBKDKxqJWWlf1oP390Azg` (on the entrance drive at Paris Rd).

## Web context
Roster source: Columbia Chamber listing + COMO Business Times; named by PepsiCo (Food
Dive, Apr 2024) as a receiving plant for production shifted from the closed Danville IL
plant — consistent with the busy trailer field observed.

## Verdict
Gate: sliding gate on the inner drive, open at the road. Guard shack: none (remote
check-in). Confidence: **high** (gate/booth calls from clear z20-z21 overhead; dock
count is an overhead estimate).
