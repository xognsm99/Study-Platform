-- 게임 세트 테이블
CREATE TABLE IF NOT EXISTS game_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  grade TEXT NOT NULL, -- 예: "middle2", "middle3"
  is_active BOOLEAN DEFAULT true,
  items JSONB NOT NULL, -- 퀴즈 아이템 배열
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 게임 시도 기록 테이블
CREATE TABLE IF NOT EXISTS game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_set_id UUID REFERENCES game_sets(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  time_spent_sec INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_id ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_game_set_id ON game_attempts(game_set_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_created_at ON game_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sets_is_active ON game_sets(is_active) WHERE is_active = true;

-- RLS 정책: game_sets (읽기 전체 허용, 쓰기 서비스 롤만)
ALTER TABLE game_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sets_select_all" ON game_sets
  FOR SELECT
  USING (true);

CREATE POLICY "game_sets_insert_service_role" ON game_sets
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "game_sets_update_service_role" ON game_sets
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "game_sets_delete_service_role" ON game_sets
  FOR DELETE
  USING (auth.role() = 'service_role');

-- RLS 정책: game_attempts (본인 것만 CRUD)
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_attempts_select_own" ON game_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "game_attempts_insert_own" ON game_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_attempts_update_own" ON game_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "game_attempts_delete_own" ON game_attempts
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sets_updated_at
  BEFORE UPDATE ON game_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

