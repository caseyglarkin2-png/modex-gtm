-- GAP YardFlow fit (2026-09-29), step 1 of 3: drop the old candidate vocabulary CHECKs
-- (verdict was LIKELY_ICP / MAYBE_ICP / NOT_ICP / AMBIGUOUS / INSUFFICIENT; entity_type had six values).
-- Step 2: npx tsx scripts/gap/refit-candidates.ts --apply   (re-derives every row from its stored evidence)
-- Step 3: 2026-09-29-gap-yardflow-fit-2-checks.sql           (the new vocabulary)
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_verdict;
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_entity_type;
