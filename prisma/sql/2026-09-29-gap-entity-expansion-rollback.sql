-- Rollback for 2026-09-29-gap-entity-expansion.sql (the CHECKs only; the table is dropped by the DDL rollback).
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_verdict;
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_entity_type;
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_decision;
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_decided;
ALTER TABLE gap_account_candidates DROP CONSTRAINT IF EXISTS gap_ck_gap_account_candidates_account;
