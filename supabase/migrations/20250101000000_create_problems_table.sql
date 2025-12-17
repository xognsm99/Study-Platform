-- Create problems table for dialogue flow questions
CREATE TABLE IF NOT EXISTS problems (
  id text PRIMARY KEY,
  grade int NOT NULL,
  subject text NOT NULL,
  category text NOT NULL,
  question_type text NOT NULL,
  difficulty int NOT NULL DEFAULT 1,
  prompt text NOT NULL,
  content jsonb NOT NULL,
  answer_index int NOT NULL,
  explanation text NOT NULL,
  source text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_problems_grade_subject ON problems(grade, subject);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_question_type ON problems(question_type);

