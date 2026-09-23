-- GAP Prospecting OS: hand SQL that `prisma db push` cannot express.
-- Spec: docs/GAP_PROSPECTING_OS.md sections 4.6 and 5.3.
--
-- Run AFTER `prisma db push` has created the GAP tables, and RERUN after every
-- later `db push`: push can recreate a table and drop its triggers. Idempotent
-- on purpose (CREATE OR REPLACE FUNCTION, DROP TRIGGER IF EXISTS then CREATE,
-- constraints guarded by IF NOT EXISTS, CREATE UNIQUE INDEX IF NOT EXISTS).
-- Verified by scripts/gap/verify-triggers.ts. Rollback: 2026-09-23-gap-os-rollback.sql.
--
-- Apply:
--   npx prisma db execute --file prisma/sql/2026-09-23-gap-os.sql --url "$DATABASE_URL"
--
-- Every guard raises with a distinct token so the verifier and the services can
-- assert the reason, not just "it failed":
--   GAP_VERSION_FROZEN      sequence_versions: only draft rows change; draft -> frozen only by a citing live enrollment;
--                           frozen -> retired is the one exception; a row is inserted frozen only by an import (R3-7b)
--   GAP_ENROLLMENT_PIN      sequence_enrollments: the pins never move after insert; the one backfill arm is R3-1
--   GAP_APPEND_ONLY         sequence_copy_events, hypothesis_events, gap_audit_events: no UPDATE, no DELETE
--   GAP_BID_IMMUTABLE       buyer_input_data: raw language and identity write-once; nothing moves once confirmed; no DELETE
--   GAP_SIGNAL_FROZEN       prospecting_signals: fact columns frozen after insert (only metadata moves)
--   GAP_HYPOTHESIS_FROZEN   prospecting_hypotheses narrative frozen past review; hypothesis_signals cannot link, unlink or re-point past review
--   GAP_HYPOTHESIS_UNSUPPORTED  prospecting_hypotheses cannot enter approved/active without reviewed_by and one evidenced linked signal
--   GAP_DISPOSITION_FROZEN  conversation_dispositions: classes and buyer language frozen once confirmed; confirmation never reverts
-- CHECK constraints are named gap_ck_<table>_<column> so a violation names itself.

