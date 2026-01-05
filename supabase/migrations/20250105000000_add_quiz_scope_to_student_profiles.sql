-- Add quiz_scope column to student_profiles table
-- This field stores the quiz range: individual units (u1-u12), exam ranges (mid1, final1, mid2, final2, overall), or comma-separated units (u1,u3,u5)
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS quiz_scope TEXT;

-- Add comment to column
COMMENT ON COLUMN student_profiles.quiz_scope IS 'Quiz scope: unit (u1-u12), exam range (mid1/final1/mid2/final2/overall), or comma-separated units (u1,u3,u5)';
