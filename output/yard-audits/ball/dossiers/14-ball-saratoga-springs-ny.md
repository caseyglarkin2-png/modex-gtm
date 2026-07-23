# Ball - Saratoga Springs NY — Deep Yard Audit

**Type:** Beverage Can Plant (bodies) · **Confidence:** high
**Resolved center:** 43.0616, -73.8255 · [satellite](https://www.google.com/maps/@43.0616,-73.8255,400m/data=!3m1!1e3)
**Address:** 11 Adams Rd, Cady Hill Industrial Park, Saratoga Springs, NY 12866 (accessed off Weibel Ave)

## Verification (Step -1) — CONFIRMED
Ball's own Feb-2025 locations map lists Saratoga Springs NY. Corroborated by multiple "Ball Metal Container" business listings at the Cady Hill Industrial Park / 11 Adams Rd. Long-running plant, not among Ball's closures. Owner-operated.

## Location resolution (Step 0)
Roster gave no coordinates and flagged that 33 Cady Hill Blvd is a **dunnage** node, not necessarily the plant. Web search + Waze resolved the plant to **11 Adams Rd** (Ball Metal Beverage Container); "11 Adams Rd" geocoded rooftop to 43.0619, -73.8252. Satellite confirmed a large dark-roof manufacturing hall + attached process/office building in the Cady Hill park. (33 Cady Hill Blvd is a separate warehouse building to the north — the dunnage node — not this audited site.)

## Views
- **z17/z18:** a large dark-roof main hall (long axis ~N-S, slightly rotated) joined to a grey/white process+office building on the east; an interior SE truck court holds a dock apron with trailers; a second dock apron + trailer staging runs along the SW perimeter drive; employee parking to the SE; a municipal rec park (ballfields, tennis) across Weibel Ave to the south; wooded buffer to the west.
- **z19 entrance:** the drive off Weibel Ave splits to the truck court and the employee lot; no guard booth or barrier arm at the throat.
- **Street View (Mar 2022):** chain-link perimeter fencing along the property; plant set back behind a tree line.

## Gate / guard / docks
- **Truck gate:** FALSE (flagged medium) — perimeter fencing exists, but the truck drive opens off Weibel Ave with no visible guard booth or barrier arm.
- **Docks:** ~20 doors **split across two faces** — the interior SE court (between the two buildings) and the SW face of the main hall → `shipRcvSeparate` true (flagged). Band **10-25**.
- **Drop / staging:** trailer staging along the SW perimeter drive (`dropYard` true), ~14 visible, capacity ~38. Internal court before docks (`postGateStaging`, `drivewayLong` true); set back, not backup-sensitive.

## Yard metrics
Dock doors ~20 (10-25) · trailers visible ~14 · capacity ~38 · gates 1 · buildings 2 (main hall + process/office) · ~35 acres · **rail: none into site** (park rail line to the E, no spur).

## Setting
SW edge of Saratoga Springs (small city) in a wooded industrial park abutting a rec park → **Rural** (edge-of-town). Cell coverage fine. `multipleFacilities` false (the nearby 33 Cady Hill dunnage warehouse is a separate parcel).

## Final confidence: high
Building and operator unambiguous and well-verified. Flagged: open gate call, ship/rcv split, exact dock count/acreage are overhead estimates.
