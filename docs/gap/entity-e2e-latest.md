# GAP Entity Expansion E2E (scratch)

Run 2026-10-02T02:24:28.155Z: PASS

- PASS E1 queue: 2 spellings of Harbor Provisions enmuqcayon are one candidate (2 people); Summit Logistics enmuqcayon is a 3PL guess by name with its fit left open (never rejected by name); no account created by reading
- PASS E2 scout: one candidate row for both spellings, fit DIRECT_BUYER from cited operations; the database refuses the retired LIKELY_ICP vocabulary and an undecided "ignored"
- PASS E3 add: a normalized duplicate is refused with the existing name; a clean add creates exactly one account (band C, source gap_candidate), the candidate is "added", and after the re-plan both people are placed at Harbor Provisions enmuqcayon
- PASS E4 brief: the new account's brief shows "Operates 6 distribution centers. (Scout lead, not yet verified at source)" as INFERENCE with its link; nothing Scout said is VERIFIED
- PASS E5 person: an email match with a different stated company is ambiguous; a Persona GAP did not offer is refused; "this is Dana" places the member at Costa Growers enmuqcayon, LLC, and a re-plan left it alone
- PASS E6 ignore: Summit Logistics enmuqcayon ignored and Harbor Provisions enmuqcayon added: neither is in the queue any more
