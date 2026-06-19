# Crowley — FOV verification rejections

Verified 2026-06-18 (agent). 12 sites checked. 9 confirmed, 3 rejected.

The rejected three are all marine terminals that Crowley merely uses as **ports of
call** for its liner service. Crowley does not operate a yard at any of these
addresses — an independent terminal operator runs each, so per protocol V4
("a DIFFERENT operating company is at the address, not running it for the
account → reject") they are out.

- **Crowley Penn Terminals (Eddystone PA, 1 Saville Ave)** — REJECTED: the
  terminal is operated by **PSA Penn Terminals** (Penn Terminals Inc., joined the
  PSA Group Aug 2019), an independent terminal operator. Crowley's own
  port-terminals page lists this address under "Penn Terminals, Inc." — a port of
  call, not a Crowley-operated yard. [Tier 1: https://www.psa-pennterminals.com/contact.htm, 2026-06; corroborated https://www.crowley.com/port-terminals/]

- **Crowley Holt Terminals / Gloucester Marine Terminal (Gloucester City NJ, 160 Essex St)**
  — REJECTED: operated by **Holt Logistics / Gloucester Terminals LLC** (a Holt
  entity). Crowley lists the address as "Holt Terminals," a port of call, not a
  Crowley-operated yard. [Tier 1: https://www.holtlogistics.com/facilities/gloucester-marine-terminal/, 2026-06; corroborated https://www.crowley.com/port-terminals/]

- **Crowley Wilmington Port Terminal (Wilmington NC, 2202 Burnett Blvd)** —
  REJECTED: the container terminal is owned and operated by the **North Carolina
  State Ports Authority**. Crowley is a Central America liner carrier calling the
  port (listed by NC Ports as a service provider), not the terminal/yard operator.
  [Tier 1: https://ncports.com/port-facilities/port-of-wilmington/ + https://ncports.com/service-provider/crowley-maritime/, 2026-06]

## Confirmed (9) — proceed

All carry a Tier-1 verification block in their site JSON.

- 01 JAXPORT Marine Terminal (2831 Talleyrand Ave, Jacksonville FL) — Crowley main terminal, LNG ConRo PR service; JAXPORT-owned, Crowley-operated.
- 02 JAXPORT Terminal Office #2 (1163 Talleyrand Ave, Jacksonville FL) — Crowley Port Office #2, PR/breakbulk/car-haul/cross-dock.
- 05 Port Everglades Terminal (4300 McIntosh Rd, Fort Lauderdale FL) — Crowley's largest container terminal, 10-yr lease.
- 06 Isla Grande Terminal (San Juan PR) — flagship Crowley PR gateway, modernized LNG ConRo terminal.
- 10 Gulfport Terminal (692 30th Ave, Gulfport MS) — Crowley Mexico Gulf Express weekly container/reefer service (launched May 2025).
- 11 Conley Container Yard (4252 Transport City Dr, Conley GA) — Crowley Atlanta-area inland container yard, on Crowley's locations page.
- 12 Jacksonville Distribution Center / Dry-LCL (2113 W 30th St, Jacksonville FL) — Crowley 100,418 sqft bonded LCL warehouse, 27 docks.
- 13 Jacksonville Cross Dock (2061 SCL Drive, Jacksonville FL) — Crowley cross-dock, 12.1 ac / 31,500 sqft / 58 docks (resolved the prior no-signage gap via Crowley's own warehouse locator).
- 14 CrowleyFresh DC / Temperature Controlled (11401 NW 100th Rd, Medley FL) — CrowleyFresh cold-storage suite, 9 reefer doors.
