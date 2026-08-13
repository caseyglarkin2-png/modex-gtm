# Tyson Foods - New Holland Complex, New Holland PA (idx 13)

**Resolved location:** 40.0960, -76.0860 (campus center). Street address **403 S Custer Ave, New Holland, PA 17557**.
**Maps:** https://www.google.com/maps/@40.096,-76.086,400m/data=!3m1!1e3
**Confidence:** high (location and gate/guard-shack calls); several counts are honest overhead estimates, listed below.

---

## How the location was confirmed

The roster coordinate (40.09554, -76.086927, ROOFTOP) was already correct. Two independent confirmations:

1. **Google Places** returns exactly one result for "Tyson Foods New Holland PA": *Tyson New Holland*, 403 S Custer Ave, at 40.09554, -76.0869269.
2. **On-site signage, read from Street View (April 2025).** A brick-and-stucco monument at the S Custer Ave entrance reads **"Tyson - NEW HOLLAND COMPLEX"**, and a blue pylon sign 40 m inside reads **"Tyson - NEW HOLLAND FACILITY, 403 S. CUSTER AVE"**. That is first-party branding on an operating plant, so no web verification was needed (web search was unavailable for this run).

**Excluded from the site:** Savencia Cheese USA / Zausner Foods / Fleur De Lait at **400** S Custer Ave sit on the **west** side of the street, along with the trailer lot beside them. They are a different operator and are outside the geofence.

---

## What each view showed

| View | Finding |
| --- | --- |
| z15 / z16 wide | Plant sits at the south edge of New Holland borough, cropland on three sides. Small-town industrial, not metro. |
| z17 campus | One fenced campus: main processing plant (west/center), a large paved truck yard with trailer rows to the east, a warehouse/freezer inside the yard, a second building group to the south, employee lots on the S Custer frontage and to the south-east. |
| z18 north / z19 yard | The east yard is a deep gravel-and-asphalt trailer field with yard tractors working it. Rows of dry vans and reefers, no live-haul cage trailers, no poultry holding sheds. |
| z19/z20/z21 entrance | The main drive leaves S Custer Ave at 40.09483, -76.08707 and runs ~62 m north-east to a fence line with a gate leaf and a painted island. |
| Street View, S Custer Ave (4 panos, April 2025) | Continuous chain-link fence with privacy slats around the plant and yard. **Employee/visitor parking is outside the fence.** At the entrance: a wayfinding sign with the Tyson mark listing **"Guard House"**, Corporate Office, Receiving & Shipping, Manufacturing. |
| Street View, fov 4.5 deg on the gate | A **small purpose-built booth** with a metal awning roof, windows on multiple faces and Tyson branding, standing beside the gate leaf at ~40.09510, -76.08644. |

---

## Gate / guard-shack determination

**truckGate = true.** The plant proper is fully fenced (chain-link with privacy slats, confirmed from four separate panos along S Custer Ave, including one looking straight across at the fence with employee cars parked outside it). The truck/plant drive passes through a gate in that fence roughly 62 m in from the public road.

**guardShack = true.** Two mutually reinforcing pieces of evidence:
- Visual: a compact booth structure with awning roof, multi-side glazing and Tyson signage sits immediately beside the gate leaf, matching the ~1-vehicle-footprint profile of a guard booth and nothing else on the site.
- Textual: the entrance wayfinding sign explicitly lists **Guard House** as a destination.

**remoteGs = false** (a booth is present).

**backupSensitive = true, flagged.** The drive from S Custer Ave to the gate measures ~62 m, which stacks roughly three tractor-trailers before a queue would reach the public road. Wide paved aprons flank the drive and a second (north) service access exists, so the practical risk is moderate rather than severe. This is the single most sales-relevant geometry finding on the site.

**Second access:** an unguarded service drive enters the north end of the property from the street at ~40.09882, -76.08671. Narrow, crossing a lawn, past a maintenance building. Treated as a back route, not a primary truck lane. `truckGateCount = 2`.

---

## Docks, drop yard, zones measured

- **Perimeter:** 11-vertex ring traced to the fenced/developed campus. **26.2 acres.** Tyson-associated mowed ground and a service building extend further north toward W Jackson St and were left out of the acreage.
- **Truck gate zone:** rotated quad aligned to the entrance drive (bearing ~61 deg), covering road mouth through gate.
- **Drop yards (2):** the east trailer field (2.82 ac) and the plant's south-west trailer apron (1.78 ac).
- **Dock aprons (2):** main plant east face (0.64 ac) and the south building's east face (0.59 ac).
- **dockDoorCount 55, band 50+ (estimate).** Dock banks on the main plant's east and south faces, a separate warehouse/freezer inside the yard, and the south building's east face. 25-35 trailers were seen backed in simultaneously.
- **trailersVisible ~70; trailerParkingCapacity ~110.** Both approximate.
- **dropArea 50+.** A fan of ~18 trailers in the east yard, ~10 on the south-west apron, ~9 at the south building, plus scattered rows.
- **railServed false.** No spur enters the property.
- **scale: recorded false, unverified.** No weigh pad isolated. Worth noting for the sales conversation: **this reads as a further-processing plant, not a live-haul kill complex** - there are no poultry holding sheds and no open-sided cage trailers anywhere on the property, only dry vans and reefers. That changes the yard profile (no live-haul receiving queue) and makes a receiving scale less likely.

---

## Web findings

None. The session's web-search budget was exhausted, so no company pages, news or driver reviews were pulled. Everything above comes from satellite imagery, Street View, the Google Geocoding/Places APIs, and on-site signage. The verification block is marked `confirmed` on the strength of current first-party Tyson signage plus visible operating activity (docked trailers, full yard), with `checkedDivestiture` and `checkedBankruptcyEra` both false.

## Final confidence

**High.** Location unambiguous, gate and guard shack both directly observed. Uncertain: `entryLanes`, `exitLanes`, `scale`, `multiStep`, `backupSensitive`, `dockDoorCount`, `trailerParkingCapacity`.
