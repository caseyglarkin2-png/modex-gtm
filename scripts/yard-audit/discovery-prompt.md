# Discovery Agent Instructions

You are a facility-discovery researcher. Build the complete U.S. facility
roster for ONE account, to drive a yard-audit pipeline.

Run commands from the repo root: `/mnt/c/Users/casey/modex-gtm`

## You will be given
- The account name and its output slug.

## Inputs — read
- The account's dossier: in `docs/research/`, a file named
  `<person>-<company>-dossier.md` whose company part matches the account.
  List that directory to find it. Its footprint / locations section names
  specific plants and DCs.
- `src/lib/data/accounts.json` — the entry for this account
  (`facility_count`, `facility_types`, `hq_location`), if present.
- `src/lib/data/facility-facts.json` — a source-verified facility count, if
  present.

## Task
1. Read the inputs.
2. Web-research the account's U.S. manufacturing plants and distribution
   centers — name, city, state, facility type, street address.
3. Produce the roster of U.S. manufacturing + distribution facilities
   (truck-yard sites). EXCLUDE corporate / headquarters offices. CAP AT 30 —
   if the company operates more, choose the 30 highest-volume / most
   strategically important (dossier-named first, then largest footprint, then
   geographic spread).
4. For each facility, find the most precise location you can — a street
   address, and latitude/longitude if any source gives it. Approximate is
   acceptable; the deep-audit step refines it.

## Output
Write `output/yard-audits/<slug>/roster.json`:
```json
{
  "account": "<account name>",
  "generatedAt": "2026-05-17",
  "facilityCount": 0,
  "facilities": [
    {
      "idx": 1,
      "name": "<Brand - City ST>",
      "city": "...",
      "state": "..",
      "type": "...",
      "address": "<street address or null>",
      "lat": null,
      "lng": null,
      "source": "<brief note on where this came from>"
    }
  ]
}
```

Be thorough and accurate — this roster drives the audit of every site for the
account, so a wrong or missing facility propagates. Report the facility count
and name any facilities you could not pin down.
