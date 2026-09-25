-- GAP Prospecting OS, Sprint 6D: hand SQL for the reconciliation attribution
-- freeze. Spec: docs/GAP_PROSPECTING_OS.md, GAP OS RUNTIME section, 6D.
--
-- Idempotent (DROP TRIGGER IF EXISTS then CREATE). Rollback:
-- 2026-09-24-gap-reconcile-rollback.sql.
--
-- Apply AFTER `prisma db push`:
--   npx prisma db execute --file prisma/sql/2026-09-24-gap-reconcile.sql --url "$DATABASE_URL"
--
--   GAP_DISPOSITION_ENROLLMENT_FROZEN   conversation_dispositions.enrollment_id
--                                       freezes the FIRST time it is set to a
--                                       non-null value (independent of
--                                       human_confirmed: attribution is a fact
--                                       about which send produced a reply,
--                                       decided once at reconciliation time,
--                                       never a judgment call that revises
--                                       later). A row born with enrollment_id
--                                       already set is fine; only a CHANGE to
--                                       an already-non-null value is refused.

CREATE OR REPLACE FUNCTION gap_disposition_enrollment_freeze()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.enrollment_id IS NOT NULL AND NEW.enrollment_id IS DISTINCT FROM OLD.enrollment_id THEN
    RAISE EXCEPTION 'GAP_DISPOSITION_ENROLLMENT_FROZEN: conversation_dispositions.% has enrollment_id already set to %; refused change to %',
      OLD.id, OLD.enrollment_id, NEW.enrollment_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_disposition_enrollment_freeze ON conversation_dispositions;
CREATE TRIGGER gap_disposition_enrollment_freeze
  BEFORE UPDATE ON conversation_dispositions
  FOR EACH ROW EXECUTE FUNCTION gap_disposition_enrollment_freeze();
