# PepsiCo — Facility Operation Verification (FOV) rejections & flags

Run date: 2026-06-18. Verified by: agent (web research). Sites checked: 30/30.

## Result

- **Confirmed: 29**
- **Probable (low-confidence, human review): 1** — PBNA Detroit MI (DC)
- **Rejected: 0**

No site was found to be divested, sold, or fully closed. The divestiture/closure
gauntlet was run against every site (PepsiCo's Oct-2024 bottling closures —
Cincinnati, Chicago, Harrisburg PA, Atlanta bottling — and the Quaker recall
shutdown of the Danville IL plant were all checked against this list and none of
the 30 sites is one of them). The Tropicana divestiture (2022) does not touch any
of these sites.

---

## Probable / low-confidence (review before yard modeling)

- **PBNA - Detroit MI (DC)** (Detroit, ~42.3553,-83.0442) — PROBABLE, not rejected.
  PepsiCo announced ending **manufacturing** at the Detroit plant on 2025-07-30
  (last day Sept 27 2025, 83 layoffs), BUT explicitly stated warehouse, fleet,
  delivery, sales, and field-service teams **continue** at the location. So the
  DC/yard function survives — this is a partial closure, not a site exit.
  Flagged because the pin should be confirmed against the surviving DC footprint
  (not the shuttered manufacturing hall) before yard modeling.
  [Tier 2: https://www.supplychaindive.com/news/pepsico-to-close-portion-of-detroit-plant/754176/, 2025-07-30]

---

## Coordinate / mis-geocode caveats (operation confirmed; pin needs correction)

These sites are confirmed PepsiCo-operated, but the supplied lat/lng appears to
point at the wrong location and should be re-pinned before geofencing the yard:

- **Gatorade - Dallas TX** — supplied coords (32.7172,-96.8706) are downtown
  Dallas. The actual Gatorade plant is in East Dallas (Forney Rd area).
  Facility is real and operating (DOE Better Plants profile); re-pin the coords.
- **Gatorade - Oakland CA** — supplied coords (37.76445,-122.20475) are in the
  Oakland/San Leandro industrial corridor; the Gatorade plant address is
  1175 57th Ave, Oakland. Same area, but confirm the exact pin.
- **PBNA - Mesquite TX** — supplied coords (32.802466,-96.665808) are in the
  Mesquite industrial corridor; the main plant is 4532 I-30. Same area; confirm pin.

---

## Distractors ruled out (so they are not mis-rejected later)

- **Sacramento CA** — the widely reported "West Sacramento bottling plant abruptly
  closes" story (Oct 2025) was **Manna Beverages**, a non-PepsiCo copacker, NOT
  PepsiCo's own Sacramento PBNA facility (which is actively hiring).
- **Munster IN** — PepsiCo's Indiana closure was **Muncie**, a different city.
  Munster's bottling plant is active.
- **Cedar Rapids IA & Bridgeview IL** — the Quaker recall shutdown was **Danville IL**;
  Cedar Rapids absorbed Danville's production and Bridgeview was expanded.
- **Twinsburg OH** — the only recent Twinsburg WARN at Enterprise Pkwy belongs to
  Giesecke+Devrient (a different company), not PepsiCo.
- **Atlanta GA (Gatorade)** — the Gatorade manufacturing plant on Westgate Pkwy is
  DISTINCT from the Atlanta **bottling** plant PepsiCo closed Oct 2024. The
  Gatorade site remains operating. (Tucker GA is also a separate, expanding PBNA plant.)
