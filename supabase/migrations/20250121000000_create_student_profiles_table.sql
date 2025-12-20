-- 학생 프로필 테이블
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT,
  district TEXT,
  school TEXT,
  school_code TEXT,
  grade TEXT,
  subject TEXT,
  term TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_updated_at ON student_profiles(updated_at DESC);

-- RLS 정책: 본인만 select/insert/update 가능
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "student_profiles_insert_own" ON student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_profiles_update_own" ON student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_profiles_delete_own" ON student_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_student_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_student_profiles_updated_at();

