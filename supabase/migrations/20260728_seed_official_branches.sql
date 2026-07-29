-- ============================================================================
-- RCMS Migration Script: Seed Official Robotics Club Branches
-- Description: Idempotent SQL seed for standard department branches
-- ============================================================================

INSERT INTO branches (code, name, created_at, updated_at, version)
VALUES
  ('ECE', 'Electronics and Communication Engineering', NOW(), NOW(), 1),
  ('CSE', 'Computer Science and Engineering', NOW(), NOW(), 1),
  ('CSC', 'Computer Science and Engineering (Cyber Security)', NOW(), NOW(), 1),
  ('CSM', 'Computer Science and Engineering (Artificial Intelligence & Machine Learning)', NOW(), NOW(), 1),
  ('EEE', 'Electrical and Electronics Engineering', NOW(), NOW(), 1),
  ('AIML', 'Artificial Intelligence and Machine Learning', NOW(), NOW(), 1),
  ('AIDS', 'Artificial Intelligence and Data Science', NOW(), NOW(), 1),
  ('IT', 'Information Technology', NOW(), NOW(), 1),
  ('MECH', 'Mechanical Engineering', NOW(), NOW(), 1),
  ('CIVIL', 'Civil Engineering', NOW(), NOW(), 1),
  ('OTHER', 'Other Department / General', NOW(), NOW(), 1)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    updated_at = NOW();
