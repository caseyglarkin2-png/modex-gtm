-- GAP Prospecting OS: rollback for 2026-09-23-gap-os.sql AND the GAP models
-- added to prisma/schema.prisma on the same date.
--
-- Drops ONLY what GAP added: its triggers, functions, partial indexes, CHECK
-- constraints, the fourteen new tables, and the one nullable column on
-- draft_queue_items. Nothing pre-existing is touched. Idempotent: every
-- statement is IF EXISTS, so it applies cleanly on a database where the forward
-- file was never run, and applies again after itself.
--
-- Apply:
--   npx prisma db execute --file prisma/sql/2026-09-23-gap-os-rollback.sql --url "$DATABASE_URL"
--
-- After running this, revert prisma/schema.prisma to the pre-GAP commit before
-- the next `prisma db push`, or push will recreate the tables.

-- ---------------------------------------------------------------------------
-- 1. Triggers (before the functions they reference)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS gap_version_guard_ins ON sequence_versions;
DROP TRIGGER IF EXISTS gap_version_guard_upd ON sequence_versions;
DROP TRIGGER IF EXISTS gap_version_guard_del ON sequence_versions;
DROP TRIGGER IF EXISTS gap_enrollment_freeze_version ON sequence_enrollments;
DROP TRIGGER IF EXISTS gap_enrollment_pin_guard ON sequence_enrollments;
DROP TRIGGER IF EXISTS gap_append_only_copy_events ON sequence_copy_events;
DROP TRIGGER IF EXISTS gap_append_only_hypothesis_events ON hypothesis_events;
DROP TRIGGER IF EXISTS gap_append_only_audit_events ON gap_audit_events;
DROP TRIGGER IF EXISTS gap_bid_guard_upd ON buyer_input_data;
DROP TRIGGER IF EXISTS gap_bid_guard_del ON buyer_input_data;
DROP TRIGGER IF EXISTS gap_signal_guard ON prospecting_signals;
DROP TRIGGER IF EXISTS gap_hypothesis_guard ON prospecting_hypotheses;
DROP TRIGGER IF EXISTS gap_hypothesis_signal_unlink_guard ON hypothesis_signals;
DROP TRIGGER IF EXISTS gap_disposition_guard ON conversation_dispositions;

-- ---------------------------------------------------------------------------
-- 2. Functions
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS gap_version_guard();
DROP FUNCTION IF EXISTS gap_enrollment_freeze_version();
DROP FUNCTION IF EXISTS gap_enrollment_pin_guard();
DROP FUNCTION IF EXISTS gap_append_only_guard();
DROP FUNCTION IF EXISTS gap_bid_guard();
DROP FUNCTION IF EXISTS gap_signal_guard();
DROP FUNCTION IF EXISTS gap_hypothesis_guard();
DROP FUNCTION IF EXISTS gap_hypothesis_signal_unlink_guard();
DROP FUNCTION IF EXISTS gap_disposition_guard();
DROP FUNCTION IF EXISTS gap_add_check(text, text, text);

-- ---------------------------------------------------------------------------
-- 3. Partial unique indexes
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS gap_uq_enrollments_active_email;
DROP INDEX IF EXISTS gap_uq_hypotheses_source_ref;

