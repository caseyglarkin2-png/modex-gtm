-- Draft Queue — manual SQL that `prisma db push` cannot express.
-- Run AFTER `prisma db push` has created draft_queue_items.
--
-- This repo uses `prisma db push` (see package.json db:push), not Prisma Migrate.
-- `db push` creates the draft_queue_items table + its regular @@index list and the
-- email_logs(to_email) index from schema.prisma. It does NOT create partial
-- (filtered) unique indexes, which Prisma's schema language cannot represent.
--
-- The partial unique index is the atomic dedup guard: two concurrent adds for the
-- same recipient collide at the DB (the loser is handled as already_queued), and a
-- recipient can be re-queued once a prior attempt reached a terminal state.
CREATE UNIQUE INDEX IF NOT EXISTS draft_queue_active_recipient
  ON draft_queue_items (to_email)
  WHERE status NOT IN ('sent', 'skipped', 'failed');

-- Optional (prod): if email_logs is large, prefer building its new index without a
-- write lock instead of letting `db push` build it inline:
--   DROP INDEX IF EXISTS email_logs_to_email_idx;  -- if db push already made it
--   CREATE INDEX CONCURRENTLY email_logs_to_email_idx ON email_logs (to_email);