-- ---------------------------------------------------------------------------
-- 1. CHECK constraints on every enum-like column (value lists from the spec
--    and src/lib/gap/taxonomy.ts; the two must stay identical).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_add_check(p_table text, p_name text, p_expr text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = p_name AND t.relname = p_table
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', p_table, p_name, p_expr);
  END IF;
END;
$$;

-- prospecting_signals
SELECT gap_add_check('prospecting_signals', 'gap_ck_signals_source_kind',
  $c$source_kind IN ('pounce_trigger','evidence_record','top100_evidence','pic_citation','operator_knowledge','crm','manual')$c$);
SELECT gap_add_check('prospecting_signals', 'gap_ck_signals_type',
  $c$type IN ('acquisition','new_site','site_expansion','automation_program','job_posting','technology_signal','news','intent','website_behavior','manual_research','other')$c$);
SELECT gap_add_check('prospecting_signals', 'gap_ck_signals_source_type',
  $c$source_type IN ('public_primary','public_secondary','first_party_intent','first_party','crm','manual')$c$);
SELECT gap_add_check('prospecting_signals', 'gap_ck_signals_confidence',
  $c$confidence BETWEEN 0 AND 100$c$);

-- prospecting_hypotheses
SELECT gap_add_check('prospecting_hypotheses', 'gap_ck_hypotheses_status',
  $c$status IN ('draft','review_required','approved','active','confirmed','partially_confirmed','rejected','unresolved','expired')$c$);
SELECT gap_add_check('prospecting_hypotheses', 'gap_ck_hypotheses_problem_family',
  $c$problem_family IN ('network_standardization','hidden_capacity','yard_state_integrity','driver_gate_scale','automation_readiness','cost_to_ship','chain_of_custody','unmapped')$c$);
SELECT gap_add_check('prospecting_hypotheses', 'gap_ck_hypotheses_persona',
  $c$persona IN ('executive_ops','supply_chain','transportation','distribution','site_ops','automation','security','finance_procurement','technology')$c$);
SELECT gap_add_check('prospecting_hypotheses', 'gap_ck_hypotheses_confidence',
  $c$confidence BETWEEN 0 AND 100$c$);

-- hypothesis_signals
SELECT gap_add_check('hypothesis_signals', 'gap_ck_hypothesis_signals_role',
  $c$role IN ('primary','supporting')$c$);

-- conversation_dispositions
SELECT gap_add_check('conversation_dispositions', 'gap_ck_dispositions_channel',
  $c$channel IN ('call','email','linkedin','meeting')$c$);
SELECT gap_add_check('conversation_dispositions', 'gap_ck_dispositions_response_class',
  $c$response_class IN ('problem_confirmed','problem_partially_confirmed','problem_rejected','wrong_person','referral','not_priority','timing','existing_solution','request_information','meeting_accepted','meeting_declined','do_not_contact','bounce','out_of_office','no_signal','no_answer','voicemail','gatekeeper')$c$);

-- buyer_input_data
SELECT gap_add_check('buyer_input_data', 'gap_ck_bid_type',
  $c$type IN ('current_state','business_problem','root_cause','impact','metric','future_state','priority','constraint','objection')$c$);
SELECT gap_add_check('buyer_input_data', 'gap_ck_bid_source',
  $c$source IN ('call','email','meeting','linkedin')$c$);

-- sequence_families
SELECT gap_add_check('sequence_families', 'gap_ck_families_engine',
  $c$engine IN ('hubspot_native','modex_draft_queue','manual')$c$);
SELECT gap_add_check('sequence_families', 'gap_ck_families_problem_family',
  $c$problem_family IS NULL OR problem_family IN ('network_standardization','hidden_capacity','yard_state_integrity','driver_gate_scale','automation_readiness','cost_to_ship','chain_of_custody','unmapped')$c$);
SELECT gap_add_check('sequence_families', 'gap_ck_families_persona',
  $c$persona IS NULL OR persona IN ('executive_ops','supply_chain','transportation','distribution','site_ops','automation','security','finance_procurement','technology')$c$);

-- sequence_versions
SELECT gap_add_check('sequence_versions', 'gap_ck_versions_status',
  $c$status IN ('draft','frozen','retired')$c$);

-- sequence_enrollments
SELECT gap_add_check('sequence_enrollments', 'gap_ck_enrollments_engine',
  $c$engine IN ('hubspot_native','modex_draft_queue','manual')$c$);
SELECT gap_add_check('sequence_enrollments', 'gap_ck_enrollments_status',
  $c$status IN ('active','paused','stop_pending','stopped','completed')$c$);
SELECT gap_add_check('sequence_enrollments', 'gap_ck_enrollments_stop_reason',
  $c$stop_reason IS NULL OR stop_reason IN ('replied','unsubscribed','in_thread','bounced','dnc','suppressed','manual','hypothesis_resolved','hypothesis_expired','sequence_retired','legacy_unknown')$c$);

-- sequence_copy_events
SELECT gap_add_check('sequence_copy_events', 'gap_ck_copy_events_source',
  $c$source IN ('journal_import','gap_push')$c$);

-- routing_decisions
SELECT gap_add_check('routing_decisions', 'gap_ck_routing_mode',
  $c$mode IN ('shadow','live')$c$);
SELECT gap_add_check('routing_decisions', 'gap_ck_routing_action',
  $c$action IN ('research_required','approve_hypothesis','call_now','enroll_gap_sequence','one_off_email','linkedin_manual_task','nurture','do_not_contact')$c$);
SELECT gap_add_check('routing_decisions', 'gap_ck_routing_lane',
  $c$lane IN ('work_queue','reply_triage','blocked')$c$);

-- gap_compiles
SELECT gap_add_check('gap_compiles', 'gap_ck_compiles_verdict',
  $c$verdict IN ('pass','review_required','reject')$c$);

-- ---------------------------------------------------------------------------
-- 2. Partial unique indexes (Prisma's schema language cannot express these).
-- ---------------------------------------------------------------------------

-- One live enrollment per recipient. Two concurrent enrolls for the same
-- address collide here; the loser is handled as already_enrolled.
CREATE UNIQUE INDEX IF NOT EXISTS gap_uq_enrollments_active_email
  ON sequence_enrollments (to_email)
  WHERE status IN ('active', 'paused', 'stop_pending');

-- One hypothesis per imported source row (pic:<slug>#<row>, research:<run>:<key>).
CREATE UNIQUE INDEX IF NOT EXISTS gap_uq_hypotheses_source_ref
  ON prospecting_hypotheses (source_ref)
  WHERE source_ref IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. sequence_versions: frozen unless draft (GAP_VERSION_FROZEN)
--    R3-7b: draft -> frozen is the freeze trigger's move (it cites the live
--    enrollment it just saw); a plain UPDATE cannot freeze a draft. A row is
--    INSERTED frozen only by an import that reconstructs what HubSpot or the
--    modex queue actually ran (provenance.kind journal | manifest |
--    modex_legacy) and it must say when (frozen_at).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_version_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
  prov_kind text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% is % and cannot be deleted', OLD.id, OLD.status;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'frozen' THEN
      prov_kind := NEW.provenance->>'kind';
      IF prov_kind IS NULL OR prov_kind NOT IN ('journal', 'manifest', 'modex_legacy') THEN
        RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% cannot be inserted frozen; only an import (provenance.kind journal, manifest or modex_legacy) may, got %', NEW.id, COALESCE(prov_kind, 'none');
      END IF;
      IF NEW.frozen_at IS NULL THEN
        RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% inserted frozen (provenance.kind %) without frozen_at', NEW.id, prov_kind;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Draft rows may change freely. The only way off draft is frozen, and only
  -- by citing the live (non-test, non-legacy) enrollment pinned to this
  -- version that froze it; a draft nobody wants is deleted, not retired.
  IF OLD.status = 'draft' THEN
    IF NEW.status NOT IN ('draft', 'frozen') THEN
      RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% is draft and may only become frozen, not %', OLD.id, NEW.status;
    END IF;
    IF NEW.status = 'frozen' THEN
      IF NEW.frozen_by_enrollment_id IS NULL THEN
        RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% may only become frozen by its first live enrollment; frozen_by_enrollment_id is null', OLD.id;
      END IF;
      IF NEW.frozen_at IS NULL THEN
        RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% may not become frozen without frozen_at', OLD.id;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM sequence_enrollments e
         WHERE e.id = NEW.frozen_by_enrollment_id
           AND e.sequence_version_id = NEW.id
           AND e.is_test = false
           AND e.legacy = false
      ) THEN
        RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% may only become frozen by a non-test, non-legacy enrollment pinned to it; % is not one', OLD.id, NEW.frozen_by_enrollment_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Off draft: the only status change is frozen -> retired.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'frozen' AND NEW.status = 'retired') THEN
    RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% is % and cannot become %', OLD.id, OLD.status, NEW.status;
  END IF;

  IF NEW.steps IS DISTINCT FROM OLD.steps THEN changed := array_append(changed, 'steps'); END IF;
  IF NEW.steps_hash IS DISTINCT FROM OLD.steps_hash THEN changed := array_append(changed, 'steps_hash'); END IF;
  IF NEW.family_id IS DISTINCT FROM OLD.family_id THEN changed := array_append(changed, 'family_id'); END IF;
  IF NEW.version IS DISTINCT FROM OLD.version THEN changed := array_append(changed, 'version'); END IF;
  IF NEW.hubspot_template_ids IS DISTINCT FROM OLD.hubspot_template_ids THEN changed := array_append(changed, 'hubspot_template_ids'); END IF;
  IF NEW.provenance IS DISTINCT FROM OLD.provenance THEN changed := array_append(changed, 'provenance'); END IF;
  IF NEW.frozen_at IS DISTINCT FROM OLD.frozen_at THEN changed := array_append(changed, 'frozen_at'); END IF;
  IF NEW.frozen_by_enrollment_id IS DISTINCT FROM OLD.frozen_by_enrollment_id THEN changed := array_append(changed, 'frozen_by_enrollment_id'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_VERSION_FROZEN: sequence_versions.% is %; refused change to %', OLD.id, OLD.status, array_to_string(changed, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_version_guard_ins ON sequence_versions;
CREATE TRIGGER gap_version_guard_ins
  BEFORE INSERT ON sequence_versions
  FOR EACH ROW EXECUTE FUNCTION gap_version_guard();

DROP TRIGGER IF EXISTS gap_version_guard_upd ON sequence_versions;
CREATE TRIGGER gap_version_guard_upd
  BEFORE UPDATE ON sequence_versions
  FOR EACH ROW EXECUTE FUNCTION gap_version_guard();

DROP TRIGGER IF EXISTS gap_version_guard_del ON sequence_versions;
CREATE TRIGGER gap_version_guard_del
  BEFORE DELETE ON sequence_versions
  FOR EACH ROW EXECUTE FUNCTION gap_version_guard();

-- ---------------------------------------------------------------------------
-- 4. sequence_enrollments: first non-test, non-legacy enrollment freezes its
--    version. R2-5: a legacy=true row is a readback ledger entry (HubSpot said
--    the contact is in a lane-built sequence); nobody received the placeholder
--    scaffold, so it must stay draft for S3-T4 to reconstruct the real steps.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_enrollment_freeze_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Plain invoker rights; the version guard allows draft -> frozen.
  UPDATE sequence_versions
     SET status = 'frozen',
         frozen_at = now(),
         frozen_by_enrollment_id = NEW.id,
         updated_at = now()
   WHERE id = NEW.sequence_version_id
     AND status = 'draft';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS gap_enrollment_freeze_version ON sequence_enrollments;
CREATE TRIGGER gap_enrollment_freeze_version
  AFTER INSERT ON sequence_enrollments
  FOR EACH ROW
  WHEN (NEW.is_test = false AND NEW.legacy = false)
  EXECUTE FUNCTION gap_enrollment_freeze_version();

-- ---------------------------------------------------------------------------
-- 5. sequence_enrollments: pins immutable after insert (GAP_ENROLLMENT_PIN);
--    R2-5b / R3-1: one-time attribution backfill for HubSpot legacy rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_enrollment_pin_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
  backfill boolean;
BEGIN
  -- R2-5b: a Sprint 2 legacy readback row was inserted against the placeholder
  -- v1 with no rendered steps. Its attribution to the reconstructed journal
  -- version (S3-T4) is a one-time backfill of exactly three columns. R3-1
  -- narrows the arm to what that backfill actually is: the row is a HubSpot
  -- readback (engine hubspot_native; a modex legacy row has rendered_steps
  -- NULL by design and never qualifies), the statement sets rendered_steps
  -- (so the arm closes in the same statement it is used), and the new version
  -- belongs to the row's own family. Every other pinned column stays refused
  -- throughout, and once rendered_steps is set the row is fully pinned again.
  backfill := (
    OLD.legacy = true
    AND OLD.engine = 'hubspot_native'
    AND OLD.rendered_steps IS NULL
    AND NEW.rendered_steps IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM sequence_versions v
       WHERE v.id = NEW.sequence_version_id
         AND v.family_id = OLD.family_id
    )
  );
  IF NOT backfill AND NEW.sequence_version_id IS DISTINCT FROM OLD.sequence_version_id THEN changed := array_append(changed, 'sequence_version_id'); END IF;
  IF NEW.family_id IS DISTINCT FROM OLD.family_id THEN changed := array_append(changed, 'family_id'); END IF;
  IF NEW.engine IS DISTINCT FROM OLD.engine THEN changed := array_append(changed, 'engine'); END IF;
  IF NEW.to_email IS DISTINCT FROM OLD.to_email THEN changed := array_append(changed, 'to_email'); END IF;
  IF NEW.hubspot_contact_id IS DISTINCT FROM OLD.hubspot_contact_id THEN changed := array_append(changed, 'hubspot_contact_id'); END IF;
  IF NEW.hubspot_sequence_id IS DISTINCT FROM OLD.hubspot_sequence_id THEN changed := array_append(changed, 'hubspot_sequence_id'); END IF;
  IF NEW.hypothesis_id IS DISTINCT FROM OLD.hypothesis_id THEN changed := array_append(changed, 'hypothesis_id'); END IF;
  IF NOT backfill AND NEW.rendered_steps IS DISTINCT FROM OLD.rendered_steps THEN changed := array_append(changed, 'rendered_steps'); END IF;
  IF NOT backfill AND NEW.rendered_steps_hash IS DISTINCT FROM OLD.rendered_steps_hash THEN changed := array_append(changed, 'rendered_steps_hash'); END IF;
  IF NEW.enrolled_at IS DISTINCT FROM OLD.enrolled_at THEN changed := array_append(changed, 'enrolled_at'); END IF;
  IF NEW.legacy IS DISTINCT FROM OLD.legacy THEN changed := array_append(changed, 'legacy'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_ENROLLMENT_PIN: sequence_enrollments.% refused change to %', OLD.id, array_to_string(changed, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_enrollment_pin_guard ON sequence_enrollments;
CREATE TRIGGER gap_enrollment_pin_guard
  BEFORE UPDATE ON sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION gap_enrollment_pin_guard();

-- ---------------------------------------------------------------------------
-- 6. Append-only tables (GAP_APPEND_ONLY): sequence_copy_events, hypothesis_events, gap_audit_events
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_append_only_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'GAP_APPEND_ONLY: % on % refused (append-only table)', TG_OP, TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS gap_append_only_copy_events ON sequence_copy_events;
CREATE TRIGGER gap_append_only_copy_events
  BEFORE UPDATE OR DELETE ON sequence_copy_events
  FOR EACH ROW EXECUTE FUNCTION gap_append_only_guard();

DROP TRIGGER IF EXISTS gap_append_only_hypothesis_events ON hypothesis_events;
CREATE TRIGGER gap_append_only_hypothesis_events
  BEFORE UPDATE OR DELETE ON hypothesis_events
  FOR EACH ROW EXECUTE FUNCTION gap_append_only_guard();

DROP TRIGGER IF EXISTS gap_append_only_audit_events ON gap_audit_events;
CREATE TRIGGER gap_append_only_audit_events
  BEFORE UPDATE OR DELETE ON gap_audit_events
  FOR EACH ROW EXECUTE FUNCTION gap_append_only_guard();

-- ---------------------------------------------------------------------------
-- 7. buyer_input_data: write-once language and identity; nothing moves once
--    confirmed; never deleted (GAP_BID_IMMUTABLE)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_bid_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'GAP_BID_IMMUTABLE: buyer_input_data.% cannot be deleted; correct it with a new row carrying supersedes_id', OLD.id;
  END IF;

  IF NEW.raw_buyer_language IS DISTINCT FROM OLD.raw_buyer_language THEN changed := array_append(changed, 'raw_buyer_language'); END IF;
  IF NEW.type IS DISTINCT FROM OLD.type THEN changed := array_append(changed, 'type'); END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN changed := array_append(changed, 'source'); END IF;
  IF NEW.captured_at IS DISTINCT FROM OLD.captured_at THEN changed := array_append(changed, 'captured_at'); END IF;
  IF NEW.captured_by IS DISTINCT FROM OLD.captured_by THEN changed := array_append(changed, 'captured_by'); END IF;
  IF NEW.hypothesis_id IS DISTINCT FROM OLD.hypothesis_id THEN changed := array_append(changed, 'hypothesis_id'); END IF;
  IF NEW.contact_email IS DISTINCT FROM OLD.contact_email THEN changed := array_append(changed, 'contact_email'); END IF;
  IF NEW.supersedes_id IS DISTINCT FROM OLD.supersedes_id THEN changed := array_append(changed, 'supersedes_id'); END IF;
  IF NEW.numeric_value IS DISTINCT FROM OLD.numeric_value THEN changed := array_append(changed, 'numeric_value'); END IF;
  IF NEW.unit IS DISTINCT FROM OLD.unit THEN changed := array_append(changed, 'unit'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_BID_IMMUTABLE: buyer_input_data.% refused change to % (write-once)', OLD.id, array_to_string(changed, ',');
  END IF;

  -- Once confirmed, nothing moves. updated_at is excluded so a Prisma
  -- @updatedAt touch is not itself the violation; every real column is.
  IF OLD.human_confirmed THEN
    IF NEW.human_confirmed IS DISTINCT FROM OLD.human_confirmed THEN changed := array_append(changed, 'human_confirmed'); END IF;
    IF NEW.normalized_summary IS DISTINCT FROM OLD.normalized_summary THEN changed := array_append(changed, 'normalized_summary'); END IF;
    IF NEW.account_name IS DISTINCT FROM OLD.account_name THEN changed := array_append(changed, 'account_name'); END IF;
    IF NEW.persona_id IS DISTINCT FROM OLD.persona_id THEN changed := array_append(changed, 'persona_id'); END IF;
    IF NEW.disposition_id IS DISTINCT FROM OLD.disposition_id THEN changed := array_append(changed, 'disposition_id'); END IF;
    IF NEW.inbound_message_id IS DISTINCT FROM OLD.inbound_message_id THEN changed := array_append(changed, 'inbound_message_id'); END IF;
    IF NEW.activity_id IS DISTINCT FROM OLD.activity_id THEN changed := array_append(changed, 'activity_id'); END IF;
    IF NEW.ai_extracted IS DISTINCT FROM OLD.ai_extracted THEN changed := array_append(changed, 'ai_extracted'); END IF;
    IF NEW.confirmed_by IS DISTINCT FROM OLD.confirmed_by THEN changed := array_append(changed, 'confirmed_by'); END IF;
    IF NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at THEN changed := array_append(changed, 'confirmed_at'); END IF;
    IF NEW.metadata IS DISTINCT FROM OLD.metadata THEN changed := array_append(changed, 'metadata'); END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN changed := array_append(changed, 'created_at'); END IF;

    IF array_length(changed, 1) > 0 THEN
      RAISE EXCEPTION 'GAP_BID_IMMUTABLE: buyer_input_data.% is human_confirmed; refused change to %', OLD.id, array_to_string(changed, ',');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_bid_guard_upd ON buyer_input_data;
CREATE TRIGGER gap_bid_guard_upd
  BEFORE UPDATE ON buyer_input_data
  FOR EACH ROW EXECUTE FUNCTION gap_bid_guard();

DROP TRIGGER IF EXISTS gap_bid_guard_del ON buyer_input_data;
CREATE TRIGGER gap_bid_guard_del
  BEFORE DELETE ON buyer_input_data
  FOR EACH ROW EXECUTE FUNCTION gap_bid_guard();

-- ---------------------------------------------------------------------------
-- 8. prospecting_signals: fact columns frozen after insert (GAP_SIGNAL_FROZEN);
--    only metadata may change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_signal_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title THEN changed := array_append(changed, 'title'); END IF;
  IF NEW.summary IS DISTINCT FROM OLD.summary THEN changed := array_append(changed, 'summary'); END IF;
  IF NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN changed := array_append(changed, 'evidence_url'); END IF;
  IF NEW.evidence_text IS DISTINCT FROM OLD.evidence_text THEN changed := array_append(changed, 'evidence_text'); END IF;
  IF NEW.observed_at IS DISTINCT FROM OLD.observed_at THEN changed := array_append(changed, 'observed_at'); END IF;
  IF NEW.source_kind IS DISTINCT FROM OLD.source_kind THEN changed := array_append(changed, 'source_kind'); END IF;
  IF NEW.source_id IS DISTINCT FROM OLD.source_id THEN changed := array_append(changed, 'source_id'); END IF;
  IF NEW.source_type IS DISTINCT FROM OLD.source_type THEN changed := array_append(changed, 'source_type'); END IF;
  IF NEW.claim_class IS DISTINCT FROM OLD.claim_class THEN changed := array_append(changed, 'claim_class'); END IF;
  -- An operator fact must never flip to public, a fact never moves accounts,
  -- confidence is set at registration, and expiry is never extended.
  IF NEW.external_ok IS DISTINCT FROM OLD.external_ok THEN changed := array_append(changed, 'external_ok'); END IF;
  IF NEW.account_name IS DISTINCT FROM OLD.account_name THEN changed := array_append(changed, 'account_name'); END IF;
  IF NEW.confidence IS DISTINCT FROM OLD.confidence THEN changed := array_append(changed, 'confidence'); END IF;
  IF NEW.freshness_expires_at IS DISTINCT FROM OLD.freshness_expires_at THEN changed := array_append(changed, 'freshness_expires_at'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_SIGNAL_FROZEN: prospecting_signals.% refused change to % (register a new signal instead)', OLD.id, array_to_string(changed, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_signal_guard ON prospecting_signals;
CREATE TRIGGER gap_signal_guard
  BEFORE UPDATE ON prospecting_signals
  FOR EACH ROW EXECUTE FUNCTION gap_signal_guard();

-- ---------------------------------------------------------------------------
-- 9. prospecting_hypotheses: narrative frozen past review (GAP_HYPOTHESIS_FROZEN)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_hypothesis_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  -- R1-7 begin: the machine's approve/activate guards, enforced at the DB.
  -- Entering approved or active requires a reviewer and at least one linked
  -- signal that carries evidence (a url or first-party text). Code checks
  -- expiry and suppression; this is the floor nothing can bypass.
  IF NEW.status IN ('approved', 'active') AND OLD.status NOT IN ('approved', 'active') THEN
    IF NEW.reviewed_by IS NULL THEN
      RAISE EXCEPTION 'GAP_HYPOTHESIS_UNSUPPORTED: prospecting_hypotheses.% cannot become % without reviewed_by', OLD.id, NEW.status;
    END IF;
    IF NOT EXISTS (
      SELECT 1
        FROM hypothesis_signals hs
        JOIN prospecting_signals s ON s.id = hs.signal_id
       WHERE hs.hypothesis_id = NEW.id
         AND (s.evidence_url IS NOT NULL OR s.evidence_text IS NOT NULL)
    ) THEN
      RAISE EXCEPTION 'GAP_HYPOTHESIS_UNSUPPORTED: prospecting_hypotheses.% cannot become % without a linked signal carrying evidence_url or evidence_text', OLD.id, NEW.status;
    END IF;
  END IF;
  -- R1-7 end

  IF OLD.status IN ('draft', 'review_required') THEN
    RETURN NEW;
  END IF;

  IF NEW.observation IS DISTINCT FROM OLD.observation THEN changed := array_append(changed, 'observation'); END IF;
  IF NEW.problem_hypothesis IS DISTINCT FROM OLD.problem_hypothesis THEN changed := array_append(changed, 'problem_hypothesis'); END IF;
  IF NEW.root_cause_hypotheses IS DISTINCT FROM OLD.root_cause_hypotheses THEN changed := array_append(changed, 'root_cause_hypotheses'); END IF;
  IF NEW.impact_hypotheses IS DISTINCT FROM OLD.impact_hypotheses THEN changed := array_append(changed, 'impact_hypotheses'); END IF;
  IF NEW.why_now IS DISTINCT FROM OLD.why_now THEN changed := array_append(changed, 'why_now'); END IF;
  IF NEW.falsification_questions IS DISTINCT FROM OLD.falsification_questions THEN changed := array_append(changed, 'falsification_questions'); END IF;
  IF NEW.what_a_no_means IS DISTINCT FROM OLD.what_a_no_means THEN changed := array_append(changed, 'what_a_no_means'); END IF;
  IF NEW.problem_family IS DISTINCT FROM OLD.problem_family THEN changed := array_append(changed, 'problem_family'); END IF;
  IF NEW.persona IS DISTINCT FROM OLD.persona THEN changed := array_append(changed, 'persona'); END IF;
  IF NEW.confidence IS DISTINCT FROM OLD.confidence THEN changed := array_append(changed, 'confidence'); END IF;
  IF NEW.secondary_families IS DISTINCT FROM OLD.secondary_families THEN changed := array_append(changed, 'secondary_families'); END IF;
  IF NEW.contrary_evidence IS DISTINCT FROM OLD.contrary_evidence THEN changed := array_append(changed, 'contrary_evidence'); END IF;
  IF NEW.predicted_buyer_language IS DISTINCT FROM OLD.predicted_buyer_language THEN changed := array_append(changed, 'predicted_buyer_language'); END IF;
  IF NEW.buying_center IS DISTINCT FROM OLD.buying_center THEN changed := array_append(changed, 'buying_center'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_HYPOTHESIS_FROZEN: prospecting_hypotheses.% is %; refused change to % (reopen with a new row carrying supersedes_id)', OLD.id, OLD.status, array_to_string(changed, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_hypothesis_guard ON prospecting_hypotheses;
CREATE TRIGGER gap_hypothesis_guard
  BEFORE UPDATE ON prospecting_hypotheses
  FOR EACH ROW EXECUTE FUNCTION gap_hypothesis_guard();

-- hypothesis_signals: a link cannot be added, removed or re-pointed once its
-- hypothesis left review. Both ends are checked on UPDATE so a link cannot be
-- moved out of, or into, a hypothesis that is past review, and INSERT (N4)
-- checks the target the same way, so the evidence set of an approved or
-- active hypothesis is exactly what the reviewer saw.
CREATE OR REPLACE FUNCTION gap_hypothesis_signal_unlink_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_status text;
  target_status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO target_status FROM prospecting_hypotheses WHERE id = NEW.hypothesis_id;
    IF target_status IS NOT NULL AND target_status NOT IN ('draft', 'review_required') THEN
      RAISE EXCEPTION 'GAP_HYPOTHESIS_FROZEN: hypothesis % is %; a link to signal % cannot be added', NEW.hypothesis_id, target_status, NEW.signal_id;
    END IF;
    RETURN NEW;
  END IF;

  SELECT status INTO parent_status FROM prospecting_hypotheses WHERE id = OLD.hypothesis_id;

  IF TG_OP = 'DELETE' THEN
    IF parent_status IS NOT NULL AND parent_status NOT IN ('draft', 'review_required') THEN
      RAISE EXCEPTION 'GAP_HYPOTHESIS_FROZEN: hypothesis % is %; signal % cannot be unlinked', OLD.hypothesis_id, parent_status, OLD.signal_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.signal_id IS DISTINCT FROM OLD.signal_id OR NEW.hypothesis_id IS DISTINCT FROM OLD.hypothesis_id THEN
    IF parent_status IS NOT NULL AND parent_status NOT IN ('draft', 'review_required') THEN
      RAISE EXCEPTION 'GAP_HYPOTHESIS_FROZEN: hypothesis % is %; link to signal % cannot be re-pointed', OLD.hypothesis_id, parent_status, OLD.signal_id;
    END IF;
    IF NEW.hypothesis_id IS DISTINCT FROM OLD.hypothesis_id THEN
      SELECT status INTO target_status FROM prospecting_hypotheses WHERE id = NEW.hypothesis_id;
      IF target_status IS NOT NULL AND target_status NOT IN ('draft', 'review_required') THEN
        RAISE EXCEPTION 'GAP_HYPOTHESIS_FROZEN: hypothesis % is %; a link cannot be moved into it', NEW.hypothesis_id, target_status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_hypothesis_signal_unlink_guard ON hypothesis_signals;
CREATE TRIGGER gap_hypothesis_signal_unlink_guard
  BEFORE INSERT OR UPDATE OR DELETE ON hypothesis_signals
  FOR EACH ROW EXECUTE FUNCTION gap_hypothesis_signal_unlink_guard();

-- ---------------------------------------------------------------------------
-- 10. conversation_dispositions: classes and buyer language frozen once
--     confirmed; confirmation never reverts (GAP_DISPOSITION_FROZEN)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION gap_disposition_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF NOT OLD.human_confirmed THEN
    RETURN NEW;
  END IF;

  IF NOT NEW.human_confirmed THEN
    RAISE EXCEPTION 'GAP_DISPOSITION_FROZEN: conversation_dispositions.% is human_confirmed; confirmation cannot revert', OLD.id;
  END IF;

  IF NEW.response_class IS DISTINCT FROM OLD.response_class THEN changed := array_append(changed, 'response_class'); END IF;
  IF NEW.root_cause_class IS DISTINCT FROM OLD.root_cause_class THEN changed := array_append(changed, 'root_cause_class'); END IF;
  IF NEW.impact_class IS DISTINCT FROM OLD.impact_class THEN changed := array_append(changed, 'impact_class'); END IF;
  IF NEW.buyer_language IS DISTINCT FROM OLD.buyer_language THEN changed := array_append(changed, 'buyer_language'); END IF;

  IF array_length(changed, 1) > 0 THEN
    RAISE EXCEPTION 'GAP_DISPOSITION_FROZEN: conversation_dispositions.% is human_confirmed; refused change to %', OLD.id, array_to_string(changed, ',');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gap_disposition_guard ON conversation_dispositions;
CREATE TRIGGER gap_disposition_guard
  BEFORE UPDATE ON conversation_dispositions
  FOR EACH ROW EXECUTE FUNCTION gap_disposition_guard();
