-- GAP Prospecting OS, Sprint 6A: rollback for 2026-09-24-gap-identity.sql AND
-- the GapAccountAlias model added to prisma/schema.prisma on the same date.
--
-- Drops ONLY the one CHECK constraint this phase added. The table itself is
-- dropped by `prisma db push` once GapAccountAlias is removed from
-- schema.prisma (Prisma owns table lifecycle; hand SQL here owns only what
-- db push cannot express). Idempotent: IF EXISTS throughout.
--
-- Apply:
--   npx prisma db execute --file prisma/sql/2026-09-24-gap-identity-rollback.sql --url "$DATABASE_URL"

ALTER TABLE gap_account_aliases DROP CONSTRAINT IF EXISTS gap_ck_gap_account_aliases_source;
