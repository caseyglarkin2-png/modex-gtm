# Deep-Audit Dossier — Bob Evans Farms, Forney TX Transportation Outpost

**Facility:** Bob Evans Farms - Forney TX Transportation Outpost
**Type:** Distribution / transportation outpost (small driver terminal
supporting the private fleet)
**Address:** Not disclosed / not findable
**Resolved coordinates:** Could not resolve
**Confidence:** Low — facility location could not be pinned down
**Archetype:** Not determinable

## Location effort (Step 0) — UNRESOLVED

This facility could not be located despite a genuine, multi-angle search:

- The Bob Evans Grocery "About Us" page names **Forney, TX** as a "small
  outpost" of the company's transportation operation (the main transportation
  facility being Springfield, OH).
- An active Bob Evans Foods CDL-driver job posting confirms a **Forney, TX**
  driver position (Post Holdings careers portal).
- CDL recruiting copy for the Texas operation also references a terminal in
  the adjacent town of **Sunnyvale, TX** (zip 75182) — described as where the
  drivers' trucks stay when off the road. Forney and Sunnyvale are neighboring
  exurban towns on the east side of the Dallas metro.
- FMCSA / SAFER for Bob Evans Transportation Company LLC (USDOT 911163) lists
  only the Springfield, OH registered address — no Texas physical address.
- A Dallas-area-code phone (972-203-6459) is associated with the carrier in a
  business directory, but no Texas street address is published.

Searches across the company website, FMCSA/SAFER, multiple carrier directories
(CarrierSource, RoseRocket, CDLLife, Cortera, Buzzfile), and job postings did
not surface a mappable street address or coordinates for either the Forney
outpost or the Sunnyvale terminal. Several of those pages returned HTTP 403 to
automated fetching. With no address and no coordinates, no satellite or Street
View audit could be performed.

## Outcome

Per the deep-audit instructions for an unlocatable facility, the `.json` is
written with `confidence: "low"`, every classification field listed in
`uncertainFields`, and `coords` / `geofences` / `yardMetrics` left null. The 22
classification values are unverified placeholders only — they were NOT audited
from imagery. `urbanRural` is a placeholder default ("Rural"); the true setting
is unknown (exurban Dallas metro could be Urban or Rural).

## What is known (uncorroborated by imagery)

Company materials characterize the Texas presence as a "small outpost" / driver
terminal supporting the ~100-tractor private fleet — most plausibly a modest
driver-domicile and trailer-staging yard rather than a dock or DC operation.
This characterization cannot be visually confirmed.

## Recommendation

Flag for human review. To resolve, obtain the Forney/Sunnyvale terminal address
directly from Bob Evans Transportation (e.g., via the 972-203-6459 line or
hr@bobevansfoods.com) or from a state business-registration record, then
re-run the deep audit with confirmed coordinates.

## Final confidence

**Low.** Facility confirmed to exist by company and recruiting sources, but no
findable location — could not be audited.
