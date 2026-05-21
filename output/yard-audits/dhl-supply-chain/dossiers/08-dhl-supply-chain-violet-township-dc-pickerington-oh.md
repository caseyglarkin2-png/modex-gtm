# Deep-Audit Dossier — idx 08

## DHL Supply Chain — Violet Township DC — Pickerington OH

**Type:** Distribution Center
**Resolved address:** 8695 Basil Western Road NW, Violet Township, NW Fairfield County, OH
**Resolved coordinates:** 39.846447, -82.704257 (address-level, ROOFTOP geocode)
**Confidence:** LOW — facility not visible in any available imagery

## Step 0 — Locating the facility

The roster coordinate (39.846447, -82.704257; ROOFTOP geocode, moved 20m) resolves
the *address* 8695 Basil Western Road NW. Web research confirms the facility: DHL
Supply Chain announced and broke ground in 2023 on a **755,000 sq ft distribution
center** on Basil Western Road in Violet Township, ~35 miles from DHL's Westerville
HQ, with a target opening in **Q2 2024** and ~200 jobs.

However, the building **could not be located in any imagery**:

- **Satellite (z14-18):** the entire surrounding area is open farmland and scattered
  rural homes. The Google tiles are pre-development (USDA/FPAC agricultural imagery).
  No 755K sq ft building exists anywhere near the coordinate.
- **Street View (Aug 2024 — the most recent available):** walked Basil Western Road
  N and S of the intersection; every pano shows cornfields and farm fields. No
  construction equipment, no grading, no building shell.

## Assessment

The site is at the rural intersection on Basil Western Road, but the distribution
center is **not yet built / not visible**. Despite a Q2-2024 target, the latest
imagery (Aug 2024 Street View) still shows raw farmland — the project appears to
have been delayed. There is no yard, gate, dock, or trailer to classify.

Per the deep-audit protocol for an unbuilt/under-construction facility, the JSON is
written with `confidence: "low"`, every classification and metric field listed in
`uncertainFields`, and all yard geofences left null/empty.

## What can be said

- **urbanRural = Rural** — defensible: the parcel is in open NW Fairfield County
  farmland north of Carroll, OH.
- **connectivityIssue = true** — inferred (low confidence) from the rural, isolated
  setting; cellular coverage in open farmland may be marginal.
- The nominal perimeter box in the JSON is a ~700m square around the resolved
  address and does NOT represent an observed fence line.

## Web findings

NBC4i / Columbus Business First, REBusinessOnline, Connect CRE, Commercial Property
Executive, ABC6/MyFox28, and DHL's own 2023 press release all describe the planned
755K sq ft Violet Township DC. The Fairfield 33 Development Alliance posted
construction-progress updates. No source confirms an actual opening date, and no
post-2024 imagery is available.

## Final confidence

**LOW** — address resolved but the facility is not visible in any imagery; the yard
cannot be audited. Flag for human review and re-audit once newer imagery exists.
