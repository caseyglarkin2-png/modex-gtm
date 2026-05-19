# Deep-Audit Dossier — H-E-B Frisco Electronic Fulfillment Center (in development), Frisco TX (idx 15)

## Facility
- **Name:** H-E-B Frisco Electronic Fulfillment Center (in development)
- **Type:** E-commerce Fulfillment Center (planned; construction 2026-2027)
- **Address:** FM 423 at US 380, Frisco, TX 75033
- **Status:** **NOT YET BUILT — pre-construction.**

## Step 0 — Location confirmation
Roster geocode (33.218724, -96.880380, GEOMETRIC_CENTER, moved 3 m) is the
FM 423 / US 380 intersection centroid. Web research (Community Impact Dec
2025, Local Profile, Hoodline, TDLR project TABS2026005469) confirms:
- The Frisco EFC will be a **51,599 sq ft** building, ~$14.4M construction
  cost, located at FM 423 & US 380.
- It will be built **adjacent to / on the parcel of the existing H-E-B
  Frisco store at 899 University Drive** (US 380 = University Dr) — a
  130,000 sq ft H-E-B store that opened Aug 7 2024.
- A local US-380 community page explicitly states "This is not a new H-E-B
  store, it's an Electronic Fulfillment Center."
- **Construction is slated to begin July 2026 and complete June 2027.**

Coordinates were therefore locked to the confirmed parcel — the existing
H-E-B Frisco store building (33.221200, -96.878100). The exact EFC pad
location within that parcel is not yet public.

## Imagery findings
Current satellite imagery shows the completed H-E-B Frisco big-box store:
a large white-roofed building with extensive customer parking to the south,
adjacent retail strip to the west, and a back-of-house service dock on the
north side facing a creek / drainage corridor with a tree buffer. There is
**no EFC structure, truck yard, gate, or dock** present yet — the EFC has not
been built.

## Gate / guard-shack / dock — cannot be audited
Because the EFC building does not physically exist, its truck gate, guard
shack, docks, staging, and yard cannot be observed or measured. All such
fields are recorded as `false` / `NONE` / `null` placeholders and every yard
field is listed in `uncertainFields`.

**Expected archetype (not an observation):** once built, the Frisco EFC is
expected to follow H-E-B's established store-attached-eFC pattern (cf. Plano
idx 12 and Cibolo idx 13) — an uncontrolled back-of-house service drive with
no freight gate or guard booth, and a small grocery-scale dock. This should
be re-audited after the facility opens (mid-2027).

## Yard zones & counts
- **perimeter:** placeholder box over the existing H-E-B Frisco store parcel
  (~23 acres) — NOT a measured EFC geofence.
- All sub-zones null / empty; all yardMetrics zero (EFC not built).

## Web findings
Community Impact (Dec 11 2025): H-E-B set to build a 51,599 sq ft electronic
fulfillment center at FM 423 & US 380, Frisco; construction July 2026 -
June 2027; $14,439,910. The facility will fill curbside and home-delivery
orders to relieve in-store aisle congestion. H-E-B Newsroom: the adjacent
H-E-B Frisco store (899 University Dr, second Frisco store, 130,000 sq ft)
opened Aug 2024.

## Confidence
**Low.** The facility is a planned, pre-construction project. Its location is
well established (the H-E-B Frisco store parcel), but the EFC building and its
truck yard do not yet exist and cannot be audited. Recommend re-audit after
the projected June 2027 completion.
