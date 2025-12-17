-- Supabase profiles 테이블 name 컬럼을 nullable로 변경
-- 이 SQL은 Supabase Dashboard에서 직접 실행하거나 마이그레이션으로 적용할 수 있습니다.

-- name 컬럼이 NOT NULL 제약조건이 있다면 제거
ALTER TABLE profiles
ALTER COLUMN name DROP NOT NULL;

-- 참고: name 컬럼이 이미 nullable이면 에러가 발생할 수 있지만 무시해도 됩니다.
-- Supabase에서는 기본적으로 TEXT 타입은 nullable이지만, 
-- 명시적으로 NOT NULL 제약조건이 있을 수 있으므로 위 명령으로 제거합니다.

