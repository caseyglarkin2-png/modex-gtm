# Deep-Audit Dossier — idx 19

## Nabisco Allentown Sales Distribution Center — Allentown, PA

### Status: UNRESOLVED — facility could not be located

### Resolution effort
- **Roster supplied:** 40.6084, -75.4902 — a city-level centroid that lands
  in downtown / residential Allentown. Satellite confirms there is no
  distribution warehouse at that point.
- The roster's own source note states the entry is "city-level only; exact
  street address not pinned down."
- Web research (multiple searches across Mondelez sources, Indeed,
  ZipRecruiter, Yellowpages, D&B, Lehigh Valley commercial-real-estate
  directories, and Nabisco historical records) returned **no distinct
  Nabisco / Mondelez distribution-center building in Allentown**.

### Assessment
The evidence points to "Allentown" being a Mondelez/Nabisco **sales &
merchandiser territory designation** in the Lehigh Valley logistics corridor
rather than a discrete large distribution center:

- Job postings for "Allentown, PA" Mondelez/Nabisco roles are merchandiser
  positions (stocking store shelves, display maintenance) — sales-territory
  jobs, not warehouse-operations jobs.
- The actual Mondelez/Nabisco physical distribution in the Lehigh Valley
  appears consolidated at the **Tatamy, PA DC (roster idx 14)** — a ~100,300
  sq ft Becknell build-to-suit ~10 miles NE of Allentown that handles Oreo,
  Chips Ahoy!, Ritz, Triscuit, Swedish Fish, Sour Patch Kids.
- No separate Allentown warehouse address appears in any business directory,
  commercial-real-estate listing, or Mondelez source.

### Classification
All 22 classification fields are set to default values (`false` / `NONE` /
`null`) and **every field is listed in `uncertainFields`** because no
building was observed. They are placeholders, not findings. `confidence` is
`low`.

### Recommendation for human review
Either (a) treat this entry as a likely **duplicate of the Tatamy DC
(idx 14)** and drop it from the run, or (b) obtain the exact street address
directly from Mondelez and re-audit. Do not treat the current JSON as a real
audit result.

### Final confidence: low (facility unresolved)
