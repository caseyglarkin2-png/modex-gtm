# Contact Data Standard v2026-03-28

## Objective
Keep outbound quality high by only sending to contacts that meet minimum identity, role, and deliverability confidence standards.

## Contact Readiness Standard
A contact is send-ready only when all of these are true:

1. Quality score >= 80
2. Email confidence >= 70
3. Not blocked and not do-not-contact
4. Domain is corporate (not free mail)
5. Contact has a real name and relevant title

## Required Fields
- name
- first_name
- last_name
- normalized_name
- title
- normalized_title
- account_name
- company_domain
- email (or validated enrichment guess)

## Enrichment Sources
- Public web search (DuckDuckGo query trail)
- LinkedIn profile discovery via search results
- Deterministic email pattern generation by known company domain
- Curated outbound list rows with matching name, title, company, and corporate email can count as evidence for campaign eligibility

Note: Do not attempt unauthorized scraping behind login walls. Use public pages and compliant providers only.

## Quality Scoring (100 points)
- Name valid: 15
- Title valid: 15
- Account valid: 10
- Company domain present: 15
- Email format valid: 20
- LinkedIn URL present: 15
- Source URL captured: 5
- 2+ evidence signals: 5

## Bands
- A: 90-100
- B: 80-89
- C: 70-79
- D: <70

Only A and B are eligible for broad campaign sends.

## Enforcement Points
- Schema fields on personas store confidence, source evidence, and readiness gates.
- Add persona action computes and stores quality metadata.
- Campaign generation script rejects contacts below threshold.
- Enrichment pipeline upgrades low-confidence records in batch.
- Live bounced domains are synced into `lists_config` under `blocked_domain` and enforced at send time.

## Operational Commands
- Enrich contacts:
  - npm run enrich:contacts -- --limit 200
- Sync bounced domains into suppression table:
  - npm run suppress:bounces
- Generate campaign with quality gating:
  - npm run campaign:generate
- Monday bump (manual):
  - npm run campaign:monday-bump -- --since "2026-03-28T00:00:00Z"

## Governance
- Standard version is stored in `contact_standard_version`.
- Any scoring threshold change must update this doc and code together.
