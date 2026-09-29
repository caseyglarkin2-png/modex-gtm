-- Rollback for 2026-09-28-gap-work-intake.sql (constraints and trigger only;
-- the tables themselves are dropped by removing the models and running db push).
DROP TRIGGER IF EXISTS gap_work_member_guard ON gap_work_source_members;
DROP FUNCTION IF EXISTS gap_work_member_guard();
ALTER TABLE gap_work_sources DROP CONSTRAINT IF EXISTS gap_ck_gap_work_sources_source_type;
ALTER TABLE gap_work_sources DROP CONSTRAINT IF EXISTS gap_ck_gap_work_sources_intent;
ALTER TABLE gap_work_sources DROP CONSTRAINT IF EXISTS gap_ck_gap_work_sources_status;
ALTER TABLE gap_work_source_members DROP CONSTRAINT IF EXISTS gap_ck_gap_work_source_members_kind;
ALTER TABLE gap_work_source_members DROP CONSTRAINT IF EXISTS gap_ck_gap_work_source_members_resolution;
ALTER TABLE gap_work_source_members DROP CONSTRAINT IF EXISTS gap_ck_gap_work_source_members_qualification;
ALTER TABLE gap_work_source_members DROP CONSTRAINT IF EXISTS gap_ck_gap_work_source_members_status;
