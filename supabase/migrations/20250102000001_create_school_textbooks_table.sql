-- Create school_textbooks table for school textbook mappings
CREATE TABLE IF NOT EXISTS public.school_textbooks (
  school_name text NOT NULL,
  grade int NOT NULL,
  subject text NOT NULL,
  publisher text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (school_name, grade, subject)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_school_textbooks_school_name ON public.school_textbooks(school_name);
CREATE INDEX IF NOT EXISTS idx_school_textbooks_grade_subject ON public.school_textbooks(grade, subject);

