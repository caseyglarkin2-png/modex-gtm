-- GAP Entity Expansion (2026-09-29): hand SQL for gap_account_candidates.
-- Spec: docs/gap/ACCOUNT_INTELLIGENCE_STATUS.md. Vocabulary as of the YardFlow fit release (the verdict is the fit).
--
-- Depends on gap_add_check(), defined in 2026-09-23-gap-os.sql (apply that
-- first). Idempotent. Rollback: 2026-09-29-gap-entity-expansion-rollback.sql.
--
-- Apply AFTER the additive DDL has created the table:
--   npx prisma db execute --file prisma/sql/2026-09-29-gap-entity-expansion.sql --url "$DATABASE_URL"

SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_verdict',
  $c$verdict IS NULL OR verdict IN ('DIRECT_BUYER','POTENTIAL_DIRECT_BUYER','PARTNER','NOT_FIT','UNKNOWN')$c$);
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_entity_type',
  $c$entity_type IS NULL OR entity_type IN ('shipper','retailer','distributor','manufacturer','3pl','carrier','port_terminal','broker','vendor','consultant','other')$c$);
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_decision',
  $c$decision IN ('open','added','mapped','research_more','ignored')$c$);
-- A decided candidate says who decided; an added or mapped one names its account.
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_decided',
  $c$decision = 'open' OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)$c$);
SELECT gap_add_check('gap_account_candidates', 'gap_ck_gap_account_candidates_account',
  $c$decision NOT IN ('added','mapped') OR account_name IS NOT NULL$c$);
