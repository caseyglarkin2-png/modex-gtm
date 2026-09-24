-- GAP Prospecting OS, Sprint 6A: hand SQL for gap_account_aliases.
-- Spec: docs/GAP_PROSPECTING_OS.md, GAP OS RUNTIME section, 6A-T1.
--
-- Depends on gap_add_check(), defined in 2026-09-23-gap-os.sql (CREATE OR
-- REPLACE, so applying that file first is required but not re-defined here).
-- Idempotent (IF NOT EXISTS throughout). Rollback: 2026-09-24-gap-identity-rollback.sql.
--
-- Apply AFTER `prisma db push` has created gap_account_aliases:
--   npx prisma db execute --file prisma/sql/2026-09-24-gap-identity.sql --url "$DATABASE_URL"
--
-- The (name-collision) uniqueness on normalized_alias is already a Prisma
-- @@unique; the CHECK below is the one thing `db push` cannot express: the
-- provenance enum, so a garbage source value fails loudly instead of
-- silently widening what "explicit, curated" means for tier C of the
-- identity resolver.

SELECT gap_add_check('gap_account_aliases', 'gap_ck_gap_account_aliases_source',
  $c$source IN ('hypothesize_cron','manual')$c$);
