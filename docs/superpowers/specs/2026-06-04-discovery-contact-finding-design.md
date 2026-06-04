# Discovery Contact Finding — Design

**Date:** 2026-06-04
**Status:** Approved scope, pending spec review

## Goal
Turn the discovered/pushed Tier A **companies** into actionable **people** to contact —
the buyer committee — without Apollo (credits exhausted for weeks). Source contacts
from the open web + LinkedIn, verify them, deliver a reviewable CSV, then write the
approved contacts into HubSpot associated with the existing company records.

This follows the proven Boston Beer play: land a **senior supply-chain/logistics exec**
(top-down entry) who routes us to the right operator, plus the **operational champion(s)
for the most pilot-ready site** (closest to a running Primo site).

## Constraints (what makes this design different)
- **No Apollo.** Credits exhausted ~weeks. Sourcing = web search + LinkedIn (via search
  results/snippets; LinkedIn is auth-walled so no behind-login scraping).
- **HubSpot-first.** Many contacts may already exist in HubSpot — check and skip before
  sourcing new ones.
- **Verification is mandatory.** Web-sourced contacts are worthless if fabricated or
  stale. Every contact must be backed by a citable source and confirmed in-role.

## Targeting
**Tier 1 — senior execs (parent company), reliable & high value:**
CSCO / Chief Supply Chain Officer / EVP·SVP·VP Supply Chain · Logistics · Transportation ·
Operations.

**Tier 2 — site champion(s) for the pilot site, best-effort:**
Director/Manager of DC · Warehouse · Yard/Dock · Site/Plant Logistics, scoped to the pilot
site's city/state. (Often not public — captured when findable; not fabricated when not.)

**Pilot site selection:** per company, the discovered facility with the minimum
`nearestPrimoSite.distanceMiles` (tie-break by `icpScore`). Recorded on each contact so the
rep leads with the closest-to-proven-Primo angle.

**Depth:** ~3 senior + up to ~2 site champions per company (adjustable).

## Pipeline (per company)
1. **Resolve parent brand + domain** from the facility name using the scoring pipeline's
   `KNOWN_BRANDS` map (e.g. "Nestle Distribution Center (Truck Entrance)" → Nestlé →
   nestle.com). Unresolvable facility-nickname records are **skipped & logged** (no guessing).
2. **Check HubSpot** for contacts already associated with the company (and obvious matches by
   company/domain). Skip people we already have; note them in the CSV as `already_in_hubspot`.
3. **Research (parallel agent per company)** — find the buyer committee from the open web:
   leadership/about pages, press releases, reputable industry news, LinkedIn profiles
   surfaced in search.
4. **Verification (the core):** each contact must carry **name, exact title, company, ≥1
   source URL**, a **currency check** (still in role; prefer sources ≤~18 months), and a
   **confidence** (`verified` vs `likely`). Tier-1 contacts get an adversarial second-pass
   (right person, right corporate entity, still in role). **No source / can't confirm →
   reported "not found," never invented.**
5. **Email:** capture verified email if a source provides one; otherwise generate an
   **inferred** pattern (`first.last@domain`) explicitly flagged `email_status=unverified`.
   Never present a guessed email as confirmed.
6. **Dedup** vs existing HubSpot and within results (by email, else normalized name+company).
7. **Deliver CSV** for review → on approval, **create HubSpot contacts + associate** to the
   company, stamping source URL, confidence, pilot-site note, and email status.

## Execution phasing
- **Phase 1 — operation now (this is what we execute first):**
  1. **Allentown corridor** (Nestlé, KeHE, Geodis, Ryder, Kuehne+Nagel, etc. near the running
     Primo site — where Monday's pilot conversation is).
  2. **Top pilot-ready accounts** (Tier A ranked by Primo proximity × ICP score, real brands).
  3. **All Tier A** (best-effort; many facility-nicknames won't resolve).
  Mechanics: parallel research agents (superpowers: dispatching-parallel-agents) → consolidated
  cited CSV → user review → HubSpot create+associate. Credentials pulled from Vercel for the
  HubSpot write, deleted after.
- **Phase 2 — in-app feature (next):** a "Find contacts" button on the prospect detail sheet +
  a bulk action, wrapping the same web-research pipeline server-side (Apollo/sidecar both
  unavailable), surfacing found contacts + review in the Hub. Its own spec/plan later.

## CSV schema (Phase 1 deliverable)
`company, parent_brand, domain, pilot_site, nearest_primo, primo_distance_mi, icp_score, tier,
contact_name, contact_title, contact_tier (exec|champion), linkedin_url, source_url,
source_type (leadership_page|press|news|linkedin), in_role_confidence (verified|likely),
inferred_email, email_status (verified|unverified), already_in_hubspot (yes|no), notes`

## HubSpot write (after CSV approval)
- Create **contacts** with: name, title, company, email (verified or inferred-flagged),
  linkedin URL, and a note field carrying source URL + pilot-site + confidence + "sourced via
  web research (Apollo unavailable)".
- **Associate** each contact to its company record (the ones from the Tier A push).
- Dedup: skip/merge anyone already associated (from step 2).
- Dry-run/preview before any bulk create, same discipline as the company push.

## Error handling & honesty
- Brand unresolved → skip + log (`tier-a-contacts-skipped.json`).
- Contact unverifiable → omit (logged), never fabricated.
- Site champion not public → senior execs still delivered; CSV notes "no public site champion."
- Email never fabricated-as-verified; inferred always flagged.

## Out of scope (YAGNI)
- No Apollo calls of any kind (credits out).
- No scraping behind LinkedIn auth.
- No automated outreach/sending (separate future work).
- No site-level HubSpot object remodel (companies stay name-deduped as pushed).

## Success criteria
- Allentown wave: a cited CSV of senior + (where findable) site-champion contacts for each
  real-brand company, every contact source-backed, ready before Monday.
- On approval, those contacts created + associated in HubSpot with sources and pilot-site notes.
- Zero fabricated people; zero emails presented as verified that aren't.
