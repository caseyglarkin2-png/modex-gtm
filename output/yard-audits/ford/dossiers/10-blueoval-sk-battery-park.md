# Ford - BlueOval SK Battery Park, Glendale KY — Deep Audit Dossier

**Roster idx:** 10
**Type:** Battery Manufacturing Plant (JV with SK On)
**Resolved center:** 37.58600, -85.88000
**Confidence:** Low

## Location resolution

The roster coordinates (37.601728, -85.905519) point at the town center of
Glendale, KY — not the plant. The BlueOval SK Battery Park sits ~2.4 km
southeast, immediately west of Interstate 65 on the Glendale Megasite. I
located it by stepping back to z13 (which showed a large white-roof building
cluster near the I-65 corridor) and then centering and zooming on the
dual-plant complex. Web research confirmed the identity: BlueOval SK is the
Ford / SK On JV; the Glendale park has two ~4M sq ft battery plant buildings
(~8M sq ft combined). Production officially began Aug 19, 2025; Ford has since
announced the workforce would be idled by Feb 2026 with rehire planned for
2027 after retooling — the plant is built and was operational but is currently
in a retooling pause.

## Imagery caveat

The available Maxar/Airbus satellite tiles capture the campus during its
active construction / early-ramp phase. The two plant buildings have finished
roofs, and employee parking lots on the west side are full of cars (so the
site is staffed in this imagery), but the surrounding ground is still largely
bare graded dirt and construction laydown. The final operational truck-yard,
drop-yard, and gate configuration is not fully built out in the imagery
available, so most layout and count fields are low-confidence estimates and
are flagged uncertain.

## Key views

- **z13/z14 context** — confirmed the dual white-roof plant complex bounded by
  I-65 to the east, set in open farmland.
- **z15-z17 plant views** — two enormous battery plant buildings running
  roughly N-S, employee parking lots full of cars on the west, process/utility
  structures (tank farms, elevated conveyor/pipe bridges) at the south.
- **z18-z19 building faces** — regular dock-bay rhythm visible along the SW
  building's south and west faces; utility tank/process areas at the south.
- **Street View (2025-08)** — along the public perimeter road: chain-link
  perimeter fencing is clearly visible; the plant buildings are set well back
  behind the fence line. No Street View coverage extends into the plant
  property, so the gate structure itself could not be inspected from the road.

## Gate / guard-shack / dock determinations

- **Truck gate: true (low confidence).** Chain-link perimeter fencing confirmed
  along the public road. A secured automotive-JV battery campus of this scale
  operates controlled gated truck access; the exact gate structure could not be
  positively resolved in construction-era imagery.
- **Guard shack: true (low confidence).** A campus of this security profile
  (valuable battery IP, hazardous materials) conventionally runs a staffed
  gatehouse. No booth structure was positively resolved — flagged uncertain.
  remoteGs false as a consequence.
- **Dock doors: 25-50.** Estimated across the two large plant buildings; bay
  rhythm visible on the SW building. Exact count obscured by roof angle and
  construction state.
- **Ship/Rcv separate: true (low confidence).** Two distinct ~4M sq ft plant
  buildings, each with its own dock banks on different faces.

## Yard zones and counts

- **Perimeter:** the developed/fenced plant complex core, ~740 acres. (The
  broader Glendale Megasite parcel is larger, ~1,500+ acres.)
- **Drop yard:** a paved truck/trailer staging area toward the south; banded
  10-25.
- **Dock aprons:** estimated along the SW building face.
- **Buildings:** 6 (two main plant buildings plus multiple process/utility
  support structures) — multipleFacilities true.
- **Rail:** no rail spur into the property; railServed false.

## Web findings

- BlueOval SK = Ford + SK On joint venture; $5.8B combined Ford/SK investment.
- Construction began early 2022, substantial completion Feb 2025.
- Production began Aug 19, 2025; workforce idle/retool announced for Feb 2026,
  rehire 2027.
- Sits on the Glendale Megasite off I-65, Hardin County KY — rural setting.

## Final confidence

**Low.** The facility is positively identified and the perimeter is well
established, but the satellite imagery predates full operational build-out, so
gate, guard-shack, dock, and drop-yard specifics are inferred from facility
type and security profile rather than directly observed. Many fields flagged
uncertain.
