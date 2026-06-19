# Tractor Supply Company — FOV verification rejections

Run date: 2026-06-19. Protocol: `scripts/yard-audit/verify-facility-prompt.md` (current-operations audit; reject under-construction / closed / sold / store-not-DC sites).

Result: 11 sites verified — 10 confirmed, 1 rejected.

## Rejected

- **Tractor Supply Distribution Center Nampa ID** (idx 11; Nampa, 9640 Ustick Rd, Nampa, ID 83687) — REJECTED: future / under-construction DC. TSC broke ground April 2025 on its 11th DC (~865,000 sq ft, ~$225M); anticipated completion late 2026 / early 2027 with hiring only beginning Q2 2026. Not operating as of mid-2026, so it fails the current-ops audit. [Tier 1 press: https://corporate.tractorsupply.com/newsroom/news-releases/news-releases-details/2025/Tractor-Supply-Breaks-Ground-on-New-Distribution-Center-in-Nampa-Idaho/default.aspx, 2025-04-23] (The roster source already flagged this site as under construction; confirmed.)

## Confirmed (no problems)

All 10 other sites are currently-operating, TSC self-operated distribution centers (not retail stores), each backed by >=1 real Tier-1 citation (TSC corporate/IR press, TSC corporate careers DC postings, or chamber/econ-dev directory listings), with no closure / sale / WARN / under-construction negative found:

- idx 1 Pendleton IN (DC #114), idx 2 Waco TX, idx 3 Macon GA, idx 4 Casa Grande AZ (DC #111), idx 5 Franklin KY, idx 6 Hagerstown MD, idx 7 Frankfort NY (Northeast DC), idx 8 Waverly NE, idx 9 Navarre OH (opened 2023, verified open not under construction), idx 10 Maumelle AR (opened June 2024, verified open not under construction).

### Notes / data-hygiene flags (non-blocking)
- idx 4 Casa Grande: street is "W Peters Rd" (West), not "N Peters Rd" as in the roster; DC ZIP is 85193 (the retail store is 85122).
- idx 3 Macon: the only Georgia TSC WARN notice resolved to Braselton, GA — unrelated to the Macon DC.
- Tenancy left "unknown" where no owned/leased deed evidence surfaced (Waco, Macon, Casa Grande, Franklin, Hagerstown).
