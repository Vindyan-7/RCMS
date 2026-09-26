-- ============================================================================
-- RCMS Migration Script: Club Events Phase 3.1 Hardening
-- Description:
-- 1. Updates event_votes unique constraint to support configurable
--    votes_per_participant (unique per event, voter_participant_id, submission_id)
-- 2. Ensures normalized_mobile is populated on event_participants for official members
--    so database unique constraint uq_event_participants_fresher prevents cross-identity bypass
-- ============================================================================

-- 1. Upgrade event_votes unique constraint to allow multiple votes per participant across distinct submissions
ALTER TABLE IF EXISTS "event_votes"
  DROP CONSTRAINT IF EXISTS "uq_event_votes_participant";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_event_votes_voter_submission'
  ) THEN
    ALTER TABLE "event_votes"
      ADD CONSTRAINT "uq_event_votes_voter_submission" UNIQUE ("event_id", "voter_participant_id", "submission_id");
  END IF;
END $$;

-- 2. Backfill / sync normalized_mobile for any existing official member participants
UPDATE "event_participants" ep
SET
  "normalized_mobile" = RIGHT(REGEXP_REPLACE(m."phone", '\D', '', 'g'), 10),
  "mobile_number" = m."phone"
FROM "members" m
WHERE ep."member_id" = m."id"
  AND ep."normalized_mobile" IS NULL;

-- 3. Verify indexes exist
CREATE INDEX IF NOT EXISTS "idx_event_votes_voter_submission"
  ON "event_votes" ("event_id", "voter_participant_id", "submission_id");
