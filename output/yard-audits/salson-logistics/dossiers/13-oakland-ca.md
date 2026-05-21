# SalSon Logistics — Oakland CA (idx 13)

**Facility type:** Port Drayage Terminal
**Roster address:** none supplied
**Roster coords:** none supplied
**Resolved location:** UNRESOLVED
**Confidence:** low

---

## Summary verdict

- **Gate:** undetermined — facility not located.
- **Guard shack:** undetermined — facility not located.
- **Confidence:** low. No street address, no coordinates, no imagery audited.

## Step 0 — location attempt

The roster carries Oakland CA with `address: null`, `lat: null`, `lng: null` and a
note that the city is named as a SalSon port-drayage market in dossier and
Transport Topics merger coverage, with no street address surfaced. The deep
audit confirmed that finding rather than overturning it.

Research performed:

1. **salson.com** — contact, west-coast-services and national-logistics-services
   pages either 404 or list no Oakland street address. SalSon's public footprint
   statements name Oakland only as one of "Bakersfield, Inland Empire, Long Beach
   and Oakland, Calif." operating markets (Transport Topics, "SalSon Logistics
   Expands New Jersey, California Operations").
2. **Indeed company locations page** (indeed.com/cmp/Salson-Logistics-2/locations)
   — lists NJ, GA, CA, TX, NY, PA, SC office cities. The only California city
   listed is **Torrance** — Oakland does not appear at all.
3. **Drayage directories** — drayage.com and loadmatch.com San Francisco/Oakland
   intermodal-drayage directories (≈199 carriers) do **not** list SalSon Logistics,
   Sierra Trucking, Vision Logistics or West Group.
4. **Merged-company trace** — the seven Aug-2024 merged companies (SalSon, Sierra
   Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer,
   TriPack Logistics) were checked for an Oakland-registered drayage terminal; none
   resolved to a confirmable Oakland address.
5. **FMCSA SAFER** — SalSon Logistics Services LLC (USDOT 3968944) registers its
   single West Coast physical address as 18735 S Ferris Pl, Compton CA — no Oakland
   terminal registration.

## Assessment

The most plausible reality: SalSon runs an Oakland drayage *market* — drivers,
chassis and dispatch working the Port of Oakland (Outer Harbor / 7th Street
terminal complex) — rather than a SalSon-owned warehouse or branded yard. Drayage
carriers routinely operate a port market on leased or shared yard space with no
fixed publishable street address, which is consistent with every negative search
result above.

## Output

`13-oakland-ca.json` is written with `confidence: "low"`, all 22 classification
fields listed in `uncertainFields`, and null geofences / zeroed yardMetrics. The
classification values present are schema-required placeholders, not observations.

**Recommended next step:** obtain the Oakland yard address directly from SalSon
(973-986-0200 / sales@salson.com) or from a port-tenant / chassis-pool roster,
then re-run the deep audit.
