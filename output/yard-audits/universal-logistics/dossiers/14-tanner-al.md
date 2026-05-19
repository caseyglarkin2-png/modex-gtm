# Deep-Audit Dossier — idx 14: Universal Logistics, Tanner AL

**Facility:** Universal Logistics - Tanner Value-Added Facility
**Type:** Value-Added Logistics / Sequencing Warehouse
**Resolved address:** 5271 Endeavor Way NW, Tanner, AL 35671 (SouthPoint Business Park)
**Resolved coordinates:** 34.63115, -86.89625 (building centroid)
**Confidence:** High

## Location resolution

The roster supplied no address or coordinates. Web research resolved the facility:

- Universal Logistics' own recruiting posting **"Class A Yard Switcher — Tanner, AL"** (Workday / ZipRecruiter / Glassdoor) lists the in-person apply address as **5271 Endeavor Way, Tanner, AL 35671**. A dedicated yard-switcher (hostler) role confirms an active trailer yard at the site.
- Commercial-real-estate listings (LoopNet, Crexi, Showcase) identify 5271 Endeavor Way as a **2021-built ~300k+ sq ft distribution / warehouse building** in **SouthPoint Business Park**, Tanner — 40 ft clear, **51 dock doors**, 2 drive-in doors, ~179 car spaces.
- Google geocoding returns a **ROOFTOP** match at 34.6318, -86.8968 (the NW office corner of the building).
- Context: Tanner sits in Limestone County beside I-565, ~10 mi from the Mazda Toyota Manufacturing USA plant in Huntsville/Madison — consistent with the roster's note that this facility serves MTM automotive value-added work.

Note: the separately-listed "River & Rocket Commerce Center" (23366 Bibb Garrett Rd) is a *different* Tanner industrial building (tenants Inline Electric, Blue Origin, Loftis Steel) and was ruled out.

## What the imagery showed

- **Satellite z17/z18 (wide):** a single very large warehouse oriented diagonally NE–SW within a multi-building spec industrial park. Office and employee parking at the NW end; dock banks on the long NW and SW/SE faces.
- **Satellite z19/z20 (tight):** dense dock banks with trailers backed in on the SW long face, plus a large trailer **drop yard** of multiple rows south/southeast of the building. 25+ parked trailers visible in the southern drop yard alone; more along the SE.
- **Street View (office driveway, NW):** the access drive runs straight from the SouthPoint park loop road into the front car park and central two-tone office entrance — **no gate, no barrier arm, no guard booth, no pinch-point**.
- **Street View (I-565 side):** the dock yards face the highway behind a grass berm; only the public highway is covered by Street View, no truck-gate structure visible at any approach.

## Gate / guard-shack determination

- **truckGate: false.** No controlled truck entrance. The building is one tenant inside SouthPoint Business Park; its dock yards open directly onto shared internal park drives. The office driveway is fully open.
- **guardShack: false.** No staffed booth at any approach.
- **remoteGs: false.** No truck gate exists, so a remote/kiosk check-in classification does not apply.

## Yard zones & counts

- **Perimeter:** ~34 acres, capturing the building footprint, NW office parking, and the southern/southeastern drop yards.
- **Dock aprons:** two — the NW (office-side) long face and the SW/SE long face — consistent with separate shipping vs receiving banks (`shipRcvSeparate: true`).
- **Drop yards:** two areas of marked trailer-storage rows on the south and southeast sides, separate from active dock staging (`dropYard: true`).
- **Dock doors:** 51 per the CRE listing — band `50+`. Corroborated by satellite dock banks.
- **Drop area:** `50+` band — extensive rows of parked trailers.
- **Trailers visible ~70; estimated capacity ~110** (honest overhead estimates).
- **Rail:** not served — no spur into the property.
- **fastLaneOpportunity: true** — wide paved aprons and unused paved width; room to add an express lane if a gate were ever installed.

## Web findings

Universal Logistics actively staffs the Tanner site (warehouse associates, forklift, outbound supervisor, **Class A yard switcher** at ~$23/hr) — confirming an operating value-added / sequencing warehouse with internal trailer-shuttling. The facility supports Mazda Toyota Manufacturing automotive work in the Huntsville corridor.

## Final confidence: High

Location positively confirmed by a Universal Logistics job posting address plus multiple CRE listings; layout, docks, and drop yards all clearly read from satellite. Only `entryLanes`/`exitLanes` are left null (no gate exists to count lanes at).
