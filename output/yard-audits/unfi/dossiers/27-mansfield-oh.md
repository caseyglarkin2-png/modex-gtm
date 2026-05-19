# UNFI — Mansfield OH DC — Deep Audit (idx 27)

**Status: UNRESOLVED — facility could not be located. Confidence: Low.**

## Summary

No UNFI distribution center could be confirmed in Mansfield, Ohio. This idx is
flagged for human review.

## Resolution attempt

- **Roster source:** the entry comes solely from an Indeed "All UNFI office
  locations" list, which shows "Cleveland, OH" and "Mansfield, OH" for UNFI
  but gives no street address. The roster's own geocode is precision
  `APPROXIMATE` with a 7,198 m move — i.e., the geocoder itself could not pin
  a building.
- **Supplied coordinates (40.758536, -82.514085):** satellite imagery at z15
  shows downtown Mansfield — retail, civic, small commercial. No distribution
  building.
- **North Mansfield industrial corridor (US-30 / rail):** probed at z14;
  general industrial/manufacturing buildings exist but nothing identifiable
  as a UNFI grocery DC, and no source ties any of them to UNFI.

## Web research

- Repeated targeted searches (company name + city + ZIP + street guesses +
  LinkedIn/Glassdoor) returned **no street address** for any UNFI facility in
  Mansfield.
- The **UNFI Conventional GLN master list** (1WorldSync, v5.0, 2023) was
  downloaded and inspected — it contains **zero Ohio entries**.
- Legacy **SuperValu / Nash Finch** Ohio distribution centers were in
  **Bellefontaine, Cincinnati, Lima, and Dayton** — never Mansfield. There is
  no historical conventional-grocery wholesale DC in Mansfield to inherit.

## Conclusion

The Indeed "Mansfield, OH" entry is most plausibly a UNFI delivery branch,
sales office, or a stale/mislabeled directory record — not an operating
distribution center with a truck yard. Without a corporate facility list
confirming an address, this site cannot be audited.

All 22 classification fields are set to safe defaults and listed in
`uncertainFields`; geofences are `null`. **Recommend dropping this idx from
the audited roster, or sourcing a definitive UNFI facility address from the
account team before re-attempting.**
