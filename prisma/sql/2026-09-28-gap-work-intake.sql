-- GAP Universal Work Intake (2026-09-28): hand SQL for gap_work_sources and
-- gap_work_source_members. Spec: docs/gap/UNIVERSAL_WORK_INTAKE_STATUS.md.
--
-- Depends on gap_add_check(), defined in 2026-09-23-gap-os.sql (apply that
-- first). Idempotent. Rollback: 2026-09-28-gap-work-intake-rollback.sql.
--
-- Apply AFTER `prisma db push` (or the equivalent additive DDL) has created
-- the two tables:
--   npx prisma db execute --file prisma/sql/2026-09-28-gap-work-intake.sql --url "$DATABASE_URL"
--
-- Error tokens:
--   GAP_WORK_MEMBER_FROZEN  a member's supplied provenance changed after insert

SELECT gap_add_check('gap_work_sources', 'gap_ck_gap_work_sources_source_type',
  $c$source_type IN ('newsletter','conference','crm_list','referral','relationship','target_list','content','inbound','other')$c$);
SELECT gap_add_check('gap_work_sources', 'gap_ck_gap_work_sources_intent',
  $c$intent IN ('research','find_people','prepare_outreach','follow_up','watch')$c$);
SELECT gap_add_check('gap_work_sources', 'gap_ck_gap_work_sources_status',
  $c$status IN ('active','archived')$c$);

SELECT gap_add_check('gap_work_source_members', 'gap_ck_gap_work_source_members_kind',
  $c$kind IN ('person','account')$c$);
SELECT gap_add_check('gap_work_source_members', 'gap_ck_gap_work_source_members_resolution',
  $c$resolution IN ('resolved','new_candidate','ambiguous','unresolved')$c$);
SELECT gap_add_check('gap_work_source_members', 'gap_ck_gap_work_source_members_qualification',
  $c$qualification IS NULL OR qualification IN ('research','evidence_ready','already_covered','in_deal','opportunity_unknown','not_icp','needs_identity','do_not_contact','human_review')$c$);
SELECT gap_add_check('gap_work_source_members', 'gap_ck_gap_work_source_members_status',
  $c$status IN ('active','ignored','not_now','research_requested')$c$);
-- Identity (account_name, persona_id) is DERIVED and deliberately not CHECKed: a Persona merged away
-- by the dedup engine sets persona_id NULL (FK ON DELETE SET NULL), and intake must never block CRM hygiene.

-- What Casey supplied is provenance: frozen after insert. Identity,
-- qualification, status and notes are derived or human and may move.
CREATE OR REPLACE FUNCTION gap_work_member_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF NEW.work_source_id IS DISTINCT FROM OLD.work_source_id THEN changed := array_append(changed, 'work_source_id'); END IF;
  IF NEW.kind IS DISTINCT FROM OLD.kind THEN changed := array_append(changed, 'kind'); END IF;
  IF NEW.member_key IS DISTINCT FROM OLD.member_key THEN changed := array_append(changed, 'member_key'); END IF;
  IF NEW.raw IS DISTINCT FROM OLD.raw THEN changed := array_append(changed, 'raw'); END IF;
  IF NEW.name IS DISTINCT FROM OLD.name THEN changed := array_append(changed, 'name'); END IF;
  IF NEW.title IS DISTINCT FROM OLD.title THEN changed := array_append(changed, 'title'); END IF;
  IF NEW.company IS DISTINCT FROM OLD.company THEN changed := array_append(changed, 'company'); END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN changed := array_append(changed, 'email'); END IF;
  IF NEW.linkedin_url IS DISTINCT FROM OLD.linkedin_url THEN changed := array_append(changed, 'linkedin_url'); END IF;
  IF NEW.company_domain IS DISTINCT FROM OLD.company_domain THEN changed := array_append(changed, 'company_domain'); END IF;
  IF NEW.source_identifier IS DISTINCT FROM OLD.source_identifier THEN changed := array_append(changed, 'source_identifier'); END IF;
  IF NEW.ingested_at IS DISTINCT FROM OLD.ingested_at THEN changed := array_append(changed, 'ingested_at'); END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN changed := array_append(changed, 'created_by'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_WORK_MEMBER_FROZEN: gap_work_source_members.% refused change to % (supplied provenance is frozen)', OLD.id, array_to_string(changed, ',');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_work_member_guard ON gap_work_source_members;
CREATE TRIGGER gap_work_member_guard
  BEFORE UPDATE ON gap_work_source_members
  FOR EACH ROW EXECUTE FUNCTION gap_work_member_guard();