-- ---------------------------------------------------------------------------
-- 4. CHECK constraints (redundant with the table drops below, kept explicit so
--    this section alone reverts the hand SQL while leaving the tables in place)
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS prospecting_signals DROP CONSTRAINT IF EXISTS gap_ck_signals_source_kind;
ALTER TABLE IF EXISTS prospecting_signals DROP CONSTRAINT IF EXISTS gap_ck_signals_type;
ALTER TABLE IF EXISTS prospecting_signals DROP CONSTRAINT IF EXISTS gap_ck_signals_source_type;
ALTER TABLE IF EXISTS prospecting_signals DROP CONSTRAINT IF EXISTS gap_ck_signals_confidence;
ALTER TABLE IF EXISTS prospecting_hypotheses DROP CONSTRAINT IF EXISTS gap_ck_hypotheses_status;
ALTER TABLE IF EXISTS prospecting_hypotheses DROP CONSTRAINT IF EXISTS gap_ck_hypotheses_problem_family;
ALTER TABLE IF EXISTS prospecting_hypotheses DROP CONSTRAINT IF EXISTS gap_ck_hypotheses_persona;
ALTER TABLE IF EXISTS prospecting_hypotheses DROP CONSTRAINT IF EXISTS gap_ck_hypotheses_confidence;
ALTER TABLE IF EXISTS hypothesis_signals DROP CONSTRAINT IF EXISTS gap_ck_hypothesis_signals_role;
ALTER TABLE IF EXISTS conversation_dispositions DROP CONSTRAINT IF EXISTS gap_ck_dispositions_channel;
ALTER TABLE IF EXISTS conversation_dispositions DROP CONSTRAINT IF EXISTS gap_ck_dispositions_response_class;
ALTER TABLE IF EXISTS buyer_input_data DROP CONSTRAINT IF EXISTS gap_ck_bid_type;
ALTER TABLE IF EXISTS buyer_input_data DROP CONSTRAINT IF EXISTS gap_ck_bid_source;
ALTER TABLE IF EXISTS sequence_families DROP CONSTRAINT IF EXISTS gap_ck_families_engine;
ALTER TABLE IF EXISTS sequence_families DROP CONSTRAINT IF EXISTS gap_ck_families_problem_family;
ALTER TABLE IF EXISTS sequence_families DROP CONSTRAINT IF EXISTS gap_ck_families_persona;
ALTER TABLE IF EXISTS sequence_versions DROP CONSTRAINT IF EXISTS gap_ck_versions_status;
ALTER TABLE IF EXISTS sequence_enrollments DROP CONSTRAINT IF EXISTS gap_ck_enrollments_engine;
ALTER TABLE IF EXISTS sequence_enrollments DROP CONSTRAINT IF EXISTS gap_ck_enrollments_status;
ALTER TABLE IF EXISTS sequence_enrollments DROP CONSTRAINT IF EXISTS gap_ck_enrollments_stop_reason;
ALTER TABLE IF EXISTS sequence_copy_events DROP CONSTRAINT IF EXISTS gap_ck_copy_events_source;
ALTER TABLE IF EXISTS routing_decisions DROP CONSTRAINT IF EXISTS gap_ck_routing_mode;
ALTER TABLE IF EXISTS routing_decisions DROP CONSTRAINT IF EXISTS gap_ck_routing_action;
ALTER TABLE IF EXISTS routing_decisions DROP CONSTRAINT IF EXISTS gap_ck_routing_lane;
ALTER TABLE IF EXISTS gap_compiles DROP CONSTRAINT IF EXISTS gap_ck_compiles_verdict;

-- ---------------------------------------------------------------------------
-- 5. The new tables, children first. CASCADE covers the FKs among them; no
--    pre-existing table references a GAP table.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS gap_compiles CASCADE;
DROP TABLE IF EXISTS gap_audit_events CASCADE;
DROP TABLE IF EXISTS routing_decisions CASCADE;
DROP TABLE IF EXISTS gap_hubspot_mirror CASCADE;
DROP TABLE IF EXISTS buyer_input_data CASCADE;
-- S4-T3 added conversation_dispositions.metadata (Json?); it goes with the table, no separate DROP COLUMN.
DROP TABLE IF EXISTS conversation_dispositions CASCADE;
DROP TABLE IF EXISTS sequence_enrollments CASCADE;
DROP TABLE IF EXISTS sequence_copy_events CASCADE;
DROP TABLE IF EXISTS hypothesis_events CASCADE;
DROP TABLE IF EXISTS hypothesis_signals CASCADE;
DROP TABLE IF EXISTS prospecting_hypotheses CASCADE;
DROP TABLE IF EXISTS sequence_versions CASCADE;
DROP TABLE IF EXISTS sequence_families CASCADE;
DROP TABLE IF EXISTS prospecting_signals CASCADE;

-- ---------------------------------------------------------------------------
-- 6. The one nullable column (its index goes with it)
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS draft_queue_items DROP COLUMN IF EXISTS sequence_version_id;
