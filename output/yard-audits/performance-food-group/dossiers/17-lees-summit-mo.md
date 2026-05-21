# Deep-Audit Dossier — idx 17

## Performance Foodservice — Kansas City (Lee's Summit, MO)

**Facility type:** Broadline Foodservice Distribution Center
**Address:** 290 SE Thompson Dr, Lee's Summit, MO 64082
**Resolved coordinates:** 38.89000, -94.36640
**Confidence:** High

---

### Location resolution

The roster geocode (38.8895, -94.366194, ROOFTOP, moved 1821 m) lands on the
PFG-occupied DC. Probing satellite z17-z20 and walking Street View along SE
Thompson Dr (Sep 2024) confirmed the facility: a distribution warehouse with a
long **red-canopied dock face** on its south side, a truck court, and a large
trailer drop yard, all in a semi-rural pocket of Lee's Summit. A trailer at the
dock carries **Vistar** branding and PFG-branded tractors are parked in the
yard, positively identifying this as a Performance Food Group facility.
Performance Foodservice's location page lists 290 SE Thompson Dr as the Kansas
City broadline DC (a former Reinhart Foodservice building); phone
(816) 246-0100.

The site sits on a narrow rural road bordered by farmland, woods and scattered
rural housing — an edge-of-town setting.

### Key views

- **Satellite z17-z20:** Large DC building; dock bank with a red canopy along
  the south face, trailers backed in. South of the dock court a big drop yard
  holds 50+ trailers and box trucks in rows. Open access from SE Thompson Dr.
- **Street View, dock face (heading N):** Long bank of dock doors with the red
  canopy line, trailers backed in, PFG tractors in the yard, a US flag pole.
  A chain-link gate is visible mid-frame between internal yard sub-zones.
- **Street View, dock yard (heading 350):** A Vistar-branded trailer at a dock
  door confirms PFG/Vistar operations. Partial chain-link fencing along the
  yard edge, but the access from the road is open.
- **Street View along SE Thompson Dr:** Narrow rural road, farmland and rural
  housing adjacent — confirms the Rural classification.

### Gate / guard-shack / dock determinations

- **truckGate = false** — Access from SE Thompson Dr is an open, uncontrolled
  driveway. The yard has partial chain-link fencing and one internal chain-link
  gate between sub-zones, but there is no barrier arm, sliding gate or
  checkpoint structure at the property line where trucks enter. Flagged in
  uncertainFields given the internal gate could be mistaken for a truck gate.
- **guardShack = false** — No guard booth at any entrance.
- **remoteGs = false** — No property-line truck gate, so not applicable.
- **dockDoors = "25-50"** — Long red-canopied dock bank on the south face;
  ~30 doors estimated overhead.
- **dropArea = "50+"** — Large drop yard holds 50+ trailers / box trucks.
- **drivewayLong = true** — Deep truck court and drop yard give long internal
  stacking depth.

### Yard zones and counts

- **Perimeter:** ~13 acres covering the DC, dock court and drop yard.
- **Drop yard:** Large lot south of the dock court, 50+ trailers.
- **Dock apron:** Strip along the red-canopied south dock face.
- **Truck gate:** None at the property line — left null.
- **Staging:** Paved truck court between the dock apron and the drop yard.
- **Dock doors:** ~30 (medium confidence).
- **Trailers visible:** ~55 across dock court and drop yard.
- **Rail-served:** No spur into the property.

### Web findings

- Performance Foodservice — Kansas City, 290 SE Thompson Dr, Lee's Summit, MO
  64082; phone (816) 246-0100. Former Reinhart Foodservice building; serves the
  Kansas City, Columbia, Topeka and Lawrence markets. Vistar segment also
  operates from this DC.

### Final confidence: HIGH

Building positively identified by Vistar trailer branding and PFG tractors in
Street View. The site is an open (ungated) yard — the truck-gate call is
"false" with the caveat noted in uncertainFields. Dock count is an overhead
estimate. Rural classification per the edge-of-town setting.
