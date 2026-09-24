-- GAP Prospecting OS, Sprint 6D: rollback for 2026-09-24-gap-reconcile.sql.
-- Idempotent: IF EXISTS throughout.
--
-- Apply:
--   npx prisma db execute --file prisma/sql/2026-09-24-gap-reconcile-rollback.sql --url "$DATABASE_URL"

DROP TRIGGER IF EXISTS gap_disposition_enrollment_freeze ON conversation_dispositions;
DROP FUNCTION IF EXISTS gap_disposition_enrollment_freeze();
