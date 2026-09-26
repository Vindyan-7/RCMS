-- ============================================================================
-- RCMS Migration Script: Configurable Club Events, Project Submissions, Gallery & Voting
-- Description: Extends events with challenge/competition settings and creates
--              event_participants, event_submissions, event_submission_images, and event_votes.
-- ============================================================================

-- 1. Extend canonical "events" table with competition & voting configuration
ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "submission_start_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "submission_end_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "min_images" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "max_images" INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "min_description_chars" INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "voting_state" VARCHAR(20) DEFAULT 'NOT_STARTED' NOT NULL,
  ADD COLUMN IF NOT EXISTS "voting_start_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "voting_end_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "votes_per_participant" INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "self_voting_allowed" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "show_vote_counts" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "number_of_winners" INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "winners_finalized" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "winners_finalized_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "is_competition" BOOLEAN DEFAULT true NOT NULL;

-- Allow created_by / updated_by to be optional to align with previous audit strategy migrations
ALTER TABLE IF EXISTS "events" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE IF EXISTS "events" ALTER COLUMN "updated_by" DROP NOT NULL;

-- 2. Create "event_participants" table for canonical participant identity (Member or Fresher)
CREATE TABLE IF NOT EXISTS "event_participants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "participant_type" VARCHAR(20) NOT NULL CHECK ("participant_type" IN ('member', 'fresher')),
  "member_id" UUID REFERENCES "members"("id") ON DELETE RESTRICT,
  "fresher_name" VARCHAR(100),
  "mobile_number" VARCHAR(20),
  "normalized_mobile" VARCHAR(20),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_event_participants_member" UNIQUE ("event_id", "member_id"),
  CONSTRAINT "uq_event_participants_fresher" UNIQUE ("event_id", "normalized_mobile")
);

CREATE INDEX IF NOT EXISTS "idx_event_participants_event_id" ON "event_participants" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_participants_member" ON "event_participants" ("event_id", "member_id");
CREATE INDEX IF NOT EXISTS "idx_event_participants_mobile" ON "event_participants" ("event_id", "normalized_mobile");

-- 3. Create "event_submissions" table
CREATE TABLE IF NOT EXISTS "event_submissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "participant_id" UUID NOT NULL REFERENCES "event_participants"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'submitted' NOT NULL CHECK ("status" IN ('draft', 'submitted', 'published', 'rejected', 'hidden')),
  "admin_feedback" TEXT,
  "winner_rank" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_event_submissions_participant" UNIQUE ("event_id", "participant_id")
);

CREATE INDEX IF NOT EXISTS "idx_event_submissions_event_id" ON "event_submissions" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_submissions_participant" ON "event_submissions" ("participant_id");
CREATE INDEX IF NOT EXISTS "idx_event_submissions_status" ON "event_submissions" ("event_id", "status");

-- 4. Create "event_submission_images" table
CREATE TABLE IF NOT EXISTS "event_submission_images" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "submission_id" UUID NOT NULL REFERENCES "event_submissions"("id") ON DELETE CASCADE,
  "image_url" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "file_size_bytes" INTEGER,
  "mime_type" VARCHAR(50),
  "display_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_event_submission_images_submission" ON "event_submission_images" ("submission_id");

-- 5. Create "event_votes" table
CREATE TABLE IF NOT EXISTS "event_votes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "voter_participant_id" UUID NOT NULL REFERENCES "event_participants"("id") ON DELETE CASCADE,
  "submission_id" UUID NOT NULL REFERENCES "event_submissions"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "uq_event_votes_participant" UNIQUE ("event_id", "voter_participant_id")
);

CREATE INDEX IF NOT EXISTS "idx_event_votes_event_id" ON "event_votes" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_votes_voter" ON "event_votes" ("voter_participant_id");
CREATE INDEX IF NOT EXISTS "idx_event_votes_submission" ON "event_votes" ("submission_id");

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE "event_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_submission_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_votes" ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public can view published submissions" ON "event_submissions";
DROP POLICY IF EXISTS "Public can view published submission images" ON "event_submission_images";
DROP POLICY IF EXISTS "Service role has full access to event_participants" ON "event_participants";
DROP POLICY IF EXISTS "Service role has full access to event_submissions" ON "event_submissions";
DROP POLICY IF EXISTS "Service role has full access to event_submission_images" ON "event_submission_images";
DROP POLICY IF EXISTS "Service role has full access to event_votes" ON "event_votes";

-- Public read policies for published submissions
CREATE POLICY "Public can view published submissions"
  ON "event_submissions"
  FOR SELECT
  USING ("status" = 'published');

CREATE POLICY "Public can view published submission images"
  ON "event_submission_images"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "event_submissions" s
      WHERE s."id" = "event_submission_images"."submission_id"
        AND s."status" = 'published'
    )
  );

-- Service role bypass policies for server actions execution
CREATE POLICY "Service role has full access to event_participants"
  ON "event_participants"
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to event_submissions"
  ON "event_submissions"
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to event_submission_images"
  ON "event_submission_images"
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to event_votes"
  ON "event_votes"
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Seed the initial "3D Modeling & 3D Printing Challenge" event (if not exists)
INSERT INTO "events" (
  "name",
  "description",
  "venue",
  "start_date",
  "end_date",
  "points",
  "status",
  "created_by",
  "updated_by",
  "submission_start_at",
  "submission_end_at",
  "min_images",
  "max_images",
  "min_description_chars",
  "voting_state",
  "voting_start_at",
  "voting_end_at",
  "votes_per_participant",
  "self_voting_allowed",
  "show_vote_counts",
  "number_of_winners",
  "is_competition"
)
SELECT
  '3D Modeling & 3D Printing Challenge',
  'Design and create your custom 3D model (keychain, bracket, or mechanical prototype) during the Robotics Club workshop. Submit your project photos and description for public showcase and peer voting!',
  'Robotics Club Lab / Makerspace',
  NOW(),
  NOW() + INTERVAL '14 days',
  35,
  'active',
  COALESCE((SELECT "id" FROM "users" LIMIT 1), '00000000-0000-0000-0000-000000000001'::uuid),
  COALESCE((SELECT "id" FROM "users" LIMIT 1), '00000000-0000-0000-0000-000000000001'::uuid),
  NOW(),
  NOW() + INTERVAL '10 days',
  1,
  2,
  100,
  'NOT_STARTED',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '14 days',
  1,
  false,
  false,
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "events" WHERE "name" = '3D Modeling & 3D Printing Challenge'
);
