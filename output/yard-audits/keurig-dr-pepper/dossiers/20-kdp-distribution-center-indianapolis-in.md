# Deep-Audit Dossier — KDP Distribution Center, Indianapolis IN (idx 20)

## Resolved location
- **Facility:** KDP Distribution Center — Indianapolis, IN (Beverage/DSD)
- **Address:** 8150 Georgetown Rd, Indianapolis, IN 46268 (Park 100 industrial area, NW side of metro)
- **Locked center:** 39.90270, -86.24190

The roster supplied only an "APPROXIMATE" geocode at the Indianapolis city
center (39.76909, -86.158018) — the geocoder reported it moved 12.8 km, i.e.
it never resolved a real building. Web research (Yahoo Local, Superpages,
Yellowpages, Foursquare "Park 100") identified the Dr Pepper Snapple Group /
KDP beverage distribution site at **8150 Georgetown Rd, Indianapolis, IN
46268**. Nominatim geocoded that address to a building footprint at
39.9029, -86.2419. Satellite probing found a large single-story warehouse
there, and a Street View frame on Georgetown Rd shows the building front
clearly lettered **"DR PEPPER SNAPPLE"** with the **"8150"** street number —
positive identification.

Note: an early search hit ("Quandel — 92-acre former Kraft-Heinz campus,
730k SF DC + 811k SF plant") is the **Allentown PA** facility (7350
Industrial Blvd — roster idx 4), NOT Indianapolis. It was discarded.

## What the key views showed
- **Wide satellite (z17-18):** A single rectangular property. The white-roof
  KDP warehouse sits center, oriented slightly off-axis (long faces NW/SE).
  A loop driveway encircles the building. Employee car parking lines the
  east face; trailer parking and the dock apron are on the west/NW.
- **West side (z20):** A row of ~30-40 marked trailer-drop stalls runs along
  the property's west edge against a retention pond — trailers parked
  nose-out, no tractors. A dedicated drop yard.
- **NW building face (z20):** Trailers backed against the building on dock
  doors; at least one orange yard tractor visible. This is the active dock
  apron. Estimated ~22 dock doors (band 10-25).
- **East face (z20 + Street View):** Employee car parking only — this is the
  office side, no docks.
- **NE entrance (Street View 2024-10):** Open paved driveway from Georgetown
  Rd into the property/parking lot. No barrier arm, no sliding gate, no
  guard booth, no pinch-point. Free-flowing curb cut.
- **NW yard (z20):** A large open paved expanse with a circular landscaped
  island — substantial internal truck maneuvering / staging area.

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE.** Every probed entrance is an open driveway. A
  chain-link fence runs along part of the east property line but no
  controlled gate crosses any truck lane. Street View of the NE entrance
  confirms an uncontrolled curb cut.
- **Guard shack — FALSE.** No booth structure beside any entrance in
  satellite or Street View.
- **Remote GS — FALSE.** No gate, so no remote check-in inference.
- **Dock doors — 10-25 band (~22).** On the NW long face; trailers backed in
  confirm the dock bank. Count is an overhead estimate (flagged uncertain).
- **Drop area — 25-50 band.** Dedicated west-side drop row, ~30-40 stalls.

## Yard zones and counts
- **Perimeter:** ~35.7 acres (property box ~434 m N-S × ~333 m E-W).
- **Drop yard:** west-side trailer row, ~45-trailer capacity estimate.
- **Dock apron:** NW building face strip.
- **Staging:** large open paved yard NW of the building (post-gate, internal).
- **Trailers visible:** ~28 across drop row + dock apron.
- **Buildings:** 1 (neighboring large buildings are separate properties).
- **Rail-served:** no — no spur enters the property.

## Web findings
- Multiple business directories list **Dr Pepper Snapple Group / Keurig Dr
  Pepper** at 8150 Georgetown Rd, Indianapolis IN 46268, classed as a
  beverage distributor / food wholesaler ("Park 100" location).
- Indeed lists Indianapolis among KDP's Indiana office locations; the site
  functions as a regional DSD beverage distribution center.

## Final confidence
**High.** Facility positively identified by on-building signage and street
number. Layout, docks, drop yard, and open (un-gated) entrance all read
clearly from current imagery. Dock-door count and exact lane counts are
honest overhead estimates and are flagged in `uncertainFields`.

- Gate verdict: **No truck gate** (open driveways)
- Guard-shack verdict: **No guard shack**
- Confidence: **high**
