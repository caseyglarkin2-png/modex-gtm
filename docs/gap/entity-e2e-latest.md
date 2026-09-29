# GAP Entity Expansion E2E (scratch)

Run 2026-09-29T14:57:45.539Z: PASS

- PASS E1 queue: 2 spellings of Harbor Provisions enmumsw546 are one candidate (2 people); Summit Logistics enmumsw546 is NOT ICP by name rule and sorts last; no account created by reading
- PASS E2 scout: one candidate row for both spellings, verdict LIKELY_ICP from cited evidence; the database refuses VERY_LIKELY and an undecided "ignored"
- PASS E3 add: a normalized duplicate is refused with the existing name; a clean add creates exactly one account (band C, source gap_candidate), the candidate is "added", and after the re-plan both people are placed at Harbor Provisions enmumsw546
- PASS E4 brief: the new account's brief shows "Operates 6 distribution centers. (Scout lead, not yet verified at source)" as INFERENCE with its link; nothing Scout said is VERIFIED
- PASS E5 person: Casey marked a person "wrong company"; a re-plan left the decision alone
- PASS E6 ignore: Summit Logistics enmumsw546 ignored and Harbor Provisions enmumsw546 added: neither is in the queue any more
