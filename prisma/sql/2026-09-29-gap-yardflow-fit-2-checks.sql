-- GAP YardFlow fit (2026-09-29), step 3 of 3: the verdict IS the YardFlow fit (entity/fit.ts); entity_type is
-- descriptive. Depends on gap_add_check() (2026-09-23-gap-os.sql). Idempotent.
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_verdict',
  $c$verdict IS NULL OR verdict IN ('DIRECT_BUYER','POTENTIAL_DIRECT_BUYER','PARTNER','NOT_FIT','UNKNOWN')$c$);
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_entity_type',
  $c$entity_type IS NULL OR entity_type IN ('shipper','retailer','distributor','manufacturer','3pl','carrier','port_terminal','broker','vendor','consultant','other')$c$);
